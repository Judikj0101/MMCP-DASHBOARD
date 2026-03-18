# MMCP Development Policies

**Document status:** BINDING — all contributors (human and AI) must comply.
**Last updated:** 2026-03-18
**Owner:** Project lead

---

## 1. Code Integrity Rules

### 1.1 No Magic Numbers
Every numeric threshold, weight, multiplier, or structural constant MUST be defined in `config.py`.
Source modules (`src/`) import from `config.py` — they never define their own constants.

**Violation:** PR rejected. No exceptions.

### 1.2 No Implicit Dependencies Between Modules
Each `src/` module declares its inputs and outputs as typed function signatures.
No module may import from another `src/` module except through the defined interfaces.
Dependency graph:

```
data_loader.py → state_vector.py → clustering.py
                                  → similarity.py → predictor.py → report.py
                                                    calibration.py ↗
```

Cross-cutting imports (e.g., `similarity` importing from `clustering`) are FORBIDDEN
unless explicitly documented in this file.

**Allowed cross-imports:**
- `predictor.py` may import from `similarity.py` AND `clustering.py`
- `report.py` may import from `predictor.py`
- No others without policy amendment.

### 1.3 Data Immutability
Raw data (`data/raw/`) is NEVER modified by code. Only humans place files there.
Processed outputs go to `data/processed/`. All processing is reproducible from raw.

### 1.4 Deterministic Outputs
All functions that involve randomness MUST accept a `random_state` parameter.
Default random state: `42`. This ensures reproducibility across runs.

### 1.5 No Silent Failures
Functions must raise explicit exceptions on invalid input — never return `None` silently,
never swallow exceptions, never fall through with default values on unexpected data.

Logging is mandatory at WARNING level for:
- Missing data imputation
- Fallback from Mahalanobis to cosine
- Cluster sizes below `MIN_CASES_PER_CLUSTER`

---

## 2. Data Quality Rules

### 2.1 Completeness Gate
No country-year enters the feature matrix with less than 70% dimension coverage
(`MIN_DATA_COMPLETENESS` in config). This is enforced programmatically in `state_vector.py`.

### 2.2 Range Validation
All continuous dimensions must be in [0, 1] after normalization.
All trigger dimensions must be in {0, 1}.
Momentum dimensions are unconstrained but must be finite (no NaN, no Inf).

Validation is enforced by `pandera` schemas — defined in `src/schemas.py`.

### 2.3 No Manual Overrides in Code
If a case needs special treatment (e.g., North Korea with sparse data), it is handled via
a documented exception list in `config.py`, NOT via if-statements in source code.

### 2.4 Source Traceability
Every value in `data/processed/` must be traceable to either:
- A V-Dem variable (by codename)
- The Master CSV (by column name)
- A computed derivation (documented in function docstring)

No "expert judgment" values in the pipeline. Expert judgment lives ONLY in:
- The Master CSV case profiles (input layer)
- The trigger event coding (manual, documented)

---

## 3. Testing Rules

### 3.1 Test Coverage Requirements by Phase
| Phase | Minimum Coverage | What's Tested |
|-------|-----------------|---------------|
| 2 (Data Pipeline) | 90% of `data_loader.py`, `state_vector.py` | Loading, normalization, completeness gates |
| 3 (Clustering) | 85% of `clustering.py` | Cluster stability, minimum sizes, centroid math |
| 4 (Similarity) | 90% of `similarity.py`, `predictor.py` | Distance metrics, fallback logic, multipliers |
| 5 (Backtest) | 100% of `calibration.py` | Brier score, calibration curve, LOO integrity |
| 6 (Report) | 80% of `report.py` | Output structure, field completeness |

### 3.2 Test Types Required
- **Unit tests:** Every public function has at least one positive and one negative test case
- **Contract tests:** Input/output schemas validated with pandera
- **Regression tests:** After Phase 5, a frozen set of expected outputs for 5 reference cases.
  Any code change that shifts these outputs triggers manual review.
