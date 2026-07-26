"""交叉编译共用工具函数"""

from __future__ import annotations

import base64
import hashlib
import os
import sys
import tarfile
import tempfile
import urllib.request
import zipfile
from pathlib import Path

from .utils import RELEASE_DIR, REPO_ROOT, file_size_str, log, run, which

# CPython 源码版本（交叉编译 Python 扩展时下载头文件用）
CPYTHON_TAG = "3.10.0"
CPYTHON_URL = (
    "https://github.com/python/cpython/archive/"
    f"refs/tags/v{CPYTHON_TAG}.tar.gz"
)

# Zig 编译器版本（macOS 交叉编译用）
ZIG_VERSION = "0.13.0"
ZIG_URL = (
    f"https://ziglang.org/download/{ZIG_VERSION}/"
    f"zig-linux-x86_64-{ZIG_VERSION}.tar.xz"
)


def record_hash(data: bytes) -> str:
    """wheel RECORD 的 sha256 哈希（base64url 编码，无填充）"""
    return base64.urlsafe_b64encode(
        hashlib.sha256(data).digest()
    ).rstrip(b"=").decode()


def _has_ziglang() -> bool:
    """检查 ziglang pip 包是否已安装"""
    try:
        import importlib
        return importlib.util.find_spec("ziglang") is not None
    except (ImportError, ValueError):
        return False


def ensure_zig(auto_install: bool = False) -> str:
    """
    确保 Zig 编译器可用，返回可执行文件路径或 Python 模块调用命令。

    原理：Zig 内置 macOS 交叉编译支持（无需 SDK），可通过
    zig cc -target aarch64-macos 编译 ARM64 二进制。
    未安装时优先通过 pip install ziglang 安装（跨平台），
    也可从 ziglang.org 下载预编译包。
    """
    # 检查系统 PATH 中的 zig
    if p := which("zig"):
        return p
    # 检查通过 pip 安装的 ziglang 包
    if _has_ziglang():
        return sys.executable + " -m ziglang"
    if not auto_install:
        log("缺少 Zig 编译器（macOS 交叉编译需要）", "err")
        log("安装: pip install ziglang  或  https://ziglang.org/download/", "warn")
        log("或使用 --auto-install 自动安装", "warn")
        sys.exit(1)
    # 自动安装：优先 pip（跨平台、无需 sudo），回退到官方下载
    log("自动安装 Zig（pip: ziglang）...")
    run([sys.executable, "-m", "pip", "install", "--quiet", "ziglang"])
    if _has_ziglang():
        log("Zig 安装成功（pip）", "ok")
        return sys.executable + " -m ziglang"
    # 回退：从官网下载预编译包
    cache = Path(tempfile.gettempdir()) / f"zig-{ZIG_VERSION}"
    zig_bin = cache / f"zig-linux-x86_64-{ZIG_VERSION}" / "zig"
    if zig_bin.exists():
        return str(zig_bin)
    cache.mkdir(exist_ok=True)
    tarball = cache / f"zig-{ZIG_VERSION}.tar.xz"
    if not tarball.exists():
        log(f"下载 Zig {ZIG_VERSION}...")
        urllib.request.urlretrieve(ZIG_URL, tarball)
    log("提取 Zig...")
    with tarfile.open(tarball, "r:xz") as tar:
        tar.extractall(cache)
    log("Zig 准备就绪", "ok")
    return str(zig_bin)


def ensure_zig_cmd(auto_install: bool = False) -> list[str]:
    """
    确保 Zig 编译器可用，返回可直接传入 subprocess 的命令列表。

    原理：ensure_zig() 返回的路径可能是 "python3 -m ziglang" 形式，
    需要 split() 拆分为列表才能正确传递给 subprocess。
    """
    return ensure_zig(auto_install).split()


def prepare_node_headers() -> Path:
    """Install Node headers and return the platform-specific node-gyp cache path."""
    node = which("node")
    npx = which("npx")
    if not node or not npx:
        raise RuntimeError("node and npx must be available on PATH")
    result = run(
        [node, "-e", "console.log(process.version.slice(1))"], capture=True
    )
    version = result.stdout.strip()
    candidates = [
        Path.home() / ".cache" / "node-gyp" / version / "include" / "node",
        Path.home() / ".node-gyp" / version / "include" / "node",
    ]
    if local_app_data := os.environ.get("LOCALAPPDATA"):
        candidates.insert(
            0,
            Path(local_app_data)
            / "node-gyp"
            / "Cache"
            / version
            / "include"
            / "node",
        )
    def find_headers() -> Path | None:
        for candidate in candidates:
            if (candidate / "node.h").is_file():
                return candidate
        return None

    if headers := find_headers():
        return headers
    run([npx, "node-gyp", "install"], cwd=REPO_ROOT)
    if headers := find_headers():
        return headers
    raise RuntimeError(f"node-gyp installed Node {version} headers in an unknown location")


