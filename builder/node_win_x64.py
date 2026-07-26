"""Node.js Windows x64 交叉编译目标"""

import shutil
import sys
import tempfile
from pathlib import Path
from platform import system

from .utils import (
    RELEASE_DIR,
    REPO_ROOT,
    ensure_tool,
    file_size_str,
    log,
    publish_node_prebuild,
    run,
    which,
)


def _create_node_import_lib(work_dir: Path, binding_obj: Path) -> None:
    """
    创建 node.lib 导入库，用于链接 node.exe 导出的 N-API 符号。

    原理：Windows 上 Node.js 扩展需要链接 node.exe 的 N-API 符号。
    从编译好的目标文件中提取未定义的 napi_ 符号（即 N-API 导入），
    自动生成 .def 文件，再用 dlltool 生成 .lib 导入库。
    """
    lib = work_dir / "node.lib"
    if lib.exists():
        return
    # 从目标文件提取需要的 N-API 符号（未定义的 __imp_napi_* 引用）
    result = run(
        ["x86_64-w64-mingw32-nm", "-u", str(binding_obj)],
        capture=True,
    )
    symbols = sorted({
        s.replace("__imp_", "")
        for line in result.stdout.splitlines()
        for s in line.split()
        if "napi_" in s
    })
    def_text = "LIBRARY node.exe\nEXPORTS\n"
    for sym in symbols:
        def_text += f"    {sym}\n"
    (work_dir / "node.def").write_text(def_text, encoding="utf-8")
    run([
        "x86_64-w64-mingw32-dlltool",
        "--def", str(work_dir / "node.def"),
        "--output-lib", str(lib),
        "--dllname", "node.exe",
    ])


def build(auto_install: bool = False) -> None:
    """
    【Node.js Windows x64 目标】交叉编译 Windows x86_64 Node.js 扩展

    构建原理：
    在 Linux 上使用 mingw-w64 交叉编译器，将 binding.cc + parser.c +
    scanner.c 编译为 Windows DLL 格式的 .node 文件。关键步骤：
    1. 获取 node-gyp 缓存的 Node.js 头文件（node_api.h 等）
    2. 获取 node-addon-api 的 C++ 包装头文件（napi.h）
    3. 创建 node.lib — 通过 .def + dlltool 声明 N-API 导出符号
    4. 用 x86_64-w64-mingw32-g++ 交叉编译，链接 node.lib

    产物：release/tree_sitter_cangjie-win-x64.node
    """
    log("交叉编译 Node.js 扩展（Windows x64）...")
    if system() == "Windows":
        npx = which("npx")
        if not npx:
            raise RuntimeError("npx must be available on PATH")
        run([npx, "node-gyp", "rebuild"], cwd=REPO_ROOT / "bindings" / "node")
        addon = (
            REPO_ROOT / "bindings" / "node" / "build" / "Release"
            / "tree_sitter_cangjie.node"
        )
        if not addon.is_file():
            log(f"Node.js addon was not produced: {addon}", "err")
            sys.exit(1)
        dest = RELEASE_DIR / "tree_sitter_cangjie-win-x64.node"
        shutil.copy2(addon, dest)
        publish_node_prebuild(dest, "win32-x64")
        log(f"Node.js: {dest.name} ({file_size_str(dest)})", "ok")
        return

    ensure_tool(
        "x86_64-w64-mingw32-g++", apt_pkg="g++-mingw-w64-x86-64",
        auto_install=auto_install,
    )

    # 确保 node-gyp 头文件已下载到缓存
    run(["npx", "node-gyp", "install"], cwd=REPO_ROOT)

    # 查找 node-gyp 缓存的头文件目录
    result = run(
        ["node", "-e", "console.log(process.version.slice(1))"],
        capture=True,
    )
    node_ver = result.stdout.strip()
    node_inc = Path.home() / ".cache" / "node-gyp" / node_ver / "include" / "node"
    napi_inc = REPO_ROOT / "node_modules" / "node-addon-api"

    with tempfile.TemporaryDirectory(prefix="ts-cj-nodewin-") as tmp:
        work = Path(tmp)
        inc_flags = [
            f"-I{node_inc}", f"-I{napi_inc}", f"-I{REPO_ROOT / 'src'}",
        ]
        # 分别编译 C 和 C++ 源文件为目标文件，避免 C/C++ 语法冲突
        objs: list[str] = []
        for c_src in ("parser.c", "scanner.c"):
            obj = work / c_src.replace(".c", ".o")
            run([
                "x86_64-w64-mingw32-gcc", "-c", "-O2", "-std=c11",
                "-DBUILDING_NODE_EXTENSION", *inc_flags,
                str(REPO_ROOT / "src" / c_src), "-o", str(obj),
            ])
            objs.append(str(obj))
        binding_obj = work / "binding.o"
        run([
            "x86_64-w64-mingw32-g++", "-c", "-O2",
            "-DBUILDING_NODE_EXTENSION", "-DNAPI_VERSION=9",
            *inc_flags,
            str(REPO_ROOT / "bindings" / "node" / "binding.cc"),
            "-o", str(binding_obj),
        ])
        objs.append(str(binding_obj))
        # 从 binding.o 提取 N-API 符号并生成导入库
        _create_node_import_lib(work, binding_obj)
        out = work / "tree_sitter_cangjie.node"
        run([
            "x86_64-w64-mingw32-g++", "-shared", "-O2", *objs,
            f"-L{work}", "-lnode", "-lws2_32",
            "-static-libgcc", "-static-libstdc++",
            "-o", str(out),
        ])
        dest = RELEASE_DIR / "tree_sitter_cangjie-win-x64.node"
        shutil.copy2(out, dest)
        publish_node_prebuild(dest, "win32-x64")
    log(f"Node.js: {dest.name} ({file_size_str(dest)})", "ok")
