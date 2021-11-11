class App(object):
    def __init__(self):
        if not IS_JS:
            manager = AppManager()
            self.manager = manager
            self.manager.app = self
        else:
            self.manager = None

    @frontend_only
    def clear_mouse_span_selection(self, editor_id):
        self.manager.actions[editor_id].clear_current_mouse_selection()

    def handle_button_press(self, idx, selections):
        pass

    def handle_cell_change(self, editor_id, row_idx, col, value):
        pass

    def handle_click_cell_content(self, editor_id, ):
        pass

    def handle_click_span(self, editor_id, span_id, modkeys):
        pass

    def handle_enter_span(self, editor_id, span_id, modkeys):
        pass

    def handle_key_down(self, editor_id, ):
        pass

    def handle_key_press(self, editor_id, key, modkeys, spans):
        pass

    def handle_leave_span(self, editor_id, span_id, modkeys):
        pass

    def handle_mouse_select(self, editor_id, ):
        pass

    def handle_select_cell(self, editor_id, *args):
        pass

    def handle_select_rows(self, editor_id, row_keys):
        pass

    def on_state_change(self, state, old_state):
        pass

    @frontend_only
    def scroll_to_line(self, editor_id, line_number):
        self.manager.actions[editor_id].scroll_to_line(line_number)

    @frontend_only
    def scroll_to_span(self, editor_id, span_id):
        self.manager.actions[editor_id].scroll_to_span(span_id)

    def select_editor_state(self, editor_id, ):
        pass

    def set_class(self, cls):
        self.__class__ = cls
        self.manager.app = self

    def span_editor(self, name=None):
        return self.manager.span_editor(name)

    def table_editor(self, name=None):
        return self.manager.table_editor(name)


