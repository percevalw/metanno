# <!--8<-- [start:imports]
import uuid
from pathlib import Path

import edsnlp
from pret import use_ref
from pret.hooks import RefType
from pret.react import div
from pret_joy import Box, Divider, Stack
from pret_markdown import Markdown
from pret_simple_dock import Layout, Panel

from metanno.recipes.data_widget_factory import (
    DataWidgetFactory,
    FormWidgetHandle,
    TableWidgetHandle,
    TextWidgetHandle,
    infer_fields,
)

# <--8<-- [end:imports]

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

DESC = """
# Quaero Dataset Explorer

Explore and annotate the [Quaero dataset](https://quaerofrenchmed.limsi.fr/).

This app features a simple interface, built with
[Metanno](https://github.com/percevalw/metanno),
on top of [Pret](https://github.com/percevalw/pret), to view and edit notes and entities
in the dataset.
It contains three panels, that you can rearrange as you like:

- one table view for notes, showing the note ID, text, and a mutable column to mark
  notes as seen or not.
- one table view for entities, showing the entity ID, note ID, text, label, concept, etc
- one text viewer for the note text, with the entities highlighted and editable.
- one view for the note metadata displayed as a form (a fake field "note_kind" was added
  for demo purposes)

Visit the [tutorial](https://percevalw.github.io/metanno/latest/tutorials/run-quaero-explorer) to
learn how to build such an app yourself.

Happy exploring!
"""

URL = "https://quaerofrenchmed.limsi.fr/QUAERO_FrenchMed_brat.zip"
DOWNLOAD_DIR = Path.home() / ".cache"


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


def build_data():
    # --8<-- [start:import-data]
    download_quaero()

    data = edsnlp.data.read_standoff(
        DOWNLOAD_DIR / "QUAERO_FrenchMed/corpus",
        span_setter="entities",
        notes_as_span_attribute="cui",
    )
    notes = []
    for idx, doc in enumerate(data):
        notes.append(
            {
                "note_id": str(doc._.note_id),
                "note_text": doc.text,
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
                    }
                    for e in sorted(doc.spans["entities"])
                ],
            }
        )
    # --8<-- [end:import-data]
    return {"notes": notes}


