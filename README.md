<h1 align="center">
  <img alt="Metanno" width="250" src="https://raw.githubusercontent.com/percevalw/metanno/main/docs/assets/images/logo.png" />
</h1>

![Tests](https://img.shields.io/github/actions/workflow/status/percevalw/metanno/tests.yml?branch=main&label=tests&style=flat-square)
[![Documentation](https://img.shields.io/github/actions/workflow/status/percevalw/metanno/docs.yml?branch=main&label=docs&style=flat-square)](https://percevalw.github.io/metanno/latest/)
[![PyPI](https://img.shields.io/pypi/v/metanno?color=blue&style=flat-square)](https://pypi.org/project/metanno/)
[![metanno](https://labextensions.dev/api/badge/metanno?metric=downloads&leftColor=%23555&rightColor=%23F37620&style=flat)](https://labextensions.dev/extensions/metanno)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.16922240.svg)](https://zenodo.org/doi/10.5281/zenodo.10689826)

--------------------------------------------------------------------------------

Metanno brings data exploration and annotation into JupyterLab. Open data prepared in Python,
inspect it through tables, text and image views, and save an editable dataset. Move between your
notebook and the viewer as you select data, add predictions and review annotations.

Metanno supplies the visualization and annotation components. [Pret](https://github.com/percevalw/pret)
connects them to shared Python data and saves your work. These components also work directly in
notebook outputs and standalone Pret applications.

Start with the [tutorials](https://percevalw.github.io/metanno/latest/tutorials/): annotate a first table in
five minutes, then select notes in a database, pre-annotate them and build the interface your annotators need.

## Features

### Annotate anything

In addition to the Pret ecosystem component suite, Metanno provides components for common annotation views:

- [**AnnotatedText**](https://percevalw.github.io/metanno/main/components/annotated-text): display text with highlighted, nestable spans
- [**AnnotatedImage**](https://percevalw.github.io/metanno/main/components/annotated-image): draw shapes (boxes, polygons, etc.) over images.
- [**Table**](https://percevalw.github.io/metanno/main/components/table): an editable, filterable spreadsheet‑style grid for inspecting and editing annotations.

You can compose these views of the same underlying annotations to get a better grasp of the data you are annotating or inspecting.

### Run it your way

Use the JupyterLab application or compose widgets yourself:

- **JupyterLab application:** explore sources, open view recipes and save annotations.
- **Standalone app:** run a server and use it in your browser.
- **JupyterLab widgets:** embed components directly in notebooks, with no extra ports or separate server process.

Develop and test in a notebook. If you prefer, you can also run it as a standalone app.

### Installation

```bash
pip install metanno
python -m metanno.viewer.explorer_kernel --install
```

Install it in the environment running JupyterLab. If your notebooks use another environment, install it
there too, and run `pret update-jupyter-config --apply` once so JupyterLab finds the frontend files.
See [installation](docs/installation.md) for source drivers and separate environments.

### Interactive and customizable by design

- Inspect and edit application state directly from Python.
- Update the UI from Python; execute a notebook cell to see changes immediately.
- Register event handlers for clicks, hovers, keystrokes, and more.

## Why another annotation software?

Tool choice shapes both the annotation scheme and the workflow. In many out‑of‑the‑box tools, tasks like annotating implicit or document‑level entities, working across multiple documents at once, or coordinating multiple views can be difficult or unsupported. There are many available solutions (see [Neves et al.](https://pubmed.ncbi.nlm.nih.gov/31838514/)). However,  most of these are either proprietary, poorly adapted to document or multi-document annotation, require a complex installation that is not compatible with existing strict remote computing environments, or are difficult to customize.

Metanno takes a different approach: a modular, Python‑first framework that adapts to your schema and to your annotation process, instead of forcing you into fixed layers or rigid UIs.

## Demo

Check out the [demos](https://percevalw.github.io/metanno/latest/demos/)!

## Contribute

Any contribution is welcome, feel free to open a PR. See [CONTRIBUTING.md](https://github.com/percevalw/metanno/blob/main/CONTRIBUTING.md)
to set up a development environment and run the tests.
