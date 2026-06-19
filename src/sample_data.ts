import { CitizenInput, NormalizedRecord, ThemeDetail, RankedPriority, ProjectPitch, DashboardSummary } from "./types";

export const STANDARD_CITIZEN_FEEDBACK: CitizenInput[] = [
  {
    input_id: 1,
    original_text: "Lagi baha sa amoa dapit sa chapel sa Sitio Riverside. Every afternoon na lang inig mag-ulan dako kaayo baha mapuno ang karsada dli na maagian sa mga estudyante."
  },
  {
    input_id: 2,
    original_text: "We need a livelihood program for single moms, especially here in Sitio Riverside, no stable job to support families after the pandemic."
  },
  {
    input_id: 3,
    original_text: "Tambayan ng mga nag-iinuman yung madilim na kanto sa Sitio B pagka gabi. Dilim dun, safe ba yung mga kabataan dadaan dun pag-uwi?"
  },
  {
    input_id: 4,
    original_text: "Salamat sa free health checkup last week sa multi-purpose hall. Very helpful kaayo sir, unta duna pay tambal ipanghatag sunod."
  },
  {
    input_id: 5,
    original_text: "Ang tapok sa basura sa unahan sa Sitio San Jose dapit sa elementary school, baho kaayo unya wala gakuhaon sa garbage truck. Daghan na ug langaw."
  },
  {
    input_id: 6,
    original_text: "Paki-ayos po ng sirang street light sa Sitio B dapit sa Basketball Court. Delikado po dun maglakad gabi-gabi lalo na't may balita tungkol sa magnanakaw."
  },
  {
    input_id: 7,
    original_text: "Daycare center, very needed in Sitio Riverside. Sige lang mi bantay aning mga gagmayng bata, kinsa may manginabuhi ani unya manglimpyo."
  },
  {
    input_id: 8,
    original_text: "Hello testing mic hello 123 sge admin test feedback barangay 102."
  },
  {
    input_id: 9,
    original_text: "Sige lang ug agi ang mga heavy dump truck dapit sa main entrance sa Sitio San Jose, naguba na hinuon ang bag-o nga semento. Puno na ug libaong ang dalan."
  },
  {
    input_id: 10,
    original_text: "Many stray dogs roaming in Sitio B, sige managod unya saba kaayo inig gabii. Naay napaakan nga bata gahapon dapit sa tindahan."
  }
];

export const STANDARD_CENSUS = {
  sitio_populations: {
    "Sitio Riverside": 1450,
    "Sitio San Jose": 2100,
    "Sitio B": 920,
    "Sitio C": 400
  },
  sitio_households: {
    "Sitio Riverside": 320,
    "Sitio San Jose": 480,
    "Sitio B": 190,
    "Sitio C": 85
  }
};

export const STANDARD_BUDGET = {
  development_fund_php: 50000,
  planned_projects: [
    "Road cementation in Sitio B scheduled for FY2027 by City Engineering Office",
    "Daycare supply procurement planned under FY2026 Social Welfare budget"
  ]
};

export const STANDARD_REPORT_HISTORY = 
  "Previous 3 months: 14 reports of flooding in Sitio Riverside, 8 reports of dark street corners in Sitio B, 11 waste management complaints in Sitio San Jose.";

// High-fidelity pre-computed simulated outputs for Offline/Demo use:

