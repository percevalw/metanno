"""
AnnotatedImage example of the documentation with an inline image, its Konva renderer must match the React build
"""

import base64

from pret import component, create_store, use_event_callback, use_store_snapshot
from pret.marshal import js

from metanno import AnnotatedImage

SVG = (
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">'
    '<rect width="400" height="300" fill="#8ab"/></svg>'
)
IMAGE = "data:image/svg+xml;base64," + base64.b64encode(SVG.encode()).decode()
img_state = create_store(
    [{"id": "1", "type": "polygon", "points": [10, 10, 200, 20, 200, 200, 10, 200], "label": "OBJ", "style": "primary"}]
)
STYLES = {
    "primary": {"strokeColor": "red", "strokeWidth": 2, "fillColor": "rgba(255,0,0,0.5)"},
    "secondary": {"strokeColor": "blue", "strokeWidth": 2, "fillColor": "#0000ff80"},
}


@component
def MyImage():
    tracked_state = use_store_snapshot(img_state)
    js.konvaStyles = [annotation["style"] for annotation in tracked_state]

    @use_event_callback
    def on_click(shape_idx, modkeys):
        if shape_idx is not None:
            old_style = img_state[shape_idx].get("style", "primary")
            img_state[shape_idx]["style"] = "secondary" if old_style == "primary" else "primary"

    return AnnotatedImage(
        image=IMAGE,
        annotations=tracked_state,
        annotation_styles=STYLES,
        on_click=on_click,
        style={"height": "300px", "width": "400px"},
    )
