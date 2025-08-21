# Installation

## As a user

A simple pip installation should be enough to install Metanno *both* as a standalone web app framework and as a JupyterLab extension:

```bash { data-md-color-scheme="slate" }
pip install metanno==1.0.0-beta.2
```

To use it with Jupyter, if you install the library in a custom environment (conda, venv, or other),
you will likely need to tell Jupyter where to find the front-end files.
You can do this by running the following command (only once):

```bash
pret update-jupyter-config --apply
```

## As a contributor

If you want to contribute to Metanno, you should have a programming environment:

- Python 3.7 or later, with pip and [hatch](https://hatch.pypa.io/latest/) installed
- Node.js 20 or later (you can use [nvm](https://github.com/nvm-sh/nvm) to easily install and manage Node.js versions)
- JupyterLab 3 (the built extension will be compatible with JupyterLab 4)
- Various web browsers for testing (e.g., Chrome, Firefox, Safari)
- A Git client to clone the repository and manage your changes

```bash { data-md-color-scheme="slate" }
git clone https://github.com/percevalw/metanno.git
cd metanno
```

Then, create a new branch for your changes:

```bash { data-md-color-scheme="slate" }
git checkout -b my-feature-branch
```

Create (optional) virtual env and install all development deps.
Install the package in editable mode with development dependencies:

```bash { data-md-color-scheme="slate" }
yarn install
pip install -e . --group dev  #(1)!
yarn playwright install --with-deps # browsers for UI tests
```

1. or `uv pip install -e . --group dev` with uv

### Running the UI tests

Metanno uses [playwright](https://playwright.dev/) to test the JupyterLab extension (which should cover most of the app features).
You can run the tests to ensure everything is working correctly.

```bash { data-md-color-scheme="slate" }
sh tests/jupyter/run.sh #(1)!
```

1. or `uv run sh tests/jupyter/run.sh` with uv

### Building the documentation

The documentation is built with [MkDocs](https://www.mkdocs.org/) and [MkDocs Material](https://squidfunk.github.io/mkdocs-material/) theme, along with quite a few customizations.
To build the documentation, you can use the following command:

```bash { data-md-color-scheme="slate" }
pip install -e . --group docs  #(1)!
mkdocs serve  #(2)!
```

1. or `uv pip install -e . --group docs` with uv
2. or `uv run mkdocs serve` with uv
