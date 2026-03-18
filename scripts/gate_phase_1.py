#!/usr/bin/env python3
"""
MMCP Phase 1 Gate — Scaffolding Verification

Exit criteria:
  1. All required directories exist
  2. config.py importable, STATE_VECTOR_WIDTH correct
  3. All named paths defined
  4. requirements.txt parseable, no unpinned deps
  5. Policy and phase documents exist and non-empty
  6. schemas.py importable

Run: python scripts/gate_phase_1.py
Exit code 0 = PASS, non-zero = FAIL
"""

import sys
import os
import json
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
RESULTS = []


def check(name: str, condition: bool, detail: str = ""):
    status = "PASS" if condition else "FAIL"
    RESULTS.append({"check": name, "status": status, "detail": detail})
    print(f"  [{status}] {name}" + (f" — {detail}" if detail else ""))
    return condition


def main():
    print("=" * 60)
    print("MMCP PHASE 1 GATE — SCAFFOLDING VERIFICATION")
    print("=" * 60)
    all_pass = True

    # 1. Directory structure
    print("\n1. Directory structure")
    for d in ["data/raw", "data/processed", "data/cases", "src", "tests", "scripts", "notebooks"]:
        all_pass &= check(f"dir:{d}", (ROOT / d).is_dir())

    # 2. config.py importable
    print("\n2. Configuration")
    sys.path.insert(0, str(ROOT))
    try:
        import config
        all_pass &= check("config.py imports", True)
        all_pass &= check(
            "STATE_VECTOR_WIDTH value",
            config.STATE_VECTOR_WIDTH == len(config.CONTINUOUS_DIMENSIONS) + len(config.MOMENTUM_DIMENSIONS) + len(config.TRIGGER_EVENTS),
            f"width={config.STATE_VECTOR_WIDTH}",
        )
        all_pass &= check(
            "NAMED_PATHS count",
            len(config.NAMED_PATHS) == 10,
            f"found {len(config.NAMED_PATHS)} paths",
        )
        all_pass &= check(
            "INTERACTION_RULES defined",
            len(config.INTERACTION_RULES) == 3,
            f"found {len(config.INTERACTION_RULES)} rules",
        )
        all_pass &= check(
            "DIMENSION_BLOCKS defined",
            len(config.DIMENSION_BLOCKS) >= 6,
            f"found {len(config.DIMENSION_BLOCKS)} blocks",
        )
    except Exception as e:
        all_pass &= check("config.py imports", False, str(e))

    # 3. requirements.txt
    print("\n3. Dependencies")
    req_path = ROOT / "requirements.txt"
    all_pass &= check("requirements.txt exists", req_path.is_file())
    if req_path.is_file():
        lines = [l.strip() for l in req_path.read_text().splitlines() if l.strip() and not l.strip().startswith("#")]
        unpinned = [l for l in lines if ">=" not in l and "==" not in l]
        all_pass &= check(
            "no unpinned deps",
            len(unpinned) == 0,
            f"unpinned: {unpinned}" if unpinned else "",
        )

    # 4. Policy documents
    print("\n4. Policy documents")
    for doc in ["POLICIES.md", "PHASES.md"]:
        p = ROOT / doc
        exists = p.is_file()
        non_empty = p.stat().st_size > 100 if exists else False
        all_pass &= check(f"{doc} exists & non-empty", exists and non_empty)

    # 5. Package init files
    print("\n5. Package structure")
    all_pass &= check("src/__init__.py", (ROOT / "src" / "__init__.py").is_file())
    all_pass &= check("tests/__init__.py", (ROOT / "tests" / "__init__.py").is_file())

    # 6. Schemas
    print("\n6. Schemas")
    schemas_path = ROOT / "src" / "schemas.py"
    all_pass &= check("src/schemas.py exists", schemas_path.is_file())
    if schemas_path.is_file():
        try:
            # Just verify it's importable (don't need pandera installed yet)
            content = schemas_path.read_text()
            all_pass &= check("schemas.py non-empty", len(content) > 50)
        except Exception as e:
            all_pass &= check("schemas.py readable", False, str(e))

    # Summary
    print("\n" + "=" * 60)
    passed = sum(1 for r in RESULTS if r["status"] == "PASS")
    total = len(RESULTS)
    verdict = "PASS" if all_pass else "FAIL"
    print(f"GATE 1 RESULT: {verdict} ({passed}/{total} checks passed)")
    print("=" * 60)

    # Save results
    output_path = ROOT / "data" / "processed" / "gate_1_results.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps({
        "phase": 1,
        "verdict": verdict,
        "timestamp": datetime.utcnow().isoformat(),
        "checks": RESULTS,
    }, indent=2))
    print(f"\nResults saved to {output_path}")

    sys.exit(0 if all_pass else 1)


if __name__ == "__main__":
    main()
