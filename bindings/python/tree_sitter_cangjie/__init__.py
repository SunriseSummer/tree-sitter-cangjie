"""Cangjie parser for tree-sitter."""

from importlib.resources import files as _files

from ._binding import language


def _get_query(name, filename):
    query = _files(f"{__package__}.queries") / filename
    globals()[name] = query.read_text(encoding="utf-8")
    return globals()[name]


def __getattr__(name):
    query_files = {
        "HIGHLIGHTS_QUERY": "highlights.scm",
        "LOCALS_QUERY": "locals.scm",
        "TAGS_QUERY": "tags.scm",
    }
    if filename := query_files.get(name):
        return _get_query(name, filename)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


__all__ = [
    "language",
    "HIGHLIGHTS_QUERY",
    "LOCALS_QUERY",
    "TAGS_QUERY",
]


def __dir__():
    return sorted(__all__ + [
        "__all__", "__builtins__", "__cached__", "__doc__", "__file__",
        "__loader__", "__name__", "__package__", "__path__", "__spec__",
    ])
