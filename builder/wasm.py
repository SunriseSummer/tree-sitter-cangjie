"""WASM build target."""

from pathlib import Path

from .utils import RELEASE_DIR, REPO_ROOT, file_size_str, log, run, which


def _build_with_system_clang(output: Path) -> bool:
    """Build the Tree-sitter side module without downloading a full WASI SDK."""
    clang = which("clang")
    if not clang:
        return False

    include_dir = Path(__file__).with_name("wasm_include")
    run([
        clang,
        "--target=wasm32-wasi",
        "-o",
        str(output),
        "-fPIC",
        "-shared",
        "-Os",
        "-Wl,--export=tree_sitter_cangjie",
        "-Wl,--allow-undefined",
        "-Wl,--no-entry",
        "-nostdlib",
        "-nostdlibinc",
        "-fno-exceptions",
        "-fvisibility=hidden",
        "-I",
        str(include_dir),
        "-I",
        str(REPO_ROOT / "src"),
        str(REPO_ROOT / "src" / "parser.c"),
        str(REPO_ROOT / "src" / "scanner.c"),
    ])
    return True


def build(auto_install: bool = False) -> None:
    """
    【WASM 目标】构建 WebAssembly 插件

    构建原理：
    使用 tree-sitter CLI 的 build --wasm 命令，借助 wasi-sdk（基于 Clang
    的 WASM 编译工具链，首次运行时自动下载）将 C 源码（parser.c +
    scanner.c）编译为 .wasm 字节码。生成的文件可在浏览器中通过 WebAssembly
    API 加载，或在 WASI 运行时（如 wasmtime）中使用，实现跨平台语法解析。

    产物：release/tree-sitter-cangjie.wasm
    """
    log("构建 WASM 插件...")
    output = RELEASE_DIR / "tree-sitter-cangjie.wasm"
    if not _build_with_system_clang(output):
        run(
            ["npx", "tree-sitter", "build", "--wasm", "-o", str(output), "."],
            cwd=REPO_ROOT,
        )
    log(f"WASM: {output.name} ({file_size_str(output)})", "ok")
