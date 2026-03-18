"""
MMCP Data Validation Schemas

POLICY: All data flowing between pipeline stages is validated against these schemas.
        No dataframe passes a module boundary without schema enforcement.

Uses pandera for declarative schema definitions.
Schemas are imported by the modules that produce/consume the data.
"""

import pandera as pa
from pandera import Column, Check, Index
import sys
import os

# Import config from project root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config


# =============================================================================
# RAW INPUT SCHEMA — Master CSV after loading
# =============================================================================

# Defined dynamically because columns depend on config
def build_raw_case_schema() -> pa.DataFrameSchema:
    """Schema for the raw Master CSV after initial load.

    Validates:
    - Required identifier columns exist
    - Numeric columns are within plausible ranges
    - No fully empty rows
    """
    columns = {
        "country": Column(str, nullable=False),
        "year": Column(int, Check.in_range(1900, 2030), nullable=False),
        "case_id": Column(str, nullable=False),
    }

    # Continuous V-Dem dimensions — nullable (some cases have gaps)
    for dim_name in config.CONTINUOUS_DIMENSIONS:
        columns[dim_name] = Column(float, Check.in_range(0, 1), nullable=True)

    # Trigger events — binary
    for trigger in config.TRIGGER_EVENTS:
        columns[trigger] = Column(
            float,  # Allow float for NaN handling, validate {0, 1, NaN}
            Check.isin([0.0, 1.0]),
            nullable=True,
        )

    return pa.DataFrameSchema(
        columns=columns,
        coerce=True,
        strict=False,  # Allow extra columns (metadata, notes, etc.)
    )


# =============================================================================
# FEATURE MATRIX SCHEMA — After normalization and processing
# =============================================================================

def build_feature_matrix_schema() -> pa.DataFrameSchema:
    """Schema for the processed feature matrix.

    All continuous dimensions normalized to [0, 1].
    Momentum dimensions are unbounded but must be finite.
    Trigger dimensions are binary {0, 1}.
    No NaN allowed (imputation must happen before this point).
    """
    columns = {
        "country": Column(str, nullable=False),
        "year": Column(int, Check.in_range(1900, 2030), nullable=False),
        "case_id": Column(str, nullable=False),
    }

    # Continuous — strict [0, 1], no nulls
    for dim_name in config.CONTINUOUS_DIMENSIONS:
        columns[dim_name] = Column(float, Check.in_range(0.0, 1.0), nullable=False)

    # Momentum — finite, no nulls
    for dim_name in config.MOMENTUM_DIMENSIONS:
        columns[dim_name] = Column(
            float,
            Check(lambda s: s.apply(lambda x: x != float("inf") and x != float("-inf") and x == x)),
            nullable=False,
        )

    # Triggers — binary, no nulls
    for trigger in config.TRIGGER_EVENTS:
        columns[trigger] = Column(float, Check.isin([0.0, 1.0]), nullable=False)

    return pa.DataFrameSchema(
        columns=columns,
        coerce=True,
        strict=False,
    )


# =============================================================================
# CENTROID SCHEMA — Cluster centroids
# =============================================================================

def build_centroid_schema() -> pa.DataFrameSchema:
    """Schema for named path centroids.

    One row per named path. All dimensions present, finite.
    """
    columns = {
        "path_name": Column(str, Check.isin(config.NAMED_PATHS), nullable=False),
    }

    all_dims = list(config.CONTINUOUS_DIMENSIONS.keys()) + config.MOMENTUM_DIMENSIONS + config.TRIGGER_EVENTS
    for dim_name in all_dims:
        columns[dim_name] = Column(float, nullable=False)

    return pa.DataFrameSchema(
        columns=columns,
        coerce=True,
        strict=False,
    )


# =============================================================================
# PREDICTION OUTPUT SCHEMA
# =============================================================================

def build_prediction_schema() -> pa.DataFrameSchema:
    """Schema for prediction output.

    Probabilities must sum to 1.0 (within tolerance).
    """
    columns = {
        "country": Column(str, nullable=False),
        "year": Column(int, nullable=False),
    }

    # 6-month scenario probabilities
    for outcome in config.OUTCOME_BINS_6MO:
        columns[f"prob_{outcome}"] = Column(float, Check.in_range(0.0, 1.0), nullable=False)

    # Path match
    columns["primary_path"] = Column(str, Check.isin(config.NAMED_PATHS), nullable=False)
    columns["primary_path_similarity"] = Column(float, Check.in_range(0.0, 1.0), nullable=False)
    columns["path_position_equivalent"] = Column(str, nullable=True)

    # Metadata
    columns["data_completeness"] = Column(float, Check.in_range(0.0, 1.0), nullable=False)
    columns["n_close_matches"] = Column(int, Check.ge(0), nullable=False)

    return pa.DataFrameSchema(columns=columns, coerce=True, strict=False)
