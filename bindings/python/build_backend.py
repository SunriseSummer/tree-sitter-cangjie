"""PEP 517 backend that stages parser sources for the Python subproject."""

from __future__ import annotations

import atexit
import shutil
from pathlib import Path


PACKAGE_ROOT = Path(__file__).resolve().parent
REPOSITORY_ROOT = PACKAGE_ROOT.parents[1]
VENDOR_ROOT = PACKAGE_ROOT / "vendor"


def _stage_repository_sources() -> None:
    parser_dir = REPOSITORY_ROOT / "parser"
    source_dir = parser_dir / "src"
    queries_dir = parser_dir / "queries"
    license_file = REPOSITORY_ROOT / "LICENSE"

    if not source_dir.is_dir():
        if not (VENDOR_ROOT / "src" / "parser.c").is_file():
            raise RuntimeError(
                "Python build has neither repository sources nor vendored sources"
            )
        return

    shutil.rmtree(VENDOR_ROOT, ignore_errors=True)
    staged_source_dir = VENDOR_ROOT / "src"
    staged_source_dir.mkdir(parents=True)
    shutil.copy2(source_dir / "parser.c", staged_source_dir / "parser.c")
    scanner_file = source_dir / "scanner.c"
    if scanner_file.is_file():
        shutil.copy2(scanner_file, staged_source_dir / "scanner.c")
    shutil.copytree(
        source_dir / "tree_sitter",
        staged_source_dir / "tree_sitter",
    )
    shutil.copytree(
        queries_dir,
        VENDOR_ROOT / "queries",
        ignore=shutil.ignore_patterns("tests"),
    )
    shutil.copy2(license_file, VENDOR_ROOT / "LICENSE")
    atexit.register(shutil.rmtree, VENDOR_ROOT, ignore_errors=True)


_stage_repository_sources()

from setuptools.build_meta import *  # noqa: E402,F401,F403
