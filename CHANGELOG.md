# Changelog

## Unreleased

### JupyterLab viewer

- A table whose name contains a dot, for instance a `mycsv.csv` dataset of a file source, shows its rows: its tab names it `mycsv_csv` in the Store, since widgets read a dot in a Store key as a nested path.
- A file source whose `uri` is only a scheme, e.g. `s3a://`, shows the buckets as its folders, its tables are named like `my_database/my_table`.

## v2.0.0-beta.4 (2026-10-27)

### JupyterLab viewer

- File sources read CSV datasets with the connection's `read_csv`: a folder whose data files are `.csv` or `.csv.gz` files, eg written by Spark, and a `.csv` file next to folders. `format: csv` sets it for a whole source.

## v2.0.0-beta.3 (2026-10-26)

### JupyterLab viewer

- File sources show the folder tree under their `uri` at any depth, local, mounted or remote, datasets are tables named by their path, eg `runs/notes`. A folder holding data files and no subfolder is one dataset, also when it is the `uri` itself, and without `format` a table is Delta when its folder has a `_delta_log`.
- Connections list HDFS and S3 folders without Spark with a `list_storage(uri)` method returning `(name, is_folder)` pairs.
- The sidebar settings button shows the `metanno-home` folder in the file browser and opens `metanno.yaml`, in place of the views and annotations folder links. Every sidebar item, source, database, folder, table, view or annotation, is a row of the same height indented by its level, and open in a new tab shows on hover.
- Other extensions open a dataset by its location with `metanno-viewer:open-resource` and `{ kind: "path", uri }`, read as a table of the source containing it or with the new `default_connection`.

## v2.0.0-beta.2 (2026-10-22)

### JupyterLab viewer

- Metanno files move to a `metanno-home` folder: `metanno.yaml`, connection modules, `views/` and `annotations/`. The `views:` key is removed.
- Sources can list several `connections`, switchable from the sidebar or a table tab.
- `kind: databases` sources list the databases of their connection, eg Trino schemas.
- Connection factories can set `refresh_tables_on_view_open` to read their tables again at each view opening.
- **Copy code** imports connection modules without Metanno, and query code has no row limit.
- Rerunning an **Open with Metanno** cell refreshes its open panel instead of adding a sidebar entry.
- The explorer kernel only starts from the sidebar or **Refresh**, also after a shutdown.
- Each connection runs its queries on its own thread, so a slow database no longer blocks the others.

### Widgets

- Bare text filters ignore case, while `contains`, `starts with` and `ends with` match case.

## v2.0.0-beta.1 (2026-10-08)

Metanno 2 requires Pret 0.7.

### JupyterLab viewer

- `view_opener(store)` displays an **Open with Metanno** button that opens a Store in a JupyterLab tab, with the built in table view (a table and a form of the selected rows) or a view recipe.
- View recipes are Python files of a views directory, `main(store, ...)` returns the interface. Saved views (`views/*.yml`) select source tables, a recipe and its parameters.
- The **Metanno** sidebar browses sources configured in `metanno.yaml` (Ibis URLs or Python connection factories), saved views, and saved annotation Stores grouped by folder, eg one file per annotator.
- Source tables open in tabs backed by a shared query kernel, with **Copy code** to customize the query in a notebook, as plain Ibis code opening the configured connection, or to prepare an editable annotation Store.
- Tabs have a recipe selector to show the same data with another recipe, a kernel selector, a reload button and fullscreen links. Annotations reopen in their saved kernel with their saved view, independently of the notebook that created them.
- Errors above views and widgets can be dismissed.

### Widgets

- `DataWidgetFactory` displays and edits Pret DataFrames as well as lists of dictionaries: paged tables with server side filtering and sorting, forms of the selected rows (long text fields included), text views and related tables linked through `DataRelation`.
- Tables of very large sources show their first 600,000 rows, which browsers can scroll, filters and sorting apply to all rows.
- `create_pdf_widget` shows the PDF of the selected row with the browser viewer.
- `create_status_bar` shows rejected edits and undo controls of a Store, `create_connection_status_bar` remains as an alias.
- Fix `on_hover_spans` callback to trigger also when the cursor leaves a span while leaving its line

### Other changes

- `DataWidgetFactory.create_filters_view` is removed, tables filter from their column headers.

## v1.0.0 (2025-05-10)

- Added multi-document rendering to `DataWidgetFactory.create_text_widget` with `docs_mode="lead" | "selected" | "all"` and an optional `container_renderer` for custom document wrappers (e.g. sticky headers)
- Added text-widget imperative helpers to inspect and act on the active selection: `get_active_doc_id`, `get_selected_ranges`, `get_selected_text`, and `add_span_from_selection`.
- Improved text-widget span workflows: selections are tracked per document, added spans get unique IDs, selected or highlighted hidden spans remain visible, and span scrolling now activates the span's document before scrolling.
- Improved default table, form, and text selections so linked widgets select the first available row/document on initial render.
- Improved `AnnotatedText` scrolling and layout: handle methods now accept scroll positioning options, and line spacing/gutter sizing uses shared CSS variables.
- Improved the connection status bar with a visual pulse when synced writes are rejected while disconnected.
- Improved reliability thanks to pret v0.6.3

## v1.0.0-beta.7 (2025-02-27)

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
