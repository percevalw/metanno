"""
metanno setup
"""
import os

import setuptools
from jupyter_packaging import (
    create_cmdclass, install_npm, ensure_targets,
    combine_commands
)
from jupyter_packaging.setupbase import _get_data_files

HERE = os.path.abspath(os.path.dirname(__file__))

# The name of the project
name = "metanno"

lab_path = os.path.join(HERE, name, "labextension")

# Representative files that should exist after a successful build
jstargets = [
    os.path.join(HERE, "lib", "index.js"),
    os.path.join(lab_path, "package.json"),
]

package_data_spec = {
    name: [
        "*"
    ]
}

labext_name = "metanno"

data_files_spec = [
    ("share/jupyter/labextensions/%s" % labext_name, os.path.join(lab_path), "**/*.*"),
    ("share/jupyter/labextensions/%s" % labext_name, HERE, "install.json"),
]

cmdclass = create_cmdclass("jsdeps",
                           package_data_spec=package_data_spec,
                           data_files_spec=data_files_spec
                           )

cmdclass["jsdeps"] = combine_commands(
    install_npm(HERE, build_cmd="build", npm=["jlpm"]),
    ensure_targets(jstargets),
)

with open("README.md", "r") as fh:
    long_description = fh.read()

setup_args = dict(
    name="metanno",
    version="0.0.7",
    url="https://github.com/percevalw/metanno",
    author="Perceval Wajsburt",
    author_email="perceval.wajsburt@sorbonne-universite.fr",
    description="Jupyter widgets collection to setup a modular annotation environment",
    long_description=long_description,
    long_description_content_type="text/markdown",
    cmdclass=cmdclass,
    packages=setuptools.find_packages(),
    install_requires=[
        "transcrypt==3.9.0",
        "ipykernel",
        "astunparse",
    ],
    zip_safe=False,
    include_package_data=True,
    python_requires=">=3.6",
    license="MIT",
    platforms="Linux, Mac OS X, Windows",
    keywords=["Jupyter", "JupyterLab"],
    # data_files=_get_data_files(data_files_spec, None),
    classifiers=[
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Framework :: Jupyter",
    ],
)

if __name__ == "__main__":
    setuptools.setup(**setup_args)
