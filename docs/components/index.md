# Building Blocks of Metanno

For a first table or annotation task, start with [Annotate a table](../tutorials/annotate-a-table.md).
[Review entities](../tutorials/review-entities.md) shows how to connect several widgets in a view before writing
your own event callbacks.

These components work in recipes, directly inside notebooks, and in standalone Pret applications.
They do not require the JupyterLab explorer. Use `DataWidgetFactory` to connect tables, forms and
annotations to the same Store, or compose the individual components below.

<!-- --8<-- [start:components] -->

| Component                                   | Description                                                |
|---------------------------------------------|------------------------------------------------------------|
| [AnnotatedText][metanno.ui.AnnotatedText]   | View and interact with a text with optional annotations.   |
| [AnnotatedImage][metanno.ui.AnnotatedImage] | View and interact with an image with optional annotations. |
| [Table][metanno.ui.Table]                   | View and interact with a table                             |

<!-- --8<-- [end:components] -->

## Widget behaviors

`DataWidgetFactory` connects these components to a Store, for lists of dictionaries as for Pret DataFrames

- The factory handles selection, filters, sorting and source query buttons, a Table can also read rows from an
  asynchronous `row_source`
- Text fields save on Enter or when they lose focus, Escape or selecting another record discards the draft
- Checkboxes and choices save immediately, editing or deleting a multi-row selection is a single change
- Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z inside factory widgets undo and redo Store changes, text inputs keep their own undo
- `factory.create_status_bar()` shows the last rejected edit or undo of the Store and its connection to Python,
  place it below your widgets, the widgets do not show these errors themselves. A Metanno viewer tab always shows
  them below the view. A rejected field keeps its own message under the field
- Text widgets show the lead selected document with `docs_mode="lead"`, the selected ones with `"selected"`,
  or all documents with `"all"`