export const SIMULATED_NORMALIZED_RECORDS: NormalizedRecord[] = [
  {
    input_id: 1,
    original_text: "Lagi baha sa amoa dapit sa chapel sa Sitio Riverside. Every afternoon na lang inig mag-ulan dako kaayo baha mapuno ang karsada dli na maagian sa mga estudyante.",
    detected_languages: ["Cebuano", "English"],
    normalized_english: "It is always flooding near the chapel in Sitio Riverside. Every afternoon when it rains, the flood is so high that the road becomes impassable for students.",
    category: "flooding_drainage",
    sitio_mentioned: "Sitio Riverside",
    input_type: "issue",
    severity_language_score: 4
  },
  {
    input_id: 2,
    original_text: "We need a livelihood program for single moms, especially here in Sitio Riverside, no stable job to support families after the pandemic.",
    detected_languages: ["English"],
    normalized_english: "We need a livelihood program for single mothers, especially here in Sitio Riverside, as there are no stable jobs to support families after the pandemic.",
    category: "livelihood_employment",
    sitio_mentioned: "Sitio Riverside",
    input_type: "suggestion",
    severity_language_score: 3
  },
  {
    input_id: 3,
    original_text: "Tambayan ng mga nag-iinuman yung madilim na kanto sa Sitio B pagka gabi. Dilim dun, safe ba yung mga kabataan dadaan dun pag-uwi?",
    detected_languages: ["Tagalog", "English"],
    normalized_english: "The dark corner in Sitio B has became a hangout spot for people drinking alcohol at night. It is very dark there, is it safe for youths heading home to pass by?",
    category: "public_safety",
    sitio_mentioned: "Sitio B",
    input_type: "issue",
    severity_language_score: 4
  },
  {
    input_id: 4,
    original_text: "Salamat sa free health checkup last week sa multi-purpose hall. Very helpful kaayo sir, unta duna pay tambal ipanghatag sunod.",
    detected_languages: ["Cebuano", "English", "Tagalog"],
    normalized_english: "Thank you for the free health checkup last week at the multi-purpose hall. It was very helpful, sir. Hopefully, free medicine will be distributed next time.",
    category: "health_services",
    sitio_mentioned: null,
    input_type: "suggestion",
    severity_language_score: 1
  },
  {
    input_id: 5,
    original_text: "Ang tapok sa basura sa unahan sa Sitio San Jose dapit sa elementary school, baho kaayo unya wala gakuhaon sa garbage truck. Daghan na ug langaw.",
    detected_languages: ["Cebuano"],
    normalized_english: "The pile of garbage further ahead in Sitio San Jose near the elementary school smells really bad and has not been collected by the garbage truck. Flies are gathering in large numbers.",
    category: "waste_management",
    sitio_mentioned: "Sitio San Jose",
    input_type: "issue",
    severity_language_score: 4
  },
  {
    input_id: 6,
    original_text: "Paki-ayos po ng sirang street light sa Sitio B dapit sa Basketball Court. Delikado po dun maglakad gabi-gabi lalo na't may balita tungkol sa magnanakaw.",
    detected_languages: ["Tagalog"],
    normalized_english: "Please fix the broken street light in Sitio B near the basketball court. It is dangerous to walk there every night, especially with news about thieves.",
    category: "public_safety",
    sitio_mentioned: "Sitio B",
    input_type: "issue",
    severity_language_score: 4
  },
  {
    input_id: 7,
    original_text: "Daycare center, very needed in Sitio Riverside. Sige lang mi bantay aning mga gagmayng bata, kinsa may manginabuhi ani unya manglimpyo.",
    detected_languages: ["Cebuano", "English"],
    normalized_english: "A daycare center is very needed in Sitio Riverside. We are constantly preoccupied with watching small children, leaving no one to make a living or clean up.",
    category: "education",
    sitio_mentioned: "Sitio Riverside",
    input_type: "suggestion",
    severity_language_score: 3
  },
  {
    input_id: 8,
    original_text: "Hello testing mic hello 123 sge admin test feedback barangay 102.",
    detected_languages: ["English", "Cebuano"],
    normalized_english: "Microphone test. Administrative feedback system test 102.",
    category: "other",
    sitio_mentioned: null,
    input_type: "noise",
    severity_language_score: 1
  },
  {
    input_id: 9,
    original_text: "Sige lang ug agi ang mga heavy dump truck dapit sa main entrance sa Sitio San Jose, naguba na hinuon ang bag-o nga semento. Puno na ug libaong ang dalan.",
    detected_languages: ["Cebuano", "English"],
    normalized_english: "Heavy dump trucks keep rolling near the main entrance of Sitio San Jose, which has ruined the newly paved concrete. The road is now full of potholes.",
    category: "infrastructure_roads",
    sitio_mentioned: "Sitio San Jose",
    input_type: "issue",
    severity_language_score: 3
  },
  {
    input_id: 10,
    original_text: "Many stray dogs roaming in Sitio B, sige managod unya saba kaayo inig gabii. Naay napaakan nga bata gahapon dapit sa tindahan.",
    detected_languages: ["English", "Tagalog"],
    normalized_english: "There are many stray dogs roaming in Sitio B, they keep chasing people and are very noisy at night. A child was bitten yesterday near the local store.",
    category: "public_safety",
    sitio_mentioned: "Sitio B",
    input_type: "issue",
    severity_language_score: 5
  }
];

