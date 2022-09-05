from pathlib import Path

from typing import Any, Dict, Optional

import pandas as pd


DEFAULT_MAPPING = {
    "id": "note_id",
    "text": "note_text",
    "label": "label_name",
    "attributes": [],
    "comments": "comment",
    "begin": "offset_begin",
    "end": "offset_end",
}


class IO:
    """
    Class to handle IO depending on the provided file type
    """

    def __init__(self, file_type: str):
        assert file_type in {
            "pickle",
            "csv",
        }, "Provided `file_type` should be either `csv` or `pickle`"
        self.file_type = file_type
        self.suffix = f".{file_type}"

    def exists(self, path: Path):
        file_path = path.with_suffix(self.suffix)
        return file_path.exists()

    def save(self, data: pd.DataFrame, path: Path):
        file_path = path.with_suffix(self.suffix)
        if self.file_type == "pickle":
            data.to_pickle(file_path)
        elif self.data_type == "csv":
            data.to_csv(file_path)

    def read(self, path):
        file_path = path.with_suffix(self.suffix)
        if self.file_type == "pickle":
            data = pd.read_pickle(file_path)
        elif self.data_type == "csv":
            data = pd.read_csv(file_path, index_col=0)
        return data


class PandasDataConnector:
    def __init__(
        self,
        path: Optional[str] = None,
        redo_initial_prep=False,
        mapping: Dict[str, Any] = DEFAULT_MAPPING,
        file_type: str = "pickle",
    ):
        """
        Bidirectional connector with a Pandas DataFrame.
        No support for relations for now.
        Data will be fetched in the `path` folder, by looking at `txt.[file_type]` and/or `ann.[file_type]` files.
        Your setup should fall in one f the 3 categories:
        - `txt` only: To load raw texts with no pre-annotation
        - `ann` only: To load annotations and texts from the same file
        - `ann` and `txt`: To load annotations and texts from two separate files

        Columns information should be provided via the `mapping` argument, with the following keys:
        - "id": Column storing a document unique identifier (defaults to "note_id"),
        - "text": Column storing the full raw text of the document (defaults to "note_text"),
        - "label": Column storing the label name of the entity (defaults to "label_name"),
        - "attributes": List of Columns storing attributes to the entity (defaults to []),
        - "comments": Column containing some comments (defaults to "comment"),
        - "begin": Column containing the starting position of the entity (defaults to "offset_begin"),
        - "end": Column containing the ending position of the entity (defaults to "offset_end")

        Parameters
        ----------
        path: string
            Path to the folder in which data will be fetched and saved
        file_type: str
            Either `csv` or `pickle`.
        redo_initial_prep: bool
            Whether to re'run the initial data preparation. /!\ This might overwrite work you've done
        mapping: Dict[str, Any]
            A dictionary of column names
        """

        self.mapping = DEFAULT_MAPPING.copy()
        self.mapping.update(mapping)
        self.set_column_names()

        self.ann_columns = [
            col
            for key, col in self.mapping.items()
            if key not in {"text", "attributes"}
        ] + self.attributes
        self.txt_columns = [self.id, self.text]

        self.folder = Path(path)
        self.metanno_folder = self.folder / "metanno"

        self.IO = IO(file_type)

        assert self.folder.is_dir(), "The provided `path` should be a folder"

        if not self.metanno_folder.exists():
            self.initial_data_preparation()
            return

        if redo_initial_prep:
            answer = input(
                "WARNING: you set `redo_initial_prep` to `True`, this might overwrite some work you've previously done. Continue? [y/N]"
            )
            if answer.lower().startswith("y"):
                self.initial_data_preparation()
            else:
                print("Aborting")

    def handle_missing_columns(self, data, columns):
        missing = set(columns) - set(data.columns)
        for col in missing:
            print(f"Column {col} not found, creating an empty one")
            data[col] = None
        return data[columns]

    def initial_data_preparation(self):
        print(f"Creating a folder 'metanno' in {self.folder}")
        self.metanno_folder.mkdir(exist_ok=True)

        txt_path = self.folder / "txt"
        ann_path = self.folder / "ann"

        has_txt = self.IO.exists(txt_path)
        has_ann = self.IO.exists(ann_path)

        assert (
            has_txt or has_ann
        ), f"No `txt.{self.IO.file_type}` and/or `ann.{self.IO.file_type}` file found !"

        if has_ann and not has_txt:
            # Annotations and text in the same file
            print(f"Loading annotations and texts from `ann.{self.IO.file_type}`")

            data = self.IO.read(ann_path)
            txt_data = data[[self.id, self.text]].drop_duplicates()
            ann_data = self.handle_missing_columns(
                data,
                columns=self.ann_columns,
            )

        elif has_txt and not has_ann:
            # Only text: no initial annotations
            print(f"Loading raw texts from `txt.{self.IO.file_type}`")

            txt_data = self.IO.read(txt_path)[[self.id, self.text]].drop_duplicates()
            ann_data = pd.DataFrame(columns=self.ann_columns)

        elif has_txt and has_ann:
            # Annotation and text in different files
            print(
                f"Loading annotations from `ann.{self.IO.file_type}` and texts from `txt.{self.IO.file_type}`"
            )

            txt_data = self.IO.read(txt_path)[[self.id, self.text]].drop_duplicates()
            ann_data = self.handle_missing_columns(
                self.IO.read(ann_path),
                columns=self.ann_columns,
            )

        for _, txt_row in txt_data.iterrows():
            id = txt_row[self.id]
            ann = ann_data[ann_data[self.id] == id].copy()
            ann["entity_id"] = list(range(len(ann)))
            ann["entity_id"] = ann["entity_id"].astype(str)
            ann["seen"] = False
            self.IO.save(ann, self.metanno_folder / f"{id}")

        self.IO.save(txt_data, self.metanno_folder / "txt")

    def set_column_names(self):
        for key, value in self.mapping.items():
            setattr(self, key, value)

    def format_entity(self, entity):
        entity_cols = [
            "entity_id",
            "begin",
            "end",
            "label",
            "comments",
        ] + self.attributes

        entity["comments"] = entity.get("comments", [""])[0]
        entity["entity_id"] = entity["id"]
        attributes = {attr["label"]: attr["value"] for attr in entity["attributes"]}
        for attr in self.attributes:
            entity[attr] = attributes.get(attr, None)
        return {k: v for k, v in entity.items() if k in entity_cols}

    def save_one(self, doc):

        doc_id = doc["id"]
        entities = [self.format_entity(entity) for entity in doc["entities"]]
        df = pd.DataFrame(entities).rename(
            columns={k: v for k, v in self.mapping.items() if k != "attributes"}
        )
        df["seen"] = doc["seen"]
        self.IO.save(df, self.metanno_folder / f"{doc_id}")

    def save(self, docs):
        for doc in docs:
            self.save_one(doc)

    def load(self):
        texts = self.IO.read(self.metanno_folder / "txt")

        return [
            self.load_one(
                id=row[self.id],
                txt=row[self.text],
            )
            for _, row in texts.iterrows()
        ]

    def load_one(self, id, txt: str):
        """
        Load annotations coming from a single document

        Parameters
        ----------
        df : pd.DataFrame
            Containing annotations from a single document
        """

        ann = self.IO.read(self.metanno_folder / f"{id}")

        doc = {
            "id": id,
            "text": txt,
            "seen": False,
            "entities": [],
        }
        if not len(ann):
            return doc

        entities = []
        for _, entity in ann.iterrows():
            entity_dict = {
                "id": entity["entity_id"],
                "label": entity[self.label],
                "fragments": [],
                "attributes": [
                    {
                        "label": attribute,
                        "value": entity[attribute],
                    }
                    for attribute in self.attributes
                ],
                "comments": [entity[self.comments]],
                "begin": entity[self.begin],
                "end": entity[self.end],
            }
            entities.append(entity_dict)

        doc.update(
            {
                "seen": False if "seen" not in ann.columns else all(ann["seen"]),
                "entities": entities,
                "relations": [],
                "events": [],
            }
        )
        return doc
