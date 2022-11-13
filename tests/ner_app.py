from metanno.connectors import BratDataConnector
from metanno.recipes.ner import NERApp, colors


def make_app():
    data = BratDataConnector("examples/dataset/", overwrite_ann=True)

    labels = sorted(set([ent["label"] for doc in data.load() for ent in doc["entities"]]))
    keys = {"modality": "m", "experiencer": "x", "time": "t"}
    for label in labels:
        keys[label] = next(letter for letter in label.lower() if letter not in keys.values())
    app = NERApp(
        data=data,
        suggester=None,
        scheme={
            "labels": [
                {"name": label, "color": colors[i], "key": keys[label], "alias": label}
                for i, label in enumerate(labels)
            ],
            "attributes": [{
                "name": "modality",
                "kind": "text",
                "key": "m",
                "color": "lightgrey",
                "choices": ["factual", "negated", "conditional", "counterindication", "uncertain", "suggested"]
            }, {
                "name": "experiencer",
                "kind": "text",
                "key": "x",
                "color": "lightgrey",
                "choices": ["self", "family", "other"],
            }, {
                "name": "time",
                "kind": "text",
                "key": "t",
                "color": "lightgrey",
                "choices": ["present", "past", "future"],
            }, {
                "name": "concept",
                "kind": "text",
                "color": "lightgrey",
                "choices": [f"C{n:04}" for n in range(10000)],
            }],
        },
    )
    exit(0)


app = make_app()