export const SIMULATED_THEMES: ThemeDetail[] = [
  {
    theme_id: "TH-PUB-B",
    category: "public_safety",
    theme_label: "Dark Corners and Loose Stray Dogs in Sitio B",
    mention_count: 3,
    sitios_affected: ["Sitio B"],
    avg_severity_language_score: 4.33,
    input_type_breakdown: { issue: 3, suggestion: 0, noise: 0 },
    representative_quotes: [
      "The dark corner in Sitio B has became a hangout spot for people drinking alcohol at night. It is very dark there, is it safe for youths?",
      "Please fix the broken street light in Sitio B near the basketball court. It is dangerous to walk there of late due to thieves.",
      "There are many stray dogs roaming in Sitio B, chasing people. A child was bitten yesterday near the local store."
    ]
  },
  {
    theme_id: "TH-FLD-RIV",
    category: "flooding_drainage",
    theme_label: "Road Flooding Near Chapel in Sitio Riverside",
    mention_count: 1,
    sitios_affected: ["Sitio Riverside"],
    avg_severity_language_score: 4.0,
    input_type_breakdown: { issue: 1, suggestion: 0, noise: 0 },
    representative_quotes: [
      "It is always flooding near the chapel in Sitio Riverside. Every afternoon when it rains, the flood is so high that the road becomes impassable for students."
    ]
  },
  {
    theme_id: "TH-WST-SJO",
    category: "waste_management",
    theme_label: "Garbage Accumulation Near Elementary School in Sitio San Jose",
    mention_count: 1,
    sitios_affected: ["Sitio San Jose"],
    avg_severity_language_score: 4.0,
    input_type_breakdown: { issue: 1, suggestion: 0, noise: 0 },
    representative_quotes: [
      "The pile of garbage further ahead in Sitio San Jose near the elementary school smells really bad and has not been collected by the garbage truck. Flies are gathering in large numbers."
    ]
  },
  {
    theme_id: "TH-LIV-RIV",
    category: "livelihood_employment",
    theme_label: "Livelihood Programs for Single Mothers in Sitio Riverside",
    mention_count: 1,
    sitios_affected: ["Sitio Riverside"],
    avg_severity_language_score: 3.0,
    input_type_breakdown: { issue: 0, suggestion: 1, noise: 0 },
    representative_quotes: [
      "We need a livelihood program for single mothers, especially here in Sitio Riverside, as there are no stable jobs to support families."
    ]
  },
  {
    theme_id: "TH-EDU-RIV",
    category: "education",
    theme_label: "Daycare Center Requirement in Sitio Riverside",
    mention_count: 1,
    sitios_affected: ["Sitio Riverside"],
    avg_severity_language_score: 3.0,
    input_type_breakdown: { issue: 0, suggestion: 1, noise: 0 },
    representative_quotes: [
      "A daycare center is very needed in Sitio Riverside. We are constantly preoccupied watching small children, leaving no one to clean or work."
    ]
  },
  {
    theme_id: "TH-INF-SJO",
    category: "infrastructure_roads",
    theme_label: "Dump Truck Potholes at Sitio San Jose Entrance",
    mention_count: 1,
    sitios_affected: ["Sitio San Jose"],
    avg_severity_language_score: 3.0,
    input_type_breakdown: { issue: 1, suggestion: 0, noise: 0 },
    representative_quotes: [
      "Heavy dump trucks keep rolling near the main entrance of Sitio San Jose, which has ruined the newly paved concrete. The road is now full of potholes."
    ]
  }
];

