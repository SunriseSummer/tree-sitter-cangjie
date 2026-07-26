from glob import glob
from os import path
from platform import system
from sysconfig import get_config_var

from setuptools import Extension, find_packages, setup
from setuptools.command.build import build
from setuptools.command.egg_info import egg_info
from wheel.bdist_wheel import bdist_wheel

root_dir = path.join("..", "..")

sources = [
    "tree_sitter_cangjie/binding.c",
    path.join(root_dir, "src", "parser.c"),
]
if path.exists(path.join(root_dir, "src", "scanner.c")):
    sources.append(path.join(root_dir, "src", "scanner.c"))

macros: list[tuple[str, str | None]] = [
    ("PY_SSIZE_T_CLEAN", None),
    ("TREE_SITTER_HIDE_SYMBOLS", None),
]
if limited_api := not get_config_var("Py_GIL_DISABLED"):
    macros.append(("Py_LIMITED_API", "0x030A0000"))

if system() != "Windows":
    cflags = ["-std=c11", "-fvisibility=hidden"]
else:
    cflags = ["/std:c11", "/utf-8"]

queries_dir = path.join(root_dir, "queries")


class Build(build):
    def run(self):
        if path.isdir(queries_dir):
            dest = path.join(self.build_lib, "tree_sitter_cangjie", "queries")
            self.mkpath(dest)
            for query_path in glob(path.join(queries_dir, "*.scm")):
                self.copy_file(query_path, path.join(dest, path.basename(query_path)))
        super().run()


class BdistWheel(bdist_wheel):
    def get_tag(self):
        python, abi, platform = super().get_tag()
        # Free-threaded CPython does not use the limited ABI. Preserve its
        # interpreter/ABI tag instead of incorrectly advertising an abi3 wheel.
        if limited_api and python.startswith("cp"):
            python, abi = "cp310", "abi3"
        return python, abi, platform


class EggInfo(egg_info):
    def find_sources(self):
        super().find_sources()
        self.filelist.recursive_include(queries_dir, "*.scm")
        self.filelist.include(path.join(root_dir, "src", "tree_sitter", "*.h"))


setup(
    packages=find_packages("."),
    package_dir={"": "."},
    package_data={
        "tree_sitter_cangjie": ["*.pyi", "py.typed"],
        "tree_sitter_cangjie.queries": ["*.scm"],
    },
    ext_package="tree_sitter_cangjie",
    ext_modules=[
        Extension(
            name="_binding",
            sources=sources,
            extra_compile_args=cflags,
            define_macros=macros,
            include_dirs=[path.join(root_dir, "src")],
            py_limited_api=limited_api,
        )
    ],
    cmdclass={
        "build": Build,
        "bdist_wheel": BdistWheel,
        "egg_info": EggInfo,
    },
    zip_safe=False
)
