# MMCP Phase Definitions — Entry/Exit Criteria

**Document status:** BINDING — no phase may begin until prior phase exit criteria are met.
**Last updated:** 2026-03-18

---

## Phase Transition Rules

1. **Sequential enforcement.** Phase N+1 CANNOT begin until Phase N exit criteria are ALL met.
2. **Gate verification.** Each phase has a gate script (`scripts/gate_phase_N.py`) that
   programmatically verifies exit criteria. The gate must PASS before proceeding.
3. **No partial phases.** A phase is either NOT STARTED, IN PROGRESS, or COMPLETE.
   There is no "mostly done" — either the gate passes or it doesn't.
4. **Rollback rule.** If Phase N+1 reveals a defect in Phase N's output, development
   returns to Phase N. Phase N's tag is NOT moved — a new completion is required.
5. **Documentation.** Each phase completion is recorded with:
   - Git tag: `phase-N-complete`
   - Gate script output saved to `data/processed/gate_N_results.json`
   - Brief summary in this document (appended under the phase)

---

## PHASE 1: Project Scaffolding

**Objective:** Repository structure, dependencies, configuration, policies.

### Entry Criteria
- None (starting phase)

### Deliverables
- [ ] Directory structure created (`data/`, `src/`, `tests/`, `scripts/`, `notebooks/`)
- [ ] `requirements.txt` with pinned dependencies
- [ ] `config.py` with all dimension definitions, thresholds, named paths
- [ ] `POLICIES.md` — binding development rules
- [ ] `PHASES.md` — this document
- [ ] `src/__init__.py`, `tests/__init__.py`
- [ ] `src/schemas.py` — pandera schemas for data validation
- [ ] Gate script: `scripts/gate_phase_1.py`

### Exit Criteria (Gate 1)
- [ ] All directories exist
- [ ] `config.py` importable without errors
- [ ] `config.STATE_VECTOR_WIDTH` equals expected value
- [ ] All named paths defined
- [ ] `requirements.txt` parseable, no unpinned deps
- [ ] `POLICIES.md` and `PHASES.md` exist and are non-empty

### Hard Boundaries
- No source code logic in this phase (only config, schemas, stubs)
- No data processing
- No model code

---

## PHASE 2: Data Pipeline

**Objective:** Load Master CSV → build normalized State(t) feature matrix.

### Entry Criteria
- Phase 1 gate PASSED
- Master CSV placed in `data/raw/` by human

### Deliverables
- [ ] `src/data_loader.py` — loads Master CSV, validates schema
- [ ] `src/state_vector.py` — normalizes dimensions, computes momentum, builds feature matrix
- [ ] `src/schemas.py` — pandera schemas for raw input and processed output
- [ ] `tests/test_data_loader.py` — minimum 90% coverage
- [ ] `tests/test_state_vector.py` — minimum 90% coverage
- [ ] Output: `data/processed/feature_matrix.parquet`

### Exit Criteria (Gate 2)
- [ ] Feature matrix loads without errors
- [ ] All continuous dimensions in [0, 1]
- [ ] All trigger dimensions in {0, 1}
- [ ] No NaN/Inf in momentum dimensions
- [ ] Completeness gate enforced (rows below 70% excluded, count logged)
- [ ] Row count matches expected case count (±5% tolerance for excluded cases)
- [ ] All tests pass, coverage meets threshold
- [ ] `data/processed/feature_matrix.parquet` exists and is reproducible
  (running twice produces identical output)

### Hard Boundaries
- No similarity calculations
- No clustering
- No prediction logic
- Data flows ONE direction: raw → processed. Never the reverse.

---

## PHASE 3: Clustering → Named Paths

**Objective:** Hierarchical clustering on historical state vectors → named path centroids.

### Entry Criteria
- Phase 2 gate PASSED
- Feature matrix available in `data/processed/`

### Deliverables
- [ ] `src/clustering.py` — Ward linkage clustering, centroid computation
- [ ] `tests/test_clustering.py` — minimum 85% coverage
- [ ] Output: `data/processed/centroids.parquet` — one row per named path
- [ ] Output: `data/processed/cluster_assignments.json` — which case belongs to which cluster
- [ ] Validation: known cases land in expected clusters (manual review checklist)

### Exit Criteria (Gate 3)
- [ ] Number of clusters equals `len(NAMED_PATHS)` in config
- [ ] Every cluster has ≥ `MIN_CASES_PER_CLUSTER` members
- [ ] Centroid dimensionality matches `STATE_VECTOR_WIDTH`
- [ ] At least 80% of manually-labeled cases match their expected cluster
- [ ] Dendrogram saved to `data/processed/dendrogram.png` for human review
- [ ] All tests pass, coverage meets threshold

