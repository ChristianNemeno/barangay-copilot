import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Activity, 
  AlertCircle, 
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart2, 
  BarChart3, 
  BookOpen, 
  Building2, 
  Check, 
  CheckCircle, 
  CheckCircle2, 
  CheckSquare, 
  Code, 
  Coins, 
  Copy, 
  CornerDownRight, 
  Cpu, 
  Download, 
  Eye, 
  FileCheck, 
  FileText, 
  Flame, 
  History, 
  Lightbulb, 
  ListTodo, 
  Loader2, 
  MapPin, 
  MessageSquare,
  PenSquare, 
  Plus, 
  RotateCcw, 
  Send, 
  ShieldCheck, 
  Sparkles, 
  Trash2, 
  TrendingUp, 
  Users, 
  X,
  Volume2
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar 
} from "recharts";
import { motion, AnimatePresence } from "motion/react";

import { 
  CitizenInput, 
  NormalizedRecord, 
  ThemeDetail, 
  RankedPriority, 
  ProjectPitch, 
  BarangayCensus, 
  BarangayBudget 
} from "./types";

import { 
  STANDARD_CITIZEN_FEEDBACK, 
  STANDARD_CENSUS, 
  STANDARD_BUDGET, 
  STANDARD_REPORT_HISTORY, 
  SIMULATED_NORMALIZED_RECORDS, 
  SIMULATED_THEMES, 
  SIMULATED_RANKED_PRIORITIES, 
  SIMULATED_PROJECT_PITCHES, 
  SIMULATED_DRAFT_DOCUMENTS 
} from "./sample_data";

import { PHASE_PROMPTS } from "./prompts";
import PromptViewer from "./components/PromptViewer";

