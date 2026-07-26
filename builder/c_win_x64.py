"""C Windows x64 DLL 交叉编译目标"""

import shutil
import tempfile
from pathlib import Path

from .cross import ensure_zig_cmd
from .utils import RELEASE_DIR, REPO_ROOT, ensure_tool, file_size_str, log, run, which


def _build_with_zig(auto_install: bool) -> None:
    zig_cmd = ensure_zig_cmd(auto_install)
    dll = RELEASE_DIR / "tree-sitter-cangjie.dll"
    library = RELEASE_DIR / "tree-sitter-cangjie.lib"
    stale_pdb = RELEASE_DIR / "tree-sitter-cangjie.pdb"
    if stale_pdb.is_file():
        stale_pdb.unlink()
    with tempfile.TemporaryDirectory(prefix="ts-cj-cwin-") as tmp:
        work = Path(tmp)
        work_dll = work / dll.name
        work_library = work / library.name
        objects: list[str] = []
        for source_name in ("parser.c", "scanner.c"):
            obj = work / source_name.replace(".c", ".o")
            run([
                *zig_cmd, "cc", "-target", "x86_64-windows-gnu", "-c", "-O2",
                f"-I{REPO_ROOT / 'src'}", str(REPO_ROOT / "src" / source_name),
                "-o", str(obj),
            ])
            objects.append(str(obj))
        run([
            *zig_cmd, "cc", "-target", "x86_64-windows-gnu", "-shared", "-O2",
            *objects, "-o", str(work_dll), f"-Wl,--out-implib,{work_library}",
        ])
        run([*zig_cmd, "ar", "rs", str(work_library), *objects])
        shutil.copy2(work_dll, dll)
        shutil.copy2(work_library, library)
    log(f"Windows DLL: {dll.name} ({file_size_str(dll)})", "ok")
    log(f"Windows LIB: {library.name} ({file_size_str(library)})", "ok")


def build(auto_install: bool = False) -> None:
    """
    【C Windows x64 目标】交叉编译 Windows x86_64 DLL 和导入库

    构建原理：
    使用 mingw-w64 交叉编译器将 parser.c + scanner.c 编译为 Windows
    PE32+ DLL。分三步：
    1. 编译 — 将 .c 源码交叉编译为 Windows 目标文件（.o）
    2. 链接 — 用 -shared 链接为 DLL，通过 --out-implib 同时生成
       .lib 导入库（包含 DLL 导出符号的存根信息）
    3. 归档 — 将完整目标文件追加到 .lib 中，使其兼作静态库

    最终 .lib 既含 DLL 导入存根（动态链接用），也含完整 .o（静态链接用）。

    产物：release/tree-sitter-cangjie.{dll,lib}
    """
    log("交叉编译 C 共享库（Windows x64）...")
    if not which("x86_64-w64-mingw32-gcc"):
        _build_with_zig(auto_install)
        return

    ensure_tool(
        "x86_64-w64-mingw32-gcc", apt_pkg="gcc-mingw-w64-x86-64",
        auto_install=auto_install,
    )
    dll = RELEASE_DIR / "tree-sitter-cangjie.dll"
    lib = RELEASE_DIR / "tree-sitter-cangjie.lib"
    with tempfile.TemporaryDirectory(prefix="ts-cj-cwin-") as tmp:
        work = Path(tmp)
        objs: list[str] = []
        for src_name in ("parser.c", "scanner.c"):
            obj = work / src_name.replace(".c", ".o")
            run([
                "x86_64-w64-mingw32-gcc", "-c", "-O2",
                "-DTREE_SITTER_HIDE_SYMBOLS", f"-I{REPO_ROOT / 'src'}",
                str(REPO_ROOT / "src" / src_name), "-o", str(obj),
            ])
            objs.append(str(obj))
        run([
            "x86_64-w64-mingw32-gcc", "-shared", "-O2", *objs,
            "-o", str(dll), f"-Wl,--out-implib,{lib}",
        ])
        run(["x86_64-w64-mingw32-ar", "rs", str(lib), *objs])
    log(f"Windows DLL: {dll.name} ({file_size_str(dll)})", "ok")
    log(f"Windows LIB: {lib.name} ({file_size_str(lib)})", "ok")
