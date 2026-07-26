"""Node.js macOS ARM64 交叉编译目标"""

import shutil
import tempfile
from pathlib import Path

from .cross import ensure_zig_cmd, prepare_node_headers
from .utils import (
    RELEASE_DIR,
    REPO_ROOT,
    file_size_str,
    log,
    publish_node_prebuild,
    run,
)


def build(auto_install: bool = False) -> None:
    """
    【Node.js macOS ARM64 目标】交叉编译 macOS ARM64 Node.js 扩展

    构建原理：
    使用 Zig 编译器的 C/C++ 前端（zig c++），通过 -target aarch64-macos
    交叉编译 binding.cc + parser.c + scanner.c 为 Mach-O 格式的 .node
    共享库。Zig 内置 macOS 交叉编译支持，无需 Xcode 或 macOS SDK。
    通过 -Wl,-undefined,dynamic_lookup 延迟解析 N-API 符号（运行时
    由 Node.js 进程提供），无需链接 libnode。

    产物：release/tree_sitter_cangjie-macos-arm64.node
    """
    log("交叉编译 Node.js 扩展（macOS ARM64）...")
    zig_cmd = ensure_zig_cmd(auto_install)

    node_inc = prepare_node_headers()
    napi_inc = REPO_ROOT / "node_modules" / "node-addon-api"

    with tempfile.TemporaryDirectory(prefix="ts-cj-nodemac-") as tmp:
        work = Path(tmp)
        inc_flags = [
            f"-I{node_inc}", f"-I{napi_inc}", f"-I{REPO_ROOT / 'src'}",
        ]
        # 分别编译 C 和 C++ 源文件为目标文件，避免 C/C++ 语法冲突
        objs: list[str] = []
        for c_src in ("parser.c", "scanner.c"):
            obj = work / c_src.replace(".c", ".o")
            run([
                *zig_cmd, "cc", "-target", "aarch64-macos",
                "-c", "-O2", "-std=c11",
                "-DBUILDING_NODE_EXTENSION", *inc_flags,
                str(REPO_ROOT / "src" / c_src), "-o", str(obj),
            ])
            objs.append(str(obj))
        binding_obj = work / "binding.o"
        run([
            *zig_cmd, "c++", "-target", "aarch64-macos",
            "-c", "-O2",
            "-DBUILDING_NODE_EXTENSION", "-DNAPI_VERSION=9",
            *inc_flags,
            str(REPO_ROOT / "bindings" / "node" / "binding.cc"),
            "-o", str(binding_obj),
        ])
        objs.append(str(binding_obj))
        out = work / "tree_sitter_cangjie.node"
        run([
            *zig_cmd, "c++", "-target", "aarch64-macos",
            "-shared", "-O2", *objs,
            "-Wl,-undefined,dynamic_lookup",
            "-Wl,-install_name,@rpath/tree-sitter-cangjie.node",
            "-Wl,-S",
            "-o", str(out),
        ])
        dest = RELEASE_DIR / "tree_sitter_cangjie-macos-arm64.node"
        shutil.copy2(out, dest)
        publish_node_prebuild(dest, "darwin-arm64")
    log(f"Node.js: {dest.name} ({file_size_str(dest)})", "ok")
