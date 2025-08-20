# Customize the data explorer app

In this tutorial, we are going to expose different ways to customize the [Data Explorer][metanno.recipes.explorer.DatasetApp] app (demoed with the Quaero dataset in [the previous tutorial](./run-quaero-explorer.md):

- **Add new fields** to the data model and display them in the UI.
- **Pre-annotate** entities using EDS-NLP.
- **Annotate higher-level structures** such as patients the notes are attached to

## Prerequisites

Reuse the same environment you prepared in the **[Run Quaero Explorer tutorial](./run-quaero-explorer.md)** and run the app in a notebook or as a standalone app.

## Adding new fields

You control which attributes appear in the UI by editing the data you import and by listing those attributes in the table views.
Check out the [Table][pret.ui.metanno.Table] component documentation for more details about the types of attributes you can add.

#### Load the data

For example, add a `note_type` to notes and a `negation` field to entities.

```diff
notes = [
    {
        "note_id": doc._.note_id,
        "note_text": doc.text,
        # This is an example. Make sure that your data actually has this attribute
+       "note_type": doc._.note_type, #(1)!
    }
    for doc in data
]
```

```diff
entities = [
    {
        "id": f"#-{doc._.note_id}-{e.start_char}-{e.end_char}-{e.label_}",
        "note_id": doc._.note_id,
        "text": str(e),
        "begin": e.start_char,
        "end": e.end_char,
        "label": e.label_,
        "concept": e._.cui,
        # This is an example. Make sure that your data actually has this attribute
+       "negation": e._.negation, #(1)!
    }
    for doc in data
    for e in sorted(doc.spans["entities"])
]
```

#### Show these fields

Update the table/text renderers in the [Build the views section](#5-build-the-views) to include the new attributes.
Metanno will automatically detect that the negation attribute is boolean and will display it as a checkbox.

```diff
- first_columns=["note_id", "seen", "note_text"],
+ first_columns=["note_id", "seen", "note_type", "note_text"],
...
- editable_columns=["seen"],
+ editable_columns=["seen", "review_status"],
```

```diff
- first_columns=["id", "note_id", "text", "label", "concept", "begin", "end"],
+ first_columns=["id", "note_id", "text", "label", "concept", "begin", "end", "negation"],
...
- editable_columns=["label", "concept"],
+ editable_columns=["label", "concept", "source"],
```

!!! tip "Dropdown input"

    Add any new columns to `categorical_columns` if they should show a dropdown filter like the `concept` column.


## Pre-annotation

_TBD_

## Annotate higher-level structures

_TBD_
