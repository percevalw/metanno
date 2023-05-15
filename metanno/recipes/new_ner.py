from typing import List

from metanno.view import View, kernel_only, frontend_only, get_idx
from state import State
from types import Layout, TextSpan, ColumnType

"""
Philosophy:
- different components because different kind of data to view
- these components need to share some data to display: single state per app

- these components must render the data in a customizable fashion: make the render (or select_editor_state func) editable
- this function must be writable in Python:  
  -> transpile the code

- the components must be able to execute some callbacks when the user performs certain actions:
  -> make some callbacks, writable in Python

- should we transpile and send these callbacks to the browser or keep them in the kernel and perform rpc ?
  -> send to the browser for fast execution (and we already send some code for rendering so why not ?)

- some functions on the browser might want to execute functions in the kernel
  -> allow rpc to the kernel

- the functions might start on the browser, make a quick state change and defer to the kernel the rest of the computation
  -> TODO: how to transmit the partial state changes to the kernel ? 
"""

"""
state -> syncrhonisé
Pour afficher un composant, il faut créer une View.
Pourquoi pas un composant React directement ?
Trop complexe, mieux vaut optimiser ça en amont. On prefere passer
par render(layout: Layout): ...
Comme on doit créer une View, il faut des events handlers + function render.
Pour que ça aille vite, on transpile. 
Comme executé en JS, kernel Python non accessible nativement, on synchronise
un store/state.
Mais ça ne suffit pas, comment appeler une fonction depuis JS


OU ALORS

state = State()

@transpile
def handle_key_press(key):
    state["key"] = key

@widgetify
def render_text(layout):
    layout.truc(..., handler=handle_key_press)
    return layout

On capture dans renderable le contexte: state et autres trucs necessaires

@widgetify
class Widget:
    def __init__(self, state):
        self.state = state

    def __call__(self, layout):
        pass

widget = Widget(state)

1. inspecter __call__ (classe ou fonction)
2. recuperer contexte (inspect, ...) avec bound vars comme self
3. 

Pour transpiler un widget, on le "pickle":
-> code de la fonction ou de la classe est transpilé
-> state de la classe est serialisé le cas échéant
-> variables de closures sont évaluées, puis serialisées

Serialisation:
-> builtins: json
-> fonctions: proxy

"""


class TextView():
    pass


class NERMainApp:
    def __init__(self, data, suggester, scheme):
        super().__init__()

        self.suggester = suggester
        self.data = data

        docs = self.data.load()

        self.state = State({
            # Data specific state
            "doc_id": docs[0]["id"],
            "docs": docs,

            # Styles
            # "scheme": scheme,

            # Editor specific state
            "mouse_selection": [],
            "highlighted": [],
            "selected": [],
            "scheme": scheme,
            "entities_filters": {},
            # "entities_subset": list(range(len(docs[0]["entities"]))),
            "styles": {
                field["name"]: {"color": field["color"], "alpha": 0.8}
                for field in scheme["labels"]
            },
            "buttons": (
                [
                    {
                        "type": "button",
                        "key": "suggest",
                        "label": "Suggest",
                        "annotation_kind": None,
                        # "secondary": None,
                        "color": "white",
                    },
                    *(
                        {
                            "type": "button",
                            "key": field["key"],
                            "label": field["name"],
                            "annotation_kind": anno_type,
                            "secondary": field["key"],
                            **({
                                   "color": field["color"],
                               } if field.get("color", None) else {})
                        }
                        for anno_type in ("labels", "attributes")
                        for field in scheme[anno_type]
                        if field.get("key", None) is not None
                    )
                ]
            )
        }, on_change=self.on_state_change)

        self.text_view = NERTextView(self.state)
        self.entities_view = NEREntitiesView(self.state)
        self.docs_view = NERDocsView(self.state)

    def change_doc(self, key):
        if key == self.state["doc_id"]:
            return

        self.state["doc_id"] = key
        self.state["mouse_selection"] = []
        self.state["highlighted"] = []
        self.state["selected"] = []

    def on_state_change(self, state, old_state, patches):
        if "docs" in old_state and not (state["docs"] is old_state.get("docs", None)):
            self.data.save(state["docs"])


