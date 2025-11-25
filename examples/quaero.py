# <!--8<-- [start:imports]
from collections import Counter
from pathlib import Path

import edsnlp
from pret import component, create_store, use_ref, use_store_snapshot

# Pending deprecation, prefer pret.react
from pret.react import div
from pret_markdown import Markdown
from pret_simple_dock import Layout, Panel

from metanno.recipes.explorer import DatasetExplorerWidgetFactory

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


def app(save_path=None, deduplicate=False):
    # Load the data
    # --8<-- [start:import-data]
    download_quaero()

    data = edsnlp.data.read_standoff(
        DOWNLOAD_DIR / "QUAERO_FrenchMed/corpus",
        span_setter="entities",
        notes_as_span_attribute="cui",
    )
    notes = [
        {
            "note_id": str(doc._.note_id),
            "note_text": doc.text,
            "seen": False,
        }
        for doc in data
    ]
    entities = [
        {
            "id": f"#{doc._.note_id}-{e.start_char}-{e.end_char}-{e.label_}",
            "note_id": str(doc._.note_id),
            "text": str(e),
            "begin": e.start_char,
            "end": e.end_char,
            "label": e.label_,
            "concept": e._.cui,
        }
        for doc in data
        for e in sorted(doc.spans["entities"])
    ]
    # --8<-- [end:import-data]

    # Check for unicity of entity IDs
    # --8<-- [start:unicity]
    if deduplicate:
        entities = list({v["id"]: v for v in entities}.values())
    else:
        ctr = Counter(e["id"] for e in entities)
        if any(count > 1 for count in ctr.values()):
            raise ValueError(
                "Duplicate IDs found in the dataset: "
                + ", ".join(f"{i} (x{n})" for i, n in ctr.items() if n > 1)
            )
    # --8<-- [end:unicity]

    # Compute shortcuts and colors for labels
    # --8<-- [start:label-config]
    all_labels = list(dict.fromkeys(e["label"] for e in entities))
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
    # --8<-- [end:label-config]

    # --8<-- [start:instantiate]
    factory = DatasetExplorerWidgetFactory(
        {
            "notes": notes,
            "entities": entities,
        },
        sync=save_path,
    )
    # --8<-- [end:instantiate]

    # Interaction Logic
    # --8<-- [start:render-views]
    # Create handles to control the widgets imperatively
    notes_handle = use_ref()
    entities_handle = use_ref()
    note_text_handle = use_ref()

    # State for the header
    top_level_state = create_store({"note_id": notes[0]["note_id"] if notes else None})

    def on_note_selected_in_table(note_id, row_idx, col, mode, cause):
        # When user clicks a note row:
        # Update NoteHeader (we could also use a handle with setNoteId in NoteHeader)
        top_level_state["note_id"] = note_id
        # Update text view
        note_text_handle.current.set_document_by_id(note_id)
        # Filter entity table to show only this note's entities
        entities_handle.current.set_filter("note_id", str(note_id))

    def on_entity_selected_in_table(entity_id, row_idx, col, mode, cause):
        # When user clicks an entity row
        note_text_handle.current.scroll_to_span(entity_id)

    def on_change_text_id(note_id):
        # When user uses arrow keys in text view:
        # Update NoteHeader (we could also use a handle with setNoteId in NoteHeader)
        top_level_state["note_id"] = note_id
        # Sync the entities table
        entities_handle.current.set_filter("note_id", str(note_id))
        # Scroll to note in note view
        notes_handle.current.scroll_to_key(note_id)
        # Set highlighted note in notes table
        notes_handle.current.set_highlighted([note_id])

    def on_hover_spans(span_ids):
        # When user hovers spans in text view:
        # Highlight corresponding entities in entity table
        entities_handle.current.set_highlighted(span_ids)

    def on_hover_entity_row(span_idx, span_id, mod_keys):
        # When user hovers an entity row in entity table:
        # Highlight corresponding span in text view
        note_text_handle.current.set_highlighted_spans([span_id])

    notes_view = factory.create_table_widget(
        handle=notes_handle,
        on_position_change=on_note_selected_in_table,
        store_key="notes",
        pkey_column="note_id",
        first_columns=["note_id", "seen", "note_text"],
        id_columns=["note_id"],
        editable_columns=["seen"],
        hidden_columns=[],
        style={"--min-notebook-height": "300px"},
    )

    entities_view = factory.create_table_widget(
        handle=entities_handle,
        on_position_change=on_entity_selected_in_table,
        on_mouse_hover_row=on_hover_entity_row,
        store_key="entities",
        pkey_column="id",
        first_columns=["id", "note_id", "text", "label", "concept"],
        id_columns=["id", "note_id"],
        editable_columns=["label", "concept"],
        categorical_columns=["label", "concept"],
        style={"--min-notebook-height": "300px"},
    )

    note_text_view = factory.create_text_widget(
        handle=note_text_handle,
        on_change_text_id=on_change_text_id,
        on_hover_spans=on_hover_spans,
        store_text_key="notes",
        text_column="note_text",
        text_pkey_column="note_id",
        # Where to look for spans data in the app data
        store_spans_key="entities",
        spans_pkey_column="id",
        style={"--min-notebook-height": "300px"},
        labels=labels_config,
    )
    # --8<-- [end:render-views]

    # --8<-- [start:layout]
    @component
    def NoteHeader():
        note_id = use_store_snapshot(top_level_state)["note_id"]
        return f"Note ({note_id})" if note_id else "Note"

    layout = div(
        Layout(
            Panel(div(Markdown(DESC), style={"margin": "10px"}), key="Description"),
            Panel(notes_view, key="Notes"),
            Panel(entities_view, key="Entities"),
            Panel(note_text_view, header=NoteHeader(), key="Note Text"),
            # Describe how the panels should be arranged by default
            default_config={
                "kind": "row",
                "children": ["Description", ["Notes", "Entities"], "Note Text"],
            },
            collapse_tabs_on_mobile=["Note Text", "Description", "Notes", "Entities"],
        ),
        style={
            "background": "var(--joy-palette-background-level2, #f0f0f0)",
            "width": "100%",
            "height": "100%",
            "minHeight": "300px",
            "--sd-background-color": "transparent",
        },
    )
    return (
        # Return the pret component
        layout,
        # and expose handles for further manipulation if needed
        {
            "notes": notes_handle,
            "entities": entities_handle,
            "note_text": note_text_handle,
        },
    )
    # --8<-- [end:layout]


if __name__ == "__main__":
    import argparse

    from pret import run

    parser = argparse.ArgumentParser(description="Quaero dataset explorer.")
    (
        parser.add_argument(
            "--port",
            type=int,
            default=5000,
            help="Port to run the app on (default: 5000)",
        ),
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
    run(app(save_path=save_path, deduplicate=True)[0], port=port)
