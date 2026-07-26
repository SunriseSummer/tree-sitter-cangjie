"""Node.js Linux x64 构建目标"""

import shutil
import sys
import tempfile
from pathlib import Path
from platform import system

from .cross import ensure_zig_cmd, prepare_node_headers
from .utils import (
    RELEASE_DIR,
    REPO_ROOT,
    ensure_tool,
    file_size_str,
    log,
    publish_node_prebuild,
    run,
)


def _build_cross(auto_install: bool) -> None:
    zig_cmd = ensure_zig_cmd(auto_install)
    node_inc = prepare_node_headers()
    napi_inc = REPO_ROOT / "node_modules" / "node-addon-api"
    with tempfile.TemporaryDirectory(prefix="ts-cj-nodelinux-") as tmp:
        work = Path(tmp)
        inc_flags = [f"-I{node_inc}", f"-I{napi_inc}", f"-I{REPO_ROOT / 'src'}"]
        objects: list[str] = []
        for source_name in ("parser.c", "scanner.c"):
            obj = work / source_name.replace(".c", ".o")
            run([
                *zig_cmd, "cc", "-target", "x86_64-linux-gnu", "-c", "-fPIC",
                "-O2", "-std=c11", "-DBUILDING_NODE_EXTENSION", *inc_flags,
                str(REPO_ROOT / "src" / source_name), "-o", str(obj),
            ])
            objects.append(str(obj))
        binding_obj = work / "binding.o"
        run([
            *zig_cmd, "c++", "-target", "x86_64-linux-gnu", "-c", "-fPIC", "-O2",
            "-DBUILDING_NODE_EXTENSION", "-DNAPI_VERSION=9", *inc_flags,
            str(REPO_ROOT / "bindings" / "node" / "binding.cc"),
            "-o", str(binding_obj),
        ])
        objects.append(str(binding_obj))
        addon = work / "tree_sitter_cangjie.node"
        run([
            *zig_cmd, "c++", "-target", "x86_64-linux-gnu", "-shared", "-O2",
            *objects, "-o", str(addon),
        ])
        destination = RELEASE_DIR / "tree_sitter_cangjie-linux-x64.node"
        shutil.copy2(addon, destination)
        publish_node_prebuild(destination, "linux-x64")
    log(f"Node.js: {destination.name} ({file_size_str(destination)})", "ok")


def build(auto_install: bool = False) -> None:
    """
    【Node.js Linux x64 目标】构建 Linux x86_64 原生扩展

    构建原理：
    使用 node-gyp 将 binding.cc（C++）编译为 .node 文件（Linux ELF 格式
    的共享库）。binding.cc 通过 node-addon-api（N-API 的 C++ 包装层）将
    tree-sitter 的 C 语言解析器桥接到 Node.js 运行时。node-gyp 读取
    binding.gyp 配置，调用系统 g++ 编译源码，生成可被 require() 加载的
    原生扩展。

    产物：release/tree_sitter_cangjie-linux-x64.node
    """
    log("构建 Node.js 原生扩展（Linux x64）...")
    if system() != "Linux":
        _build_cross(auto_install)
        return

    ensure_tool(
        "node", hint="安装 Node.js v22 LTS: https://nodejs.org/",
        auto_install=auto_install,
    )
    run(["npx", "node-gyp", "rebuild"], cwd=REPO_ROOT / "bindings" / "node")
    addon = (
        REPO_ROOT / "bindings" / "node" / "build" / "Release"
        / "tree_sitter_cangjie.node"
    )
    if not addon.exists():
        log(f"Node.js 扩展未找到: {addon}", "err")
        sys.exit(1)
    dest = RELEASE_DIR / "tree_sitter_cangjie-linux-x64.node"
    shutil.copy2(addon, dest)
    publish_node_prebuild(dest, "linux-x64")
    log(f"Node.js: {dest.name} ({file_size_str(dest)})", "ok")