export default function App() {
  // --- Pipeline States ---
  const [activeStep, setActiveStep] = useState<number>(1);
  const [apiHealth, setApiHealth] = useState<{ status: string; api_key_configured: boolean } | null>(null);
  const [useSimulationMode, setUseSimulationMode] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- Real-time Phase Outputs ---
  const [rawFeedbacks, setRawFeedbacks] = useState<CitizenInput[]>(STANDARD_CITIZEN_FEEDBACK);
  const [census, setCensus] = useState<BarangayCensus>(STANDARD_CENSUS);
  const [budget, setBudget] = useState<BarangayBudget>(STANDARD_BUDGET);
  const [reportHistory, setReportHistory] = useState<string>(STANDARD_REPORT_HISTORY);

  const [normalizedRecords, setNormalizedRecords] = useState<NormalizedRecord[]>(SIMULATED_NORMALIZED_RECORDS);
  const [themes, setThemes] = useState<ThemeDetail[]>(SIMULATED_THEMES);
  const [rankedPriorities, setRankedPriorities] = useState<RankedPriority[]>(SIMULATED_RANKED_PRIORITIES);
  const [projectPitches, setProjectPitches] = useState<ProjectPitch[]>(SIMULATED_PROJECT_PITCHES);
  const [selectedPitchId, setSelectedPitchId] = useState<string>("TH-PUB-B");
  const [selectedPitch, setSelectedPitch] = useState<ProjectPitch>(SIMULATED_PROJECT_PITCHES[0]);
  
  // Phase 6 Document draft strings
  const [draftedResolution, setDraftedResolution] = useState<string>(SIMULATED_DRAFT_DOCUMENTS.resolution);
  const [draftedPPMP, setDraftedPPMP] = useState<string>(SIMULATED_DRAFT_DOCUMENTS.ppmp);
  const [draftedBudget, setDraftedBudget] = useState<string>(SIMULATED_DRAFT_DOCUMENTS.budget);

  // --- Human-In-The-Loop (HITL) edits flags ---
  const [editedRecords, setEditedRecords] = useState<Set<number>>(new Set());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<NormalizedRecord | null>(null);

  // Voter simulation count inside Barangay secretary dashboard
  const [voters, setVoters] = useState<{ [person: string]: "APPROVED" | "PENDING" | "REJECTED" }>({
    "Hon. Punong Barangay": "PENDING",
    "Kagawad Sec 1 (Peace & Order)": "PENDING",
    "Kagawad Sec 2 (Health)": "PENDING",
    "Kagawad Sec 3 (Livelihood)": "PENDING",
    "Kagawad Sec 4 (Infrastructure)": "PENDING",
    "SK Chairman": "PENDING"
  });

  // Feedback input creation string
  const [newFeedbackText, setNewFeedbackText] = useState("");

  // Check backend server status & API availability
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setApiHealth(data);
        if (data.api_key_configured) {
          // If a key is actual and ready in the secrets panel, disable simulation by default!
          setUseSimulationMode(false);
        }
      })
      .catch((err) => {
        console.warn("Could not check developer API health. Running offline-first.", err);
        setApiHealth({ status: "offline", api_key_configured: false });
      });
  }, []);

  const currentAvailableBudgetPhpText = useMemo(() => {
    return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 })
      .format(budget.development_fund_php);
  }, [budget.development_fund_php]);

  // Handle selected pitch update when selectedPitchId changes
  useEffect(() => {
    const found = projectPitches.find(p => p.theme_id === selectedPitchId) || projectPitches[0];
    if (found) {
      setSelectedPitch(found);
    }
  }, [selectedPitchId, projectPitches]);

  // Add an custom user submission
  const handleAddFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedbackText.trim()) return;

    const nextId = Math.max(...rawFeedbacks.map(f => f.input_id), 0) + 1;
    const newEntry: CitizenInput = {
      input_id: nextId,
      original_text: newFeedbackText.trim()
    };
    setRawFeedbacks([...rawFeedbacks, newEntry]);
    setNewFeedbackText("");
  };

  const handleRemoveFeedback = (id: number) => {
    setRawFeedbacks(rawFeedbacks.filter(f => f.input_id !== id));
  };

  const handleResetFeedbacks = () => {
    setRawFeedbacks(STANDARD_CITIZEN_FEEDBACK);
  };

  // Human-in-the-loop editing for normalized entries
  const openEditModal = (rec: NormalizedRecord) => {
    setEditingRecord({ ...rec });
    setIsEditModalOpen(true);
  };

  const saveEditedRecord = () => {
    if (!editingRecord) return;
    setNormalizedRecords(normalizedRecords.map(r => r.input_id === editingRecord.input_id ? editingRecord : r));
    setEditedRecords(new Set([...editedRecords, editingRecord.input_id]));
    setIsEditModalOpen(false);
    setEditingRecord(null);
  };

  // --- PIPELINE RUN COMMANDS ---

  // Phase 2 Translation / Normalization HTTP Request
  const runPhase2Normalize = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (useSimulationMode) {
        // High fidelity simulated records derived from current rawFeedbacks or standard
        // Filter sample simulated based on current content or provide reasonable matches
        const simulatedResult = rawFeedbacks.map(f => {
          const preMatched = SIMULATED_NORMALIZED_RECORDS.find(sim => sim.input_id === f.input_id);
          if (preMatched) return { ...preMatched, original_text: f.original_text };
          
          // Generate realistic placeholder parsing for dynamically typed custom feedbacks
          return {
            input_id: f.input_id,
            original_text: f.original_text,
            detected_languages: ["Cebuano-Tagalog-English Mix"],
            normalized_english: `Normalized Translation: "${f.original_text}"`,
            category: f.original_text.toLowerCase().includes("baha") ? "flooding_drainage" :
                      f.original_text.toLowerCase().includes("basura") ? "waste_management" :
                      f.original_text.toLowerCase().includes("trabaho") || f.original_text.toLowerCase().includes("livelihood") ? "livelihood_employment" : "other",
            sitio_mentioned: f.original_text.includes("Riverside") ? "Sitio Riverside" : f.original_text.includes("San Jose") ? "Sitio San Jose" : "Sitio B",
            input_type: f.original_text.toLowerCase().includes("test") ? "noise" : "issue",
            severity_language_score: f.original_text.length > 50 ? 4 : 2
          } as NormalizedRecord;
        });

        setTimeout(() => {
          setNormalizedRecords(simulatedResult);
          setIsLoading(false);
          setActiveStep(2);
        }, 1200);
      } else {
        const res = await fetch("/api/pipeline/normalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ raw_inputs: rawFeedbacks })
        });
        const data = await res.json();
        if (res.ok && data.records) {
          setNormalizedRecords(data.records);
          setIsLoading(false);
          setActiveStep(2);
        } else {
          throw new Error(data.error || "Failed live Normalizer API call.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Normalization failed. Please verify secret keys and environment status.");
      setIsLoading(false);
    }
  };

  // Phase 3 Clustering API
  const runPhase3Clustering = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (useSimulationMode) {
        // Yield matching high-fidelity simulated thematic categories
        setTimeout(() => {
          setThemes(SIMULATED_THEMES);
          setIsLoading(false);
          setActiveStep(3);
        }, 1100);
      } else {
        const res = await fetch("/api/pipeline/cluster", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ normalized_records: normalizedRecords })
        });
        const data = await res.json();
        if (res.ok && data.themes) {
          setThemes(data.themes);
          setIsLoading(false);
          setActiveStep(3);
        } else {
          throw new Error(data.error || "Failed Thematic Clustering API.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Thematic grouping failed.");
      setIsLoading(false);
    }
  };

  // Phase 4 Prioritization scoring
  const runPhase4Prioritize = async () => {
    if (themes.length === 0) {
      setErrorMessage("Please run preceding clustering first to structure raw themes.");
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (useSimulationMode) {
        setTimeout(() => {
          setRankedPriorities(SIMULATED_RANKED_PRIORITIES);
          setIsLoading(false);
          setActiveStep(4);
        }, 1100);
      } else {
        const res = await fetch("/api/pipeline/prioritize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            themes: themes,
            barangay_data: {
              census: census,
              budget: budget,
              report_history: reportHistory
            }
          })
        });
        const data = await res.json();
        if (res.ok && data.ranked_priorities) {
          // Sort descending inside the response or client-side as mandated
          const sorted = data.ranked_priorities.sort((a: any, b: any) => b.composite_priority_score - a.composite_priority_score);
          setRankedPriorities(sorted);
          setIsLoading(false);
          setActiveStep(4);
        } else {
          throw new Error(data.error || "Failed prioritization request.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Prioritization scoring failed.");
      setIsLoading(false);
    }
  };

  // Phase 5 Project pitches
  const runPhase5Pitches = async () => {
    if (rankedPriorities.length === 0) {
      setErrorMessage("Please execute prioritization scoring first.");
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (useSimulationMode) {
        setTimeout(() => {
          setProjectPitches(SIMULATED_PROJECT_PITCHES);
          // Auto select first generated pitch
          setSelectedPitchId(SIMULATED_PROJECT_PITCHES[0].theme_id);
          setSelectedPitch(SIMULATED_PROJECT_PITCHES[0]);
          setIsLoading(false);
          setActiveStep(5);
        }, 1100);
      } else {
        const res = await fetch("/api/pipeline/pitches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ranked_priorities: rankedPriorities,
            available_budget: currentAvailableBudgetPhpText + " development fund"
          })
        });
        const data = await res.json();
        if (res.ok && data.project_pitches) {
          setProjectPitches(data.project_pitches);
          if (data.project_pitches.length > 0) {
            setSelectedPitchId(data.project_pitches[0].theme_id);
            setSelectedPitch(data.project_pitches[0]);
          }
          setIsLoading(false);
          setActiveStep(5);
        } else {
          throw new Error(data.error || "Failed pitches ideation.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Project pitches ideation failed.");
      setIsLoading(false);
    }
  };

  // Phase 6 Document writing
  const runPhase6Drafting = async () => {
    if (!selectedPitch) {
      setErrorMessage("No selected project pitch found. Please go back and select a pitch first.");
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    // Reset voters
    setVoters({
      "Hon. Punong Barangay": "PENDING",
      "Kagawad Sec 1 (Peace & Order)": "PENDING",
      "Kagawad Sec 2 (Health)": "PENDING",
      "Kagawad Sec 3 (Livelihood)": "PENDING",
      "Kagawad Sec 4 (Infrastructure)": "PENDING",
      "SK Chairman": "PENDING"
    });

    try {
      if (useSimulationMode) {
        setTimeout(() => {
          // Check standard or generate custom simulated resolution based on custom pitch
          if (selectedPitch.theme_id === "TH-PUB-B") {
            setDraftedResolution(SIMULATED_DRAFT_DOCUMENTS.resolution);
            setDraftedPPMP(SIMULATED_DRAFT_DOCUMENTS.ppmp);
            setDraftedBudget(SIMULATED_DRAFT_DOCUMENTS.budget);
          } else {
            // Write simple custom mock draft matches
            setDraftedResolution(`REPUBLIC OF THE PHILIPPINES
PROVINCE OF CEBU
CITY OF MANDAUE
BARANGAY [CITY_CENTER]

EXCERPT FROM THE MINUTES OF SANGGUNIANG SESSION...

BARANGAY RESOLUTION NO. 26-088
Series of 2026

"A RESOLUTION AUTHORIZING PROCUREMENT WORK FOR THE LOCAL EFFORT: ${selectedPitch.pitch_title.toUpperCase()} BY DISBURSING FUNDS FROM THE DEVELOPMENT ALLOTMENT."

WHEREAS, community feedback has proven the requirement for: "${selectedPitch.citizen_rationale}";

RESOLVED, that the Punong Barangay allocate resources to construct "${selectedPitch.pitch_title}" utilizing appropriate suppliers.
`);
            setDraftedPPMP(`PROJECT PROCUREMENT DETAILED DRAFT
Project: ${selectedPitch.pitch_title}
Procurement Category: Small Value Shopping (Negotiated)

1. Materials Lot: ₱18,500.00
2. Auxiliary transport and mobilization: ₱2,300.00
3. Community announcement: ₱1,200.00`);
            setDraftedBudget(`ITEMIZED BUDGET SHEETS
Allocation total: ${selectedPitch.estimated_cost_range_php}
Approved Development Fund limits: ₱50,000.00
Direct Materials: 70% of total
Labor support: 20%
Municipal buffer: 10%`);
          }
          setIsLoading(false);
          setActiveStep(6);
        }, 1200);
      } else {
        const res = await fetch("/api/pipeline/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_pitch: selectedPitch })
        });
        const data = await res.json();
        if (res.ok && data.draftText) {
          // Parse sections by headers or display entire raw text
          const text = data.draftText;
          
          let resText = text;
          let ppmText = "Procurement specs included in Resolution draft above.";
          let budText = "Budget sheets and breakdown tables attached above.";

          // We'll separate the text beautifully for tabs or show the single large markdown draft
          setDraftedResolution(resText);
          setDraftedPPMP("");
          setDraftedBudget("");
          
          setIsLoading(false);
          setActiveStep(6);
        } else {
          throw new Error(data.error || "Draft generation process encountered an issues.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Resolution document drafting failed.");
      setIsLoading(false);
    }
  };

  // Helper copy function for drafted records
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(label);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  // Vote Simulation Event handle
  const handleVoteAction = (person: string, vote: "APPROVED" | "REJECTED") => {
    setVoters({
      ...voters,
      [person]: vote
    });
  };

  const isResolutionRatified = useMemo(() => {
    const totalVotes = Object.values(voters);
    const approvedCount = totalVotes.filter(v => v === "APPROVED").length;
    return approvedCount >= 4; // Majority in LGU council
  }, [voters]);

  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#4A4A3A] flex flex-col font-sans transition-all duration-300">
      
      {/* PROFESSIONAL NAV/HEADER CHANNEL */}
      <header className="bg-[#F1EFE7] text-[#4A4A3A] shadow-sm border-b border-[#E5E2D6] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo & Civic Credentials */}
          <div className="flex items-center space-x-3.5">
            <div className="p-2.2 bg-[#E5E2D6] rounded-xl text-[#5A5A40] shadow-sm">
              <Building2 className="w-6 h-6 text-[#5A5A40]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold font-display tracking-tight text-[#3D3D2F]">
                  Barangay Development Copilot
                </h1>
                <span className="bg-[#A0522D]/10 border border-[#A0522D]/20 text-[#A0522D] font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
                  Philippines LGU
                </span>
              </div>
              <p className="text-xs text-[#8A8A75] mt-0.5">
                Participatory XML Prompt Pipeline Corridor • Mandaue City, Cebu
              </p>
            </div>
          </div>

          {/* Core Configuration & Connection Switcher */}
          <div className="flex items-center flex-wrap gap-2.5">
            
            {/* LGU API Connection status indicator */}
            <div className="flex items-center bg-white border border-[#E5E2D6] rounded-xl px-3 py-1.5 text-xs text-[#4A4A3A]">
              <span className="text-[10px] uppercase font-mono mr-2.5 text-[#8A8A75]">Live Gemini Client:</span>
              {apiHealth?.api_key_configured ? (
                <div className="flex items-center space-x-1.5 text-emerald-700 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span>ONLINE</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 text-[#A0522D] font-medium select-none animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-[#A0522D]"></span>
                  <span>DEMO MODE</span>
                </div>
              )}
            </div>

            {/* Simulation mode switcher button */}
            <button
              onClick={() => setUseSimulationMode(!useSimulationMode)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                useSimulationMode 
                  ? "bg-[#A0522D]/15 border border-[#A0522D]/35 text-[#A0522D] hover:bg-[#A0522D]/25" 
                  : "bg-[#5A5A40] border border-[#E5E2D6] text-white hover:bg-[#4A4A34]"
              }`}
              title="Toggle between live Gemini parsing and local low-latency high-fidelity simulation model."
              id="toggle-sim-mode-btn"
            >
              {useSimulationMode ? <RotateCcw className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
              <span>{useSimulationMode ? "Demo Mode (Simulation)" : "Live AI Processing"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ERROR DISPLAY SYSTEM */}
      {errorMessage && (
        <div className="bg-[#F5D1D1]/30 border-y border-[#F5D1D1] text-[#A0522D] px-4 py-3 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4.5 h-4.5 text-[#A0522D] flex-shrink-0" />
            <span>
              <strong>LGU pipeline error:</strong> {errorMessage}. 
              {!apiHealth?.api_key_configured && " You might need to set your valid GEMINI_API_KEY in the Secrets menu. Enabling 'Demo Mode (Simulation)' bypasses this and loads the workspace immediately!"}
            </span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="p-1 hover:bg-[#F5D1D1]/20 rounded">
            <X className="w-4 h-4 text-[#A0522D]" />
          </button>
        </div>
      )}
      {/* PIPELINE NAVIGATION TIMELINE (PHASE PROGRESSIVE STEPPER) */}
      <div className="bg-white border-b border-[#E5E2D6] py-4.5 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden md:flex items-center justify-between">
            {[
              { num: 1, label: "Messy Input", desc: "Citizen Feedback List" },
              { num: 2, label: "Normalize", desc: "Translation & Intake" },
              { num: 3, label: "Cluster", desc: "Theme Formulations" },
              { num: 4, label: "Prioritize", desc: "Multi-Criteria Scores" },
              { num: 5, label: "Ideation Deck", desc: "Project Option Pitches" },
              { num: 6, label: "Draft Resolution", desc: "Government Dossiers" }
            ].map((step) => {
              const isCompleted = activeStep > step.num;
              const isActive = activeStep === step.num;
              return (
                <div key={step.num} className="flex-1 flex items-center">
                  <div 
                    onClick={() => setActiveStep(step.num)}
                    className="cursor-pointer group flex flex-col items-center flex-1"
                    id={`stepper-node-${step.num}`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-mono text-xs font-bold transition-all duration-200 ${
                        isCompleted 
                          ? "bg-[#5A5A40] text-[#F8F7F2] border-[#5A5A40]" 
                          : isActive 
                            ? "bg-[#A0522D] text-white border-[#A0522D] ring-4 ring-[#A0522D]/10" 
                            : "bg-[#F1EFE7] text-[#8A8A75] border-[#E5E2D6] group-hover:bg-[#E5E2D6]/40 group-hover:text-[#4A4A3A]"
                      }`}>
                        {isCompleted ? <Check className="w-4 h-4 text-[#F8F7F2]" /> : step.num}
                      </div>
                      <div className="text-left">
                        <div className={`text-xs font-bold tracking-tight font-serif ${isActive ? "text-[#3D3D2F]" : "text-[#8A8A75]"}`}>
                          {step.label}
                        </div>
                        <div className="text-[10px] text-[#8A8A75]/80 leading-tight">
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  </div>
                  {step.num < 6 && (
                    <div className="w-6 h-px bg-[#E5E2D6] mx-2"></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Small screens responsive switcher layout */}
          <div className="flex md:hidden items-center justify-between text-xs">
            <button 
              disabled={activeStep === 1}
              onClick={() => setActiveStep(prev => prev - 1)}
              className="p-1 px-2.5 bg-[#F1EFE7] border border-[#E5E2D6] rounded-lg hover:bg-[#E5E2D6] text-[#5A5A40] disabled:opacity-40"
              id="mobile-prev-step-btn"
            >
              Back
            </button>
            <div className="text-center">
              <span className="font-mono text-[10px] text-[#A0522D] font-bold uppercase tracking-widest block">Phase {activeStep} of 6</span>
              <span className="font-bold text-[#3D3D2F] font-serif text-sm">
                {activeStep === 1 && "Phase 1: Raw Citizen Submissions"}
                {activeStep === 2 && "Phase 2: Translation & Intake"}
                {activeStep === 3 && "Phase 3: Thematic Clustering"}
                {activeStep === 4 && "Phase 4: Budget Prioritization"}
                {activeStep === 5 && "Phase 5: Project Option Deck"}
                {activeStep === 6 && "Phase 6: Draft Resolution"}
              </span>
            </div>
            <button 
              disabled={activeStep === 6}
              onClick={() => setActiveStep(prev => prev + 1)}
              className="p-1 px-2.5 bg-[#5A5A40] border border-[#5A5A40] rounded-lg hover:opacity-95 text-[#F8F7F2] disabled:opacity-40"
              id="mobile-next-step-btn"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* CORE WORKSPACE COMPONENT PANEL */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        
        {/* WORKSPACE AREA (LEFT/MAIN COMPLEMENT) */}
        <div className="flex-1 overflow-hidden flex flex-col space-y-6">

          {/* Active Phase summary */}
          <div className="bg-white rounded-3xl border border-[#E5E2D6] p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#F1EFE7] flex-wrap gap-4">
              <div>
                <span className="font-mono text-[10px] text-[#A0522D] font-bold tracking-widest uppercase block">
                  Interactive Workspace
                </span>
                <h2 className="text-xl font-bold font-serif text-[#3D3D2F] mt-1">
                  {activeStep === 1 && "Phase 1: Raw Citizen Intake & Local Metadata Config"}
                  {activeStep === 2 && "Phase 2: Multilingual Cleanse & Normalization"}
                  {activeStep === 3 && "Phase 3: Thematic Aggregation & Sentiment Grouping"}
                  {activeStep === 4 && "Phase 4: Objective Multi-Criteria Prioritization"}
                  {activeStep === 5 && "Phase 5: Participatory Project Option Pitches"}
                  {activeStep === 6 && "Phase 6: Automatic LGU Document Drafting & Voting"}
                </h2>
              </div>

              {/* Phase trigger buttons */}
              <div className="flex items-center gap-2">
                {activeStep === 1 && (
                  <button
                    disabled={isLoading}
                    onClick={runPhase2Normalize}
                    className="flex items-center space-x-2 bg-[#5A5A40] hover:bg-[#4A4A34] text-white font-semibold px-4.5 py-2 rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
                    id="trigger-p2-btn"
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Sparkles className="w-3.5 h-3.5 text-white" />}
                    <span>Normalize & Translate Feedbacks</span>
                  </button>
                )}
                {activeStep === 2 && (
                  <button
                    disabled={isLoading}
                    onClick={runPhase3Clustering}
                    className="flex items-center space-x-2 bg-[#5A5A40] hover:bg-[#4A4A34] text-white font-semibold px-4.5 py-2 rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
                    id="trigger-p3-btn"
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <BarChart3 className="w-3.5 h-3.5 text-white" />}
                    <span>Cluster Into Thematic Themes</span>
                  </button>
                )}
                {activeStep === 3 && (
                  <button
                    disabled={isLoading}
                    onClick={runPhase4Prioritize}
                    className="flex items-center space-x-2 bg-[#5A5A40] hover:bg-[#4A4A35] text-white font-semibold px-4.5 py-2 rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
                    id="trigger-p4-btn"
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <TrendingUp className="w-3.5 h-3.5 text-white" />}
                    <span>Calculate Prioritization Scores</span>
                  </button>
                )}
                {activeStep === 4 && (
                  <button
                    disabled={isLoading}
                    onClick={runPhase5Pitches}
                    className="flex items-center space-x-2 bg-[#5A5A40] hover:bg-[#4A4A34] text-white font-semibold px-4.5 py-2 rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
                    id="trigger-p5-btn"
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Lightbulb className="w-3.5 h-3.5 text-white" />}
                    <span>Generate Project Pitches (3 Choices)</span>
                  </button>
                )}
                {activeStep === 5 && (
                  <button
                    disabled={isLoading}
                    onClick={runPhase6Drafting}
                    className="flex items-center space-x-2 bg-[#5A5A40] hover:bg-[#4A4A34] text-white font-semibold px-4.5 py-2 rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
                    id="trigger-p6-btn"
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <FileText className="w-3.5 h-3.5 text-white" />}
                    <span>Draft Barangay Resolution & PPMP</span>
                  </button>
                )}
              </div>
            </div>

            {/* Prompt template debug line (explains what the prompt does) */}
            <div className="mt-3">
              <span className="text-xs text-[#8A8A75] leading-relaxed block italic">
                {activeStep === 1 && "This step allows the simulated citizens to submit feedback in their native tongues. Setup census population figures and overall funds to align your scoring algorithm."}
                {activeStep === 2 && "The normalizing prompter detects Ceb/Eng/Tag codes, translates to standardized English to prevent language bias, sets basic category tags, and rates raw intensity 1-5."}
                {activeStep === 3 && "The clustering engine sorts normalized issues together based on shared core topics and discards pure administrative noise elements like microphone testing rants."}
                {activeStep === 4 && "Criteria-led prioritization calculates a composite score based on location coverage, intensity, timeline frequency logs, and geographic census counts, removing manual favoritism."}
                {activeStep === 5 && "Calculates estimated local costs (scoped under available fund checks) and presents up to 3 feasible project options. The Punong Barangay selects one option to proceed."}
                {activeStep === 6 && "The drafting module constructs a resolution including signature tables, an itemized public Procurement Plan (PPMP), and budget tables ready for the Sangguniang Barangay votes."}
              </span>
            </div>
          </div>

          {/* ACTIVE STEP UI BLOCK */}

          {/* PHASE 1: CITIZEN APP SIMULATOR & METADATA CONFIG */}
          {activeStep === 1 && (
            <div className="space-y-6">
              
              {/* Form Input panel & feedback stream */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Citizen Inputs panel */}
                <div className="bg-white border border-[#E5E2D6] rounded-3xl shadow-sm p-5 flex flex-col h-[520px]">
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#F1EFE7] flex-shrink-0">
                    <h3 className="text-sm font-bold text-[#3D3D2F] font-serif flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4 text-[#A0522D]" />
                      <span>Citizen Feedback Stream ({rawFeedbacks.length})</span>
                    </h3>
                    <button
                      onClick={handleResetFeedbacks}
                      className="text-[#A0522D] hover:text-[#5A5A40] text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
                      title="Reset feedbacks list to authentic sample dataset"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Standard</span>
                    </button>
                  </div>

                  {/* Feedbacks list section */}
                  <div className="flex-1 overflow-y-auto space-y-3.5 py-4 scrollbar">
                    {rawFeedbacks.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-[#8A8A75] text-xs">
                        <MessageSquare className="w-8 h-8 stroke-1 text-[#E5E2D6] mb-2" />
                        <p>No feedback entries submitted.</p>
                        <p className="text-[10px] mt-1 text-[#8A8A75]">Click Reset above to reload mock samples!</p>
                      </div>
                    ) : (
                      rawFeedbacks.map((f, idx) => (
                        <div 
                          key={f.input_id} 
                          className="p-3.5 bg-[#F1EFE7]/30 border border-[#E5E2D6] hover:border-[#D1CFB9] rounded-xl flex items-start justify-between space-x-3 text-xs text-[#4A4A3A] transition-all"
                          id={`feedback-item-${f.input_id}`}
                        >
                          <div>
                            <span className="font-mono text-[9px] font-bold text-[#8A8A75] tracking-wider block mb-1">RECORD ID: #{f.input_id}</span>
                            <p className="leading-relaxed">&ldquo;{f.original_text}&rdquo;</p>
                          </div>
                          <button
                            onClick={() => handleRemoveFeedback(f.input_id)}
                            className="p-1 hover:bg-[#E5E2D6] text-[#8A8A75] hover:text-[#A0522D] rounded transition-colors flex-shrink-0 cursor-pointer"
                            title="Delete submission"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add feedback form */}
                  <form onSubmit={handleAddFeedback} className="pt-3 border-t border-[#F1EFE7] flex-shrink-0">
                    <span className="text-[10px] font-mono text-[#8A8A75] font-bold block mb-1">SIMULATE NEW CITIZEN SUBMISSION:</span>
                    <div className="flex space-x-1.5">
                      <input
                        type="text"
                        placeholder="e.g., Baha kaayo pirme sa among agianan Sitio Riverside..."
                        value={newFeedbackText}
                        onChange={(e) => setNewFeedbackText(e.target.value)}
                        className="flex-1 text-xs border border-[#E5E2D6] hover:border-[#D1CFB9] focus:border-[#5A5A40] rounded-xl py-2 px-3 text-[#4A4A3A] bg-white focus:outline-none transition-colors"
                      />
                      <button
                        type="submit"
                        className="p-2 bg-[#5A5A40] hover:bg-[#4A4A34] text-white rounded-xl text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer"
                        title="Add submission"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>

                {/* Configuration registers */}
                <div className="bg-white border border-[#E5E2D6] rounded-3xl shadow-sm p-5 flex flex-col h-[520px]">
                  <div className="pb-3.5 border-b border-[#F1EFE7] flex-shrink-0">
                    <h3 className="text-sm font-bold text-[#3D3D2F] font-serif flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-[#A0522D]" />
                      <span>Barangay LGU Metadata Registry</span>
                    </h3>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4 py-4 scrollbar text-xs">
                    
                    {/* Census Section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-[#4A4A3A] tracking-tight flex items-center gap-1.5"><Users className="w-4 h-4 text-[#A0522D]" /> Sitio Census Records</span>
                        <span className="text-[10px] text-[#8A8A75]">Total pop mapped for scoring</span>
                      </div>
                      <div className="bg-[#F1EFE7]/30 p-3 rounded-xl border border-[#E5E2D6] space-y-2 font-mono">
                        {Object.entries(census.sitio_populations).map(([sitio, pop]) => (
                          <div key={sitio} className="flex justify-between items-center text-[11px]">
                            <span className="text-[#4A4A3A] font-sans font-medium">{sitio}:</span>
                            <div className="flex items-center space-x-2">
                              <input 
                                type="number" 
                                value={pop}
                                onChange={(e) => setCensus({
                                  ...census,
                                  sitio_populations: { ...census.sitio_populations, [sitio]: parseInt(e.target.value) || 0 }
                                })}
                                className="w-16 bg-white border border-[#E5E2D6] text-right px-1.5 py-0.5 rounded focus:outline-none focus:border-[#5A5A40] text-[#4A4A3A]"
                              />
                              <span className="text-[#E5E2D6] font-sans">|</span>
                              <span className="text-[#8A8A75] font-sans text-[10px] min-w-[70px] text-right">
                                {census.sitio_households[sitio as keyof typeof census.sitio_households] || 0} hholds
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Funding Constraints Section */}
                    <div>
                      <div className="mb-2">
                        <span className="font-bold text-[#4A4A3A] tracking-tight flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-[#A0522D]" /> Available Funds Constraints
                        </span>
                      </div>
                      <div className="bg-[#F1EFE7]/30 p-4 rounded-xl border border-[#E5E2D6] space-y-3.5">
                        <div>
                          <label className="text-[10px] font-mono text-[#8A8A75] font-bold block mb-1">DEVELOPMENT FUND LIMIT (PHP):</label>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[#8A8A75] text-[13px] font-medium">₱</span>
                            <input 
                              type="number" 
                              value={budget.development_fund_php}
                              onChange={(e) => setBudget({ ...budget, development_fund_php: parseInt(e.target.value) || 0 })}
                              className="font-mono bg-white border border-[#E5E2D6] text-[#4A4A3A] text-[14px] font-bold px-3 py-1.5 rounded-lg w-full focus:outline-none focus:border-[#5A5A40] shadow-sm"
                            />
                          </div>
                          <span className="text-[10px] text-[#8A8A75] block mt-1">
                            Default limit is set to ₱50,000 for standard barangay minor projects.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Log Section */}
                    <div>
                      <label className="font-bold text-[#4A4A3A] tracking-tight flex items-center gap-1.5 mb-2">
                        <History className="w-4 h-4 text-[#A0522D]" /> Historical Reports Audit Log
                      </label>
                      <textarea
                        value={reportHistory}
                        onChange={(e) => setReportHistory(e.target.value)}
                        className="w-full h-16 text-[11px] p-2.5 bg-white border border-[#E5E2D6] rounded-xl text-[#4A4A3A] focus:outline-none font-mono focus:border-[#5A5A40] resize-none h-20 leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Collapsed prompts information viewer */}
              <PromptViewer 
                phaseNumber={2} 
                title="Cleaning, Translation and Category Classification extraction"
                xmlContent={PHASE_PROMPTS.phase2}
              />
            </div>
          )}

          {/* PHASE 2: NORMALIZATION VIEW */}
          {activeStep === 2 && (
            <div className="space-y-6">
              
              {/* Table or Card list display */}
              <div className="bg-white border border-[#E5E2D6] rounded-3xl shadow-sm p-5 overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-[#F1EFE7] mb-4 flex-wrap gap-2">
                  <h3 className="text-sm font-bold text-[#3D3D2F] font-serif flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-[#A0522D]" />
                    <span>Normalized Intakes ({normalizedRecords.length} records processed)</span>
                  </h3>
                  <div className="flex items-center space-x-3 text-xs text-[#8A8A75]">
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 bg-[#DDE5D1] border border-[#c4d4b1] rounded"></span>
                      <span>Verified by Copilot</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 bg-[#F5EDD1] border border-[#ebdcb1] rounded"></span>
                      <span>Edited by Human</span>
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-[#4A4A3A] min-w-[700px]">
                    <thead className="text-[10px] font-mono text-[#8A8A75] uppercase tracking-wider bg-[#F1EFE7]/40 border-y border-[#E5E2D6]">
                      <tr>
                        <th className="py-2.5 px-3 w-16">ID</th>
                        <th className="py-2.5 px-3 w-40">Original Content</th>
                        <th className="py-2.5 px-3 w-40">Standardized English</th>
                        <th className="py-2.5 px-3">Classification</th>
                        <th className="py-2.5 px-3">Category Tag</th>
                        <th className="py-2.5 px-3 text-center">Intensity</th>
                        <th className="py-2.5 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1EFE7]">
                      {normalizedRecords.map((r) => {
                        const isEdited = editedRecords.has(r.input_id);
                        return (
                          <tr key={r.input_id} className={`hover:bg-[#FDFCF8] ${isEdited ? "bg-[#F5EDD1]/20" : ""}`}>
                            <td className="py-3 px-3 font-mono font-bold text-[#8A8A75]">#{r.input_id}</td>
                            <td className="py-3 px-3 max-w-[200px] truncate text-[#8A8A75] leading-normal" title={r.original_text}>
                              &ldquo;{r.original_text}&rdquo;
                            </td>
                            <td className="py-3 px-3 max-w-[200px] whitespace-normal text-[#3D3D2F] font-medium leading-relaxed">
                              {r.normalized_english}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                r.input_type === "issue" 
                                  ? "bg-[#F5D1D1]/50 text-[#A0522D] border-[#F5D1D1]" 
                                  : r.input_type === "suggestion" 
                                    ? "bg-[#DDE5D1]/50 text-[#4A5A30] border-[#DDE5D1]" 
                                    : "bg-[#E5E2D6] text-[#8A8A75] border-[#E5E2D6]"
                              }`}>
                                {r.input_type.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex flex-col">
                                <span className="font-semibold text-[#4A4A3A] capitalize">
                                  {r.category.replace("_", " ")}
                                </span>
                                {r.sitio_mentioned && (
                                  <span className="text-[10px] text-[#8A8A75] font-medium font-sans flex items-center gap-0.5 mt-0.5">
                                    <MapPin className="w-2.5 h-2.5 text-[#8A8A75]/50" /> {r.sitio_mentioned}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center space-x-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Flame 
                                    key={i} 
                                    className={`w-3.5 h-3.5 ${
                                      i < r.severity_language_score 
                                        ? "text-[#A0522D] fill-[#A0522D]" 
                                        : "text-[#E5E2D6]"
                                    }`} 
                                  />
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => openEditModal(r)}
                                className="p-1 px-2.2 bg-[#F1EFE7] hover:bg-[#E5E2D6] text-[#5A5A40] border border-[#E5E2D6] rounded-lg font-semibold inline-flex items-center space-x-1 cursor-pointer"
                                title="Open Human in the loop manual reviewer"
                              >
                                <PenSquare className="w-3.5 h-3.5" />
                                <span className="text-[10px]">Edit</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 pt-4 border-t border-[#F1EFE7] flex justify-end">
                  <button
                    disabled={isLoading}
                    onClick={runPhase3Clustering}
                    className="flex items-center space-x-1.5 bg-[#5A5A40] hover:bg-[#4A4A34] text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    <span>Proceed to Theme Clustering</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              <PromptViewer 
                phaseNumber={3} 
                title="Thematic Clustering & Sentiment Grouping"
                xmlContent={PHASE_PROMPTS.phase3}
              />
            </div>
          )}

          {/* PHASE 3: THEMATIC CLUSTERING VIEW */}
          {activeStep === 3 && (
            <div className="space-y-6">
              
              {/* Grid with themes and isolated noise lists */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Active Themes */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between pb-2">
                    <h3 className="text-sm font-bold text-[#3D3D2F] font-serif flex items-center space-x-2">
                      <BarChart2 className="w-4.5 h-4.5 text-[#A0522D]" />
                      <span>Formulated Community Themes ({themes.length})</span>
                    </h3>
                    <span className="text-[10px] text-[#8A8A75]">Aggregated by keyword affinity</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {themes.map((t) => (
                      <div 
                        key={t.theme_id} 
                        className="bg-white border border-[#E5E2D6] hover:border-[#D1CFB9] rounded-3xl shadow-sm p-4 relative flex flex-col justify-between transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-[9px] font-bold text-[#A0522D] bg-[#A0522D]/10 border border-[#A0522D]/20 px-2 py-0.5 rounded">
                              {t.theme_id}
                            </span>
                            <span className="capitalize text-[10px] text-[#8A8A75] font-semibold">
                              {t.category.replace("_", " ")}
                            </span>
                          </div>

                          <h4 className="text-[13px] font-bold text-[#3D3D2F] font-serif leading-snug mb-1">
                            {t.theme_label}
                          </h4>

                          {/* Sitio Badges */}
                          <div className="flex flex-wrap gap-1 mb-3.5">
                            {t.sitios_affected.map(s => (
                              <span key={s} className="inline-flex items-center text-[9px] font-medium bg-[#F1EFE7] border border-[#E5E2D6] text-[#5A5A40] px-1.5 py-0.2 rounded">
                                <MapPin className="w-2.5 h-2.5 mr-0.5 text-[#8A8A75]/50" /> {s}
                              </span>
                            ))}
                          </div>

                          {/* Representative Quotes list */}
                          <div className="space-y-1.5 border-t border-[#F1EFE7] pt-3.5 mb-4">
                            <span className="text-[9px] font-mono text-[#8A8A75] font-bold block">REPRESENTATIVE DISPLACEMENT:</span>
                            {t.representative_quotes.slice(0, 2).map((q, idx) => (
                              <p key={idx} className="text-[11px] text-[#4A4A3A] italic leading-snug pl-3 border-l-2 border-[#D1CFB9]">
                                &ldquo;{q}&rdquo;
                              </p>
                            ))}
                          </div>
                        </div>

                        {/* Quantitative Footer specs */}
                        <div className="flex items-center justify-between bg-[#F1EFE7] border-t border-[#E5E2D6] -mx-4 -mb-4 p-3 rounded-b-[22px] text-[10px] text-[#8A8A75]">
                          <span className="font-bold text-[#5A5A40] font-sans">{t.mention_count} reported counts</span>
                          <span className="flex items-center space-x-1 text-[#8A8A75]">
                            <Flame className="w-3.5 h-3.5 text-[#A0522D] fill-[#A0522D]" />
                            <span className="font-bold text-[#4A4A3A]">{t.avg_severity_language_score.toFixed(1)} severity</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Noise isolation panel */}
                <div className="bg-white border border-[#E5E2D6] rounded-3xl shadow-sm p-5 self-start">
                  <div className="flex items-center space-x-2 pb-3 border-b border-[#F1EFE7] mb-3.5">
                    <Flame className="w-4 h-4 text-[#A0522D]" />
                    <h3 className="text-sm font-bold text-[#3D3D2F] font-serif">Discarded Noise Filter</h3>
                  </div>
                  <p className="text-[11px] text-[#8A8A75] leading-relaxed mb-4">
                    The prompter automatically identified administrative comments, mic test checks, and off-topic strings to keep our scoring calculations completely secure.
                  </p>

                  <div className="space-y-3">
                    {SIMULATED_THEMES.length > 0 ? (
                      <div className="p-3.5 bg-[#F1EFE7]/30 border border-[#E5E2D6] rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-[#A0522D] font-mono">RECORD ID #8</span>
                          <span className="text-[#8A8A75]">Tagged: NOISE</span>
                        </div>
                        <p className="text-[11px] text-[#4A4A3A] leading-snug italic">
                          &ldquo;Hello testing mic hello 123 sge admin test feedback barangay 102.&rdquo;
                        </p>
                        <span className="text-[9px] font-bold text-[#8A8A75] block border-t border-[#E5E2D6] pt-2">
                          REASON: Testing microphone or systems diagnostics. No actionable local community merit.
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-[#8A8A75]">No noise detected.</p>
                    )}
                  </div>
                </div>

              </div>

              <div className="pt-4 border-t border-[#E5E2D6] flex justify-end">
                <button
                  disabled={isLoading}
                  onClick={runPhase4Prioritize}
                  className="flex items-center space-x-1.5 bg-[#5A5A40] hover:bg-[#4A4A34] text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  <span>Proceed to Prioritization</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </div>

              <PromptViewer 
                phaseNumber={4} 
                title="Data-Aware Prioritization Formulas & Weighted Limits"
                xmlContent={PHASE_PROMPTS.phase4}
              />
            </div>
          )}

          {/* PHASE 4: BUDGET PRIORITIZATION CRITERIA VIEW */}
          {activeStep === 4 && (
            <div className="space-y-6">
              
              {/* Matrix Scoring table & charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Priority Matrix List */}
                <div className="lg:col-span-2 bg-white border border-[#E5E2D6] rounded-3xl shadow-sm p-5">
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#F1EFE7] mb-4 flex-wrap gap-2">
                    <h3 className="text-sm font-bold text-[#3D3D2F] font-serif flex items-center space-x-2">
                      <TrendingUp className="text-[#A0522D] w-4.5 h-4.5" />
                      <span>Data-Aware Priority Matrix Ranking</span>
                    </h3>
                    <span className="text-[10px] text-[#4A5A30] bg-[#DDE5D1] border border-[#c4d4b1] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#4A5A30]" /> Fully Audited
                    </span>
                  </div>

                  <div className="space-y-4">
                    {rankedPriorities.map((item, index) => {
                      return (
                        <div 
                          key={item.theme_id} 
                          className="p-4 border border-[#E5E2D6] rounded-2xl bg-[#F1EFE7]/10 relative flex flex-col justify-between transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-[10px] font-bold text-[#8A8A75]">RANK #{index + 1}</span>
                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                                  item.composite_priority_score >= 3.8 
                                    ? "bg-[#A0522D]" 
                                    : item.composite_priority_score >= 3.2 
                                      ? "bg-amber-500" 
                                      : "bg-[#5A5A40]"
                                }`}></span>
                                <span className="text-[10px] font-mono font-semibold text-[#A0522D] bg-[#A0522D]/10 px-1.5 py-0.5 rounded">
                                  {item.theme_id}
                                </span>
                              </div>
                              <h4 className="text-[13px] font-bold text-[#3D3D2F] mt-1 font-serif">{item.theme_label}</h4>
                            </div>

                            {/* Score circle badge */}
                            <div className="text-right flex flex-col items-end">
                              <span className="text-[18px] font-black text-[#3D3D2F] font-serif leading-tight">
                                {item.composite_priority_score.toFixed(2)}
                              </span>
                              <span className="text-[9px] font-mono text-[#8A8A75] tracking-wider">COMPOSITE SCORE</span>
                            </div>
                          </div>

                          {/* Specific criteria metrics bar gauges */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-[#E5E2D6] my-2">
                            {[
                              { label: "Coverage", value: item.scores.coverage },
                              { label: "Concentration", value: item.scores.geographic_concentration },
                              { label: "Time Frequency", value: item.scores.time_consistency },
                              { label: "Population Imp.", value: item.scores.population_impact }
                            ].map(crit => (
                              <div key={crit.label} className="text-center font-mono">
                                <span className="text-[9px] text-[#8A8A75] uppercase tracking-tight block">{crit.label}</span>
                                <div className="flex items-center justify-center space-x-0.5 mt-1">
                                  {crit.value !== null ? (
                                    [...Array(5)].map((_, idx) => (
                                      <span 
                                        key={idx} 
                                        className={`w-2.5 h-1.5 rounded-sm ${
                                          idx < (crit.value || 0) 
                                            ? "bg-[#5A5A40]" 
                                            : "bg-[#F1EFE7]"
                                        }`}
                                      />
                                    ))
                                  ) : (
                                    <span className="text-[10px] text-[#8A8A75]">N/A</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Budget sizing analysis */}
                          <div className="flex items-start space-x-2 pt-2.5 border-t border-[#F1EFE7] mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.budget_fit === "fits_within_fund" 
                                ? "bg-[#DDE5D1] text-[#4A5A30] border border-[#c4d4b1]" 
                                : item.budget_fit === "partial_fit" 
                                  ? "bg-[#F5EDD1] text-[#5A5A40] border border-[#ebdcb1]" 
                                  : "bg-[#F5D1D1]/50 text-[#A0522D] border border-[#F5D1D1]" 
                            }`}>
                              {item.budget_fit.replace(/_/g, " ").toUpperCase()}
                            </span>
                            <p className="text-[11px] text-[#4A4A3A] leading-normal flex-1">
                              {item.budget_fit_explanation}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dashboard visualization radar */}
                <div className="bg-white border border-[#E5E2D6] rounded-3xl shadow-sm p-5 self-start">
                  <div className="pb-3 border-b border-[#F1EFE7] mb-3 flex items-center gap-1.5 text-[#3D3D2F]">
                    <BarChart3 className="w-4 h-4 text-[#A0522D]" />
                    <h3 className="text-sm font-bold font-serif">Priority Distribution</h3>
                  </div>

                  {/* Recharts chart comparing priority composite scores */}
                  <div className="h-64 mt-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={rankedPriorities.slice(0, 4)} 
                        layout="vertical"
                        margin={{ left: -10, right: 10, top: 0, bottom: 0 }}
                      >
                        <XAxis type="number" domain={[0, 5]} stroke="#8A8A75" fontSize={10} />
                        <YAxis type="category" dataKey="theme_id" stroke="#8A8A75" fontSize={10} width={65} />
                        <Tooltip 
                          contentStyle={{ background: "#F1EFE7", border: "1px solid #E5E2D6", borderRadius: "12px", color: "#4A4A3A" }}
                          itemStyle={{ color: "#A0522D" }}
                        />
                        <Bar dataKey="composite_priority_score" name="Score" fill="#5A5A40" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-[#F1EFE7]/30 border border-[#E5E2D6] p-3 rounded-xl mt-4">
                    <span className="text-[10px] font-mono text-[#8A8A75] font-bold block mb-1">AUDIT METHODOLOGY:</span>
                    <p className="text-[10px] text-[#8A8A75] leading-relaxed">
                      All criteria averages are calculated purely via structured JSON weights. Flooding and streetlighting receive appropriate high priority based on repetitive months frequency counts in logs and population impact figures.
                    </p>
                  </div>
                </div>

              </div>

              <div className="pt-4 border-t border-[#E5E2D6] flex justify-end">
                <button
                  disabled={isLoading}
                  onClick={runPhase5Pitches}
                  className="flex items-center space-x-1.5 bg-[#5A5A40] hover:bg-[#4A4A34] text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  <span>Proceed to Project Ideation</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </div>

              <PromptViewer 
                phaseNumber={5} 
                title="LGU Sized Pitches, Cost Calculations and Feasibilities"
                xmlContent={PHASE_PROMPTS.phase5}
              />
            </div>
          )}

          {/* PHASE 5: PROJECT IDEATION VIEW */}
          {activeStep === 5 && (
            <div className="space-y-6">
              
              {/* Bento Grid pitches deck */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
                  <h3 className="text-sm font-bold text-[#3D3D2F] font-serif flex items-center space-x-2">
                    <Lightbulb className="w-4.5 h-4.5 text-[#A0522D]" />
                    <span>Feasible Project Option Deck (Stated Fund: {currentAvailableBudgetPhpText})</span>
                  </h3>
                  <span className="text-[10px] text-[#8A8A75]">Select one option to compile into formal resolution documents</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {projectPitches.map((pitch) => {
                    const isSelected = selectedPitchId === pitch.theme_id;
                    const isBudgetFit = pitch.feasibility_flag === "fits_budget";
                    return (
                      <div 
                        key={pitch.theme_id}
                        onClick={() => setSelectedPitchId(pitch.theme_id)}
                        className={`bg-white border rounded-3xl p-5 cursor-pointer relative flex flex-col justify-between transition-all shadow-sm ${
                          isSelected 
                            ? "border-[#A0522D] ring-2 ring-[#A0522D]/10 bg-[#F1EFE7]/10" 
                            : "border-[#E5E2D6] hover:border-[#D1CFB9]"
                        }`}
                        id={`pitch-card-${pitch.theme_id}`}
                      >
                        <div>
                          
                          {/* Selected marker check badge */}
                          {isSelected && (
                            <div className="absolute top-4 right-4 bg-[#A0522D] text-white p-1 rounded-full text-xs">
                              <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
                            </div>
                          )}

                          <div className="flex items-center space-x-2 mb-3 max-w-[80%]">
                            <span className="font-mono text-[9px] font-bold text-[#A0522D] bg-[#A0522D]/10 px-2 py-0.5 rounded-md">
                              {pitch.theme_id}
                            </span>
                            <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                              isBudgetFit 
                                ? "bg-[#DDE5D1] text-[#4A5A30] border-[#c4d4b1]" 
                                : "bg-[#F5EDD1] text-[#5A5A40] border-[#ebdcb1]"
                            }`}>
                              {pitch.feasibility_flag.replace(/_/g, " ").toUpperCase()}
                            </span>
                          </div>

                          <h4 className="text-[15px] font-bold text-[#3D3D2F] leading-snug mb-1 font-serif">
                            {pitch.pitch_title}
                          </h4>

                          {/* Cost range pills */}
                          <div className="inline-flex items-center gap-1 bg-[#F5EDD1]/80 border border-[#ebdcb1] text-[#A0522D] rounded-xl px-2.5 py-1 text-xs font-bold font-mono my-2.5">
                            <Coins className="w-3.5 h-3.5" />
                            <span>{pitch.estimated_cost_range_php}</span>
                          </div>

                          <p className="text-xs text-[#4A4A3A] leading-relaxed mb-4 mt-1.5">
                            {pitch.description}
                          </p>

                          {/* Impact assessment lines */}
                          <div className="space-y-2 border-t border-[#F1EFE7] pt-4.5 mt-2 text-[11px] text-[#8A8A75]">
                            <div>
                              <span className="font-bold text-[#3D3D2F] block">ESTIMATED MAPPED IMPACT:</span>
                              <p className="leading-snug mt-0.5 text-[#4A4A3A]">{pitch.estimated_impact}</p>
                            </div>
                            <div>
                              <span className="font-bold text-[#3D3D2F] block mt-2">CITIZEN RATIONALE:</span>
                              <p className="leading-snug italic mt-0.5 text-[#4A4A3A]">&ldquo;{pitch.citizen_rationale}&rdquo;</p>
                            </div>
                          </div>

                        </div>

                        <div className="mt-5 pt-3 border-t border-[#F1EFE7]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPitchId(pitch.theme_id);
                            }}
                            className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isSelected 
                                ? "bg-[#A0522D] text-white hover:bg-[#8A3A1D] shadow-sm" 
                                : "bg-[#F1EFE7] text-[#5A5A40] hover:bg-[#E5E2D6]"
                            }`}
                          >
                            {isSelected ? "Pitch Selected" : "Select Pitch Option"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E2D6] flex justify-end">
                <button
                  disabled={isLoading}
                  onClick={runPhase6Drafting}
                  className="flex items-center space-x-1.5 bg-[#5A5A40] hover:bg-[#4A4A34] text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  <span>Build Formal Documents</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </div>

              <PromptViewer 
                phaseNumber={6} 
                title="Sangguniang Barangay Official Resolutions and procurement schedules"
                xmlContent={PHASE_PROMPTS.phase6}
              />
            </div>
          )}

          {/* PHASE 6: OFFICIAL DOCUMENT DRAFTING & VOTES */}
          {activeStep === 6 && (
            <div className="space-y-6">
               {/* Dual Panel view: Document Workspace vs Council Voting Module */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Resolution Draft text block */}
                <div className="lg:col-span-2 bg-white border border-[#E5E2D6] rounded-3xl shadow-sm p-5 flex flex-col h-[650px]">
                  <div className="flex items-center justify-between pb-3 border-b border-[#F1EFE7] mb-4 flex-wrap gap-2 flex-shrink-0">
                    <div className="flex items-center space-x-2">
                      <FileCheck className="w-5 h-5 text-[#A0522D]" />
                      <h3 className="text-sm font-bold text-[#3D3D2F] font-serif">Sangguniang Barangay Resolution Dossier</h3>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleCopyToClipboard(draftedResolution, "doc")}
                        className="p-1 px-2.5 bg-[#F1EFE7] border border-[#E5E2D6] text-[#4A4A3A] hover:bg-[#E5E2D6] rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                        title="Copy text resolution to clipboard"
                        id="copy-to-clipboard-btn"
                      >
                        {copyStatus === "doc" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy Draft</span>
                      </button>

                      {/* Download link helper element */}
                      <a 
                        href={`data:text/plain;charset=utf-8,${encodeURIComponent(draftedResolution + "\n\n" + draftedPPMP + "\n\n" + draftedBudget)}`}
                        download="Barangay_Resolution_Draft.txt"
                        className="p-1 px-2.5 bg-[#A0522D] border border-[#8A3A1D] text-white hover:bg-[#8A3A1D] rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-all"
                        id="download-draft-btn"
                      >
                        <Download className="w-3.5 h-3.5 text-white" />
                        <span>Download TXT</span>
                      </a>
                    </div>
                  </div>

                  {/* Fully display formatted text */}
                  <div className="flex-1 overflow-y-auto space-y-4 p-4.5 bg-[#2D2D24] text-[#E5E2D6] border border-[#4A4A3A] rounded-2xl font-mono text-xs leading-relaxed scrollbar shadow-inner">
                    <pre className="whitespace-pre-wrap selection:bg-[#A0522D]/30">{draftedResolution}</pre>
                    {draftedPPMP && (
                      <div className="pt-6 border-t border-[#4A4A3A] mt-6">
                        <pre className="whitespace-pre-wrap">{draftedPPMP}</pre>
                      </div>
                    )}
                    {draftedBudget && (
                      <div className="pt-6 border-t border-[#4A4A3A] mt-6">
                        <pre className="whitespace-pre-wrap">{draftedBudget}</pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sangguniang Barangay Council Voting Simulator */}
                <div className="bg-white border border-[#E5E2D6] rounded-3xl shadow-sm p-5 self-start">
                  
                  {/* Title and details */}
                  <div className="pb-3 border-b border-[#F1EFE7] mb-4 flex items-center gap-1.5 text-[#3D3D2F]">
                    <Award className="w-4.5 h-4.5 text-[#A0522D]" />
                    <h3 className="text-sm font-bold font-serif">HITL Council Adjudication</h3>
                  </div>
                  <p className="text-[11px] text-[#8A8A75] leading-relaxed mb-4">
                    In the Philippine Local Government Unit structure, the AI generates proposals, but the <strong>Barangay Council holds supreme legislative vote authority</strong>. Simulate Kagawad approvals to ratify and stamp this resolution.
                  </p>

                  <div className="space-y-3">
                    {Object.entries(voters).map(([person, vote]) => (
                      <div key={person} className="flex justify-between items-center text-xs p-2.5 bg-[#F1EFE7]/10 border border-[#E5E2D6] rounded-xl">
                        <div>
                          <span className="font-semibold text-[#3D3D2F] block leading-tight">{person}</span>
                          <span className="text-[9px] text-[#8A8A75] font-mono tracking-wider">COMMITTEE CHAIR</span>
                        </div>

                        {/* Voting pills */}
                        <div className="flex space-x-1">
                          <button
                            type="button"
                            onClick={() => handleVoteAction(person, "APPROVED")}
                            className={`p-1 px-2 rounded font-mono text-[9px] font-bold transition-all cursor-pointer ${
                              vote === "APPROVED" 
                                ? "bg-[#5A5A40] text-white shadow-sm" 
                                : "bg-white border border-[#E5E2D6] text-[#8A8A75] hover:text-[#5A5A40] hover:border-[#D1CFB9]"
                            }`}
                          >
                            AYE
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVoteAction(person, "REJECTED")}
                            className={`p-1 px-2 rounded font-mono text-[9px] font-bold transition-all cursor-pointer ${
                              vote === "REJECTED" 
                                ? "bg-[#A0522D] text-white shadow-sm" 
                                : "bg-white border border-[#E5E2D6] text-[#8A8A75] hover:text-[#A0522D] hover:border-[#D1CFB9]"
                            }`}
                          >
                            NAY
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Stamp of Certification */}
                  <div className="mt-5 pt-4.5 border-t border-[#F1EFE7] flex flex-col items-center">
                    {isResolutionRatified ? (
                      <div className="bg-[#DDE5D1] border-2 border-dashed border-[#c4d4b1] text-[#4A5A30] p-4.5 rounded-2xl flex flex-col items-center text-center w-full shadow-sm animate-fade-in">
                        <CheckCircle2 className="w-8 h-8 text-[#4A5A30] mb-1.5" />
                        <span className="font-mono text-[10px] font-bold tracking-widest uppercase block text-[#4A5A30] mb-0.5">RESOLUTION COMMITTED</span>
                        <h4 className="text-[13px] font-bold font-serif text-[#3D3D2F] leading-tight">RATIFIED & APPROVED</h4>
                        <p className="text-[10px] text-[#8A8A75] mt-1 lines-tight">Approved by majority vote. Sangguniang Seal attached ready for dispatching to municipal engineering office.</p>
                      </div>
                    ) : (
                      <div className="bg-[#F1EFE7]/30 border-2 border-dashed border-[#E5E2D6] text-[#8A8A75] p-4.5 rounded-2xl flex flex-col items-center text-center w-full select-none">
                        <FileText className="w-8 h-8 text-[#8A8A75] mb-1.5 stroke-1" />
                        <span className="font-mono text-[10px] font-bold tracking-widest uppercase block text-[#8A8A75] mb-0.5">DRAFT LEGISLATION PENDING</span>
                        <h4 className="text-[13px] font-bold font-serif text-[#3D3D2F] leading-tight">Awaiting 4 Council Affirmations</h4>
                        <p className="text-[10px] text-[#8A8A75] mt-1">AI drafted. Ayes are pending. Tap AYE above for Kagawads to endorse official project release.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Back out button */}
              <div className="mt-4 pt-4 border-t border-[#E5E2D6] flex justify-start">
                <button
                  type="button"
                  onClick={() => {
                    setRawFeedbacks(STANDARD_CITIZEN_FEEDBACK);
                    setActiveStep(1);
                  }}
                  className="p-2.5 px-4 bg-[#5A5A40] hover:bg-[#4A4A34] text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart App Pipeline Demo</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* FOOTER CAPTION CONTROL */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-5 border-t border-slate-800/80 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2 leading-relaxed">
          <p className="font-display font-medium text-slate-300">
            Participatory Barangay Development Copilot — XML Prompt Pipeline Corridor
          </p>
          <p className="text-[11px] text-slate-500">
            Designed to bridge raw multilingual civic feedback with structured Philippine municipal development and government resolution drafting formats under human-in-the-loop oversight.
          </p>
          <div className="flex items-center justify-center space-x-2 text-[10px] font-mono text-slate-600 pt-1.5 select-none">
            <span>R.A. 7160 (Local Government Code) Compliant Framework</span>
            <span>•</span>
            <span>Gemini v3.5 Live Pipeline Active</span>
          </div>
        </div>
      </footer>

      {/* HUMAN-IN-THE-LOOP RECORD EDIT MODAL */}
      <AnimatePresence>
        {isEditModalOpen && editingRecord && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-xl">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-sm font-bold text-slate-900 font-display flex items-center space-x-2">
                  <PenSquare className="w-4 h-4 text-indigo-500" />
                  <span>Human-In-The-Loop Manual Edit</span>
                </h3>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                
                {/* Original reference text */}
                <div>
                  <span className="font-mono text-[9px] font-bold text-slate-400 block mb-1">ORIGINAL CITIZEN FEEDBACK:</span>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl leading-relaxed text-slate-605 italic">
                    &ldquo;{editingRecord.original_text}&rdquo;
                  </div>
                </div>

                {/* English translation edit input */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Standardized English Translation:</label>
                  <textarea
                    value={editingRecord.normalized_english}
                    onChange={(e) => setEditingRecord({ ...editingRecord, normalized_english: e.target.value })}
                    className="w-full h-18 p-3 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-xl text-slate-800 leading-normal focus:outline-none"
                  />
                </div>

                {/* Category & classifier drop downs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-705 text-slate-700 block mb-1.5">Category Class tag:</label>
                    <select
                      value={editingRecord.category}
                      onChange={(e) => setEditingRecord({ ...editingRecord, category: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-semibold capitalize focus:outline-none"
                    >
                      <option value="flooding_drainage">Flooding & Drainage</option>
                      <option value="livelihood_employment">Livelihood & Jobs</option>
                      <option value="public_safety">Public Safety</option>
                      <option value="waste_management">Waste Management</option>
                      <option value="health_services">Health Services</option>
                      <option value="infrastructure_roads">Infras & Roads</option>
                      <option value="education">Education Mapped</option>
                      <option value="social_welfare">Social Welfare</option>
                      <option value="other">Other/Uncategorized</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Target Classification:</label>
                    <select
                      value={editingRecord.input_type}
                      onChange={(e) => setEditingRecord({ ...editingRecord, input_type: e.target.value as any })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-semibold focus:outline-none"
                    >
                      <option value="issue">ISSUE</option>
                      <option value="suggestion">SUGGESTION</option>
                      <option value="noise">NOISE</option>
                    </select>
                  </div>
                </div>

                {/* Severity indicator */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Subjective Severity Level (1-5):</label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setEditingRecord({ ...editingRecord, severity_language_score: num })}
                        className={`p-1.5 px-3 rounded-lg font-mono font-bold text-xs transition-all ${
                          editingRecord.severity_language_score === num 
                            ? "bg-slate-900 border border-slate-900 text-white" 
                            : "bg-slate-50 border border-slate-200 text-slate-500"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end space-x-2 text-xs">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditedRecord}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm shadow-indigo-600/10"
                >
                  Save Override Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