- **Smoke tests:** `scripts/smoke_test.py` runs end-to-end on a 5-case subset in <30 seconds

### 3.3 Test Independence
Tests must not depend on each other. No shared mutable state between test functions.
Each test sets up and tears down its own data.

---

## 4. Version Control Rules

### 4.1 Commit Discipline
- One logical change per commit
- Commit messages follow: `[PHASE-N] <verb>: <what changed>`
  - Example: `[PHASE-2] add: state vector builder with V-Dem normalization`
  - Example: `[PHASE-4] fix: Mahalanobis fallback when covariance singular`
- No commits that break existing tests (pre-commit gate)

### 4.2 Branch Rules
- All development on `claude/setup-codespace-fcndU`
- No force pushes
- No rebasing published commits

### 4.3 Phase Tagging
Each completed phase gets a git tag: `phase-N-complete`
Tags are immutable — if a phase needs rework, it's a new commit, not a tag move.

---

## 5. Self-Limiting Rules

### 5.1 What This System Is NOT
- NOT a real-time monitor. It processes snapshots, not streams.
- NOT a causal model. It finds historical analogues — it does not claim X causes Y.
- NOT a point prediction. All outputs are probability distributions over scenarios.
- NOT a substitute for area expertise. The narrative layer (Claude) must flag uncertainty.

### 5.2 Confidence Reporting is Mandatory
Every prediction output MUST include:
- Data completeness percentage for the target country-year
- Number of historical matches within meaningful distance
- Which dimensions are driving the match (top 3)
- Which dimensions have weakest data

### 5.3 Honest Uncertainty
If fewer than 5 of the top-10 matches agree on an outcome category, the output MUST
state: "Low consensus among historical analogues — prediction confidence is limited."

If the nearest match distance exceeds 2× the median inter-case distance,
the output MUST state: "No close historical analogue found — novel situation."

### 5.4 Known Blind Spots (Document and Track)
The system must maintain a living list of known blind spots:
- Regions with thin V-Dem coverage (update per data refresh)
- Trigger events not yet coded for modern cases
- Structural breaks (e.g., social media as a variable not in historical cases)

This list lives in `data/processed/blind_spots.json` and is regenerated at each build.

### 5.5 No Optimization Without Validation
You may NOT tune parameters (k, thresholds, multipliers) to improve backtest scores
without first splitting into train/validation sets. Overfitting to 99 cases is the
primary risk — every tuning decision must be justified and documented.

---

## 6. Ethical Constraints

### 6.1 No Weaponization
This tool predicts democratic erosion to INFORM — not to enable:
- No outputs designed to advise on how to accelerate erosion
- No optimization of "how to consolidate power" strategies
- If a user requests this, the system must refuse

### 6.2 Transparency
All model logic is open and auditable. No black-box components.
The separation between quantitative layer (auditable math) and narrative layer (Claude)
is maintained at all times.

### 6.3 No False Precision
Never present probabilities with more than 1 decimal place (e.g., "67.3%" not "67.2841%").
The underlying data does not support finer granularity.

---

## 7. Dependency Management

### 7.1 Pinned Dependencies
All dependencies in `requirements.txt` are pinned to major.minor range.
No `>=X` without upper bound. No unpinned packages.

### 7.2 Minimal Dependencies
Every dependency must justify its inclusion. If stdlib can do it, use stdlib.
Current justifications:
- `pandas`: DataFrame operations on feature matrix — no stdlib equivalent
- `numpy`: Numerical operations — foundational
- `scipy`: Mahalanobis distance, hierarchical clustering — specialized math
- `scikit-learn`: Isotonic regression, preprocessing — no lighter alternative
- `pandera`: Schema validation — critical for data quality gates
- `matplotlib/seaborn`: Visualization in notebooks only — not in production path

### 7.3 No Runtime Network Calls
The prediction pipeline (`state_vector → similarity → predictor → report`) makes
ZERO network calls. All data must be local. Data fetching is a separate, explicit step.
