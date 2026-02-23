# Customize the data explorer app

In this tutorial, we expose different ways to customize the [Data Explorer][metanno.recipes.data_widget_factory.DataWidgetFactory] app (demoed with the Quaero dataset in [the previous tutorial](./run-quaero-explorer.md)):

- **Add new fields** to the data model and display them in the UI.
- **Pre-annotate** entities using EDS-NLP.
- **Annotate higher-level structures** such as patients the notes are attached to.

## Prerequisites

Reuse the same environment you prepared in the **[Run Quaero Explorer tutorial](./run-quaero-explorer.md)** and run the app in a notebook or as a standalone app.

## Adding new fields

In the current Quaero example, entities are nested inside each note (`notes[i]["entities"]`).
You control which attributes appear in the UI by:

1. Extending the imported data structure.
2. Listing these attributes in widget fields (`infer_fields(...)` or manual form fields).

Check out the [Table][metanno.ui.Table] component documentation for more details about supported field types.

#### Load the data

For example, add a note-level `source` field and an entity-level `negation` field.

```diff
 notes.append(
     {
         "note_id": str(doc._.note_id),
         "note_text": doc.text,
+        "source": "quaero",  # (1)!
         "note_kind": "interesting" if idx % 2 == 0 else "very interesting",
         "seen": False,
         "entities": [
             {
                 "id": f"#{uuid.uuid4()}",
                 "text": str(e),
                 "begin": e.start_char,
                 "end": e.end_char,
                 "label": e.label_,
                 "concept": e._.cui,
+                "negation": False,  # (2)!
             }
             for e in sorted(doc.spans["entities"])
         ],
     }
 )
```

1. You can set this from metadata, a file path, or an upstream pipeline.
2. Replace with `e._.negation` if your EDS-NLP pipeline populates it (for example with `nlp.add_pipe("eds.negation")`).

#### Show these fields

Update renderers in the [Build the views and define their interactions section](./run-quaero-explorer.md#4-build-the-views-and-define-their-interactions) to include these attributes.
For booleans such as `negation`, Metanno infers a boolean field type and renders a checkbox/toggle editor.

```diff
- visible_keys=["note_id", "seen", "note_text", "note_kind"],
+ visible_keys=["note_id", "seen", "note_text", "note_kind", "source"],
...
- editable_keys=["seen", "note_kind"],
+ editable_keys=["seen", "note_kind", "source"],
...
+ categorical_keys=["note_kind", "source"],
```

```diff
 fields=[
     {"key": "note_id", "kind": "text"},
     {
         "key": "note_kind",
         "kind": "radio",
         "editable": True,
         "options": ["interesting", "very interesting"],
         "filterable": True,
     },
     {"key": "seen", "kind": "boolean", "editable": True},
+    {"key": "source", "kind": "text", "editable": True},
 ]
```

```diff
- visible_keys=["id", "text", "label", "concept"],
+ visible_keys=["id", "text", "label", "concept", "negation"],
...
- editable_keys=["label", "concept"],
+ editable_keys=["label", "concept", "negation"],
```

```diff
- visible_keys=["label", "concept"],
+ visible_keys=["label", "concept", "negation"],
...
- editable_keys=["label", "concept"],
+ editable_keys=["label", "concept", "negation"],
```

!!! tip "Dropdown input"

    Add new keys to `categorical_keys` if they should use a dropdown editor/filter
    (for example `concept`, `label`, or a custom string category like `source`).
