# Metanno

Metanno is a Python library aimed at building dynamic annotation interfaces customized
to your needs without leaving your notebook.

At the moment, Metanno focuses on textual documents with rich structured entities.
Its main goals are:

- modularity: you decide how many views of your data are needed
- customization: you can easily customize the software behavior in Python and see the changes immediately
- interactivity: all of your annotations are immediately available as Python objects as soon as you edit something

## Features

### Annotate anything

Metanno allows users to create a wide variety of annotations,
including multiline and nested span annotations with text views,
as well as document level, relational, or complex annotations with table views.

It also supports multiple data types, including hyperlinks, text, and lists, and
allows users to switch between text and table views for their annotations.

### Easy setup

Metanno is easy to install with a simple

```bash { data-md-color-scheme="slate" }
pip install metanno
```

Unlike many other alternatives, when used in JupyterLab, it does not require users to open any ports
or leave their notebook to launch a server. It also allows users to write
their own apps in Python and while automatically benefiting from the speed of client
run Javascript code with a React-based implementation.

### Interactive and customizable by design

- visualize and edit the current app state directly in Python
- update the UI in Python, execute the cell and see the results immediately
- immutable state management, any state mutation is recorded and undoable
- many event handlers to react to any user action (click, hover, type, ...)

Metanno is designed to be highly interactive and customizable, with the ability
to visualize and edit app states directly in Python and update the UI in real
time. It also offers a variety of event handlers that allow users to react to
any user action. This makes it easy to create tailored and responsive apps
UIs in JupyterLab.

## Why another annotation tool ?

The choice of annotation software must be taken into account in the design of the
annotation scheme. For example, it is challenging to annotate implicit/document-level
entities in Brat or to annotate relations on multiple lines, and impossible to handle
multiple documents at once. There are many annotation tools available
(see [Neves et al.](https://pubmed.ncbi.nlm.nih.gov/31838514/)), but most of them
are either proprietary, poorly adapted to document or multi-document annotation, require
a complex installation that is not compatible with existing remote work environments,
or are difficult to customize. Finally, the standardization of annotation levels
(mention / relation / event) is an obstacle to the development of new tasks. Given the
limitations of the existing softwares and the difficulty to cover every need with a
single static annotator, this project was initiated to provide a modular and fully
customizable annotation framework, Metanno, and address these difficulties.

## Demo

Below is a simple example of a Metanno app that allows users to annotate text spans
and visualize the annotations in a table. Just select spans of text to annotate them.
Hold the Shift (or Maj) while selecting to delete spans instead.

```python { .render-with-pret .code--expandable }
from pret import component, proxy, use_tracked, use_event_callback
from pret.ui.metanno import TextComponent

state = proxy([
    {"text": "soir", "begin": 3, "end": 7, "id": "s-3-7", "label": "ENT"},
    {"text": "Charlie", "begin": 59, "end": 66, "id": "s-59-66", "label": "ENT"},
])

text = ("Le soir, après avoir mangé sa soupe aux choux noyée "
        "d’eau, Charlie allait toujours dans la chambre de ses "
        "quatre grands-parents pour écouter leurs histoires, "
        "et pour leur souhaiter bonne nuit.\n"
        "Chacun d’eux avait plus de quatre-vingt-dix ans. Ils "
        "étaient fripés comme des pruneaux secs, ossus comme "
        "des squelettes et, toute la journée, jusqu’à l’apparition "
        "de Charlie, ils se pelotonnaient dans leur lit, deux de "
        "chaque côté, coiffés de bonnets de nuit qui leur tenaient "
        "chaud, passant le temps à ne rien faire.")


@component
def App():
    view_state = use_tracked(state)

    @use_event_callback
    def on_select(spans, mod_keys):
        if "Shift" in mod_keys:
            # Delete overlapped spans if the user holds Shift
            state[:] = [
                x
                for x in state
                if any((s['begin'] >= x['end'] or s['end'] <= x['begin']) for s in spans)
            ]
        else:
            state.extend(
                [{**s, "id": f"s-{s['begin']}-{s['end']}", "text": text[s['begin']:s['end']], "label": "ENT"} for s in spans]
            )

    return TextComponent(
        text=text,
        spans=view_state,
        annotation_styles={"ENT": {"color": "lightblue"}},
        on_mouse_select=on_select,
    )


App()
```

Observe how the annotations are updated in the table below. The two views are synchronized because they share the same state (see the `state` variable in the code).


```python { .render-with-pret .code--expandable style="height: 200px;" }
# ↑ Complete the code above with the following snippet ↑
from pret import component, use_tracked, use_event_callback
from pret.ui.metanno import TableComponent

columns = [
    {"key": "id", "kind": "text", "name": "id", "filterable": True},
    {"key": "begin", "kind": "text", "name": "begin", "filterable": True},
    {"key": "end", "kind": "text", "name": "end", "filterable": True},
    {"key": "text", "kind": "text", "name": "text", "filterable": True},
    {"key": "label", "kind": "text", "name": "label", "filterable": True, "editable": True, "choices": ["ENT", "OTHER"]},
]

@component
def MyTable():
    @use_event_callback
    def on_cell_change(row_idx, col, new_value):
        view_state[row_idx][col] = new_value

    for x in state:
        x.setdefault("label", "ENT")  # Ensure all rows have a label

    view_state = use_tracked(state)
    return TableComponent(
        rows=view_state,
        columns=columns,
        auto_filter=True,
        on_cell_change=on_cell_change,
    )

MyTable()
```