class NERTextView(View):
    def __init__(self, state, view_id, detach):
        super().__init__(state, view_id, detach=detach)

        self.suggester = ...

    def serialize_dict(self):
        self.__dict__

    def annotate(self, key, spans):
        def has_overlap(x, y):
            return not (x['end'] <= y['begin'] or y['end'] <= x['begin'])

        doc_idx = get_idx(self.state["docs"], self.state["doc_id"])
        doc = self.state["docs"][doc_idx]

        if key == " ":
            first_selection = self.state["mouse_selection"][0]
            term = doc["text"][first_selection["begin"]:first_selection["end"]]
            next_occurrence = doc["text"].find(term, self.state["mouse_selection"][len(self.state["mouse_selection"]) - 1]["end"])
            if next_occurrence > 0:
                self.state["mouse_selection"].append({"begin": next_occurrence, "end": next_occurrence + len(term)})
        elif key == "Backspace":
            doc["entities"] = [
                span for span in doc["entities"]
                if not any(has_overlap(span, mouse_span) for mouse_span in spans)
            ]
        elif key == "suggest":
            self.info(str(self.suggest()))
        elif len(spans):
            new_spans = []
            for button in self.state["buttons"]:
                if button['type'] == 'button' and button["key"] == key:
                    if button["annotation_kind"] == "labels":
                        for span in spans:
                            new_spans.append({
                                "begin": span["begin"],
                                "end": span["end"],
                                "label": button["label"],
                                "id": max(entity['id'] for entity in doc["entities"]) + 1 if len(doc["entities"]) else 0,
                            })
                    if button["annotation_kind"] == "attributes" and button["key"] == key:
                        is_true = None
                        for span in doc["entities"]:
                            if any(has_overlap(span, mouse_span) for mouse_span in spans):
                                if is_true is None:
                                    is_true = span[button["label"]]
                                span[button["label"]] = not is_true
                if key == " ":
                    pass
            if not len(new_spans):
                return
            doc["entities"].extend(new_spans)
        self.state["mouse_selection"] = []

    def handle_key_press(self, key: str, modkeys: List[str], spans: List[TextSpan]):
        self.annotate(key, spans)

    def handle_button_press(self, button_idx, selections):
        self.annotate(self.state["buttons"][button_idx]["key"], selections)

    def handle_mouse_select(self, modkeys, spans):
        if "Shift" in modkeys:
            self.state["mouse_selection"].extend(spans)
        else:
            self.state["mouse_selection"] = spans

    def handle_click_span(self, span_id, modkeys):
        if "Shift" in modkeys:
            if span_id in self.state['selected']:
                self.state['selected'].remove(span_id)
            else:
                self.state['selected'].append(span_id)
        if "Meta" in modkeys:
            self.app.entities_view.scroll_to_row(span_id)

    @frontend_only
    def handle_mouse_enter_span(self, span_id, modkeys):
        self.state["highlighted"].extend([span_id])

    @frontend_only
    def handle_mouse_leave_span(self, span_id, modkeys):
        self.state["highlighted"] = [
            highlighted_span_id
            for highlighted_span_id in self.state["highlighted"]
            if span_id != highlighted_span_id
        ]

    def render(self, layout: Layout):
        doc = self.state["docs"][get_idx(self.state["docs"], self.state["doc_id"])]
        if not doc:
            return

        layout.text_annotator(dict(
            # Currently displayed text
            text=doc["text"],

            # Currently displayed entities in the span-editor
            spans=[{
                "begin": entity["begin"],
                "end": entity["end"],
                "label": entity["label"],
                "style": entity["label"],
                "id": entity["id"],
                "highlighted": entity["id"] in self.state["highlighted"],
                "selected": entity["id"] in self.state["selected"],
            } for entity in doc["entities"]],

            # Styles map to lookup span attributes
            styles=self.state["styles"],

            # Currently selected spans of text
            mouse_selection=self.state["mouse_selection"],

            # Event handlers
            on_key_press=self.handle_key_press,
            on_mouse_select=self.handle_mouse_select,
            on_click_span=self.handle_click_span,
            on_mouse_enter_span=self.handle_mouse_enter_span,
            on_mouse_leave_span=self.handle_mouse_leave_span,
        ))


