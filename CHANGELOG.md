# Changelog

## Unreleased

- Added `label_formatter` to `create_text_widget` to allow users to provide a function to customize the displayed label on top of text spans
- Added function-based `options` to let users dynamically choose options to display in the dropdown selectors (or radio)
- Minor fixes to the data widget explorer and quaero demo

## v1.0.0-beta.6 (2025-02-26)

New notebook-based tutorials : [each tutorial](https://percevalw.github.io/metanno/latest/tutorials/) can now be downloaded as a Jupyter notebook and run "at home".

### New DataWidgetFactory !

- The `DatasetExplorerApp` factory moved to `metanno/recipes/data_widget_factory.py` and is now `DataWidgetFactory`
- `create_table_widget` and `create_form_widget` now take fields built with `infer_fields` (makes them reusable, or you can provide fields directly)
- `create_text_widget`:
  - now returns a toolbar widget and a text widget as a tuple
  - now supports fields for the span editor to customize the toolbar
- Optional helpers can replace custom wiring
  - `create_selected_field_view` for simple value display of selected table rows, for instance to show a note header
  - `create_filters_view` for table filters
- **Automatic syncing between tables, forms, and text widgets (no more manual callbacks required)**
- Nested data support, ie `notes: [{"note_id": ..., "note_text": ..., "entities": [{"id": ..., "begin": ...}], ...}]` can be seen in two views using store keys `notes` and `notes.entities`
- New connection status bar to know if an app is connected, disconnected or offline.

### New Pret changes !

- Transactions, connection status, store rollbacks, Jupyter "Open in a new tab" button, and more.
- Check out [Pret's changelog](https://percevalw.github.io/pret/latest/changelog/) for more info.

## v1.0.0-beta.5 (2025-12-09)

- Table input suggestions are now more visible (with a blueish outline)
- Update `Table` props and events: use pkey instead of row_key. Imperative handle now exposes scroll_to_row_idx and scroll_to_row_id. All row callbacks now receive row_id first, followed by row_idx, column, etc., and row_id can be None when unset. Adjust your handlers and highlighted-row keys to match.
- Dataset explorer factory inputs (metanno/recipes/explorer.py):
  - create_table_widget is keyword-only and uses the new Table API and handle (TableWidgetHandle with scroll/filter/highlight helpers). If you passed handlers, update them to the new signatures with row_id.
  - New form widget: create_form_widget renders a single record with text, select, and boolean inputs.
- Text handle keys are renamed to set_doc_by_id, get_doc_id, scroll_to_span, set_highlighted_spans, and set_doc_by_id. New on_click_span callback added and hover callback now passes (span_ids, mod_keys).
- Added `begin_key`, `end_key`, `primary_key`, `style_key`, `label_key` and `highlighted_key` to allow the user to customize the provenance of these attributes in the `AnnotatedText` component span data.
- :boom: Breaking API change in `metanno.recipes.explorer`:
  - `create_table_widget`:
    - `pkey_column` -> `primary_key`
    - `hidden_columns` -> `hidden_keys`
    - `id_columns` -> `id_keys`
    - `editable_columns` -> `editable_keys`
    - `categorical_columns` -> `categorical_keys`
    - `first_columns` -> `first_keys`
  - `create_text_widget`:
    - `text_pkey_column` -> `text_primary_key`
    - `spans_pkey_column` -> `text_primary_key`
    - new `primary_key`
    - new `begin_key`
    - new `end_key`
    - new `style_key`
    - new `label_key`
    - new `highlighted_key`
- Minor documentation fixes.

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
