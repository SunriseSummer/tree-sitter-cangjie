"""C Linux x64 静态库和共享库构建目标"""

import shutil
import tempfile
from pathlib import Path
from platform import system

from .cross import ensure_zig_cmd
from .utils import RELEASE_DIR, REPO_ROOT, ensure_tool, file_size_str, log, run


def _build_cross(auto_install: bool) -> None:
    zig_cmd = ensure_zig_cmd(auto_install)
    with tempfile.TemporaryDirectory(prefix="ts-cj-clinux-") as tmp:
        work = Path(tmp)
        objects: list[str] = []
        for source_name in ("parser.c", "scanner.c"):
            obj = work / source_name.replace(".c", ".o")
            run([
                *zig_cmd, "cc", "-target", "x86_64-linux-gnu", "-c", "-fPIC", "-O2",
                f"-I{REPO_ROOT / 'src'}", str(REPO_ROOT / "src" / source_name),
                "-o", str(obj),
            ])
            objects.append(str(obj))
        static_library = RELEASE_DIR / "libtree-sitter-cangjie.a"
        shared_library = RELEASE_DIR / "libtree-sitter-cangjie.so"
        run([*zig_cmd, "ar", "rcs", str(static_library), *objects])
        run([
            *zig_cmd, "cc", "-target", "x86_64-linux-gnu", "-shared", "-O2",
            *objects, "-o", str(shared_library),
        ])
    shutil.copy2(
        REPO_ROOT / "bindings" / "c" / "tree_sitter" / "tree-sitter-cangjie.h",
        RELEASE_DIR / "tree-sitter-cangjie.h",
    )
    for artifact in (static_library, shared_library):
        log(f"C: {artifact.name} ({file_size_str(artifact)})", "ok")


def build(auto_install: bool = False) -> None:
    """
    【C Linux x64 目标】构建 Linux x86_64 C 静态库和共享库

    构建原理：
    通过 bindings/c/Makefile 驱动，使用 gcc 将 parser.c + scanner.c 编译
    为位置无关的目标文件（-fPIC），然后：
    · 静态库（.a）— 用 ar 打包为归档文件，编译时直接链接到可执行文件
    · 共享库（.so）— 用 gcc -shared 链接为共享对象，运行时动态加载
    · 头文件（.h）— 供用户 #include 引用

    产物：release/libtree-sitter-cangjie.{a,so} + tree-sitter-cangjie.h
    """
    log("构建 C 静态库和共享库（Linux x64）...")
    if system() != "Linux":
        _build_cross(auto_install)
        return

    ensure_tool("gcc", apt_pkg="gcc", auto_install=auto_install)
    ensure_tool("make", apt_pkg="make", auto_install=auto_install)
    c_dir = REPO_ROOT / "bindings" / "c"
    run(["make", "clean"], cwd=c_dir, check=False)
    run(["make", "all"], cwd=c_dir)
    for name in ["libtree-sitter-cangjie.a", "libtree-sitter-cangjie.so"]:
        src = c_dir / name
        if src.exists():
            dest = RELEASE_DIR / name
            shutil.copy2(src, dest)
            log(f"C: {dest.name} ({file_size_str(dest)})", "ok")
    shutil.copy2(
        c_dir / "tree_sitter" / "tree-sitter-cangjie.h",
        RELEASE_DIR / "tree-sitter-cangjie.h",
    )
    log("C 头文件: tree-sitter-cangjie.h", "ok")
