"""Run the standard Tree-sitter corpus through the Python binding."""

from dataclasses import dataclass
from pathlib import Path

import pytest
from tree_sitter import Language, Parser
import tree_sitter_cangjie


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
CORPUS_DIR = REPOSITORY_ROOT / "parser" / "test" / "corpus"
LANGUAGE = Language(tree_sitter_cangjie.language())


@dataclass(frozen=True)
class CorpusCase:
    file_path: Path
    title: str
    source: str
    expected: str

    @property
    def test_id(self):
        return f"{self.file_path.name}::{self.title}"


def parse_corpus(text, file_path):
    """Parse Tree-sitter's corpus text format into independent cases."""
    lines = text.replace("\r\n", "\n").split("\n")
    cases = []
    index = 0

    while index < len(lines):
        while index < len(lines) and not lines[index].strip():
            index += 1
        if index >= len(lines):
            break

        delimiter = lines[index].strip()
        assert delimiter and set(delimiter) == {"="}, (
            f"expected test delimiter in {file_path}:{index + 1}"
        )
        title = lines[index + 1].strip() if index + 1 < len(lines) else ""
        assert title, f"missing corpus title in {file_path}:{index + 2}"
        assert (
            index + 2 < len(lines) and lines[index + 2].strip() == delimiter
        ), f"unclosed corpus header for {title} in {file_path}"

        index += 3
        if index < len(lines) and lines[index] == "":
            index += 1

        source_lines = []
        while index < len(lines) and lines[index].strip() != "---":
            source_lines.append(lines[index])
            index += 1
        assert index < len(lines), f"missing separator for {title} in {file_path}"

        index += 1
        if index < len(lines) and lines[index] == "":
            index += 1

        expected_lines = []
        while index < len(lines):
            current = lines[index].strip()
            next_line = lines[index + 1].strip() if index + 1 < len(lines) else ""
            third_line = lines[index + 2].strip() if index + 2 < len(lines) else ""
            if (
                current
                and set(current) == {"="}
                and next_line
                and third_line == current
            ):
                break
            expected_lines.append(lines[index])
            index += 1

        source = "\n".join(source_lines).rstrip()
        expected = "\n".join(expected_lines).strip()
        assert source, f"missing corpus source for {title} in {file_path}"
        assert expected, f"missing expected tree for {title} in {file_path}"
        cases.append(CorpusCase(file_path, title, f"{source}\n", expected))

    return cases


CORPUS_FILES = tuple(sorted(CORPUS_DIR.glob("*.txt")))
CORPUS_BY_FILE = {
    file_path: tuple(
        parse_corpus(file_path.read_text(encoding="utf-8"), file_path)
    )
    for file_path in CORPUS_FILES
}
CORPUS_CASES = tuple(
    case for file_path in CORPUS_FILES for case in CORPUS_BY_FILE[file_path]
)


@pytest.mark.parametrize(
    "file_path",
    CORPUS_FILES,
    ids=lambda path: path.name,
)
def test_corpus_file_defines_cases(file_path):
    assert CORPUS_BY_FILE[file_path]


@pytest.mark.parametrize(
    "corpus_case",
    CORPUS_CASES,
    ids=lambda case: case.test_id,
)
@pytest.mark.parametrize(
    "trailing_newline",
    (True, False),
    ids=("with-newline", "without-newline"),
)
def test_corpus_case_matches_expected_tree(corpus_case, trailing_newline):
    source = (
        corpus_case.source
        if trailing_newline
        else corpus_case.source.rstrip("\n")
    )
    root = Parser(LANGUAGE).parse(source.encode("utf-8")).root_node
    actual = str(root)

    assert not root.has_error
    assert "ERROR" not in actual
    assert "MISSING" not in actual
    assert actual == corpus_case.expected
