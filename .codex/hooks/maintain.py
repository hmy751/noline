"""Project-root wrapper for the Workspace Maintain lifecycle adapter."""

from __future__ import annotations

from pathlib import Path
import sys


PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))

from context.work.harness.maintain.host_adapter import main  # noqa: E402


if __name__ == "__main__":
    raise SystemExit(
        main([*sys.argv[1:], "--project-root", str(PROJECT_ROOT)])
    )