class NEREntitiesView(View):
    @frontend_only
    def handle_mouse_enter_row(self, row_id, modkeys):
        self.state["highlighted"].extend([row_id])

    @frontend_only
    def handle_mouse_leave_row(self, row_id, modkeys):
        self.state["highlighted"] = [
            highlighted_span_id
            for highlighted_span_id in self.state["highlighted"]
            if row_id != highlighted_span_id
        ]

    def handle_click_cell_content(self, key):
        self.get_view("text").scroll_to_span(key)

    def handle_select_rows(self, span_ids):
        self.state['selected'] = span_ids

    def handle_filters_change(self, col, value):
        self.state["entities_filters"][col] = value

    def handle_cell_change(self, row_id, col, value):
        current_doc_idx = get_idx(self.state["docs"], self.state["doc_id"])
        span_idx = get_idx(self.state["docs"][current_doc_idx]["entities"], row_id)
        self.state["docs"][current_doc_idx]["entities"][span_idx][col] = value

    def filter_and_sort_entities(self, doc, entities, filters):
        return [
            entity
            for entity in entities
            if ("label" not in filters or filters["label"] in entity["label"])
               and ("mention" not in filters or filters["mention"] in doc["text"][entity["begin"]:entity["end"]])
        ]

    @kernel_only
    def suggest(self):
        current_doc_idx = get_idx(self.state["docs"], self.state["doc_id"])
        doc = self.state["docs"][current_doc_idx]
        doc = self.suggester(doc)
        self.state["docs"][current_doc_idx] = doc
        return "c'est cool"

    def render(self, layout: Layout):
        doc = self.state["docs"][self.state["doc_id"]]
        if not doc:
            return
        hyperlinks = {
            ent['id']: {"key": ent["id"], "text": doc["text"][ent["begin"]:ent["end"]]}
            for ent in doc["entities"].values()
        }
        layout.table_annotator(dict(
            dict(
                rows=[
                    {
                        "visible": True,

                        # Span specific columns
                        "id": entity["id"],
                        "offsets": str(entity["begin"]) + "-" + str(entity["end"]),
                        "mention": hyperlinks.get(entity["id"], None),
                        "label": self.state["aliases"][entity["label"]],
                        **{
                            attribute["name"]: entity[attribute["name"]] if attribute["name"] in entity else None
                            for attribute in self.state["scheme"]["attributes"]
                        }
                    }
                    for entity in self.filter_and_sort_entities(doc, doc["entities"], self.state["entities_filters"])
                ],
                row_key="id",
                columns=[
                    {"name": "offsets", "type": "text"},
                    {"name": "delete", "type": "button"},
                    {"name": "mention", "type": "hyperlink", "mutable": True, "filterable": True},
                    {"name": "label", "type": "text", "mutable": True, "filterable": True, "choices": [
                        label["name"] for label in self.state["scheme"]["labels"]
                    ]},
                    *(
                        {
                            "name": attribute["name"],
                            "type": attribute["type"],
                            "mutable": True,
                            "filterable": True,
                            **({"choices": attribute["choices"]} if "choices" in attribute else {}),
                        }
                        for attribute in self.state["scheme"]["attributes"]
                    )
                ],
                filters=self.state["entities_filters"],
                selected_rows=self.state["selected"],
                highlighted_rows=self.state["highlighted"],
                input_value=self.state["input_value"],
                # suggestions=self.state["suggestions"],
                selected_position=(self.state["table_position"] if self.state["table_position"] and self.state["table_position"]["editor_id"] == "entities" else None),
            )
        ))


class NERDocsView(View):
    def change_doc(self, key):
        idx = get_idx(self.state["docs"], key)
        if idx == self.state["doc_id"]:
            return

        self.state["doc_id"] = idx
        self.state["mouse_selection"] = []
        self.state["highlighted"] = []
        self.state["selected"] = []

    def handle_click_cell_content(self, key):
        self.change_doc(key)

    def handle_select_rows(self, span_ids):
        self.state['selected'] = span_ids

    def handle_filters_change(self, col, value):
        self.state["entities_filters"][col] = value

    def handle_cell_change(self, row_id, col, value):
        current_doc_idx = get_idx(self.state["docs"], self.state["doc_id"])
        span_idx = get_idx(self.state["docs"][current_doc_idx]["entities"], row_id)
        self.state["docs"][current_doc_idx]["entities"][span_idx][col] = value

    def filter_and_sort_entities(self, doc, entities, filters):
        return [
            entity
            for entity in entities
            if ("label" not in filters or filters["label"] in entity["label"])
               and ("mention" not in filters or filters["mention"] in doc["text"][entity["begin"]:entity["end"]])
        ]

    @kernel_only
    def suggest(self):
        current_doc_idx = get_idx(self.state["docs"], self.state["doc_id"])
        doc = self.state["docs"][current_doc_idx]
        doc = self.suggester(doc)
        self.state["docs"][current_doc_idx] = doc
        return "c'est cool"

    def render(self, layout: Layout):
        layout.table_annotator(
            dict(
                rows=[{
                    # Row attributes
                    "id": {"key": doc["id"], "text": doc["id"]},
                    "seen": doc["seen"],
                    "count": len(doc["entities"]),
                    "key": doc["id"],
                } for doc in self.state["docs"]],

                # Columns description
                row_key="key",
                columns=[
                    {"name": "id", "type": ColumnType.hyperlink},
                    {"name": "seen", "type": ColumnType.boolean},
                    {"name": "count", "type": ColumnType.number},
                ],
                highlighted_rows=[self.state["docs"][self.state["doc_id"]]["id"]],
                position=(
                    self.state["table_position"]
                    if self.state["table_position"] and self.state["table_position"]["editor_id"] == "docs"
                    else None
                ),
            ))