export const SIMULATED_RANKED_PRIORITIES: RankedPriority[] = [
  {
    theme_id: "TH-PUB-B",
    theme_label: "Dark Corners and Loose Stray Dogs in Sitio B",
    scores: {
      coverage: 2,
      geographic_concentration: 3,
      time_consistency: 4,
      population_impact: 4
    },
    composite_priority_score: 3.25,
    criteria_scored_count: 4,
    data_gaps: [],
    budget_fit: "fits_within_fund",
    budget_fit_explanation: "Solar street lights and stray animal coordinate roundups are low-overhead and fit directly inside the ₱50,000 Barangay Development Fund."
  },
  {
    theme_id: "TH-FLD-RIV",
    theme_label: "Road Flooding Near Chapel in Sitio Riverside",
    scores: {
      coverage: 2,
      geographic_concentration: 4,
      time_consistency: 5,
      population_impact: 5
    },
    composite_priority_score: 4.0,
    criteria_scored_count: 4,
    data_gaps: [],
    budget_fit: "exceeds_fund_needs_city_support",
    budget_fit_explanation: "Flooding requires complete culvert declogging and drainage construction, exceeding the ₱50,000 limit. Propose referral and escalation to City Engineering Office."
  },
  {
    theme_id: "TH-WST-SJO",
    theme_label: "Garbage Accumulation Near Elementary School in Sitio San Jose",
    scores: {
      coverage: 1,
      geographic_concentration: 2,
      time_consistency: 4,
      population_impact: 5
    },
    composite_priority_score: 3.0,
    criteria_scored_count: 4,
    data_gaps: [],
    budget_fit: "fits_within_fund",
    budget_fit_explanation: "Conducting community cleanup events and placing modular garbage segregation bins fit well within the ₱50,000 budget."
  },
  {
    theme_id: "TH-LIV-RIV",
    theme_label: "Livelihood Programs for Single Mothers in Sitio Riverside",
    scores: {
      coverage: 2,
      geographic_concentration: 3,
      time_consistency: 3,
      population_impact: 4
    },
    composite_priority_score: 3.0,
    criteria_scored_count: 4,
    data_gaps: [],
    budget_fit: "fits_within_fund",
    budget_fit_explanation: "Sponsoring short-course skills training (dishwashing liquid making, sewing, detergent formulation) has low start-up cost (approx ₱20,000-₱35,000)."
  },
  {
    theme_id: "TH-EDU-RIV",
    theme_label: "Daycare Center Requirement in Sitio Riverside",
    scores: {
      coverage: 2,
      geographic_concentration: 4,
      time_consistency: 3,
      population_impact: 3
    },
    composite_priority_score: 3.0,
    criteria_scored_count: 4,
    data_gaps: [],
    budget_fit: "conflicts_with_planned_project",
    budget_fit_explanation: "Conflicts with standard FY2026 Social Welfare daycare supply procurement project. Suggest integration with existing project instead of separate funding."
  }
];

