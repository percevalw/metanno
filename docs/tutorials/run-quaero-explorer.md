# Run the Quaero Explorer

<!-- blacken-docs:off -->

Run the [Quaero Explorer demo app](/demos/quaero-data_widget_factory) and discover Metanno’s collaborative workflow: real‑time syncing, multi‑panel editing, and simple persistence.

## Prerequisites

Reuse the same environment you prepared in the **[New project tutorial](./new-project.md)**. You should already have a working Python environment with Pret, Metanno, and EDS‑NLP installed.

The script downloads the [**Quaero FrenchMed**](https://quaerofrenchmed.limsi.fr/) dataset on first run, so an Internet access is required.

Create a new file named `quaero.py` in your project and copy the contents from the official example [https://github.com/percevalw/metanno/blob/main/examples/quaero.py](https://github.com/percevalw/metanno/blob/main/examples/quaero.py).

## Run the app

```python { .hidden }
--8<-- "examples/quaero.py:imports"
```

From a terminal. The server will start at **[http://localhost:5000](http://localhost:5000)**.

```bash { data-md-color-scheme="slate" }
python quaero.py --port 5000
```

Or in JupyterLab, run the following cell:

```python
from quaero import app

view, handles = app()
view
```

## Code breakdown

Below, we break down the script.

#### 1) Load the data

We first fetch and extracts the dataset if it isn’t already present, and read the BRAT standoff annotations using EDS-NLP.
We then build two Python lists: `notes` and `entities` with the fields we’ll display and edit.

```python
--8<-- "examples/quaero.py:import-data"
```

#### 2) Check unique entity IDs

The [Table][metanno.ui.Table] component requires unique IDs for each row. We check if the entity IDs are unique and raise an error if not, or deduplicate them automatically.

```python
--8<-- "examples/quaero.py:unicity"
```

#### 3) Configure labels

We compute a stable list of labels, assign a color for each, and auto‑pick a one‑letter keyboard shortcut per label.

```python
--8<-- "examples/quaero.py:label-config"
```

#### 4) Instantiate the manager

We create a [DataWidgetFactory][metanno.recipes.data_widget_factory.DataWidgetFactory] (a ready‑to‑customize recipe). Under the hood, it composes Metanno components such as [Table][metanno.ui.Table], [AnnotatedText][metanno.ui.AnnotatedText], buttons with a bit of app logic.

```python
--8<-- "examples/quaero.py:instantiate"
```

#### 5) Build the views and define their interactions

We define the views that will be rendered in the app. Each view is a component that displays a specific part of the data.

```python
--8<-- "examples/quaero.py:render-views"
```

#### 6) Assemble everything

Panels can be resized, rearranged (drag the tab handles), or hidden by docking into another panel’s tab bar. The note panel header is customized to display the current note id.

```python
--8<-- "examples/quaero.py:layout"
```

#### 7) Render or serve

You can either **serve it** or **display it** in a notebook, following the instructions in [the previous section](#run-the-app).


!!! tip "JupyterLab Tabs"

    In notebooks, Pret layouts cannot be "mixed" with JupyterLab’s own UI system, and will always be embedded in a single JupyterLab tab. You may prefer displaying specific views in separate cells.

    Simply display the variables `notes_view`, `entities_view`, `note_text_view` (the return values of [`factory.create_table_widget`][metanno.recipes.data_widget_factory.DataWidgetFactory.create_table_widget], [`factory.create_form_widget`][metanno.recipes.data_widget_factory.DataWidgetFactory.create_form_widget] and [`factory.create_text_widget`][metanno.recipes.data_widget_factory.DataWidgetFactory.create_text_widget]) in separate cells.

<!-- blacken-docs:on -->

## Syncing, collaboration, and saving

Metanno (via Pret) can sync app state across clients and optionally persist it.

#### Live sync only (no persistence)

Pass `sync=True` when creating the app to enable real‑time collaboration without saving to disk:

```python
app = DataWidgetFactory(
    {
        "notes": notes,
        "entities": entities,
    },
    sync=True,
)
```

Open the same notebook twice or the same app URL in two tabs: edits in one tab are mirrored to the other.

#### Live sync **and** saving to a file

Provide a file path to append every change to an on‑disk log:

```python
app = DataWidgetFactory(
    {
        "notes": notes,
        "entities": entities,
    },
    sync="quaero.bin",
)
```

Changes are now saved on disk, and multiple servers/kernels can collaborate by pointing to the same file.

#### What is the saved format?

It’s a compact, binary, append‑only log of user mutations: you cannot read it directly.

To inspect it, you can use [`create_store`][pret.store.create_store] synced with the file and read current state, but the object will receive live updates as
the underlying file changes, and you risk mutating it by accident.

Prefer using the [`load_store_snapshot`][pret.store.load_store_snapshot] function to load the current state of the store as a pure Python object without subscribing to updates or risking modifying it:

```python
from pret import load_store_snapshot

data = load_store_snapshot("quaero.bin")
```

To **export** to other formats, write a small exporter from your in‑memory data (`app.data`). We recommend using [**EDS‑NLP** data connectors](https://aphp.github.io/edsnlp/latest/data/) since it supports several data formats and schemas.
