"""
Tests for MMCP Data Loader — Phase 2

Coverage target: 90%
Tests both positive (valid data) and negative (invalid/missing data) paths.
"""

import pytest
import pandas as pd
from pathlib import Path

# Stub tests — implemented in Phase 2


class TestLoadMasterCSV:
    """Tests for data_loader.load_master_csv()"""

    def test_load_valid_csv(self, tmp_path):
        """Valid CSV loads without errors and passes schema validation."""
        pytest.skip("[PHASE-2] Not yet implemented")

    def test_load_missing_file_raises(self):
        """FileNotFoundError on missing CSV."""
        pytest.skip("[PHASE-2] Not yet implemented")

    def test_load_empty_csv_raises(self, tmp_path):
        """ValueError on empty CSV."""
        pytest.skip("[PHASE-2] Not yet implemented")

    def test_load_csv_with_missing_required_columns(self, tmp_path):
        """SchemaError when required columns missing."""
        pytest.skip("[PHASE-2] Not yet implemented")

    def test_load_csv_with_out_of_range_values(self, tmp_path):
        """SchemaError when values outside valid ranges."""
        pytest.skip("[PHASE-2] Not yet implemented")


class TestGetCaseMetadata:
    """Tests for data_loader.get_case_metadata()"""

    def test_metadata_contains_required_keys(self):
        """Metadata dict has all required keys."""
        pytest.skip("[PHASE-2] Not yet implemented")

    def test_metadata_counts_correct(self):
        """Case count and country count are accurate."""
        pytest.skip("[PHASE-2] Not yet implemented")
