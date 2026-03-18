"""
MMCP Political Stability Predictor — Central Configuration

POLICY: All magic numbers, thresholds, and structural definitions live HERE.
        No hardcoded values in src/ modules. If you need a number, define it here.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Tuple

# =============================================================================
# STATE VECTOR DEFINITION — 17 dimensions
# =============================================================================

# Continuous dimensions (0–1 normalized from V-Dem or external sources)
CONTINUOUS_DIMENSIONS: Dict[str, str] = {
    # Judicial block
    "v2juhcind": "High Court independence",
    "v2jucomp": "Compliance with judiciary",
    "v2jureview": "Judicial review",
    "v2juncind": "Lower court independence",
    # Legislative block
    "v2lgello": "Legislature investigates executive",
    "v2exrescon": "Executive respects constitution",
    "v2psoppaut": "Opposition party autonomy",
    # Civil society
    "v2cseeorgs": "CSO entry/exit",
    "v2csreprss": "CSO repression",
    "v2cafres": "Academic freedom",
    # Electoral
    "v2elaccept": "Election losers accept results",
    "v2elirreg": "Election irregularities (inverted)",
    "v2elfpdary": "Fairness of party registration",
    # Media
    "v2mecenefm": "Media censorship effort",
    "v2mebias": "Media bias",
    # Economic (z-scored, then sigmoid-mapped to 0–1)
    "gdp_growth_z": "GDP growth (standardized)",
    "inflation_z": "Inflation (standardized, inverted)",
}

# Momentum dimensions (computed, not raw)
MOMENTUM_DIMENSIONS: List[str] = [
    "momentum_12mo",  # 12-month rolling DSI change
    "momentum_3mo",   # 3-month rolling DSI change
]

# Discrete trigger sub-vector (binary, 6-month window)
TRIGGER_EVENTS: List[str] = [
    "court_packing",
    "state_of_emergency",
    "term_limit_change",
    "disputed_election",
    "foreign_agent_law",
    "opposition_leader_arrest",
    "public_media_capture",
    "protest_violent_dispersal",
]

# Total state vector width
STATE_VECTOR_WIDTH: int = len(CONTINUOUS_DIMENSIONS) + len(MOMENTUM_DIMENSIONS) + len(TRIGGER_EVENTS)
# Expected: 17 + 2 + 8 = 27 (full vector including triggers)
# Core continuous+momentum: 19

# =============================================================================
# NAMED PATHS — cluster identities
# =============================================================================

NAMED_PATHS: List[str] = [
    "rapid_collapse",
    "polarisation_collapse",
    "gradual_legal_consolidation",
    "populist_consolidation",
    "resource_funded_populism",
    "development_driven_transition",
    "pacted_elite_transition",
    "civil_society_transition",
    "electoral_self_correction",
    "control_stable_democracy",
]

# =============================================================================
# SIMILARITY ENGINE PARAMETERS
# =============================================================================

TOP_K: int = 10  # Number of nearest historical matches to retrieve
COVARIANCE_MIN_SAMPLES: int = 30  # Minimum samples before Mahalanobis is trustworthy
# Below this → fall back to cosine similarity

# =============================================================================
# PREDICTION OUTCOME BINS (6-month horizon)
# =============================================================================

OUTCOME_BINS_6MO: List[str] = [
    "stable",
    "moderate_erosion",
    "significant_institutional_event",
    "crisis",
]

# =============================================================================
# INTERACTION MULTIPLIERS — empirically calibrated
# =============================================================================

@dataclass(frozen=True)
class InteractionRule:
    name: str
    condition_description: str
    multiplier: float
    empirical_basis: str
    override: bool = False  # If True, triggers HIGH ALERT instead of multiplier

INTERACTION_RULES: List[InteractionRule] = [
    InteractionRule(
        name="judicial_legislative_erosion",
        condition_description="D1 < 5.0 AND D2 < 5.0 simultaneously",
        multiplier=1.3,
        empirical_basis="11/12 historical cases → significant event within 18 months",
    ),
    InteractionRule(
        name="civil_society_crush_plus_institutional_weakness",
        condition_description="D6 < 5.0 AND (D1 + D4) < 10.0",
        multiplier=1.4,
        empirical_basis="Weimar, Chile, Tunisia calibration",
    ),
    InteractionRule(
        name="rapid_media_collapse_plus_judicial_weakness",
        condition_description="D7 drops > 2pt in 6 months AND D1 < 6.0",
        multiplier=0.0,  # Not used — override takes over
        empirical_basis="Weimar 1932, Chile 1973, Yugoslavia 1990",
        override=True,
    ),
]

# =============================================================================
# DIMENSION BLOCK MAPPING (for interaction rule evaluation)
# =============================================================================
# D1 = Judicial, D2 = Legislative, D3 = Civil society, D4 = Electoral,
# D5 = Media, D6 = Economic, D7 = composite DSI momentum

DIMENSION_BLOCKS: Dict[str, List[str]] = {
    "D1_judicial": ["v2juhcind", "v2jucomp", "v2jureview", "v2juncind"],
    "D2_legislative": ["v2lgello", "v2exrescon", "v2psoppaut"],
    "D3_civil_society": ["v2cseeorgs", "v2csreprss", "v2cafres"],
    "D4_electoral": ["v2elaccept", "v2elirreg", "v2elfpdary"],
    "D5_media": ["v2mecenefm", "v2mebias"],
    "D6_economic": ["gdp_growth_z", "inflation_z"],
}

# =============================================================================
# QA / VALIDATION THRESHOLDS
# =============================================================================

# Minimum data completeness per country-year to include in analysis
MIN_DATA_COMPLETENESS: float = 0.70  # 70% of dimensions must be non-null

# Brier score threshold — model must beat this or it's not deployable
MAX_ACCEPTABLE_BRIER_SCORE: float = 0.25

# Calibration — max deviation between predicted and observed frequency
MAX_CALIBRATION_DEVIATION: float = 0.15  # 15 percentage points

# Minimum cases per named path cluster
MIN_CASES_PER_CLUSTER: int = 3
