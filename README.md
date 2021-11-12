# Metanno

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/percevalw/metanno/HEAD?urlpath=lab%2Ftree%2Fexamples%2FAnnotator.ipynb)

Metanno is a JupyterLab extension that allows you build your own annotator. For the moment, it focuses on textual documents with rich structured entities.
Its main objectives are:
- modularity: you decide how many views of your data are needed
- customization: you can easily customize the software behavior in Python and see the changes immediately
- interactivity: all of your annotations are immediately available as Python objects as soon as you edit something

## Features

- ↵ multiline and nested span annotations
- 🖇️ nested, relational, complex annotation with table views
- 🔗 multiple data type: hyperlinks, text, lists
- 🪟 text view or table view
- ✨ extensive customization power
- 🐍 write your app in Python, execute it in the browser (or in the kernel, you decide)
- 🚀 fast: the client side is written in React, and every action is processed in the browser directly by default
- 🌐 websocket communication: you do not need to open any port
- ⏮️ immutable state management, any state mutation is recorded and undoable

## Installation

This project is still under development and is subject to change.
A simple pip install should be enough if you use Jupyterlab 3. You do not need to open any port.
```
pip install metanno
```

If you're a user in a shared Jupyter environment, you should instead install the extension at the user level
```
pip install metanno --user
```

## Why

The choice of annotation software must be taken into account in the design of the annotation scheme.
For example, it is difficult to annotate implicit/document-level entities in Brat or to annotate relations on multiple lines, and impossible to handle multiple documents at once.
There are many annotation tools available (see [Neves et al.](https://pubmed.ncbi.nlm.nih.gov/31838514/)), but most of them are either proprietary, poorly adapted to document or multi-document annotation,
require a complex installation that is not compatible with existing remote work environments, or are difficult to customize.
Finally, the standardization of annotation levels (mention / relation / event) is an obstacle to the development of new tasks.
Given the limitations of the existing softwares and the difficulty to cover every need with a single static annotator,
this project was initiated to provide a modular and fully customizable annotation framework, Metanno, and address these difficulties.  

## Demo

You can try it with [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/percevalw/metanno/HEAD?urlpath=lab%2Ftree%2Fexamples%2FAnnotator.ipynb). Be patient though, when there is no cached build, it may take a few minutes to start.

![https://github.com/percevalw/metanno/raw/master/doc/screenshot.png](https://github.com/percevalw/metanno/raw/master/doc/screenshot.png)

## How it works

<img src="https://github.com/percevalw/metanno/raw/master/doc/how.png" width=500px />

All the app is controlled by a single state, replicated on both the frontend (the Jupyter client) and the backend (the Python kernel).
Each views rendered in Jupyter uses a derivation of this state (think `view_data = fn(app_data)`) and calls functions in the app class whenever an event occurs.
This app class is written in Python (by you), automatically translated into javascript and sent to the front-end such that every action taken by the
user is answered immediately.
If a given function modifies the state (wrapped by the `@produce` decorator), the changes are sent to the backend or the frontend to keep the state replicas in sync.
If a function needs to be executed exclusively on the frontend or the backend (for example, triggering a database query on the backend), you can wrap it
with `@frontend_only` or `@kernel_only`, and the call will be transmitted over the Jupyter websocket.

## Todo

- add basic app samples
- add a documentation
- add more table column types and renderers (boolean, numerical, ...)
- add customizable column filterers
- add relations visualizations and edition with editable arrows
- add an image annotation view
- finish javascript to typescript conversion
- customizable undo / redo logic
- add multi-cell editing (through a [react-data-grid](https://github.com/adazzle/react-data-grid) PR)
- find a logo ?

## Contribute

Any contribution is welcome, feel free to open a PR.
