"""
MMCP Clustering — Phase 3

Hierarchical clustering (Ward linkage) on historical state vectors → named path centroids.

Interface contract:
    Input:  Feature matrix DataFrame (from state_vector.py)
    Output: Centroids DataFrame + cluster assignments dict

POLICY: Clustering operates ONLY on historical feature matrix.
        If cophenetic correlation < 0.7, raise ClusterInstabilityError.
        Every cluster must have >= MIN_CASES_PER_CLUSTER members.
"""

import pandas as pd
import numpy as np
from typing import Dict, Tuple
import logging

logger = logging.getLogger(__name__)


class ClusterInstabilityError(Exception):
    """Raised when clustering quality is too low to proceed."""
    pass


def compute_clusters(
    feature_matrix: pd.DataFrame,
    n_clusters: int,
    random_state: int = 42,
) -> Tuple[pd.DataFrame, Dict[str, list]]:
    """Perform Ward linkage hierarchical clustering.

    Args:
        feature_matrix: Processed feature matrix (from Phase 2)
        n_clusters: Number of clusters (must equal len(NAMED_PATHS))
        random_state: For reproducibility

    Returns:
        Tuple of:
            - centroids_df: DataFrame with one row per cluster centroid
            - assignments: Dict mapping path_name → list of case_ids

    Raises:
        ClusterInstabilityError: If cophenetic correlation < 0.7
        ValueError: If any cluster has fewer than MIN_CASES_PER_CLUSTER members
    """
    raise NotImplementedError("[PHASE-3] Not yet implemented")


def compute_cophenetic_correlation(feature_matrix: pd.DataFrame) -> float:
    """Compute cophenetic correlation coefficient for clustering quality.

    Returns:
        Float in [0, 1]. Below 0.7 = unstable clustering.
    """
    raise NotImplementedError("[PHASE-3] Not yet implemented")


def assign_path_names(
    centroids: np.ndarray,
    assignments: Dict[int, list],
    known_labels: Dict[str, list],
) -> Dict[str, list]:
    """Map numeric cluster IDs to named paths based on known case membership.

    Args:
        centroids: Array of centroid vectors
        assignments: Dict mapping cluster_id → list of case_ids
        known_labels: Dict mapping path_name → list of case_ids (ground truth)

    Returns:
        Dict mapping path_name → list of case_ids
    """
    raise NotImplementedError("[PHASE-3] Not yet implemented")