class BRATApp(App):
    def __init__(self, path=None):
        super().__init__()

        state = {
            "text": "",
            "spans": [],
            "docs": [],
            "styles": {},
            "next_span_id": 1,
            "mouse_selection": [],
            "attributes": [],
            "buttons": [],
        }
        self.state = state
        self.label_config = {
            "neg": ("#ff5b5b", "n"),
            "quad": ("#0f8edc", "q"),
        }

        if path is not None:
            self.dataset = list(load_from_brat(path))
            labels = [label for label, count in sorted(Counter(e["label"] for d in self.dataset for e in d["entities"]).items(), key=lambda x: -x[1])]
            buttons=[
                {"type": 'button', "label": "⌫", "color": 'white', "key": "delete"},
                {"type": 'spacer'},
            ]
            used_letters = set()
            for label, color in zip(labels, colors):
                letter = next((l for l in label.lower() if l not in used_letters))
                used_letters.add(letter)
                buttons.append({"type": 'button', "label": label, "secondary": letter, "color": color, "key": label})
            self.state['docs'] = [{"id": doc["doc_id"]} for doc in self.dataset]
            self.state["styles"] = {
                label: {"color": self.label_config.get(label, (color,))[0], "alpha": 0.8}
                for label, color in zip(labels, colors)
            }
            self.state["buttons"] = buttons
            self.state["attributes"] = sorted(set(a['label'] for d in self.dataset for e in d['entities'] for a in e['attributes']))
            self.change_doc(self.dataset[0]['doc_id'])


    @kernel_only
    def change_doc(self, *args):
        return "change_doc"

    @produce
    def handle_button_press(self, editor_id, button_idx, selections):
        print((editor_id, button_idx, selections))

    @produce
    def handle_cell_change(self, editor_id, row_idx, col, value):
        if col == "label":
            self.state["spans"][row_idx]["label"] = value
        if col == "custom_link":
            self.state["spans"][row_idx]["custom_link"] = value

    def handle_click_cell_content(self, editor_id, key):
        if editor_id == "docs-table":
            print("Changing doc")
            self.change_doc(key)
        else:
            self.scroll_to_span("my-editor", key)

    @produce
    def handle_click_span(self, editor_id, span_id, modkeys):
        if "Shift" in modkeys:
            for span in self.state["spans"]:
                if span['id'] == span_id:
                    span['selected'] = not span['selected']

    @produce
    @frontend_only
    def handle_enter_span(self, editor_id, span_id, modkeys):
        for span in self.state["spans"]:
            if span['id'] == span_id:
                span['highlighted'] = True

    @produce
    def handle_key_press(self, editor_id, key, modkeys, spans):
        def has_overlap(x, y):
            return not (x['end'] <= y['begin'] or y['end'] <= x['begin'])

        text = self.state["text"]
        next_span_id = self.state["next_span_id"]
        if key == " ":
            first_selection = self.state["mouse_selection"][0]
            term = self.state["text"][first_selection["begin"]:first_selection["end"]]
            next_occurence = self.state["text"].find(term, self.state["mouse_selection"][len(self.state["mouse_selection"]) - 1]["end"])
            if next_occurence > 0:
                self.state["mouse_selection"].append({"begin": next_occurence, "end": next_occurence + len(term)})
        if key == "Backspace":
            self.state["spans"] = [
                span
                for span in self.state["spans"]
                if not any(has_overlap(span, mouse_span) for mouse_span in spans)
            ]
        elif len(spans):
            new_spans = []
            for span in spans:
                for button in self.state["buttons"]:
                    if button["secondary"] == key:
                        new_spans.append({
                            "begin": span["begin"],
                            "end": span["end"],
                            "label": [button["label"]],
                            "id": "T{}".format(next_span_id),
                            "highlighted": False,
                            "selected": False,
                            "custom_link": "",
                        })
                        next_span_id += 1
                        added_spans = True
                if key == " ":
                    pass
                    # Do something
                    # added_spans = True
            if not len(new_spans):
                return
            self.state["spans"].extend(new_spans)
        self.state["mouse_selection"] = []
        self.state["next_span_id"] = next_span_id

    @produce
    @frontend_only
    def handle_leave_span(self, editor_id, span_id, modkeys):
        for span in self.state["spans"]:
            if span['id'] == span_id:
                span['highlighted'] = False

    @produce
    def handle_mouse_select(self, editor_id, modkeys, spans):
        print(spans)
        if "Shift" in modkeys:
            self.state["mouse_selection"].extend(spans)
        else:
            self.state["mouse_selection"] = spans

    @produce
    def handle_select_rows(self, editor_id, span_ids):
        for span in self.state["spans"]:
            span['selected'] = span['id'] in span_ids

    def on_state_change(self, state, old_state):
        # logs.append(state["spans"] is not old_state["spans"])
        pass

    def select_editor_state(self, state, editor_id):
        if editor_id == "my-editor":
            return dict(
                text=state["text"],
                spans=[{
                    "begin": span["begin"],
                    "end": span["end"],
                    "label": [label for label in span["label"] if label in state["styles"]][0],
                    "style": [label for label in span["label"] if label in state["styles"]][0],
                    "id": span["id"],
                    "highlighted": span["highlighted"],
                    "selected": span["selected"],
                } for span in state["spans"]],
                styles=state["styles"],
                mouse_selection=state["mouse_selection"],
                buttons=state["buttons"],
            )
        elif editor_id == "docs-table":
            return dict(
                rows=[{
                    "doc_id": {"key": doc["id"], "text": doc["id"]},
                    "key": doc["id"],
                    "highlighted": False,
                } for doc in state["docs"]],
                rowKey="key",
                columns=[
                    {
                        "name": "doc_id",
                        "type": "hyperlink",
                    },
                ],
                selectedRows=[],
            )
        elif editor_id == "mentions-table":
            res = dict(
                rows=[{
                    "id": span["id"],
                    "highlighted": span["highlighted"],
                    "visible": True,
                    "mention": {
                        "text": state["text"][span["begin"]:span["end"]],
                        "key": span["id"],
                    },
                    "labels": chain_list(span["label"], [span['attributes'][a] for a in state['attributes'] if a in span['attributes']]),
                    "custom_link": span["custom_link"],
                } for span in state["spans"]],
                rowKey="id",
                columns=[
                    {
                        "name": "mention",
                        "type": "hyperlink",
                    },
                    {
                        "name": "labels",
                        "type": "multi-text",
                        "suggestions": [],
                    },
                    {
                        "name": "custom_link",
                        "type": "hyperlink",
                        "readonly": False,
                        "suggestions": [
                            {"text": state["text"][span["begin"]:span["end"]], "key": span["id"]}
                            for span in state["spans"]
                        ],
                    },
                ],
                selectedRows=[span["id"] for i, span in enumerate(state["spans"]) if span["selected"]],
            )
            # res['columns'].extend([
            #    {
            #        "name": name,
            #        "type": "text",
            #    } for name in state['attributes']
            # ])
            # print(res['columns'])
            return res
        raise Exception()