export const SIMULATED_PROJECT_PITCHES: ProjectPitch[] = [
  {
    theme_id: "TH-PUB-B",
    pitch_title: "Sitio B Safe Haven: Solar Streetlighting & Animal Control Campaign",
    description: "Procurement of 12 solar-powered LED streetlights with dynamic motion sensors to light up the dark basketball court corner, combined with a coordinated municipal veterinarian dog-catching roundup plus free anti-rabies vaccination sweep for loose dogs.",
    estimated_cost_range_php: "₱32,000 - ₱42,000",
    estimated_impact: "Restores community safety for 920 residents, deters nocturnal drinking/criminal loitering, and eliminates stray dog bite risks dapit sa tindahan.",
    citizen_rationale: "Addresses reports of children bitten near the store, broken lights causing fear of thieves, and alcohol hangouts in dark basketball court corners.",
    feasibility_flag: "fits_budget",
    conflict_warning: null
  },
  {
    theme_id: "TH-WST-SJO",
    pitch_title: "Eco-Guardians: School-Zone Segregation Hubs",
    description: "Setting up 4 secure community garbage segregation chambers near the entrance of Sitio San Jose and the elementary school, paired with an informative zero-waste campaign led by Sangguniang Kabataan and a dedicated LGU collection schedule guarantee.",
    estimated_cost_range_php: "₱18,000 - ₱24,000",
    estimated_impact: "Serves 2,100 municipal citizens, eliminates disease vectors around sweet elementary students, and eliminates the strong offensive odor.",
    citizen_rationale: "Directly addresses complaints of uncollected smelly trash attracting flies right near children's elementary school.",
    feasibility_flag: "fits_budget",
    conflict_warning: null
  },
  {
    theme_id: "TH-LIV-RIV",
    pitch_title: "Single Mother Household Income Project (Sewing & Detergents)",
    description: "Barangay-sponsored workshop training that provides single mothers with liquid soap making starter kits, sewing machine rentals, and packaging supplies to form a registered local microeconomic cooperative.",
    estimated_cost_range_php: "₱25,000 - ₱35,000",
    estimated_impact: "Empowers 40-50 localized single mother households with sustainable home-based earning opportunities.",
    citizen_rationale: "Directly addresses calls from Riverside mothers seeking livelihood after losing jobs during the pandemic.",
    feasibility_flag: "fits_budget",
    conflict_warning: null
  }
];

