import glob
import os
import pathlib
import re
from collections import defaultdict
from typing import Dict, Union

REGEX_ENTITY = re.compile(r'^(T\d+)\t([^\s]+)([^\t]+)\t(.*)$')
REGEX_NOTE = re.compile(r'^(#\d+)\tAnnotatorNotes ([^\t]+)\t(.*)$')
REGEX_STATUS = re.compile(r'^(#\d+)\tStatus ([^\t]+)\t(.*)$')
REGEX_RELATION = re.compile(r'^(R\d+)\t([^\s]+) Arg1:([^\s]+) Arg2:([^\s]+)')
REGEX_ATTRIBUTE = re.compile(r'^([AM]\d+)\t(.+)$')
REGEX_EVENT = re.compile(r'^(E\d+)\t(.+)$')
REGEX_EVENT_PART = re.compile(r'([^\s]+):([TE]\d+)')


class BratDataConnector:
    def __init__(self, path, merge_newline_fragments=True, overwrite_txt=False, overwrite_ann=False):
        """
        Bidirectional connector with Brat.
        Allows nested directories (just set `path` to the top level directory)
        For now, writing events is not supported and any entity containing multiple fragments will only
        load the last one.

        Parameters
        ----------
        path: string
        merge_newline_fragments: bool
            Merge fragments of a entity that was split by brat because it overlapped an end of line
        overwrite_txt: bool
            Allow the connector to overwrite any .txt under `path`
        overwrite_ann: bool
            Allow the connector to overwrite any .txt under `path`
        """
        self.path = pathlib.Path(path)
        self.merge_newline_fragments = merge_newline_fragments
        self.overwrite_txt = overwrite_txt
        self.overwrite_ann = overwrite_ann

        os.makedirs(path, exist_ok=True)

    def load_one(self, filename: Union[str, pathlib.Path]) -> Dict:
        path = self.path.joinpath(filename)

        ann_filenames = []
        for filename in glob.glob(str(path).replace(".txt", ".a*"), recursive=True):
            ann_filenames.append(filename)

        entities = {}
        relations = []
        events = {}

        with open(path) as f:
            text = f.read()

        note_id = filename

        if not len(ann_filenames):
            return {
                "id": note_id,
                "text": text,
                "seen": False,
                "entities": [],
            }

        doc = {
            "id": note_id,
            "text": text,
            "seen": False,
        }

        for ann_file in ann_filenames:
            with open(ann_file) as f:
                for line_idx, line in enumerate(f):
                    try:
                        if line.startswith('T'):
                            match = REGEX_ENTITY.match(line)
                            if match is None:
                                raise ValueError(f'File {ann_file}, unrecognized Brat line {line}')
                            ann_id = match.group(1)
                            entity = match.group(2)
                            span = match.group(3)
                            # mention_text = match.group(4)
                            entities[ann_id] = {
                                "id": ann_id,
                                "label": entity,
                                "fragments": [],
                                "attributes": [],
                                "comments": [],
                            }
                            begins_ends = sorted([(int(s.split()[0]), int(s.split()[1])) for s in span.split(';')])
                            entities[ann_id]["begin"] = begins_ends[0][0]
                            entities[ann_id]["end"] = begins_ends[-1][1]
                        elif line.startswith('A') or line.startswith('M'):
                            match = REGEX_ATTRIBUTE.match(line)
                            if match is None:
                                raise ValueError(f'File {ann_file}, unrecognized Brat line {line}')
                            # ann_id = match.group(1)
                            parts = match.group(2).split(" ", 2)
                            if len(parts) >= 3:
                                entity, entity_id, value = parts
                            elif len(parts) == 2:
                                entity, entity_id = parts
                                value = None
                            else:
                                raise ValueError(f'File {ann_file}, unrecognized Brat line {line}')
                            (entities[entity_id] if entity_id.startswith('T') else events[entity_id])["attributes"].append({
                                "label": entity,
                                "value": value if value not in ("True", "False") else value == "True",
                            })
                        elif line.startswith('R'):
                            match = REGEX_RELATION.match(line)
                            if match is None:
                                raise ValueError(f'File {ann_file}, unrecognized Brat line {line}')
                            ann_id = match.group(1)
                            ann_name = match.group(2)
                            arg1 = match.group(3)
                            arg2 = match.group(4)
                            relations.append({
                                "id": ann_id,
                                "relation_label": ann_name,
                                "from_id": arg1,
                                "to_id": arg2,
                            })
                        elif line.startswith('E'):
                            match = REGEX_EVENT.match(line)
                            if match is None:
                                raise ValueError(f'File {ann_file}, unrecognized Brat line {line}')
                            ann_id = match.group(1)
                            arguments_txt = match.group(2)
                            arguments = []
                            for argument in REGEX_EVENT_PART.finditer(arguments_txt):
                                arguments.append({"entity_id": argument.group(2), "label": argument.group(1)})
                            events[ann_id] = {
                                "id": ann_id,
                                "attributes": [],
                                "arguments": arguments,
                            }
                        elif line.startswith('#'):
                            match = REGEX_STATUS.match(line)
                            if match:
                                comment = match.group(3)
                                doc["seen"] = comment == "CHECKED"
                                continue

                            match = REGEX_NOTE.match(line)
                            if match is None:
                                raise ValueError(f'File {ann_file}, unrecognized Brat line {line}')
                            # ann_id = match.group(1)
                            entity_id = match.group(2)
                            comment = match.group(3)
                            entities[entity_id]["comments"].append({
                                "comment": comment,
                            })
                    except Exception:
                        raise Exception("Could not parse line {} from {}: {}".format(line_idx, filename.replace(".txt", ".ann"), repr(line)))

        doc.update({
            "entities": list(entities.values()),
            "relations": relations,
            "events": list(events.values()),
        })
        return doc

    def load(self):
        filenames = list(self.path.rglob("*.txt"))
        docs = []
        for filename in sorted(filenames):
            if ".ipynb_checkpoints" in str(filename):
                continue
            filename = pathlib.Path(filename).relative_to(self.path)
            doc = self.load_one(filename)
            doc["id"] = str(filename)
            if doc is not None:
                docs.append(doc)
        return docs

    def save_one(self, doc):
        txt_filename = str(self.path.joinpath(doc["id"]))
        if not txt_filename.endswith(".txt"):
            txt_filename = txt_filename + ".txt"

        parent_dir = txt_filename.rsplit("/", 1)[0]
        if parent_dir and not os.path.exists(parent_dir):
            os.makedirs(parent_dir, exist_ok=True)
        if not os.path.exists(txt_filename) or self.overwrite_txt:
            with open(txt_filename, "w") as f:
                f.write(doc["text"])

        ann_filename = txt_filename.replace(".txt", ".ann")
        attribute_idx = 1
        entities_ids = defaultdict(lambda: "T" + str(len(entities_ids) + 1))
        if not os.path.exists(ann_filename) or self.overwrite_ann:
            with open(ann_filename, "w") as f:
                if "seen" in doc and doc["seen"]:
                    print("#1000\tStatus #1000\tCHECKED", file=f)
                if "entities" in doc:
                    for entity in doc["entities"]:
                        # idx = None
                        spans = []
                        brat_entity_id = entities_ids[entity["id"]]
                        if "begin" in entity and "end" in entity:
                            entity["fragments"] = [{
                                "begin": entity["begin"],
                                "end": entity["end"],
                            }]
                        for fragment in sorted(entity["fragments"], key=lambda frag: frag["begin"]):
                            idx = fragment["begin"]
                            entity_text = doc["text"][fragment["begin"]:fragment["end"]]
                            for part in entity_text.split("\n"):
                                begin = idx
                                end = idx + len(part)
                                idx = end + 1
                                if begin != end:
                                    spans.append((begin, end))
                        print("{}\t{} {}\t{}".format(
                            brat_entity_id,
                            str(entity["label"]),
                            ";".join(" ".join(map(str, span)) for span in spans),
                            entity_text.replace("\n", " ")), file=f)
                        if "attributes" in entity:
                            for i, attribute in enumerate(entity["attributes"]):
                                if "value" in attribute and attribute["value"] is not None and attribute["value"] != "":
                                    print("A{}\t{} {} {}".format(
                                        attribute_idx,
                                        str(attribute["label"]),
                                        brat_entity_id,
                                        attribute["value"]), file=f)
                                elif attribute["value"] is True:
                                    print("A{}\t{} {}".format(
                                        attribute_idx,
                                        str(attribute["label"]),
                                        brat_entity_id), file=f)
                                attribute_idx += 1
                if "relations" in doc:
                    for i, relation in enumerate(doc["relations"]):
                        entity_from = entities_ids[relation["from_id"]]
                        entity_to = entities_ids[relation["to_id"]]
                        print("R{}\t{} Arg1:{} Arg2:{}\t".format(
                            i + 1,
                            str(relation["label"]),
                            entity_from,
                            entity_to), file=f)

    def save(self, docs):
        for doc in docs:
            self.save_one(doc)
