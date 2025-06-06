# Installation

## As a user

A simple pip installation should be enough to install Metanno *both* as a standalone web app framework and as a JupyterLab extension:


```bash { data-md-color-scheme="slate" }
pip install metanno
```

However, depending on your Jupyter setup, especially for shared JupyterHub servers,
a user-level installation might be necessary. In this case, run instead


```bash { data-md-color-scheme="slate" }
pip install metanno --user
```

Refresh your JupyterLab page to load the installed javascript files, et voilà.

## As a contributor

If you want to contribute to Metanno, you should have a programming environment:

- Python 3.7 or later, with pip and [hatch](https://hatch.pypa.io/latest/) installed
- Node.js 20 or later (you can use [nvm](https://github.com/nvm-sh/nvm) to easily install and manage Node.js versions)
- Various web browsers for testing (e.g., Chrome, Firefox, Safari)
- A Git client to clone the repository and manage your changes

```bash { data-md-color-scheme="slate" }
git clone https://github.com/percevalw/metanno.git
```

Then, create a new branch for your changes:

```bash { data-md-color-scheme="slate" }
git checkout -b my-feature-branch
```

Install the package in editable mode with development dependencies:

```bash { data-md-color-scheme="slate" }
pip install -e ".[dev]"
```

### Running the tests

Metanno uses [playwright](https://playwright.dev/) to test the JupyterLab extension (which should cover most of the app features).
You can run the tests to ensure everything is working correctly.

```bash { data-md-color-scheme="slate" }
hatch run tests
```

### Building the documentation

The documentation is built with [MkDocs](https://www.mkdocs.org/) and [MkDocs Material](https://squidfunk.github.io/mkdocs-material/) theme, along with quite a few customizations.
To build the documentation, you can use the following command:

```bash { data-md-color-scheme="slate" }
hatch run docs
```