def prepare_cpython_headers(work_dir: Path) -> Path:
    """
    下载并提取 CPython 头文件。
    原理：交叉编译 Python C 扩展需要 CPython 头文件（Include/ 和
    PC/pyconfig.h）。从源码包中提取即可在 Linux 上编译目标平台扩展。
    """
    cpython_dir = work_dir / f"cpython-{CPYTHON_TAG}"
    if cpython_dir.exists():
        return cpython_dir
    tarball = work_dir / f"cpython-{CPYTHON_TAG}.tar.gz"
    if not tarball.exists():
        log(f"下载 CPython {CPYTHON_TAG} 头文件...")
        urllib.request.urlretrieve(CPYTHON_URL, tarball)
    log("提取 CPython 头文件...")
    prefix = f"cpython-{CPYTHON_TAG}/"
    with tarfile.open(tarball) as tar:
        tar.extractall(work_dir, members=[
            m for m in tar.getmembers()
            if m.name.startswith(f"{prefix}Include/")
            or m.name.startswith(f"{prefix}PC/")
        ])
    return cpython_dir


def create_cross_wheel(
    ext_path: Path, ext_name: str, platform_tag: str, version: str,
) -> None:
    """
    创建交叉编译的 Python wheel。
    原理：wheel 本质是按固定目录结构组织的 zip 文件（PEP 427）。
    手动构建目录结构并写入 METADATA/WHEEL/RECORD 元数据即可生成合法 wheel。
    """
    whl = f"tree_sitter_cangjie-{version}-cp310-abi3-{platform_tag}.whl"
    whl_path = RELEASE_DIR / whl
    for stale in RELEASE_DIR.glob(
        f"tree_sitter_cangjie-*-cp310-abi3-{platform_tag}.whl"
    ):
        if stale != whl_path:
            stale.unlink()
    pkg = "tree_sitter_cangjie"
    di = f"tree_sitter_cangjie-{version}.dist-info"
    pkg_dir = REPO_ROOT / "bindings" / "python" / pkg
    entries: list[tuple[str, bytes]] = [
        (f"{pkg}/__init__.py", (pkg_dir / "__init__.py").read_bytes()),
        (f"{pkg}/{ext_name}", ext_path.read_bytes()),
        (f"{pkg}/py.typed", (pkg_dir / "py.typed").read_bytes()),
        (f"{pkg}/__init__.pyi", (pkg_dir / "__init__.pyi").read_bytes()),
    ]
    for scm in sorted((REPO_ROOT / "queries").glob("*.scm")):
        entries.append((f"{pkg}/queries/{scm.name}", scm.read_bytes()))
    metadata = (
        f"Metadata-Version: 2.1\nName: tree-sitter-cangjie\nVersion: {version}\n"
        "Summary: Cangjie grammar for tree-sitter\n"
        "Author-email: vchuoshen6 <vchuoshen6@163.com>\n"
        "License: MulanPSL-2.0\nKeywords: incremental,parsing,tree-sitter,cangjie\n"
        "Classifier: Intended Audience :: Developers\n"
        "Classifier: Topic :: Software Development :: Compilers\n"
        "Classifier: Topic :: Text Processing :: Linguistic\n"
        "Classifier: Typing :: Typed\nRequires-Python: >=3.10\n"
        'Provides-Extra: core\nRequires-Dist: tree-sitter~=0.25; extra == "core"\n'
    )
    entries.append((f"{di}/METADATA", metadata.encode()))
    entries.append((f"{di}/WHEEL",
        f"Wheel-Version: 1.0\nGenerator: cross-compile\n"
        f"Root-Is-Purelib: false\nTag: cp310-abi3-{platform_tag}\n".encode()))
    entries.append((f"{di}/top_level.txt", b"tree_sitter_cangjie\n"))
    lines: list[str] = []

    def write_entry(zf: zipfile.ZipFile, zpath: str, data: bytes | str) -> None:
        # A fixed timestamp and permissions keep manually assembled wheels
        # reproducible across build hosts.
        info = zipfile.ZipInfo(zpath, date_time=(1980, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        zf.writestr(info, data)

    with zipfile.ZipFile(whl_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for zpath, data in entries:
            write_entry(zf, zpath, data)
            lines.append(f"{zpath},sha256={record_hash(data)},{len(data)}")
        lines.append(f"{di}/RECORD,,")
        write_entry(zf, f"{di}/RECORD", "\n".join(lines) + "\n")
    log(f"wheel ({platform_tag}): {whl} ({file_size_str(whl_path)})", "ok")
