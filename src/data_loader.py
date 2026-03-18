"""
MMCP Data Loader — Phase 2

Loads the Master CSV and validates it against the raw case schema.

Interface contract:
    Input:  Path to Master CSV file
    Output: pd.DataFrame validated against schemas.build_raw_case_schema()

POLICY: This module ONLY loads and validates. No normalization, no computation.
"""

import pandas as pd
from pathlib import Path
from typing import Optional

# Stub — implementation in Phase 2
# All function signatures are contracts. Do not change signatures without policy review.


def load_master_csv(filepath: Path) -> pd.DataFrame:
    """Load and validate the Master CSV.

    Args:
        filepath: Absolute path to the Master CSV in data/raw/

    Returns:
        Validated DataFrame with raw case data.

    Raises:
        FileNotFoundError: If CSV does not exist.
        pandera.errors.SchemaError: If data fails validation.
        ValueError: If CSV is empty.
    """
    raise NotImplementedError("[PHASE-2] Not yet implemented")


def get_case_metadata(df: pd.DataFrame) -> dict:
    """Extract summary metadata from loaded data.

    Returns dict with:
        - total_cases: int
        - country_count: int
        - year_range: tuple[int, int]
        - completeness_by_dimension: dict[str, float]
    """
    raise NotImplementedError("[PHASE-2] Not yet implemented")