def app(save_path=None, deduplicate=False):
    factory = DataWidgetFactory(
        # Load the data if no serialized store exists already,
        # otherwise load from the store
        # This is why we pass a function
        data=build_data,
        sync=save_path,
    )
    data = factory.data

    # Compute shortcuts and colors for labels
    all_labels = list(dict.fromkeys(e["label"] for n in data["notes"] for e in n["entities"]))
    shortcuts = set()
    labels_config = {}
    for i, lab in enumerate(all_labels):
        labels_config[lab] = {}
        if i < len(PALETTE):
            labels_config[lab]["color"] = PALETTE[i]
        letter = next((c for c in lab.lower() if c not in shortcuts), None)
        if letter:
            shortcuts.add(letter)
            labels_config[lab]["shortcut"] = letter

    # Interaction Logic
    # --8<-- [start:render-views]
    # Create handles to control the widgets imperatively

    # View the documents as a table
    notes_table_handle: RefType[TableWidgetHandle] = use_ref()
    notes_view = factory.create_table_widget(
        store_key="notes",
        primary_key="note_id",
        fields=infer_fields(
            data["notes"],
            visible_keys=["note_id", "seen", "note_text", "note_kind"],
            id_keys=["note_id"],
            editable_keys=["seen", "note_kind"],
            categorical_keys=["note_kind"],
        ),
        style={"--min-notebook-height": "300px"},
        handle=notes_table_handle,
    )

    # Show the selected note as a form
    note_form_handle: RefType[FormWidgetHandle] = use_ref()
    note_form_view = factory.create_form_widget(
        store_key="notes",
        primary_key="note_id",
        # Instead of using infer_fields, we can also define the
        # fields manually which can actually be simpler
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
        ],
        add_navigation_buttons=True,
        style={"--min-notebook-height": "300px", "margin": "10px"},
        handle=note_form_handle,
    )

    # View the entities as a table
    ents_table_handle: RefType[TableWidgetHandle] = use_ref()
    entities_view = factory.create_table_widget(
        store_key="notes.entities",
        primary_key="id",
        fields=infer_fields(
            [e for n in data["notes"] for e in n["entities"]],
            visible_keys=["id", "text", "label", "concept"],
            id_keys=["id"],
            editable_keys=["label", "concept"],
            categorical_keys=["label", "concept"],
        ),
        style={"--min-notebook-height": "300px"},
        handle=ents_table_handle,
    )

    # View and edit the note text with highlighted entities
    # It returns both the text view and a view for the entity being edited
    note_text_handle: RefType[TextWidgetHandle] = use_ref()
    note_text_view, ent_view = factory.create_text_widget(
        store_text_key="notes",
        # Where to look for spans data in the app data
        store_spans_key="notes.entities",
        # Fields that will be displayed in the toolbar
        fields=infer_fields(
            [e for n in data["notes"] for e in n["entities"]],
            visible_keys=["label", "concept"],
            editable_keys=["label", "concept"],
            categorical_keys=["label", "concept"],
        ),
        text_key="note_text",
        text_primary_key="note_id",
        spans_primary_key="id",
        labels=labels_config,
        style={"--min-notebook-height": "300px"},
    )

    # Create a header for the note text panel
    note_header = factory.create_selected_field_view(
        store_key="notes",
        shown_key="note_id",
        fallback="Note",
    )
    # --8<-- [end:render-views]

    # --8<-- [start:layout]
    layout = Stack(
        Layout(
            Panel(div(Markdown(DESC), style={"margin": "10px"}), key="Description"),
            Panel(notes_view, key="Notes"),
            Panel(entities_view, key="Entities"),
            Panel(note_text_view, key="Note Text", header=note_header),
            Panel(Stack(note_form_view, Divider(), Box(ent_view, sx={"m": "10px"})), key="Info"),
            # Describe how the panels should be arranged by default
            default_config={
                "kind": "row",
                "children": [
                    {
                        "kind": "column",
                        "size": 25,
                        "children": [
                            {"tabs": ["Description"], "size": 40},
                            {"tabs": ["Notes"], "size": 30},
                        ],
                    },
                    {"tabs": ["Note Text"], "size": 50},
                    {
                        "kind": "column",
                        "size": 25,
                        "children": [
                            {"tabs": ["Info"], "size": 65},
                            {"tabs": ["Entities"], "size": 35},
                        ],
                    },
                ],
            },
            collapse_tabs_on_mobile=[
                "Note Text",
                "Description",
                "Notes",
                "Note Form",
                "Entities",
            ],
        ),
        factory.create_connection_status_bar(),
        style={
            "background": "var(--joy-palette-background-level2, #f0f0f0)",
            "width": "100%",
            "height": "100%",
            "minHeight": "300px",
            "--sd-background-color": "transparent",
        },
    )
    # Display `layout` in a cell to see the app
    # --8<-- [end:layout]

    return (
        # Return the pret component
        layout,
        # and expose handles for further manipulation if needed
        {
            "notes": notes_table_handle,
            "entities": ents_table_handle,
            "note_text": note_text_handle,
            "note_form": note_form_handle,
        },
    )


if __name__ == "__main__":
    import argparse

    from pret import run

    parser = argparse.ArgumentParser(description="Quaero dataset explorer.")
    parser.add_argument(
        "--port",
        type=int,
        default=5000,
        help="Port to run the app on (default: 5000)",
    )
    parser.add_argument(
        "--host",
        type=str,
        default=None,
        help="Host to run the app on (default: None, localhost). "
        "Use '0.0.0.0' to make the app publicly available.",
    )
    parser.add_argument(
        "--save-path",
        type=str,
        default=None,
        help="Path to save the app state (default: None, no saving)",
    )
    args = parser.parse_args()
    port = args.port
    save_path = args.save_path
    host = args.host
    run(app(save_path=True, deduplicate=True)[0], port=port, host=host)