### Hard Boundaries
- No similarity queries against new/unseen data
- No prediction logic
- Clustering operates ONLY on the historical feature matrix from Phase 2
- If cluster stability is poor (cophenetic correlation < 0.7), STOP and document.
  Do not proceed to Phase 4 with unstable clusters.

---

## PHASE 4: Similarity Engine + Predictor

**Objective:** Given a country state vector, find top-k matches and predict outcomes.

### Entry Criteria
- Phase 3 gate PASSED
- Centroids available in `data/processed/`

### Deliverables
- [ ] `src/similarity.py` — Mahalanobis distance (primary), cosine fallback
- [ ] `src/predictor.py` — top-k retrieval, outcome aggregation, interaction multipliers
- [ ] `tests/test_similarity.py` — minimum 90% coverage
- [ ] `tests/test_predictor.py` — minimum 90% coverage

### Exit Criteria (Gate 4)
- [ ] Mahalanobis distance computed correctly for known test pairs (unit tests)
- [ ] Cosine fallback triggers when covariance matrix has condition number > 1e10
- [ ] Top-k retrieval returns exactly k results, sorted by distance
- [ ] Interaction multipliers apply correctly (verified against 3 known cases)
- [ ] Outcome probabilities sum to 1.0 (within floating point tolerance: |sum - 1.0| < 1e-6)
- [ ] All tests pass, coverage meets threshold

### Hard Boundaries
- No calibration adjustments (raw probabilities only)
- No report generation
- Similarity engine is STATELESS — it receives a vector and a matrix, returns distances.
  It does not load data itself.

---

## PHASE 5: Backtest + Calibration

**Objective:** Leave-one-out validation, calibration of raw probabilities.

### Entry Criteria
- Phase 4 gate PASSED

### Deliverables
- [ ] `tests/test_backtest.py` — full LOO cross-validation
- [ ] `src/calibration.py` — isotonic regression calibrator
- [ ] Output: `data/processed/backtest_results.json`
- [ ] Output: `data/processed/calibration_map.json`
- [ ] Output: `data/processed/blind_spots.json`
- [ ] Validation report: Brier score, calibration curve, per-path accuracy

### Exit Criteria (Gate 5)
- [ ] LOO completed for all 99 cases without errors
- [ ] Brier score ≤ `MAX_ACCEPTABLE_BRIER_SCORE` (0.25)
- [ ] Calibration deviation ≤ `MAX_CALIBRATION_DEVIATION` (0.15)
- [ ] Per-path accuracy: no path below 50% correct classification
- [ ] Results reproducible (deterministic with `random_state=42`)
- [ ] `blind_spots.json` generated and non-empty
- [ ] All tests pass

### Hard Boundaries
- No parameter tuning without train/validation split documentation
- If Brier score exceeds threshold: STOP. Document failure mode. Do not proceed.
- Calibration is a MONOTONIC transform — it may not reorder probability rankings.
- LOO must remove the case from BOTH the feature matrix AND the centroid computation.
  Leaking the test case into centroids invalidates the entire backtest.

---

## PHASE 6: Report Generator + Claude Integration

**Objective:** Structured output generation, Claude input packet assembly.

### Entry Criteria
- Phase 5 gate PASSED
- Calibration map available

### Deliverables
- [ ] `src/report.py` — generates Country Assessment Report structure
- [ ] `tests/test_report.py` — minimum 80% coverage
- [ ] `scripts/smoke_test.py` — end-to-end pipeline on 5-case subset, <30s
- [ ] Template: Claude input packet specification (JSON schema)
- [ ] Example outputs for 3 reference countries

### Exit Criteria (Gate 6)
- [ ] Report contains all required sections (per output spec in summary doc)
- [ ] Probabilities in report match predictor output exactly
- [ ] Claude input packet validates against JSON schema
- [ ] Smoke test passes in <30 seconds
- [ ] 3 example reports reviewed and approved by human
- [ ] All tests pass, coverage meets threshold

### Hard Boundaries
- Report generator does NOT call Claude. It produces the INPUT for Claude.
- No modification of prediction logic in this phase.
- Report generator is a pure function: structured data in → formatted output out.

---

## Phase Status Tracker

| Phase | Status | Tag | Gate Result | Date |
|-------|--------|-----|-------------|------|
| 1 | IN PROGRESS | — | — | — |
| 2 | NOT STARTED | — | — | — |
| 3 | NOT STARTED | — | — | — |
| 4 | NOT STARTED | — | — | — |
| 5 | NOT STARTED | — | — | — |
| 6 | NOT STARTED | — | — | — |
