"""
Automated quality assurance sanity tests validating linting, formatting, and static typing harness.
"""

import subprocess
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent


def test_ruff_linter_execution() -> None:
    """Verify that Ruff linter runs cleanly on the backend codebase with zero errors."""
    result = subprocess.run(
        [sys.executable, "-m", "ruff", "check", "."],
        cwd=BACKEND_DIR,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, f"Ruff linter detected issues:\n{result.stdout}\n{result.stderr}"


def test_ruff_formatter_check() -> None:
    """Verify that all backend Python files are formatted cleanly according to Ruff standards."""
    result = subprocess.run(
        [sys.executable, "-m", "ruff", "format", "--check", "."],
        cwd=BACKEND_DIR,
        capture_output=True,
        text=True,
        check=False,
    )
    assert (
        result.returncode == 0
    ), f"Ruff format check detected unformatted files:\n{result.stdout}\n{result.stderr}"


def test_mypy_type_checker_execution() -> None:
    """Verify that Mypy static type checker executes and reports 0 type errors on apps and config."""
    result = subprocess.run(
        [sys.executable, "-m", "mypy", "apps", "config"],
        cwd=BACKEND_DIR,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, f"Mypy type checker failed:\n{result.stdout}\n{result.stderr}"
