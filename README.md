<h1 align="center">
  <img alt="Metanno" width="250" src="https://raw.githubusercontent.com/percevalw/metanno/main/docs/assets/images/logo.png" />
</h1>

![Tests](https://img.shields.io/github/actions/workflow/status/percevalw/metanno/tests.yml?branch=main&label=tests&style=flat-square)
[![Documentation](https://img.shields.io/github/actions/workflow/status/percevalw/metanno/docs.yml?branch=main&label=docs&style=flat-square)](https://percevalw.github.io/metanno/latest/)
[![PyPI](https://img.shields.io/pypi/v/metanno?color=blue&style=flat-square)](https://pypi.org/project/metanno/)
[![DOI](https://zenodo.org/badge/244972164.svg)](https://zenodo.org/doi/10.5281/zenodo.10689826)

--------------------------------------------------------------------------------

Metanno is a Python library built on top of the [Pret framework](https://github.com/percevalw/pret) for building dynamic, customizable annotation interfaces.

Who is it for? Research groups, clinical NLP and biomedical teams, data labeling squads, and anyone who wants custom and interactive annotation tools without wrestling with JavaScript.

Metanno currently focuses on text and images with richly structured entities. Its goals are:

- **Modularity:** show your data from multiple synchronized angles. For example, highlight entities over text or images while editing the same rows in a table.
- **Python‑first UI:** write the entire app in Python; it renders to a fast React UI under the hood.
- **Interactivity:** handle annotations as plain Python objects at any time, so you can create, inspect, and transform them programmatically.

## Features

### Annotate anything

In addition to the Pret ecosystem component suite, Metanno provides components for common annotation views:

- [**AnnotatedText**](https://percevalw.github.io/metanno/main/components/annotated-text): display text with highlighted, nestable spans
- [**AnnotatedImage**](https://percevalw.github.io/metanno/main/components/annotated-image): draw shapes (boxes, polygons, etc.) over images.
- [**Table**](https://percevalw.github.io/metanno/main/components/table): an editable, filterable spreadsheet‑style grid for inspecting and editing annotations.

You can compose these views of the same underlying annotations to get a better grasp of the data you are annotating or inspecting.

### Run it your way

Use Metanno in two modes:

- **Standalone app:** run a server and use it in your browser.
- **JupyterLab widgets:** embed components directly in notebooks, with no extra ports or separate server process.

Develop and test in a notebook. If you prefer, you can also run it as a standalone app.

### Easy setup

```bash { data-md-color-scheme="slate" }
pip install metanno==1.0.0-beta.2
```

To use it with Jupyter, if you install the library in a custom environment (conda, venv, or other),
you will likely need to tell Jupyter where to find the front-end files.
You can do this by running the following command (only once):

```bash
pret update-jupyter-config --apply
```

Unlike other alternatives, Metanno requires no additional ports and no separate server process when used in JupyterLab. Write your app in Python and benefit from a fast React front end under the hood.

### Interactive and customizable by design

- Inspect and edit application state directly from Python.
- Update the UI from Python; execute a notebook cell to see changes immediately.
- Register event handlers for clicks, hovers, keystrokes, and more.

## Why another annotation software?

Tool choice shapes both the annotation scheme and the workflow. In many out‑of‑the‑box tools, tasks like annotating implicit or document‑level entities, working across multiple documents at once, or coordinating multiple views can be difficult or unsupported. There are many available solutions (see [Neves et al.](https://pubmed.ncbi.nlm.nih.gov/31838514/)). However,  most of these are either proprietary, poorly adapted to document or multi-document annotation, require a complex installation that is not compatible with existing strict remote computing environments, or are difficult to customize.

Metanno takes a different approach: a modular, Python‑first framework that adapts to your schema and to your annotation process, instead of forcing you into fixed layers or rigid UIs.

## Demo

Check out the [demos](https://percevalw.github.io/metanno/latest/demos/)!

## Todo

- ~~add basic app samples~~
- ~~add a documentation~~
- add more table column types and renderers (numerical, dates, ...)
- ~~add customizable column filterers~~
- add relations visualizations and edition with editable arrows
- ~~add an image annotation view~~
- ~~finish javascript to typescript conversion~~
- ~~customizable undo / redo logic~~
- add multi-cell editing (see a [react-data-grid](https://github.com/adazzle/react-data-grid) PR)
- ~~add a test suite (Cypress ?)~~
- ~~make a standalone version (without Jupyter)~~

## Contribute

Any contribution is welcome, feel free to open a PR.
