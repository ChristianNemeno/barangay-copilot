import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const getFilename = () => {
  try {
    // @ts-ignore
    return fileURLToPath(import.meta.url);
  } catch {
    return typeof __filename !== "undefined" ? __filename : "";
  }
};

const getDirname = () => {
  try {
    return path.dirname(getFilename());
  } catch {
    return typeof __dirname !== "undefined" ? __dirname : "";
  }
};

const resolvedFilename = getFilename();
const resolvedDirname = getDirname();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Let's configure body parsing with a generous limit for raw JSON loads
  app.use(express.json({ limit: "15mb" }));

  // Helper to initialize Gemini client lazyly
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      throw new Error("GEMINI_API_KEY_MISSING");
    }
    return new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // ==========================================
  // API ROUTES (FIRST)
  // ==========================================

  app.get("/api/health", (req, res) => {
    const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
    res.json({ status: "ok", api_key_configured: hasKey });
  });

  // Phase 2: Normalization endpoint
  app.post("/api/pipeline/normalize", async (req, res) => {
    try {
      const { raw_inputs } = req.body;
      if (!Array.isArray(raw_inputs)) {
        return res.status(400).json({ error: "raw_inputs must be an array of objects or strings." });
      }

      // Check key
      let ai;
      try {
        ai = getGeminiClient();
      } catch (err: any) {
        return res.status(400).json({
          error: "API key is missing or not configured.",
          code: "GEMINI_API_KEY_MISSING",
        });
      }

      // Format inputs into XML block
      const formattedInputs = raw_inputs
        .map((input: any, index: number) => {
          const text = typeof input === "string" ? input : input.original_text || input.text || "";
          const id = typeof input === "object" ? input.input_id || (index + 1) : (index + 1);
          return `${id}. "${text}"`;
        })
        .join("\n");

      const systemInstruction = `You are the intake-normalization engine for a Philippine barangay citizen feedback system.
Your only job is to clean and structure raw citizen submissions. You do not prioritize, cluster, or recommend anything in this step — that happens later.`;

      const prompt = `
<context>
Citizens submit feedback in Cebuano, Tagalog, English, or a mix of all three ("Bisaya-Tagalog-English"
code-switching is common and expected). Submissions may be a single word, a rant, a question,
or unrelated chatter. Some will reference a sitio (sub-village) by name or description instead
of an official label.
</context>

<task>
For each raw input in <raw_inputs>, produce one normalized record. Do the following per input:
1. Detect the source language(s) used (e.g. "Tagalog", "Cebuano", "English", "Code-switching").
2. Translate/normalize the content into clear English while preserving the original meaning
   and emotional intensity (don't sanitize "lagi baha" into something mild — it means
   "always flooding," a strong recurring complaint).
3. Extract the issue category from <category_list>. If nothing fits, use "other".
4. Extract any sitio/location mention, verbatim as written by the citizen.
5. Flag whether this is (a) an actionable issue/complaint ("issue"), (b) a suggestion/request ("suggestion"), or
   (c) noise/irrelevant/unintelligible ("noise").
6. Assign a severity_language_score 1-5 based on word choice/repetition/urgency markers only
   (e.g. "lagi," "every week," "delikado," ALL CAPS, exclamation points) — not based on the
   issue type itself.
</task>

<category_list>
flooding_drainage, livelihood_employment, public_safety, waste_management,
health_services, infrastructure_roads, education, social_welfare, other
</category_list>

<raw_inputs>
${formattedInputs}
</raw_inputs>
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2, // Low temperature for extraction fidelity
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                input_id: { type: Type.INTEGER },
                original_text: { type: Type.STRING },
                detected_languages: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                normalized_english: { type: Type.STRING },
                category: { type: Type.STRING },
                sitio_mentioned: { type: Type.STRING, nullable: true },
                input_type: { 
                  type: Type.STRING, 
                  description: "Must be exactly one of: 'issue', 'suggestion', 'noise'" 
                },
                severity_language_score: { type: Type.INTEGER }
              },
              required: [
                "input_id", "original_text", "detected_languages", 
                "normalized_english", "category", "sitio_mentioned", 
                "input_type", "severity_language_score"
              ]
            }
          }
        }
      });

      const responseText = response.text || "[]";
      const records = JSON.parse(responseText.trim());
      res.json({ records });
    } catch (error: any) {
      console.error("Error in normalizer:", error);
      res.status(500).json({ error: error.message || "An unexpected error occurred during normalization." });
    }
  });

  // Phase 3: Thematic Clustering endpoint
  app.post("/api/pipeline/cluster", async (req, res) => {
    try {
      const { normalized_records } = req.body;
      if (!Array.isArray(normalized_records)) {
        return res.status(400).json({ error: "normalized_records must be an array of normalized objects." });
      }

      let ai;
      try {
        ai = getGeminiClient();
      } catch (err: any) {
        return res.status(400).json({
          error: "API key is missing or not configured.",
          code: "GEMINI_API_KEY_MISSING",
        });
      }

      const systemInstruction = `You are the clustering and sentiment-aggregation engine for a Philippine barangay feedback system.
You receive normalized citizen records and group them into community themes. You do not make budget or project recommendations in this step.`;

      const prompt = `
<task>
1. Group the records in <normalized_records> by category and sub-theme (a category can split
   into more than one theme if the underlying issues are clearly different — e.g.
   "flooding_drainage" might split into "chapel-area flooding" vs "main road flooding"
   if the records describe distinct locations/causes).
2. For each theme, compute:
   - theme_id: Unique short identifier, e.g. "TH-FLD-01"
   - category: One of the official categories from the input normalized_records
   - theme_label: Short descriptive label summarizing the core problem/aspect
   - mention_count: number of records matching this theme (issue + suggestion)
   - sitios_affected: deduplicated list of sitios reporting this issue
   - avg_severity_language_score: Average score among member records
   - input_type_breakdown: Count of issues, suggestions, and noises in this theme
3. Discard themes made up entirely of "noise" records — list them separately under
   "discarded_noise" instead of as an active theme.
4. Rank themes by mention_count descending, using avg_severity_language_score as the tiebreaker.
</task>

<normalized_records>
${JSON.stringify(normalized_records, null, 2)}
</normalized_records>
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              themes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    theme_id: { type: Type.STRING },
                    category: { type: Type.STRING },
                    theme_label: { type: Type.STRING },
                    mention_count: { type: Type.INTEGER },
                    sitios_affected: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    avg_severity_language_score: { type: Type.NUMBER },
                    input_type_breakdown: {
                      type: Type.OBJECT,
                      properties: {
                        issue: { type: Type.INTEGER },
                        suggestion: { type: Type.INTEGER },
                        noise: { type: Type.INTEGER }
                      },
                      required: ["issue", "suggestion", "noise"]
                    },
                    representative_quotes: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "1-3 of the English normalized strings that best typify the theme"
                    }
                  },
                  required: [
                    "theme_id", "category", "theme_label", "mention_count", 
                    "sitios_affected", "avg_severity_language_score", 
                    "input_type_breakdown", "representative_quotes"
                  ]
                }
              },
              discarded_noise: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    input_id: { type: Type.INTEGER },
                    reason: { type: Type.STRING }
                  },
                  required: ["input_id", "reason"]
                }
              }
            },
            required: ["themes", "discarded_noise"]
          }
        }
      });

      const responseText = response.text || "{}";
      const clusterResult = JSON.parse(responseText.trim());
      res.json(clusterResult);
    } catch (error: any) {
      console.error("Error in themes clustering:", error);
      res.status(500).json({ error: error.message || "An unexpected error occurred during clustering." });
    }
  });

  // Phase 4: Prioritization endpoint
  app.post("/api/pipeline/prioritize", async (req, res) => {
    try {
      const { themes, barangay_data } = req.body;
      if (!Array.isArray(themes)) {
        return res.status(400).json({ error: "themes array is required." });
      }

      let ai;
      try {
        ai = getGeminiClient();
      } catch (err: any) {
        return res.status(400).json({
          error: "API key is missing or not configured.",
          code: "GEMINI_API_KEY_MISSING",
        });
      }

      const systemInstruction = `You are the prioritization engine for a Philippine barangay development copilot. You rank community issues using ONLY the four objective criteria defined below — never gut feeling, never issue-type bias.`;

      const prompt = `
<scoring_criteria>
  <criterion name="coverage">
    How many distinct sitios report this same issue. More sitios = higher score.
    Scale: 1-5 (1: Single location, 5: Almost all sitios in the census affected).
  </criterion>
  <criterion name="geographic_concentration">
    Whether the issue is highly clustered and intense in a single spot (local cluster) versus widely distributed.
    For this demo, give general density scores from 1 (very scattered) to 5 (highly concentrated, acute hotspot).
  </criterion>
  <criterion name="time_consistency">
    Whether the issue recurs over time (repetition counts, previous months logs) versus a one-off.
    Scoring: 1 (seasonal/unlikely recurring) to 5 (heavy recurring history in report_history).
  </criterion>
  <criterion name="population_impact">
    Estimated number of residents/households affected, cross-referencing affected sitios with <census> counts.
    Scoring: 1 (few households, <50), to 5 (major population, >1000 affected).
  </criterion>
</scoring_criteria>

<scoring_instructions>
For each theme in <themes_input>:
1. Score each of the 4 criteria from 1 (low) to 5 (high), using the data provided in <barangay_data>. 
   If a criterion's required data is completely missing or unusable for a theme, score it as null and explain in "data_gaps". Do not guess or default to a mid-point.
2. Compute composite_priority_score as the mathematical average of the non-null criterion scores.
3. Cross-reference municipal assets/constraints: Evaluate against the <budget_constraints> (₱50,000 available Development Fund). 
   Determine budget_fit: "fits_within_fund", "partial_fit", "exceeds_fund_needs_city_support", or "conflicts_with_planned_project".
   Explain clearly in budget_fit_explanation.
4. Rank all themes by composite_priority_score descending.
</scoring_instructions>

<themes_input>
${JSON.stringify(themes, null, 2)}
</themes_input>

<barangay_data>
  <census>
    Populaton count by Sitio:
    ${JSON.stringify(barangay_data?.census?.sitio_populations || {}, null, 2)}
    
    Household count by Sitio:
    ${JSON.stringify(barangay_data?.census?.sitio_households || {}, null, 2)}
  </census>
  <report_history>
    ${barangay_data?.report_history || "none provided"}
  </report_history>
  <budget_constraints>
    Available Development fund: ₱${barangay_data?.budget?.development_fund_php || 50000}
    Planned municipal projects:
    ${JSON.stringify(barangay_data?.budget?.planned_projects || [], null, 2)}
  </budget_constraints>
</barangay_data>
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ranked_priorities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    theme_id: { type: Type.STRING },
                    theme_label: { type: Type.STRING },
                    scores: {
                      type: Type.OBJECT,
                      properties: {
                        coverage: { type: Type.INTEGER, nullable: true },
                        geographic_concentration: { type: Type.INTEGER, nullable: true },
                        time_consistency: { type: Type.INTEGER, nullable: true },
                        population_impact: { type: Type.INTEGER, nullable: true }
                      },
                      required: ["coverage", "geographic_concentration", "time_consistency", "population_impact"]
                    },
                    composite_priority_score: { type: Type.NUMBER },
                    criteria_scored_count: { type: Type.INTEGER },
                    data_gaps: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    budget_fit: { 
                      type: Type.STRING,
                      description: "Must be: 'fits_within_fund', 'partial_fit', 'exceeds_fund_needs_city_support', or 'conflicts_with_planned_project'"
                    },
                    budget_fit_explanation: { type: Type.STRING }
                  },
                  required: [
                    "theme_id", "theme_label", "scores", "composite_priority_score", 
                    "criteria_scored_count", "data_gaps", "budget_fit", "budget_fit_explanation"
                  ]
                }
              }
            },
            required: ["ranked_priorities"]
          }
        }
      });

      const responseText = response.text || "{}";
      const priorityResult = JSON.parse(responseText.trim());
      res.json(priorityResult);
    } catch (error: any) {
      console.error("Error in prioritizer:", error);
      res.status(500).json({ error: error.message || "An unexpected error occurred during prioritization scoring." });
    }
  });

  // Phase 5: Ideation Dashboard (Project Pitches)
  app.post("/api/pipeline/pitches", async (req, res) => {
    try {
      const { ranked_priorities, available_budget } = req.body;
      if (!Array.isArray(ranked_priorities)) {
        return res.status(400).json({ error: "ranked_priorities array is required." });
      }

      let ai;
      try {
        ai = getGeminiClient();
      } catch (err: any) {
        return res.status(400).json({
          error: "API key is missing or not configured.",
          code: "GEMINI_API_KEY_MISSING",
        });
      }

      const systemInstruction = `You are a planning advisor generating realistic local project pitch options for a Barangay Captain (Punong Barangay) to choose from in a Philippine Local Government Unit (LGU). You are presenting options with clear trade-offs.`;

      const prompt = `
<task>
Using <ranked_priorities> and available budget limit of <available_budget>, generate down-to-earth project pitches for top priorities (provide 3 pitches total, focused on the highest-scoring and budget-feasible priorities, or spread across top scorable themes).

For each pitch, you must supply:
1. theme_id: cross-reference back to the priority's theme_id.
2. pitch_title: Catchy but humble, standard-sounding micro-infrastructure or social service project name.
3. description: Exactly what will be done, scoped to the stated local budget. No fancy hyper-advanced automation unless realistic.
4. estimated_cost_range_php: Stated as a clear local price range (e.g., "₱30,000 - ₱42,000").
5. estimated_impact: Who benefits, how many households (using the priority's census insights).
6. citizen_rationale: Direct justification explaining how this fits the original citizen feedback themes and quotes.
7. feasibility_flag: "fits_budget", "needs_phasing", "recommend_escalation_to_city".
8. conflict_warning: Flag if this overlaps with any planned/city projects, or null.
</task>

<ranked_priorities>
${JSON.stringify(ranked_priorities, null, 2)}
</ranked_priorities>

<available_budget>${available_budget || "₱50,000 development fund"}</available_budget>
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.5, // Slightly higher for friendly and practical descriptive writing
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dashboard_summary: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    headline: { type: Type.STRING }
                  },
                  required: ["headline"]
                },
                description: "2-4 core descriptive summaries derived strictly from the dataset"
              },
              project_pitches: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    theme_id: { type: Type.STRING },
                    pitch_title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    estimated_cost_range_php: { type: Type.STRING },
                    estimated_impact: { type: Type.STRING },
                    citizen_rationale: { type: Type.STRING },
                    feasibility_flag: { 
                      type: Type.STRING,
                      description: "Must be exactly: 'fits_budget', 'needs_phasing', or 'recommend_escalation_to_city'"
                    },
                    conflict_warning: { type: Type.STRING, nullable: true }
                  },
                  required: [
                    "theme_id", "pitch_title", "description", "estimated_cost_range_php", 
                    "estimated_impact", "citizen_rationale", "feasibility_flag", "conflict_warning"
                  ]
                }
              }
            },
            required: ["dashboard_summary", "project_pitches"]
          }
        }
      });

      const responseText = response.text || "{}";
      const pitchResult = JSON.parse(responseText.trim());
      res.json(pitchResult);
    } catch (error: any) {
      console.error("Error in pitches generation:", error);
      res.status(500).json({ error: error.message || "An unexpected error occurred during pitch generation." });
    }
  });

  // Phase 6: Document Drafting (Returns formatted text)
  app.post("/api/pipeline/draft", async (req, res) => {
    try {
      const { selected_pitch } = req.body;
      if (!selected_pitch) {
        return res.status(400).json({ error: "selected_pitch is required." });
      }

      let ai;
      try {
        ai = getGeminiClient();
      } catch (err: any) {
        return res.status(400).json({
          error: "API key is missing or not configured.",
          code: "GEMINI_API_KEY_MISSING",
        });
      }

      const systemInstruction = `You are a barangay secretary's drafting assistant. You produce formal LGU document drafts in the standard Philippine barangay format. These are PILOT/DRAFTS ONLY for Sangguniang Barangay review.`;

      const prompt = `
<task>
Using the chosen <selected_pitch>, draft three documents under their respective Markdown headers:

1. BARANGAY RESOLUTION NO. [____]
Full, proper Barangay Resolution format in the Philippines:
- Letterhead placeholders (e.g. Republic of the Philippines, Province of Cebu, City/Municipality, Barangay [Name])
- Header block indicating session, date, Sangguniang Members present.
- A descriptive Title.
- Formal "WHEREAS" clauses building rationale directly from the pitch's citizen_rationale.
- Formal "RESOLVED, AS IT IS HEREBY RESOLVED" clause detailing the budget allocation, scope, and implementation.
- Standard signature block placeholders for Punong Barangay, Kagawads, and certification by the Barangay Secretary.

2. PROJECT PROCUREMENT MANAGEMENT PLAN (PPMP) — DRAFT
A formal PPMP table or list:
- Include columns for: Item Code, General Description, Qty, Unit, Estimated Unit Cost, Estimated Total Cost, and Schedule of Need.
- Procurement Mode: Suggest "Shopping" or "Small Value Procurement" per RA 9184 standards, detailing this as a suggestion only.
- The items must sum up to within the estimated budget of the pitch!

3. ITEMIZED BUDGET BREAKDOWN
An itemized financial spreadsheet breakdown (in markdown table format) representing:
- Capital Outlays (equipment, solar panels, etc.)
- Maintenance and Other Operating Expenses (MOOE)
- Labor, transport, or voluntary Tanod coordination allowances.
- Total must match the pitch budget and be under the ₱50,000 available limit!
</task>

<rules>
- Every "WHEREAS" statement citing citizen feedback must trace back to something actually present in <selected_pitch>.citizen_rationale — do not invent additional citizen quotes or statistics.
- Use placeholder fields in [BRACKETS] for anything that requires human input you don't have (barangay name, exact dates, resolution number, names of officials).
- Add a closing disclaimer reminding that this is an AI-generated draft pending Sangguniang Barangay review, amendment, and formal vote — the AI has not approved anything legally.
</rules>

<selected_pitch>
${JSON.stringify(selected_pitch, null, 2)}
</selected_pitch>
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.4,
        }
      });

      const fullDraftText = response.text || "";

      // We'll parse the full text and split it or return it directly. Since the prompt specifies markdown format, returning it directly as an object containing sections is extremely clean.
      // Let's do some light splitting to extract the sections or just return the entire text and let the frontend render it beautifully with Markdown!
      res.json({ draftText: fullDraftText });
    } catch (error: any) {
      console.error("Error in draft generation:", error);
      res.status(500).json({ error: error.message || "An unexpected error occurred during document drafting." });
    }
  });


  // ==========================================
  // VITE AND STATIC SERVING
  // ==========================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Barangay Copilot Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
