<h1 style="text-align: center" markdown>
![Metanno](/assets/images/logo.svg){ width="250px" }
</h1>

Metanno brings data exploration and annotation into JupyterLab. Open data prepared in Python,
inspect it through tables, text and image views, and save an editable dataset. Move between your
notebook and the viewer as you select data, add predictions and review annotations.

Metanno supplies the visualization and annotation components. [Pret](https://github.com/percevalw/pret)
connects them to shared Python data and saves your work. You can also compose these components directly
in notebook outputs or standalone Pret applications.

Who is it for? Research groups, clinical NLP and biomedical teams, data labeling squads, and anyone who wants
custom and interactive annotation tools without wrestling with JavaScript.

## Choose a starting point

- [Install Metanno](installation.md) in the Jupyter server and Python environments you use
- [Annotate a table](tutorials/annotate-a-table.md) in five minutes, without any configuration
- [Annotate a corpus](tutorials/index.md#annotate-a-corpus): select notes in a database, pre-annotate them with
  EDS-NLP and review them
- [Customize the interface](tutorials/index.md#customize-the-interface) of your annotators, inside or outside
  JupyterLab

## Open data prepared in Python

```python
from metanno import view_opener
from pret import DataFrame, create_store

store = create_store({"notes": DataFrame([{"id": 1, "text": "Example"}])}, sync=True)
view_opener(store)
```

Click **Open with Metanno** to open the table in a tab. This is an unsaved preview.
Follow [Annotate a table](tutorials/annotate-a-table.md) to make an editable copy, read edits back into
Python and reopen the saved file. It needs no source configuration or custom interface code.

## Components

In addition to the Pret component suite, Metanno provides components for common annotation views:

- **[AnnotatedText][metanno.ui.AnnotatedText]**: display text with highlighted, nestable spans
- **[AnnotatedImage][metanno.ui.AnnotatedImage]**: draw shapes (boxes, polygons, etc.) over images
- **[Table][metanno.ui.Table]**: an editable, filterable spreadsheet-style grid for inspecting and editing annotations

Compose them in notebook outputs, standalone Pret apps, or [views](tutorials/review-entities.md) opened in the JupyterLab viewer.
Several views of the same annotations stay in sync, since they share the same Store.

## Why another annotation software?

Tool choice shapes both the annotation scheme and the workflow. In many out-of-the-box tools, tasks like annotating
implicit or document-level entities, working across multiple documents at once, or coordinating multiple views can
be difficult or unsupported. There are many available solutions (see [Neves et al.](https://pubmed.ncbi.nlm.nih.gov/31838514/)).
However, most of these are either proprietary, poorly adapted to document or multi-document annotation, require a
complex installation that is not compatible with existing strict remote computing environments, or are difficult to
customize.

Metanno takes a different approach: a modular, Python-first framework that adapts to your schema and to your
annotation process, instead of forcing you into fixed layers or rigid UIs. In JupyterLab, it needs no additional
port and no separate server process.

## Demo

See the [demo apps](/demos), listed below.

--8<-- "docs/demos/index.md:demos"

## Tutorials

Start with these two tutorials, then follow the [whole path](tutorials/index.md), from a database to your own
annotation interface:

--8<-- "docs/tutorials/index.md:tutorials"

## Compose your own components

For a table and text view connected to saved rows, start with [Review entities](tutorials/review-entities.md).
The example below shows the lower-level components using a small list of dictionaries.
This path is useful when you want to write the interaction callbacks yourself.

Below is a small example that lets you annotate text spans and view them in a synchronized table. Select spans to add them; hold **Shift** (also labeled **Maj** on some keyboards) while selecting to delete overlapping spans.

```python { .render-with-pret .code--expandable }
from pret import component, create_store, use_store_snapshot, use_event_callback
from metanno import AnnotatedText

state = create_store(
    [
        {"text": "soir", "begin": 3, "end": 7, "id": "s-3-7", "label": "ENT"},
        {"text": "Charlie", "begin": 59, "end": 66, "id": "s-59-66", "label": "ENT"},
    ]
)

text = (
    "Le soir, après avoir mangé sa soupe aux choux noyée "
    "d’eau, Charlie allait toujours dans la chambre de ses "
    "quatre grands-parents pour écouter leurs histoires, "
    "et pour leur souhaiter bonne nuit.\n"
    "Chacun d’eux avait plus de quatre-vingt-dix ans. Ils "
    "étaient fripés comme des pruneaux secs, ossus comme "
    "des squelettes et, toute la journée, jusqu’à l’apparition "
    "de Charlie, ils se pelotonnaient dans leur lit, deux de "
    "chaque côté, coiffés de bonnets de nuit qui leur tenaient "
    "chaud, passant le temps à ne rien faire."
)


@component
def App():
    view_state = use_store_snapshot(state)

    @use_event_callback
    def on_select(spans, mod_keys):
        if "Shift" in mod_keys:
            # Delete overlapped spans if the user holds Shift
            state[:] = [
                x
                for x in state
                if any(
                    (s["begin"] >= x["end"] or s["end"] <= x["begin"]) for s in spans
                )
            ]
        else:
            state.extend(
                [
                    {
                        **s,
                        "id": f"s-{s['begin']}-{s['end']}",
                        "text": text[s["begin"] : s["end"]],
                        "label": "ENT",
                    }
                    for s in spans
                ]
            )

    return AnnotatedText(
        text=text,
        spans=view_state,
        annotation_styles={"ENT": {"color": "lightblue"}},
        on_mouse_select=on_select,
    )


App()
```

The annotations are reflected in the table below. Both views stay in sync because they share the same state (`state`).

<!-- blacken-docs:off -->

```python { .render-with-pret .code--expandable style="height: 200px;" }
# ↑ Complete the code above with the following snippet ↑
from pret import component, use_store_snapshot, use_event_callback
from metanno import Table

columns = [
    {"key": "id", "kind": "text", "name": "id", "filterable": True},
    {"key": "begin", "kind": "text", "name": "begin", "filterable": True},
    {"key": "end", "kind": "text", "name": "end", "filterable": True},
    {"key": "text", "kind": "text", "name": "text", "filterable": True},
    {"key": "label", "kind": "text", "name": "label", "filterable": True,
        "editable": True, "choices": ["ENT", "OTHER"]},
]


@component
def MyTable():
    @use_event_callback
    def on_cell_change(row_idx, col, new_value):
        view_state[row_idx][col] = new_value

    for x in state:
        x.setdefault("label", "ENT")  # Ensure all rows have a label

    view_state = use_store_snapshot(state)
    return Table(
        rows=view_state,
        columns=columns,
        auto_filter=True,
        on_cell_change=on_cell_change,
    )


MyTable()
```

<!-- blacken-docs:on -->
