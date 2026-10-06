"""
Editable todo table loaded as a recipe by the Explorer notebook workflows
"""

from metanno import DataWidgetFactory


def main(store):
    """
    Display the shared todo text so browser edits and kernel changes remain visible
    """
    return DataWidgetFactory(store).create_table_widget(
        store_key="todos",
        primary_key="id",
        fields=[{"key": "id", "kind": "text"}, {"key": "text", "kind": "text", "editable": True}],
        style={"height": "100%"},
    )
