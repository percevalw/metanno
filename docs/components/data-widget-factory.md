# DataWidgetFactory

`DataWidgetFactory` builds the widgets of a view from a Store. Its widgets read the rows of the Store, save the
edits to it, and share the selected rows: selecting a note in a table shows its text in a text widget and its
fields in a form. [Review entities](../tutorials/review-entities.md) builds a first view with it.

```python { .no-exec }
from metanno import DataRelation, DataWidgetFactory

factory = DataWidgetFactory(
    store, relations=[DataRelation("notes", "entities", on="note_id")]
)
```

`relations` links the tables of the Store, here the entities to their note, see
[Annotate across levels](../tutorials/annotate-across-levels.md).

## Widgets

| Method | Shows | Used in |
| --- | --- | --- |
| `create_table_widget` | the rows of a table, to filter, sort and edit | [Annotate a table](../tutorials/annotate-a-table.md) |
| `create_text_widget` | the text of the selected row with its entities highlighted, and a toolbar of labels | [Review entities](../tutorials/review-entities.md) |
| `create_form_widget` | the fields of the selected row, with buttons to go to the previous or next row | [Design your view](../tutorials/design-your-view.md) |
| `create_selected_field_view` | one field of the selected row, such as the ID of a note above its text | [Design your view](../tutorials/design-your-view.md) |
| `create_pdf_widget` | the PDF of the selected row, in the PDF viewer of the browser | see below |
| `create_status_bar` | the last edit Python refused, and whether the view is connected to Python | [Design your view](../tutorials/design-your-view.md) |

Tables, texts and forms take a `fields` list, which picks the columns to show and how to edit them, see
[Choose how each field is shown](../tutorials/design-your-view.md#choose-how-each-field-is-shown).

The PDF widget asks a Python function for the document of the selected row, for instance to show the original
report next to its extracted text. The function receives the row and returns the PDF as bytes, after converting
other formats, such as scans, if needed:

```python { .no-exec }
from pathlib import Path


def load_report(note):
    """
    Read the PDF of a note from the folder of the original reports
    """
    return Path(f"reports/{note['note_id']}.pdf").read_bytes()


pdf = factory.create_pdf_widget(
    store_key="notes", primary_key="note_id", loader=load_report
)
```

## Behavior in the interface

The widgets behave the same way in every view:

- a checkbox or a choice is saved as soon as it is clicked, a text field when you press ++enter++ or click
  elsewhere, while ++escape++, or selecting another row, cancels it
- when several rows are selected, changing a field changes it for all of them, as one edit
- ++ctrl+z++ undoes the last change made in the view and ++ctrl+shift+z++ redoes it, with ++cmd++ on a Mac, while
  inside a text field these keys undo the typing
- when Python refuses an edit, for instance because someone else changed the same cell, the field shows why. A
  Metanno tab shows the last refusal under the view, add `create_status_bar` to views shown in a notebook or a web
  app
- the text widget shows the document of the selected row, or with `docs_mode="selected"` every selected document,
  and with `docs_mode="all"` all the documents of the table, or those under the selected parent row of a related
  table
- a table related to other tables by `DataRelation` shows the rows under the selected row of one of them, chosen
  above it among those with a selected row, e.g. <span class="ui-button">All</span>,
  <span class="ui-button">Patient</span> and <span class="ui-button">Stay</span> for notes. While no stay is
  selected, the notes of the selected patient show. Clicking a note selects and scrolls to its stay and its patient
  in their tables, which then show the stays of that patient, while the notes stay shown until
  <span class="ui-button">Stay</span> is clicked

## Reference

::: metanno.recipes.data_widget_factory.DataWidgetFactory
    options:
        heading_level: 3
        show_bases: false
        show_source: false
        inherited_members: true
        members:
            - create_table_widget
            - create_text_widget
            - create_form_widget
            - create_selected_field_view
            - create_pdf_widget
            - create_status_bar
