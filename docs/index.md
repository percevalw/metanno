<h1 style="text-align: center" markdown>
![Metanno](/assets/images/logo.svg){ width="250px" }
</h1>

Metanno is a Python library built on top of the [Pret framework](https://github.com/percevalw/pret) for building dynamic, customizable annotation interfaces.

Who is it for? Research groups, clinical NLP and biomedical teams, data labeling squads, and anyone who wants custom and interactive annotation tools without wrestling with JavaScript.

Metanno currently focuses on text and images with richly structured entities. Its goals are:

- **Modularity:** show your data from multiple synchronized angles. For example, highlight entities over text or images while editing the same rows in a table.
- **Python‑first UI:** write the entire app in Python; it renders to a fast React UI under the hood.
- **Interactivity:** handle annotations as plain Python objects at any time, so you can create, inspect, and transform them programmatically.

## Features

### Annotate anything

In addition to the Pret ecosystem component suite, Metanno provides components for common annotation views:

- **[AnnotatedText][pret.ui.metanno.AnnotatedText]**: display text with highlighted, nestable spans
- **[AnnotatedImage][pret.ui.metanno.AnnotatedImage]**: draw shapes (boxes, polygons, etc.) over images.
- **[Table][pret.ui.metanno.Table]**: an editable, filterable spreadsheet‑style grid for inspecting and editing annotations.

You can compose these views of the same underlying annotations to get a better grasp of the data you are annotating or inspecting.

### Run it your way

Use Metanno in two modes:

- **Standalone app:** run a server and use it in your browser.
- **JupyterLab widgets:** embed components directly in notebooks, with no extra ports or separate server process.

Develop and test in a notebook. If you prefer, you can also run it as a standalone app.

### Easy setup

```bash { data-md-color-scheme="slate" }
pip install metanno==1.0.0-beta.2
```

To use it with Jupyter, if you install the library in a custom environment (conda, venv, or other),
you will likely need to tell Jupyter where to find the front-end files.
You can do this by running the following command (only once):

```bash
pret update-jupyter-config --apply
```

Unlike other alternatives, Metanno requires no additional ports and no separate server process when used in JupyterLab. Write your app in Python and benefit from a fast React front end under the hood.

### Interactive and customizable by design

- Inspect and edit application state directly from Python.
- Update the UI from Python; execute a notebook cell to see changes immediately.
- Register event handlers for clicks, hovers, keystrokes, and more.

## Why another annotation software?

Tool choice shapes both the annotation scheme and the workflow. In many out‑of‑the‑box tools, tasks like annotating implicit or document‑level entities, working across multiple documents at once, or coordinating multiple views can be difficult or unsupported. There are many available solutions (see [Neves et al.](https://pubmed.ncbi.nlm.nih.gov/31838514/)). However,  most of these are either proprietary, poorly adapted to document or multi-document annotation, require a complex installation that is not compatible with existing strict remote computing environments, or are difficult to customize.

Metanno takes a different approach: a modular, Python‑first framework that adapts to your schema and to your annotation process, instead of forcing you into fixed layers or rigid UIs.

## Demo

See the [demo apps](/demos), listed below.

--8<-- "docs/demos/index.md:demos"

## Tutorials

Check out the [tutorials](/tutorials) to get started with Metanno !

--8<-- "docs/tutorials/index.md:tutorials"

## Small example

Below is a small example that lets you annotate text spans and view them in a synchronized table. Select spans to add them; hold **Shift** (also labeled **Maj** on some keyboards) while selecting to delete overlapping spans.

```python { .render-with-pret .code--expandable }
from pret import component, create_store, use_store_snapshot, use_event_callback
from pret.ui.metanno import AnnotatedText

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
from pret.ui.metanno import Table

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
