"""Python macOS ARM64 wheel 交叉编译目标"""

import tempfile
from pathlib import Path

from .cross import create_cross_wheel, ensure_zig_cmd, prepare_cpython_headers
from .utils import REPO_ROOT, get_version, log, run

# macOS ARM64 (LP64) 平台的最小化 pyconfig.h
# 仅包含 Python 稳定 ABI 编译所需的类型大小和特性宏定义
_MACOS_ARM64_PYCONFIG = """\
#ifndef Py_PYCONFIG_H
#define Py_PYCONFIG_H
/* macOS ARM64 — 由 builder 生成，仅用于稳定 ABI 交叉编译 */
#define SIZEOF_VOID_P 8
#define SIZEOF_SIZE_T 8
#define SIZEOF_INT 4
#define SIZEOF_LONG 8
#define SIZEOF_LONG_LONG 8
#define SIZEOF_SHORT 2
#define SIZEOF_DOUBLE 8
#define SIZEOF_FLOAT 4
#define SIZEOF_WCHAR_T 4
#define SIZEOF_FPOS_T 8
#define SIZEOF_OFF_T 8
#define SIZEOF_TIME_T 8
#define SIZEOF_PID_T 4
#define SIZEOF_UINTPTR_T 8
#define SIZEOF__BOOL 1
#define HAVE_STDINT_H 1
#define HAVE_STDLIB_H 1
#define HAVE_STRING_H 1
#define HAVE_UNISTD_H 1
#define HAVE_WCHAR_H 1
#define HAVE_SYS_TYPES_H 1
#define HAVE_SSIZE_T 1
#define HAVE_DLFCN_H 1
#define HAVE_LONG_LONG 1
#define HAVE_UINTPTR_T 1
#define HAVE_INTTYPES_H 1
#define HAVE_SIGNAL_H 1
#define HAVE_ERRNO_H 1
#define HAVE_FCNTL_H 1
#define HAVE_MEMORY_H 1
#define HAVE_SYS_STAT_H 1
#define HAVE_DYNAMIC_LOADING 1
#define HAVE_GCC_UINT128_T 1
#define HAVE_STDARG_PROTOTYPES 1
#define WITH_PYMALLOC 1
#define DOUBLE_IS_LITTLE_ENDIAN_IEEE754_DOUBLE 1
#define PY_FORMAT_SIZE_T "z"
#define PY_FORMAT_LONG_LONG "ll"
#endif
"""


def build(auto_install: bool = False) -> None:
    """
    【Python macOS ARM64 目标】交叉编译 macOS ARM64 Python wheel

    构建原理：
    使用 Zig 编译器（内置 macOS 交叉编译支持，无需 macOS SDK）将 C 源码
    编译为 macOS ARM64 的 .abi3.so 扩展。需要 CPython 头文件和自定义的
    pyconfig.h（为 macOS ARM64 的 LP64 数据模型预设类型大小和特性宏）。
    通过 -Wl,-undefined,dynamic_lookup 告知链接器延迟解析 Python 符号
    （运行时由 Python 解释器提供），最后按 wheel 格式打包。

    产物：release/tree_sitter_cangjie-{ver}-cp310-abi3-macosx_11_0_arm64.whl
    """
    log("交叉编译 Python wheel（macOS ARM64）...")
    zig_cmd = ensure_zig_cmd(auto_install)
    version = get_version()
    with tempfile.TemporaryDirectory(prefix="ts-cj-pymac-") as tmp:
        work = Path(tmp)
        cpython = prepare_cpython_headers(work)
        # 写入 macOS ARM64 专用的 pyconfig.h 到独立目录，优先于 Include/
        pyconfig_dir = work / "pyconfig"
        pyconfig_dir.mkdir()
        (pyconfig_dir / "pyconfig.h").write_text(_MACOS_ARM64_PYCONFIG)
        so = work / "_binding.abi3.so"
        run([
            *zig_cmd, "cc", "-target", "aarch64-macos", "-shared", "-O2",
            "-DPy_LIMITED_API=0x030A0000", "-DPY_SSIZE_T_CLEAN",
            "-DTREE_SITTER_HIDE_SYMBOLS", "-fvisibility=hidden",
            f"-I{pyconfig_dir}", f"-I{cpython / 'Include'}",
            f"-I{REPO_ROOT / 'src'}",
            str(REPO_ROOT / "bindings/python/tree_sitter_cangjie/binding.c"),
            str(REPO_ROOT / "src/parser.c"),
            str(REPO_ROOT / "src/scanner.c"),
            "-Wl,-undefined,dynamic_lookup",
            "-Wl,-install_name,@rpath/_binding.abi3.so",
            "-Wl,-S",
            "-o", str(so),
        ])
        create_cross_wheel(
            so, "_binding.abi3.so", "macosx_11_0_arm64", version,
        )
