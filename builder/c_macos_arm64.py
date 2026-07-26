"""C macOS ARM64 动态库交叉编译目标"""

from .cross import ensure_zig_cmd
from .utils import RELEASE_DIR, REPO_ROOT, file_size_str, log, run


def build(auto_install: bool = False) -> None:
    """
    【C macOS ARM64 目标】交叉编译 macOS ARM64 动态库

    构建原理：
    使用 Zig 编译器的 C 编译前端（zig cc），通过 -target aarch64-macos
    指定目标架构为 macOS ARM64。Zig 内置了完整的 macOS 交叉编译支持
    （包含系统头文件和链接器），无需安装 Xcode 或 macOS SDK。
    -shared 标志指示生成 Mach-O 格式的动态链接库（.dylib），可在
    macOS ARM64 系统上通过 dlopen 或编译时链接使用。

    产物：release/libtree-sitter-cangjie.dylib
    """
    log("交叉编译 C 动态库（macOS ARM64）...")
    zig_cmd = ensure_zig_cmd(auto_install)
    dylib = RELEASE_DIR / "libtree-sitter-cangjie.dylib"
    run([
        *zig_cmd, "cc", "-target", "aarch64-macos", "-shared", "-O2",
        "-DTREE_SITTER_HIDE_SYMBOLS",
        f"-I{REPO_ROOT / 'src'}",
        str(REPO_ROOT / "src" / "parser.c"),
        str(REPO_ROOT / "src" / "scanner.c"),
        "-Wl,-install_name,@rpath/libtree-sitter-cangjie.dylib",
        "-Wl,-S",
        "-o", str(dylib),
    ])
    log(f"macOS dylib: {dylib.name} ({file_size_str(dylib)})", "ok")
