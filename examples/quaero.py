import uuid
from pathlib import Path

import edsnlp
from pret import DataFrame, use_ref
from pret.hooks import RefType
from pret.react import div
from pret_joy import Box, Divider, Stack
from pret_markdown import Markdown
from pret_simple_dock import Layout, Panel

from metanno.recipes.data_widget_factory import (
    DataRelation,
    DataWidgetFactory,
    FormWidgetHandle,
    TableWidgetHandle,
    TextWidgetHandle,
)

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
  for demo purposes, and only applied to EMEA notes)

Visit the [tutorial](https://percevalw.github.io/metanno/latest/tutorials/design-your-view/) to
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
    """
    Read the Quaero notes and their entities as two tables linked by note_id
    """
    download_quaero()
    docs = list(
        edsnlp.data.read_standoff(
            DOWNLOAD_DIR / "QUAERO_FrenchMed/corpus",
            span_setter="entities",
            notes_as_span_attribute="cui",
        )
    )
    notes = edsnlp.data.from_iterable(docs).to_pandas(converter="omop")[["note_id", "note_text"]]
    # A demo field, only filled for EMEA notes
    emea = notes["note_id"].str.contains("EMEA")
    notes["note_kind"] = ""
    notes.loc[emea, "note_kind"] = ["interesting" if idx % 2 == 0 else "very interesting" for idx in notes.index[emea]]
    notes["seen"] = False
    entities = (
        edsnlp.data.from_iterable(docs)
        .to_pandas(converter="ents", span_getter="entities", span_attributes={"cui": "concept"})
        .rename(columns={"start": "begin", "lexical_variant": "text"})
        .drop(columns="span_type")
    )
    entities["id"] = [f"#{uuid.uuid4()}" for _ in range(len(entities))]
    return {"notes": DataFrame(notes), "entities": DataFrame(entities)}


def app(save_path=None, deduplicate=False):
    factory = DataWidgetFactory(
        # Load the data if no serialized store exists already,
        # otherwise load from the store
        # This is why we pass a function
        data=build_data,
        sync=save_path,
        # Selecting a note shows its entities
        relations=[DataRelation("notes", "entities", on="note_id")],
    )

    # Compute shortcuts and colors for labels
    all_labels = list(dict.fromkeys(factory.data["entities"].materialize()["label"].to_pylist()))
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
    # Create handles to control the widgets imperatively

    def make_note_kind_options(note):
        if "EMEA" in note["note_id"]:
            return ["interesting", "very interesting"]
        else:
            return []

    # View the documents as a table
    # fmt: off
    notes_table_handle: RefType[TableWidgetHandle] = use_ref()
    notes_view = factory.create_table_widget(
        store_key="notes",
        primary_key="note_id",
        fields=[  # type: ignore
            {"key": "note_id", "name": "note_id", "kind": "text", "filterable": True},
            {"key": "note_text", "name": "note_text", "kind": "text", "editable": False, "filterable": True},  # noqa: E501
            {"key": "note_kind", "name": "note_kind", "kind": "text", "editable": True, "options": make_note_kind_options, "filterable": True},  # noqa: E501
            {"key": "seen", "name": "seen", "kind": "boolean", "editable": True, "filterable": True},  # noqa: E501
        ],
        handle=notes_table_handle,
    )
    # fmt: on

    # Show the selected note as a form
    # fmt: off
    note_form_handle: RefType[FormWidgetHandle] = use_ref()
    note_form_view = factory.create_form_widget(
        store_key="notes",
        primary_key="note_id",
        fields=[  # type: ignore
            {"key": "note_id", "kind": "text"},
            {"key": "note_kind", "kind": "radio", "editable": True, "options": make_note_kind_options, "filterable": True},  # noqa: E501
            {"key": "seen", "kind": "boolean", "editable": True},
        ],
        add_navigation_buttons=True,
        style={"margin": "10px"},
        handle=note_form_handle,
    )
    # fmt: on

    # View the entities as a table
    ents_table_handle: RefType[TableWidgetHandle] = use_ref()
    entities_view = factory.create_table_widget(
        store_key="entities",
        primary_key="id",
        fields=[
            {"key": "id", "kind": "text"},
            {"key": "text", "kind": "text"},
            {"key": "label", "kind": "select", "editable": True, "options": all_labels},
            {"key": "concept", "kind": "text", "editable": True},
        ],
        handle=ents_table_handle,
    )

    # View and edit the note text with highlighted entities
    # It returns both the text view and a view for the entity being edited
    note_text_handle: RefType[TextWidgetHandle] = use_ref()
    note_text_view, ent_view = factory.create_text_widget(
        store_text_key="notes",
        # Where to look for spans data in the app data
        store_spans_key="entities",
        # Fields that will be displayed in the toolbar
        fields=[
            {"key": "label", "kind": "select", "editable": True, "options": all_labels},
            {"key": "concept", "kind": "text", "editable": True},
        ],
        text_key="note_text",
        text_primary_key="note_id",
        spans_primary_key="id",
        labels=labels_config,
    )

    # Create a header for the note text panel
    note_header = factory.create_selected_field_view(
        store_key="notes",
        shown_key="note_id",
        fallback="Note",
    )

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
        factory.create_status_bar(),
        style={
            "background": "var(--joy-palette-background-level2, #f0f0f0)",
            "width": "100%",
            "height": "100%",
            "minHeight": "300px",
            "--sd-background-color": "transparent",
        },
    )
    # Display `layout` in a cell to see the app

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
        help="Host to run the app on (default: None, localhost). Use '0.0.0.0' to make the app publicly available.",
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
    run(app(save_path=save_path, deduplicate=True)[0], port=port, host=host)
