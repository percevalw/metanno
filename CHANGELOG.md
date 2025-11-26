# Changelog

## v1.0.0-beta.4 (2025-11-26)

- Moved `pret.ui.metanno` to `metanno.ui` (accessible via `from metanno import ...`)
- Renamed `actions` props to `handle` and manage them like true refs (i.e., users should access its content via `handle.current.xxx`)
- Added `on_mouse_hover_spans` and `on_mouse_hover_row` props to `AnnotatedText` and `Table` components, which should offer a more reliable way to highlighted spans/rows on mouse hover
- Refactored the `explorer` recipe and `examples/quaero.py` example to use widgets instead of a complex/monolithic app

## v1.0.0-beta.3 (2025-08-21)

- Fix AnnotatedText bug in text selection on desktop browsers

## v1.0.0-beta.2 (2025-08-18)

- Improved visibility of highlighted spans and layout of boxes with mixed inset/outset nesting
- Improved autocompletion experience for table suggestion inputs
- Improved tokenization of text, now allowed to split around dashes (-).
- Added _theoretical_ support for touch screens (lightly tested)
- Added tutorials
    - Setup
    - Run the Quaero Explorer app
    - Customize the explorer

## v1.0.0-beta.1 (2025-06-06)

- Complete refacto of the framework: the Python-JS synchronized app mechanisms have been moved to a new library: [Pret](https://github.com/percevalw/pret) !
- Text and Table components are now callable directly from python, along other components built around MUI Joy. This gives the user the ability to easily build simple apps, and iterate on the design step by step.
- Metanno now features new Image annotation component.
- The tests run in Python 3.7 - 3.10, using playwright in headless Firefox, Chrome and Webkit.
- Metanno now also has a nice interactive documentation !

## Metanno v0

Metanno v0 is a JupyterLab extension for building custom annotation interfaces. It focuses on textual documents with structured entities and aims for modularity, customization, and interactivity. Core features include multi-line and nested span annotations, table-based relational annotations, multiple data types (hyperlinks, text, lists), and an immutable state that can be synchronized between the frontend and backend. The project compiles Python app classes to JavaScript using Transcrypt, enabling fast, browser-side execution while keeping Python code on the kernel side. To create an app, the user must modify one of the apps in recipes/*.py, and handle state management using a huge Redux-style reducer in `select_state`.

Last items in the v0 changelog:

- Almost complete typescript conversion
- Added column filters
- Customizable undo/redo logic
- Editable span annotations from a table view
- Accessible return value of a Python call from front end (async calls)
