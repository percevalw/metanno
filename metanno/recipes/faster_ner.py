from metanno import App, kernel_only, frontend_only, produce, chain_map, chain_list, get_idx


class NERApp(App):
    def __init__(self, data=None, suggester=None, scheme=None):
        super().__init__()

        if suggester is not None:
            self.suggester = suggester

        if data is not None:
            self.data = data
            docs = [
                chain_map(doc, {
                    "entities": {
                        ent["id"]: chain_map(ent, {
                            # "attributes": {
                            #     att["name"]: att["value"]
                            #     for att in ent["attributes"]
                            # }
                        })
                        for ent in doc["entities"]
                    }
                })
                for doc in self.data.load()
            ]
            self.state = {
                # Data specific state
                "doc_id": 0,
                "docs": docs,

                # Styles
                # "scheme": scheme,

                # Editor specific state
                "mouse_selection": [],
                "highlighted": [],
                "selected": [],
                "scheme": scheme,
                "entities_filters": {},
                "suggestions": [],
                # "entities_subset": list(range(len(docs[0]["entities"]))),
                "styles": {
                    field["name"]: chain_map({"alpha": 0.8}, field)  # chain_map(){"color": field["color"], "alpha": 0.8}
                    for field in chain_list(scheme["labels"])
                },
                "buttons": [
                    {
                        "type": "button",
                        "key": "suggest",
                        "label": "Suggest",
                        "annotation_kind": None,
                        # "secondary": None,
                        "color": "white",
                    }
                ] + [
                    chain_map({
                        "type": "button",
                        "key": field["key"],
                        "label": field["name"],
                        "annotation_kind": anno_type,
                        "secondary": field["key"]}, {
                        "color": field["color"],
                    } if field.get("color", None) else {})
                    for anno_type in ("labels", "attributes")
                    for field in scheme[anno_type]
                    if field.get("key", None) is not None
                ],
            }
        else:
            self.state = {
                "doc_id": "",
                "docs": {},
                "mouse_selection": [],
                "highlighted": [],
                "selected": [],
                "scheme": {},
                "styles": {},
                "buttons": [],
                "entities_filters": {},
                "entities_subset": [],
                "suggestions": [],
            }

    def select_editor_state(self, state, editor_id):
        doc = state["docs"][state["doc_id"]]
        if not doc:
            return
        hyperlinks = {
            ent['id']: {"key": ent["id"], "text": doc["text"][ent["begin"]:ent["end"]], "is_scope": ent["label"] == "scope"}
            for ent in doc["entities"].values()
        }
        if editor_id == "text":
            scopes_to_show = [doc["entities"][entity_id]["scope"] for entity_id in state["highlighted"] if "scope" in doc["entities"][entity_id]]
            return dict(
                # Currently displayed text
                text=doc["text"],

                # Currently displayed entities in the span-editor
                spans=[
                    {
                        "begin": entity["begin"],
                        "end": entity["end"],
                        "label": "".join(chain_list([entity["label"]], [
                            "["+entity[attribute["name"]] + "]"
                            for attribute in state["scheme"]["attributes"]
                            if attribute["name"] in entity
                        ])) if entity["label"] != "scope" else None,
                        "style": entity["label"],
                        "id": entity["id"],
                        "highlighted": entity["id"] in state["highlighted"],
                        "selected": entity["id"] in state["selected"],
                    }
                    for entity in doc["entities"].values()
                    if entity["label"] != "scope" or entity["id"] in scopes_to_show
                ],

                # Styles map to lookup span attributes
                styles=state["styles"],

                # Currently selected spans of text
                mouse_selection=state["mouse_selection"],

                # Buttons
                buttons=state["buttons"],
            )
        elif editor_id == "docs":
            return dict(
                rows=[{
                    # Row attributes
                    "id": {"key": doc["id"], "text": doc["id"]},
                    "seen": doc["seen"],
                    "count": len(doc["entities"]),
                    "key": doc["id"],
                } for doc in state["docs"]],

                # Columns description
                rowKey="key",
                columns=[
                    {"name": "id", "type": "hyperlink"},
                    {"name": "seen", "type": "boolean"},
                    {"name": "count", "type": "number"},
                ],
                selectedRows=[],
                highlightedRows=[state["docs"][state["doc_id"]]["id"]],
            )
        elif editor_id == "entities":
            return dict(
                rows=[
                    chain_map({
                        "visible": True,

                        # Span specific columns
                        "id": entity["id"],
                        "offsets": str(entity["begin"]) + "-" + str(entity["end"]),
                        "mention": hyperlinks.get(entity["id"], None),
                        "scope": hyperlinks.get(entity["scope"], None),
                        "label": entity["label"],
                    }, {
                        attribute["name"]: entity[attribute["name"]] if attribute["name"] in entity else None
                        for attribute in state["scheme"]["attributes"]
                    })
                    for entity in self.filter_and_sort_entities(doc, doc["entities"], state["entities_filters"])
                    if entity["label"] != "scope"
                ],
                rowKey="id",
                columns=chain_list([

                    {"name": "mention", "type": "hyperlink", "mutable": True, "filterable": True},
                    {"name": "scope", "type": "hyperlink", "mutable": True, "filterable": False},
                    {"name": "offsets", "type": "text"},
                    {"name": "label", "type": "text", "mutable": True, "filterable": True, "choices": [
                        label["name"] for label in state["scheme"]["labels"]
                    ]},
                ], [
                    chain_map(
                        {"name": attribute["name"], "type": attribute["kind"], "mutable": True, "filterable": True},
                        {"choices": attribute["choices"]} if "choices" in attribute else {},
                    )
                    for attribute in state["scheme"]["attributes"]
                ]),
                filters=state["entities_filters"],
                selectedRows=state["selected"],
                highlightedRows=state["highlighted"],
                inputValue=state["inputValue"],
                suggestions=state["suggestions"],
            )

    def filter_and_sort_entities(self, doc, entities, filters):
        return sorted([
            entity
            for entity in entities.values()
            if (
                  ("mention" not in filters or filters["mention"] in doc["text"][entity["begin"]:entity["end"]].lower()) and
                  all(
                    column_filter in entity[key].lower()
                    for key, column_filter in filters.items()
                    if key != "mention" and key != "scope")
            )
        ], key=lambda ent: ent["begin"] + (1. - ent["end"]/10000))

    @kernel_only
    @produce
    def change_doc(self, key):
        idx = get_idx(self.state["docs"], key)
        if idx == self.state["doc_id"]:
            return

        self.state["doc_id"] = idx
        self.state["mouse_selection"] = []
        self.state["highlighted"] = []
        self.state["selected"] = []

    @kernel_only
    @produce
    def suggest(self):
        doc = self.state["docs"][self.state["doc_id"]]
        doc = self.suggester(chain_map(doc, {"entities": list(doc["entities"].values())}))
        doc = chain_map(doc, {
            "entities": {
                ent["id"]: ent
                for ent in doc["entities"]
            }
        })
        self.state["docs"][self.state["doc_id"]] = doc

    def annotate(self, key, spans):
        def has_overlap(x, y):
            return not (x['end'] <= y['begin'] or y['end'] <= x['begin'])

        doc = self.state["docs"][self.state["doc_id"]]
        has_new_spans = False

        if key == " ":
            first_selection = self.state["mouse_selection"][0]
            term = doc["text"][first_selection["begin"]:first_selection["end"]]
            next_occurrence = doc["text"].find(term, self.state["mouse_selection"][len(self.state["mouse_selection"]) - 1]["end"])
            if next_occurrence > 0:
                self.state["mouse_selection"].append({"begin": next_occurrence, "end": next_occurrence + len(term)})
        elif key == "Backspace":
            self.delete_entities([
                span_id
                for span_id, span in doc["entities"].items()
                if any(has_overlap(span, mouse_span) for mouse_span in spans) and not span["label"] == "scope"
            ])
        elif key == "suggest":
            self.suggest()
            self.state["mouse_selection"] = []
        elif len(spans):
            for button in self.state["buttons"]:
                if button['type'] == 'button' and button["key"] == key:
                    if button["annotation_kind"] == "labels":
                        for span in spans:
                            new_id = f"metanno-{doc['id']}-{len(doc['entities'])}"
                            doc['entities'][new_id] = {
                                "begin": span["begin"],
                                "end": span["end"],
                                "label": button["label"],
                                "id": new_id,
                            }
                            has_new_spans = True
                    if button["annotation_kind"] == "attributes" and button["key"] == key:
                        is_true = None
                        for span in doc["entities"].values():
                            if any(has_overlap(span, mouse_span) for mouse_span in spans):
                                if is_true is None:
                                    is_true = span[button["label"]]
                                span[button["label"]] = not is_true
                if key == " ":
                    pass
            if not has_new_spans:
                return
            self.state["mouse_selection"] = []

    def delete_entities(self, entities_id):
        for entity_id in entities_id:
            scope_id = self.state["docs"][self.state["doc_id"]]["entities"][entity_id]["scope"]
            del self.state["docs"][self.state["doc_id"]]["entities"][entity_id]
            if scope_id:
                del self.state["docs"][self.state["doc_id"]]["entities"][scope_id]
            self.state["highlighted"] = [span_id for span_id in self.state["highlighted"] if span_id not in entities_id]
            self.state["selected"] = [span_id for span_id in self.state["selected"] if span_id not in entities_id]

    def on_state_change(self, state, old_state):
        if "docs" in old_state and not (state["docs"] is old_state.get("docs", None)):
            self.manager.save_state()
            docs = [
                chain_map(doc, {"entities": list(doc["entities"].values())})
                for doc in state["docs"]
            ]
            self.data.save(docs)

    @produce
    def handle_key_press(self, editor_id, key, modkeys, spans):
        if (key.lower() == "z") and "Control" in modkeys:
            if "Shift" not in modkeys:
                self.undo()
            else:
                self.redo()
        if key == "ArrowRight":
            self.state["doc_id"] = (self.state["doc_id"] + 1) % len(self.state["docs"])
        elif key == "ArrowLeft":
            self.state["doc_id"] = (self.state["doc_id"] - 1) % len(self.state["docs"])
        else:
            self.annotate(key, spans)

    @kernel_only
    def undo(self):
        self.manager.undo()

    @kernel_only
    def redo(self):
        self.manager.redo()

    @produce
    def handle_button_press(self, editor_id, button_idx, selections):
        self.annotate(self.state["buttons"][button_idx]["key"], selections)

    @produce
    def handle_mouse_select(self, editor_id, modkeys, spans):
        if len(spans):
            text = self.state["docs"][self.state["doc_id"]]["text"]
            self.state["inputValue"] = {"text": text[spans[0]["begin"]:spans[0]["end"]], "key": "", "begin": spans[0]["begin"], "end": spans[0]["end"]}
            self.focus_input("entities")
        if "Shift" in modkeys:
            self.state["mouse_selection"].extend(spans)
        else:
            self.state["mouse_selection"] = spans

    @produce
    def handle_click_span(self, editor_id, span_id, modkeys):
        if "Shift" in modkeys:
            if span_id in self.state['selected']:
                self.state['selected'].remove(span_id)
            else:
                self.state['selected'].append(span_id)
        if "Meta" in modkeys:
            self.scroll_to_row("entities", span_id)

    @frontend_only
    @produce
    def handle_mouse_enter_span(self, editor_id, span_id, modkeys):
        if self.state["docs"][self.state["doc_id"]]["entities"][span_id]["label"] != "scope":
            self.state["highlighted"].extend([span_id])

    @frontend_only
    @produce
    def handle_mouse_leave_span(self, editor_id, span_id, modkeys):
        self.state["highlighted"] = [
            highlighted_span_id
            for highlighted_span_id in self.state["highlighted"]
            if span_id != highlighted_span_id
        ]

    @frontend_only
    @produce
    def handle_mouse_enter_row(self, editor_id, row_id, modkeys):
        if editor_id == "entities":
            self.state["highlighted"].extend([row_id])

    @frontend_only
    @produce
    def handle_mouse_leave_row(self, editor_id, row_id, modkeys):
        if editor_id == "entities":
            self.state["highlighted"] = [
                highlighted_span_id
                for highlighted_span_id in self.state["highlighted"]
                if row_id != highlighted_span_id
            ]

    @frontend_only
    @produce
    def handle_input_change(self, editor_id, row_id, col, value):
        self.state['inputValue'] = value
        # entity_suggestions = self.state["docs"][self.state["doc_id"]]["entities"][row_id]["suggestions"]
        # self.state['suggestions'] = entity_suggestions[col] if col in entity_suggestions else []
        if col == "label":
            self.state["suggestions"] = [label["name"] for label in self.state["scheme"]["labels"]]
        else:
            self.state["suggestions"] = self.state["scheme"]["attributes"][get_idx(self.state["scheme"]["attributes"], col, "name")]["choices"]

    def handle_click_cell_content(self, editor_id, key):
        if editor_id == "docs":
            self.change_doc(key)
        else:
            self.scroll_to_span("text", key)

    @produce
    def handle_select_rows(self, editor_id, span_ids):
        self.state['selected'] = span_ids

    @produce
    def handle_filters_change(self, editor_id, col, value):
        print(str((col, value)))
        if editor_id == "entities":
            self.state["entities_filters"][col] = value

    @produce
    def handle_cell_change(self, editor_id, row_id, col, value):
        if editor_id == "entities":
            if col == "mention":
                self.state["docs"][self.state["doc_id"]]["entities"][row_id]["begin"] = value["begin"]
                self.state["docs"][self.state["doc_id"]]["entities"][row_id]["end"] = value["end"]
            if col == "scope":
                scope_id = self.state["docs"][self.state["doc_id"]]["entities"][row_id]["scope"]
                if not scope_id:
                    scope_id = f"{row_id}-scope"
                    self.state["docs"][self.state["doc_id"]]["entities"][scope_id] = {"id": scope_id, "label": "scope", "begin": value["begin"], "end": value["end"]}
                    self.state["docs"][self.state["doc_id"]]["entities"][row_id]["scope"] = scope_id
                else:
                    self.state["docs"][self.state["doc_id"]]["entities"][scope_id]["begin"] = value["begin"]
                    self.state["docs"][self.state["doc_id"]]["entities"][scope_id]["end"] = value["end"]
            elif col:
                self.state["docs"][self.state["doc_id"]]["entities"][row_id][col] = value
            self.state["mouse_selection"] = []
        if editor_id == "docs" and col == "checked":
            self.state["docs"][self.state["doc_id"]]["seen"] = value
