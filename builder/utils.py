"""共用工具函数和常量定义"""

from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

# ── 路径常量 ──

REPO_ROOT = Path(__file__).resolve().parent.parent
RELEASE_DIR = REPO_ROOT / "release"
PREBUILDS_DIR = REPO_ROOT / "prebuilds"

# 所有支持的构建目标
ALL_TARGETS = [
    "wasm",
    "node-linux-x64", "node-win-x64", "node-macos-arm64",
    "python-linux-x64", "python-win-x64", "python-macos-arm64",
    "c-linux-x64", "c-win-x64", "c-macos-arm64",
]


# ── 日志与命令执行 ──


def log(msg: str, level: str = "info") -> None:
    """输出格式化日志"""
    # Keep build logs encodable on Windows consoles that still default to GBK.
    symbols = {"info": ">>>", "ok": " OK", "err": "!!!", "warn": "WARN"}
    print(f"{symbols.get(level, '>>>')} {msg}", flush=True)


def run(
    cmd: list[str],
    *,
    cwd: Path | str | None = None,
    check: bool = True,
    capture: bool = False,
    env: dict[str, str] | None = None,
) -> subprocess.CompletedProcess[str]:
    """
    执行外部命令。
    原理：封装 subprocess.run，提供统一的错误处理和环境变量合并。
    """
    return subprocess.run(
        cmd, cwd=cwd, check=check,
        capture_output=capture, text=capture,
        env={**os.environ, **(env or {})},
    )


# ── 工具检测与安装 ──


def which(tool: str) -> str | None:
    """检查工具是否在 PATH 中"""
    return shutil.which(tool)


def ensure_tool(
    tool: str,
    *,
    apt_pkg: str = "",
    pip_pkg: str = "",
    hint: str = "",
    auto_install: bool = False,
) -> None:
    """
    确保构建工具可用。不可用时自动安装或提示用户。
    原理：通过 shutil.which 检测，auto_install 时用 apt/pip 自动安装。
    """
    if which(tool):
        return
    if auto_install:
        if apt_pkg:
            log(f"自动安装 {tool}（apt: {apt_pkg}）...")
            run(["sudo", "apt-get", "update", "-qq"])
            run(["sudo", "apt-get", "install", "-y", "-qq", apt_pkg])
            if which(tool):
                log(f"{tool} 安装成功", "ok")
                return
        if pip_pkg:
            log(f"自动安装 {tool}（pip: {pip_pkg}）...")
            run([sys.executable, "-m", "pip", "install", "--quiet", pip_pkg])
            if which(tool):
                log(f"{tool} 安装成功", "ok")
                return
    msg = f"缺少构建工具: {tool}"
    if hint:
        msg += f"\n    安装方法: {hint}"
    elif apt_pkg:
        msg += f"\n    安装方法: sudo apt-get install {apt_pkg}"
    log(msg, "err")
    log("提示: 使用 --auto-install 可自动安装", "warn")
    sys.exit(1)


# ── 版本与文件工具 ──


def get_version() -> str:
    """从 pyproject.toml 读取版本号"""
    toml = REPO_ROOT / "bindings" / "python" / "pyproject.toml"
    m = re.search(
        r'^version\s*=\s*"(.+?)"',
        toml.read_text(encoding="utf-8"), re.MULTILINE,
    )
    if not m:
        raise RuntimeError(f"无法从 {toml} 提取版本号")
    return m.group(1)


def file_size_str(path: Path) -> str:
    """人类可读的文件大小"""
    size = path.stat().st_size
    for unit in ("B", "KB", "MB", "GB"):
        if size < 1024 or unit == "GB":
            return f"{size:.1f} {unit}" if unit != "B" else f"{size} {unit}"
        size /= 1024
    return f"{size:.1f} GB"


def publish_node_prebuild(source: Path, platform_arch: str) -> Path:
    """Copy a Node addon into node-gyp-build's standard package layout."""
    destination_dir = PREBUILDS_DIR / platform_arch
    destination_dir.mkdir(parents=True, exist_ok=True)
    destination = destination_dir / "tree-sitter-cangjie.node"
    shutil.copy2(source, destination)
    return destination
