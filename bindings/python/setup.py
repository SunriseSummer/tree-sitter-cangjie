from glob import glob
from os import path
from platform import system
from shutil import rmtree
from sysconfig import get_config_var

from setuptools import Extension, find_packages, setup
from setuptools.command.bdist_wheel import bdist_wheel
from setuptools.command.build import build
from setuptools.command.egg_info import egg_info


vendor_dir = "vendor"

sources = [
    "tree_sitter_cangjie/binding.c",
    path.join(vendor_dir, "src", "parser.c"),
]
if path.exists(path.join(vendor_dir, "src", "scanner.c")):
    sources.append(path.join(vendor_dir, "src", "scanner.c"))

limited_api = not get_config_var("Py_GIL_DISABLED")
macros: list[tuple[str, str | None]] = [
    ("PY_SSIZE_T_CLEAN", None),
    ("TREE_SITTER_HIDE_SYMBOLS", None),
]
if limited_api:
    macros.append(("Py_LIMITED_API", "0x030A0000"))

if system() == "Windows":
    cflags = ["/std:c11", "/utf-8"]
else:
    cflags = ["-std=c11", "-fvisibility=hidden"]


class Build(build):
    def run(self):
        rmtree(self.build_lib, ignore_errors=True)
        super().run()

        queries_dir = path.join(vendor_dir, "queries")
        if path.isdir(queries_dir):
            destination = path.join(
                self.build_lib, "tree_sitter_cangjie", "queries"
            )
            rmtree(destination, ignore_errors=True)
            self.mkpath(destination)
            for query_path in glob(path.join(queries_dir, "*.scm")):
                self.copy_file(
                    query_path, path.join(destination, path.basename(query_path))
                )

        license_file = path.join(vendor_dir, "LICENSE")
        if path.isfile(license_file):
            self.copy_file(
                license_file,
                path.join(self.build_lib, "tree_sitter_cangjie", "LICENSE"),
            )


class BdistWheel(bdist_wheel):
    def get_tag(self):
        python, abi, platform = super().get_tag()
        if limited_api and python.startswith("cp"):
            python, abi = "cp310", "abi3"
        return python, abi, platform


class EggInfo(egg_info):
    def find_sources(self):
        super().find_sources()
        self.filelist.recursive_include(
            path.join(vendor_dir, "queries"), "*.scm"
        )
        self.filelist.recursive_include(path.join(vendor_dir, "src"), "*.c")
        self.filelist.recursive_include(
            path.join(vendor_dir, "src", "tree_sitter"), "*.h"
        )


setup(
    packages=find_packages("."),
    package_dir={"": "."},
    package_data={
        "tree_sitter_cangjie": ["*.pyi", "py.typed", "LICENSE"],
        "tree_sitter_cangjie.queries": ["*.scm"],
    },
    ext_package="tree_sitter_cangjie",
    ext_modules=[
        Extension(
            name="_binding",
            sources=sources,
            extra_compile_args=cflags,
            define_macros=macros,
            include_dirs=[path.join(vendor_dir, "src")],
            py_limited_api=limited_api,
        )
    ],
    cmdclass={
        "build": Build,
        "bdist_wheel": BdistWheel,
        "egg_info": EggInfo,
    },
    zip_safe=False,
)
