<h1 align="center">
  <img alt="Metanno" width="250" src="https://raw.githubusercontent.com/percevalw/metanno/main/docs/assets/images/logo.png" />
</h1>

[![DOI](https://zenodo.org/badge/244972164.svg)](https://zenodo.org/doi/10.5281/zenodo.10689826)

--------------------------------------------------------------------------------

Metanno is a JupyterLab extension that allows you to build your own annotation interface. Metanno is a Python library aimed at building dynamic annotation interfaces customized to your needs without leaving your notebook.

At the moment, Metanno focuses on textual documents and images with rich structured entities.
Its main goals are:

- modularity: you decide how many views of your data are needed
- customization: you can easily customize the software behavior in Python and see the changes immediately
- interactivity: all of your annotations are immediately available as Python objects as soon as you edit something

## Features

### Annotate anything

Metanno allows users to create a wide variety of annotations,
including multiline and nested span annotations for text, shapes for images, and document-level, relational, or complex annotations using tables.

It also supports multiple data types, including hyperlinks, text, and lists, and
allows users to switch between text, image, and table views for their annotations.

### Serving vs embedding

Metanno can be used in two different ways:

- As a standalone application, where you can run a server and access the app through a web browser.
- As a collection of JupyterLab widgets

This makes it easy to develop and test your app in a notebook, and then deploy it as a standalone application if needed.

### Easy setup

Metanno is easy to install with a simple

```bash { data-md-color-scheme="slate" }
pip install metanno
```

Unlike many other alternatives, when used in JupyterLab, it does not require users to open any ports
or leave their notebook to launch a server. It also allows users to write
their own apps in Python while automatically benefiting from the speed of client-side JavaScript code with a React-based implementation.

### Interactive and customizable by design

- visualize and edit the current app state directly in Python
- update the UI in Python, execute the cell and see the results immediately
- immutable state management, any state mutation is recorded and undoable
- many event handlers to react to any user action (click, hover, type, ...)

Metanno is designed to be highly interactive and customizable, with the ability
to visualize and edit app states directly in Python and update the UI in real
time. It also offers a variety of event handlers that allow users to react to
any user action. This makes it easy to create tailored and responsive app UIs
in JupyterLab.

## Why another annotation tool ?

The choice of annotation software must be taken into account in the design of the
annotation scheme. For example, it is challenging to annotate implicit/document-level
entities in Brat or to annotate relations on multiple lines, and impossible to handle
multiple documents at once. There are many annotation tools available
(see [Neves et al.](https://pubmed.ncbi.nlm.nih.gov/31838514/)), but most of them
are either proprietary, poorly adapted to document or multi-document annotation, require
a complex installation that is not compatible with existing remote work environments,
or are difficult to customize. Finally, the standardization of annotation levels
(mention / relation / event) is an obstacle to the development of new tasks. Given the
limitations of the existing software and the difficulty to cover every need with a
single static annotator, this project was initiated to provide a modular and fully
customizable annotation framework, Metanno, and address these difficulties.

## Demo

You can view some demos here: [Demos](https://percevalw.github.io/metanno/main/demos).

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
