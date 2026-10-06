"""
Local source configuration shared by Metanno viewer integration scenarios
"""

from pathlib import Path

import pytest


@pytest.fixture
def config_path(tmp_path: Path) -> Path:
    """
    Configure a local DuckDB catalogue without opening a connection
    """
    path = tmp_path / "metanno.yaml"
    path.write_text("connections:\n  local:\n    url: duckdb://\nsources:\n  planner:\n    connection: local\n")
    return path
