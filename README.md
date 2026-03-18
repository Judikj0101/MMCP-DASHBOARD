# MMCP Political Stability Predictor

Probabilistic democratic stability forecasting based on historical pattern matching.

## What It Does

Predicts democratic stability trajectories by comparing a country's current institutional profile against 99 historical cases. Outputs 6-month scenario probabilities and 5-year trajectory classifications.

## Architecture

```
Master CSV → data_loader → state_vector → clustering → similarity → predictor → report
                                              ↓                        ↑
                                          centroids ──────────────────┘
                                                      calibration ───┘
```

## Project Structure

```
MMCP/
├── data/raw/           # Master CSV (input, never modified by code)
├── data/processed/     # Feature matrices, centroids, backtest results
├── src/                # Core pipeline modules
│   ├── data_loader.py  # Phase 2: CSV loading + validation
│   ├── state_vector.py # Phase 2: Normalization + feature matrix
│   ├── schemas.py      # Pandera validation schemas
│   ├── clustering.py   # Phase 3: Ward linkage → named path centroids
│   ├── similarity.py   # Phase 4: Mahalanobis + cosine distance engine
│   ├── predictor.py    # Phase 4: Outcome aggregation + multipliers
│   ├── calibration.py  # Phase 5: Isotonic regression calibration
│   └── report.py       # Phase 6: Report structure + Claude input packet
├── tests/              # pytest test suite (mirrors src/)
├── scripts/            # Gate scripts, smoke test
├── notebooks/          # Exploration and validation
├── config.py           # All thresholds, dimensions, named paths
├── POLICIES.md         # Binding development rules
├── PHASES.md           # Phase definitions with entry/exit criteria
└── requirements.txt    # Pinned dependencies
```

## Development Phases

| Phase | What | Status |
|-------|------|--------|
| 1 | Scaffolding + policies | Complete |
| 2 | Data pipeline (loader + state vector) | Not started |
| 3 | Clustering → named paths | Not started |
| 4 | Similarity engine + predictor | Not started |
| 5 | Backtest + calibration | Not started |
| 6 | Report generator | Not started |

See [PHASES.md](PHASES.md) for entry/exit criteria.
See [POLICIES.md](POLICIES.md) for development rules.

## Quick Start

```bash
pip install -r requirements.txt
python scripts/gate_phase_1.py  # Verify scaffolding
```
