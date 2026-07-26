"""
builder — 构建 tree-sitter-cangjie 的所有发布件

将各语言绑定编译为可分发的制品，并收集到 release/ 目录中。
支持 Linux 本地构建以及交叉编译到 Windows x64 / macOS ARM64 平台。

用法:
    python -m builder                                    # 构建全部目标
    python -m builder wasm node-linux-x64                # 仅构建指定目标
    python -m builder --auto-install                     # 自动安装缺失工具
    python -m builder --list                             # 列出所有可用目标

支持的构建目标:
    wasm                 WebAssembly 插件
    node-linux-x64       Node.js 原生扩展（Linux x86_64）
    node-win-x64         Node.js 原生扩展（Windows x86_64，交叉编译）
    node-macos-arm64     Node.js 原生扩展（macOS ARM64，交叉编译）
    python-linux-x64     Python wheel（Linux x86_64）
    python-win-x64       Python wheel（Windows x86_64，交叉编译）
    python-macos-arm64   Python wheel（macOS ARM64，交叉编译）
    c-linux-x64          C 静态库 / 共享库（Linux x86_64）
    c-win-x64            C 共享库 / 导入库（Windows x86_64，交叉编译）
    c-macos-arm64        C 动态库（macOS ARM64，交叉编译）

前置条件:
    · Node.js（推荐 v22 LTS）+ npm
    · Python 3.10+ 及 pip
    · C 编译器（gcc / clang）
    · Windows 交叉编译需要 mingw-w64
    · macOS 交叉编译需要 Zig（可通过 --auto-install 自动下载）
"""

from __future__ import annotations

import argparse
import sys

from .utils import ALL_TARGETS, RELEASE_DIR, REPO_ROOT, file_size_str, log, run, which

# 导入各构建目标模块（每种目标对应一个文件，各自导出 build() 函数）
from . import wasm
from . import node_linux_x64
from . import node_win_x64
from . import node_macos_arm64
from . import python_linux_x64
from . import python_win_x64
from . import python_macos_arm64
from . import c_linux_x64
from . import c_win_x64
from . import c_macos_arm64

# 目标名称 → 构建函数的映射
BUILDERS = {
    "wasm":               wasm.build,
    "node-linux-x64":     node_linux_x64.build,
    "node-win-x64":       node_win_x64.build,
    "node-macos-arm64":   node_macos_arm64.build,
    "python-linux-x64":   python_linux_x64.build,
    "python-win-x64":     python_win_x64.build,
    "python-macos-arm64": python_macos_arm64.build,
    "c-linux-x64":        c_linux_x64.build,
    "c-win-x64":          c_win_x64.build,
    "c-macos-arm64":      c_macos_arm64.build,
}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="构建 tree-sitter-cangjie 的发布件",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "targets", nargs="*", default=[], metavar="TARGET",
        help=f"构建目标（可多选）: all, {', '.join(ALL_TARGETS)}。默认全部。",
    )
    parser.add_argument(
        "--auto-install", action="store_true",
        help="自动安装缺失的构建工具（需要 sudo 权限安装系统包）",
    )
    parser.add_argument(
        "--list", action="store_true", dest="list_targets",
        help="列出所有可用的构建目标并退出",
    )
    args = parser.parse_args()

    # 列出目标
    if args.list_targets:
        print("可用的构建目标:")
        for t in ALL_TARGETS:
            print(f"  {t}")
        return

    # 确定目标列表
    targets = args.targets or list(ALL_TARGETS)
    if "all" in targets:
        targets = list(ALL_TARGETS)
    for t in targets:
        if t not in BUILDERS:
            log(f"未知的构建目标: '{t}'", "err")
            log(f"有效目标: all, {', '.join(ALL_TARGETS)}", "err")
            sys.exit(1)

    # 构建流程
    print("=" * 60)
    print("  tree-sitter-cangjie 发布构建")
    print("=" * 60)
    print(f"  仓库: {REPO_ROOT}")
    print(f"  目标: {', '.join(targets)}")
    print(f"  输出: {RELEASE_DIR}")
    print("=" * 60)

    RELEASE_DIR.mkdir(exist_ok=True)

    # 公共准备：安装 npm 依赖 + 生成解析器
    npm = which("npm")
    npx = which("npx")
    if not npm or not npx:
        raise RuntimeError("npm and npx must be available on PATH")

    log("安装 npm 依赖...")
    run([npm, "install"], cwd=REPO_ROOT)
    log("生成解析器...")
    run([npx, "tree-sitter", "generate", "grammar/main.js"], cwd=REPO_ROOT)

    # 依次构建每个目标
    total = len(targets)
    for i, target in enumerate(targets, 1):
        print()
        log(f"[{i}/{total}] {target}")
        BUILDERS[target](auto_install=args.auto_install)

    # 构建摘要
    print()
    print("=" * 60)
    print("  构建完成！发布件清单:")
    print("=" * 60)
    for f in sorted(RELEASE_DIR.iterdir()):
        if f.is_file():
            print(f"  {f.name:55s} {file_size_str(f):>10s}")
    print("=" * 60)
    print(f"  所有产物位于: {RELEASE_DIR}")


if __name__ == "__main__":
    main()