export const SIMULATED_DRAFT_DOCUMENTS = {
  resolution: `REPUBLIC OF THE PHILIPPINES
PROVINCE OF CEBU
CITY OF MANDAUE
BARANGAY [CITY_CENTER]

EXCERPT FROM THE MINUTES OF THE REGULAR SESSION OF THE SANGGUNIANG BARANGAY OF [CITY_CENTER], MANDAUE CITY HELD AT THE BARANGAY SESSION HALL ON JUNE 24, 2026.

PRESENT:
Hon. [Punong Barangay Name] - Punong Barangay, Presiding Officer
Hon. [Kagawad Name 1] - Barangay Kagawad
Hon. [Kagawad Name 2] - Barangay Kagawad
Hon. [Kagawad Name 3] - Barangay Kagawad
Hon. [Kagawad Name 4] - Barangay Kagawad
Hon. [Kagawad Name 5] - Barangay Kagawad
Hon. [Kagawad Name 6] - Barangay Kagawad
Hon. [Kagawad Name 7] - Barangay Kagawad
Hon. [SK Chairperson Name] - SK Chairperson

----------------------------------------------------------------------

BARANGAY RESOLUTION NO. 26-042
Series of 2026

"A RESOLUTION AUTHORIZING THE PROCUREMENT OF TWELVE (12) SOLAR-POWERED STREET LIGHTS AND APPROVING THE ENFORCEMENT OF AN INTEGRATED ANIMAL CONTROL AND ANTI-RABIES SWEEP IN SITIO B, ALLOCATING THE AMOUNT OF FORTY THOUSAND PESOS (₱40,000) FROM THE 20% BARANGAY DEVELOPMENT FUND."

WHEREAS, multiple verified reports from the citizens of Sitio B have highlighted public safety hazards regarding the lack of functional street lighting near the basketball court, creating an unsafe environment vulnerable to theft, dark loitering, and illicit drinking activities;

WHEREAS, there has been a high incidence of stray dogs roaming freely in the same vicinity, causing extreme public nuisance and a confirmed incident of a minor child being bitten yesterday dapit sa tindahan;

WHEREAS, the Sangguniang Barangay belongs to the frontier of civic care and recognizes the immediate need of its 920 residents for reliable nocturnal illumination and biological security;

WHEREAS, under the Local Government Code of 1991 (R.A. 7160), the barangay development fund is authorized to initiate disaster preparedness and public security infrastructure projects within its territory;

NOW, THEREFORE, on motion of Kagawad [Chairperson of Public Safety Committee], seconded by Kagawad [Co-movant], be it:

RESOLVED, AS IT IS HEREBY RESOLVED, to authorize the Punong Barangay to procure twelve (12) heavy-duty solar streetlights with motion sensors, and enlist the support of the Mandaue City Veterinary Department to conduct a comprehensive stray dog collection sweep at Sitio B.

RESOLVED FURTHER, that the total budget of Forty Thousand Pesos (₱40,000) be disbursed safely from the active 20% Development Fund, and that procurement be conducted in strict compliance with the Republic Act 9184 standards.

UNANIMOUSLY APPROVED.

I hereby certify to the correctness of the foregoing resolution.

[BARANGAY_SECRETARY_NAME]
Barangay Secretary

Attested:

Hon. [PUNONG_BARANGAY_NAME]
Punong Barangay`,

  ppmp: `PROJECT PROCUREMENT MANAGEMENT PLAN (PPMP) — DRAFT
Project Title: Sitio B Safe Haven Streetlighting & Animal Roundup
Procurement Mode: Small Value Procurement (Section 53.9, R.A. 9184)
End-User Unit: Sangguniang Barangay (Committee on Peace and Order)

| Item Code | General Description of Procurement items | Qty | Unit | Estimated Unit Cost (PHP) | Estimated Total Cost (PHP) | Schedule of Need |
|---|---|---|---|---|---|---|
| SOL-01 | 100W IP65 Solar LED Streetlights containing rechargeable LiFePO4 batteries, complete with brackets and mounting poles | 12 | sets | ₱2,500.00 | ₱30,000.00 | July 2026 |
| POL-02 | Heavy Duty Galvanized Steel Mounting Anchors and Hardware Installation Kit | 12 | units | ₱350.00 | ₱4,200.00 | July 2026 |
| FE-01 | Mobile community logistics, fuel support, and refreshments for voluntary barangay tanods and animal sweep helpers | 1 | lot | ₱2,800.00 | ₱2,800.00 | July 2026 |
| VET-01 | Procurement of safety dog-catcher poles and anti-rabies vaccines (coordinated logistics) | 1 | lot | ₱3,000.00 | ₱3,000.00 | July 2026 |
| **TOTAL** | **Estimated Procurement Budget** | | | | **₱40,000.00** | |

*Prepared by the Barangay Secretary. Checked against available 2026 balance sheet by the Barangay Treasurer.*`,

  budget: `ITEMIZED BUDGET BREAKDOWN — SANCTIONED PROSECUTION
Source of Funds: Barangay Development Fund 2026 (Stated Available: ₱50,000.00)

| Account Category | Description / Specifications | Budget Allocation (PHP) | Percent of Budget |
|---|---|---|---|
| Capital Outlay | 12 x Solar LED Streetlight Kits (₱2,500.00 each) | ₱30,000.00 | 75.0% |
| Repairs & Maintenance | Galvanized bolts, concrete mix, wall sockets & post mounts | ₱4,200.00 | 10.5% |
| MOOE | Coordinated animal sweep veterinary support and dog nets | ₱3,000.00 | 7.5% |
| Auxiliary Operations | Logistics, gas, and snacks for Tanods conducting setup | ₱2,800.00 | 7.0% |
| **SUB-TOTAL** | **Sitio B Safe Haven Allocation** | **₱40,000.00** | **100.0%** |
| Contingency Reserve | Remaining Unallocated Barangay Development Fund | ₱10,000.00 | - |
| **TOTAL FUND** | **Original Stated Development allotment** | **₱50,000.00** | **125.0% of project** |

*Draft complete. Total active cost is ₱40,000.00, which leaves exactly ₱10,000.00 remaining in the Development fund.*`
};
