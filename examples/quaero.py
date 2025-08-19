from collections import Counter
from pathlib import Path

import edsnlp

from metanno.recipes.explorer import DatasetApp
from pret import component, use_store_snapshot
from pret.ui.markdown import Markdown
from pret.ui.react import div
from pret.ui.simple_dock import Layout, Panel

PALETTE = [
    "rgb(255,200,206)",
    "rgb(210,236,247)",
    "rgb(211,242,206)",
    "rgb(208,245,229)",
    "rgb(208,210,249)",
    "rgb(232,205,251)",
    "rgb(253,203,241)",
    "rgb(252,221,201)",
    "rgb(249,243,203)",
    "rgb(230,246,204)",
]

DESCRIPTION = """
# Quaero Dataset Explorer

Explore and annotate the [Quaero dataset](https://quaerofrenchmed.limsi.fr/).

This app features a simple interface, built with
[Metanno](https://github.com/percevalw/metanno),
on top of [Pret](https://github.com/percevalw/pret), to view and edit notes and entities
in the dataset.
It contains three panels:

- one table view for notes, showing the note ID, text, and a mutable column to mark
  notes as seen or not.
- one table view for entities, showing the entity ID, note ID, text, label, concept, etc
- one text viewer for the note text, with the entities highlighted and editable.

You can click on notes or entities in the tables to focus on the corresponding text in
the viewer. Use the filters in the tables to narrow down the displayed elements.

You can resize the panels, or click and move their handle to rearrange the layout as you
like. You can also "hide" them by moving their handle in the tab bar of another panel.

Happy exploring!
"""

URL = "https://quaerofrenchmed.limsi.fr/QUAERO_FrenchMed_brat.zip"
DOWNLOAD_DIR = Path("./downloaded")


def download_quaero():
    """
    If the Quaero dataset is not already downloaded,
    download the Quaero dataset from the official URL and extract it
    in the QUAERO_FrenchMed_brat directory.
    """
    import os
    import tempfile
    from zipfile import ZipFile

    import requests

    if os.path.exists(DOWNLOAD_DIR / "QUAERO_FrenchMed"):
        print(f"Quaero dataset already exists in {DOWNLOAD_DIR / 'QUAERO_FrenchMed'}")
        return
    print("Downloading Quaero dataset...")
    response = requests.get(URL)
    if response.status_code != 200:
        raise RuntimeError(f"Failed to download Quaero dataset: {response.status_code}")
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        temp_file.write(response.content)
        temp_file_path = temp_file.name
    print(f"Extracting Quaero dataset in {DOWNLOAD_DIR}...")
    with ZipFile(temp_file_path, "r") as zip_ref:
        zip_ref.extractall(DOWNLOAD_DIR)


def app(deduplicate=False):
    # Load the data
    download_quaero()

    data = edsnlp.data.read_standoff(
        DOWNLOAD_DIR / "QUAERO_FrenchMed/corpus",
        span_setter="entities",
        notes_as_span_attribute="cui",
    )
    notes = [
        {
            "note_id": doc._.note_id,
            "note_text": doc.text,
            "seen": False,
        }
        for doc in data
    ]
    entities = [
        {
            "id": f"#-{doc._.note_id}-{e.start_char}-{e.end_char}-{e.label_}",
            "note_id": doc._.note_id,
            "text": str(e),
            "begin": e.start_char,
            "end": e.end_char,
            "label": e.label_,
            "concept": e._.cui,
        }
        for doc in data
        for e in sorted(doc.spans["entities"])
    ]

    # Check for unicity of entity IDs
    if deduplicate:
        entities = list({v["id"]: v for v in entities}.values())
    else:
        counter = Counter(e["id"] for e in entities)
        if any(count > 1 for count in counter.values()):
            raise ValueError(
                "Duplicate entity IDs found in the dataset: {}".format(
                    ", ".join(
                        f"{id_} ({count} times)"
                        for id_, count in counter.items()
                        if count > 1
                    )
                )
            )

    # Compute shortcuts and colors for labels
    all_labels = list(dict.fromkeys(e["label"] for e in entities))
    shortcuts = set()
    labels_config = {}
    for i, label in enumerate(all_labels):
        labels_config[label] = {}
        if i < len(PALETTE):
            labels_config[label]["color"] = PALETTE[i]
        letter = next(c for c in label.lower() if c not in shortcuts)
        shortcuts.add(letter)
        labels_config[label]["shortcut"] = letter

    app = DatasetApp(
        {
            "notes": notes,
            "entities": entities,
        },
        sync=None,
    )

    # Small trick to expose app state and data without requiring to
    # embed "app" into the NoteHeader function scope.
    app_state = app.state
    app_data = app.data

    @component
    def NoteHeader():
        doc_idx = use_store_snapshot(app_state["notes"])["last_idx"]

        if doc_idx is None:
            return "Note"
        return f"Note ({app_data['notes'][doc_idx]['note_id']})"

    # Render the main layout with the tables and text viewer
    return div(
        Layout(
            Panel(
                div(
                    Markdown(DESCRIPTION),
                    style={"margin": "10px"},
                    class_name="markdown-body",
                ),
                key="Description",
            ),
            Panel(
                app.render_table(
                    name="notes",
                    path="notes",
                    pkey="note_id",
                    id_columns=["note_id"],
                    first_columns=["note_id", "seen", "note_text"],
                    # editable_columns=["note_type"],
                    # categorical_columns=["note_type"],
                    # hidden_columns=["entities"],
                    style={"--min-notebook-height": "300px"},
                ),
                header="Notes",
                key="notes",
            ),
            Panel(
                app.render_table(
                    name="entities",
                    path="entities",
                    pkey="id",
                    first_columns=[
                        "id",
                        "note_id",
                        "text",
                        "label",
                        "concept",
                        "begin",
                        "end",
                    ],
                    id_columns=["id", "note_id"],
                    editable_columns=["label", "seen", "concept"],
                    categorical_columns=["label", "concept"],
                    style={"--min-notebook-height": "300px"},
                ),
                header="Entities",
                key="entities",
            ),
            Panel(
                app.render_text(
                    name="note_text",
                    text_name="notes",
                    text_column="note_text",
                    text_pkey="note_id",
                    spans_name="entities",
                    spans_pkey="id",
                    style={"--min-notebook-height": "300px"},
                    labels=labels_config,
                ),
                header=NoteHeader(),
                key="note_text",
            ),
            wrap_dnd=True,
            default_config={
                "kind": "row",
                "children": [
                    "Description",
                    {"children": ["notes", "entities"]},
                    "note_text",
                ],
            },
        ),
        style={
            "background": "var(--joy-palette-background-level2, #f0f0f0)",
            "width": "100%",
            "height": "100%",
            "minHeight": "300px",
            "--sd-background-color": "transparent",
        },
    )


if __name__ == "__main__":
    import argparse

    from pret import run

    parser = argparse.ArgumentParser(description="Quaero dataset explorer.")
    parser.add_argument(
        "--port", type=int, default=5000, help="Port to run the app on (default: 5000)"
    )
    args = parser.parse_args()
    port = args.port
    run(app(deduplicate=True), bundle="federated", port=port)
