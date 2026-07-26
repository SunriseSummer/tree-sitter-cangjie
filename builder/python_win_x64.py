"""Python Windows x64 wheel 交叉编译目标"""

import shutil
import tempfile
from pathlib import Path
from platform import system

from .cross import create_cross_wheel, ensure_zig_cmd, prepare_cpython_headers
from .utils import (
    REPO_ROOT,
    ensure_tool,
    get_version,
    log,
    run,
)


def _create_python3_lib(work_dir: Path) -> None:
    """
    创建 python3.lib 导入库。

    原理：Windows 稳定 ABI 通过 python3.dll 提供。用 .def 声明
    binding.c 引用的 API 符号，再用 dlltool 生成 .lib 导入库供链接器使用。
    """
    lib = work_dir / "python3.lib"
    if lib.exists():
        return
    definition = work_dir / "python3.def"
    shutil.copy2(
        REPO_ROOT / "bindings" / "python" / "python3.def", definition,
    )
    run([
        "x86_64-w64-mingw32-dlltool",
        "--def", str(definition),
        "--output-lib", str(lib),
        "--dllname", "python3.dll",
    ])


def build(auto_install: bool = False) -> None:
    """
    【Python Windows x64 目标】交叉编译 Windows x86_64 Python wheel

    构建原理：
    在 Linux 上用 mingw-w64 交叉编译器将 binding.c + parser.c + scanner.c
    编译为 .pyd（Windows Python 扩展 DLL）。关键步骤：
    1. 获取 CPython 头文件 — Include/ 提供类型定义，PC/pyconfig.h 提供
       Windows 平台配置
    2. 创建 python3.lib — 通过 .def + dlltool 生成导入库，链接
       python3.dll 稳定 ABI
    3. 交叉编译 — 设置 Py_LIMITED_API + MS_WIN64 确保兼容 Win x64
       Python 3.10+
    4. 打包 wheel — 按 PEP 427 格式组织文件，标记平台为 win_amd64

    产物：release/tree_sitter_cangjie-{ver}-cp310-abi3-win_amd64.whl
    """
    log("交叉编译 Python wheel（Windows x64）...")
    version = get_version()
    if system() == "Windows":
        zig_cmd = ensure_zig_cmd(auto_install)
        with tempfile.TemporaryDirectory(prefix="ts-cj-pywin-") as tmp:
            work = Path(tmp)
            cpython = prepare_cpython_headers(work)
            definition = work / "python3.def"
            library = work / "python3.lib"
            shutil.copy2(
                REPO_ROOT / "bindings" / "python" / "python3.def", definition,
            )
            run([
                *zig_cmd, "dlltool", "-m", "i386:x86-64",
                "-d", str(definition), "-l", str(library), "-D", "python3.dll",
            ])
            pyd = work / "_binding.pyd"
            run([
                *zig_cmd, "cc", "-target", "x86_64-windows-gnu",
                "-shared", "-O2",
                "-DPy_LIMITED_API=0x030A0000", "-DMS_WIN64",
                "-DPY_SSIZE_T_CLEAN", "-DTREE_SITTER_HIDE_SYMBOLS",
                f"-I{cpython / 'Include'}", f"-I{cpython / 'PC'}",
                f"-I{REPO_ROOT / 'src'}",
                str(REPO_ROOT / "bindings/python/tree_sitter_cangjie/binding.c"),
                str(REPO_ROOT / "src/parser.c"),
                str(REPO_ROOT / "src/scanner.c"),
                str(library), "-o", str(pyd),
            ])
            create_cross_wheel(pyd, "_binding.pyd", "win_amd64", version)
        return

    ensure_tool(
        "x86_64-w64-mingw32-gcc", apt_pkg="gcc-mingw-w64-x86-64",
        auto_install=auto_install,
    )
    ensure_tool(
        "x86_64-w64-mingw32-dlltool", apt_pkg="binutils-mingw-w64-x86-64",
        auto_install=auto_install,
    )
    with tempfile.TemporaryDirectory(prefix="ts-cj-pywin-") as tmp:
        work = Path(tmp)
        cpython = prepare_cpython_headers(work)
        _create_python3_lib(work)
        pyd = work / "_binding.pyd"
        run([
            "x86_64-w64-mingw32-gcc", "-shared", "-O2",
            "-DPy_LIMITED_API=0x030A0000", "-DMS_WIN64", "-DPY_SSIZE_T_CLEAN",
            "-DTREE_SITTER_HIDE_SYMBOLS",
            f"-I{cpython / 'Include'}", f"-I{cpython / 'PC'}",
            f"-I{REPO_ROOT / 'src'}",
            str(REPO_ROOT / "bindings/python/tree_sitter_cangjie/binding.c"),
            str(REPO_ROOT / "src/parser.c"),
            str(REPO_ROOT / "src/scanner.c"),
            f"-L{work}", "-lpython3",
            "-o", str(pyd),
        ])
        create_cross_wheel(pyd, "_binding.pyd", "win_amd64", version)
