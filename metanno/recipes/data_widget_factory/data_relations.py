"""
DataFrame table relations and query coordination for DataWidgetFactory
"""

from dataclasses import dataclass
from typing import Dict, Union

from typing_extensions import Literal


@dataclass(frozen=True)
class DataRelation:
    """
    Link two DataFrames so a parent table controls which child rows are shown.

    For example, link patients.id to visits.patient_id. In selection mode the
    visits table follows the selected patient. In working_set mode it shows visits
    for every patient matching the parent table filters.
    """

    parent: str
    child: str
    on: Union[str, Dict[str, str]]
    load: Literal["selection", "working_set"] = "selection"

    def __post_init__(self):
        if self.load not in {"selection", "working_set"}:
            raise ValueError("DataRelation load must be selection or working_set")
        if not isinstance(self.on, str) and len(self.on) != 1:
            raise ValueError("DataRelation initially supports one column pair")

    def as_dict(self):
        """
        Return the relation as plain data read by browser code, with the parent and child column names
        """
        parent_column, child_column = (self.on, self.on) if isinstance(self.on, str) else next(iter(self.on.items()))
        return {
            "parent": self.parent,
            "child": self.child,
            "parent_column": parent_column,
            "child_column": child_column,
            "load": self.load,
        }


def make_dataframe_queries(tables, relations):
    """
    Load the scope of each factory DataFrame in the browser, the rows shown by all its widgets.

    Related tables load as a group, a child scope is filtered by its parent scope, for example
    the entities of the listed notes. fetchScope queries every scope of the group, then setScope
    shows them together, so widgets never show new notes with the entities of old ones. Initial
    loading visits roots before children, querying from a child first finds its parents then
    loads the remaining branches.

    Returns mount, the effect of every factory DataFrame widget, where the first mount loads
    every group and reloads it when the Store revision changes and the last cleanup stops, and
    query_from, called by the query button of a table and when a source preview scrolls past
    its loaded rows.
    """
    parents = {relation["child"]: relation for relation in relations}
    state = {"references": 0, "generations": {}, "subscriptions": []}

    def root_for(key):
        while key in parents:
            key = parents[key]["parent"]
        return key

    def related_filter(column, key, parent_column, scope):
        # Preview rows supply IDs, complete tables use the parent query in their provider
        if scope.rows is not None:
            # A missing column reads as undefined in the browser and would reach the query as a null value, so we
            # name the missing column instead
            if len(scope.rows) and not any(parent_column in row for row in scope.rows):
                raise Exception(f"Table {key} has no column {parent_column}, read by its relation with another table")
            return {
                "kind": "predicate",
                "column": column,
                "operator": "in",
                "source_relation": {
                    "resource_id": tables[key].resource_id,
                    "parent_column": parent_column,
                    "filter": scope.filter,
                    "offset": scope.offset,
                    "paging": tables[key].description.row_limit is None,
                },
                "value": list(set(row[parent_column] for row in scope.rows if row[parent_column] is not None)),
            }
        return {
            "kind": "relation",
            "column": column,
            "resource_id": tables[key].resource_id,
            "parent_column": parent_column,
            "filter": scope.filter,
        }

    async def query_from(key, filters, offset=0):
        """
        Load a related group for initialization, the query button or a requested source page
        """
        root = root_for(key)
        generation = state["generations"].get(root, 0) + 1
        state["generations"][root] = generation
        group = [name for name in tables.keys() if root_for(name) == root]
        for name in group:
            tables[name].setStatus("Querying source" if name == key else "Loading related data")
        try:
            scopes = {key: await tables[key].fetchScope(filters, [], offset)}
            if generation != state["generations"][root]:
                return False
            # We show the rows of the queried table at once, but its related tables keep their loading status until
            # their own queries return (which can take minutes on a large source table)
            shown = scopes[key]
            tables[key].setScope(shown, True, filters)
            current = key
            while current != root:
                relation = parents[current]
                parent, child = relation["parent"], relation["child"]
                scopes[parent] = await tables[parent].fetchScope(
                    related_filter(relation["parent_column"], child, relation["child_column"], scopes[child])
                )
                if generation != state["generations"][root]:
                    return False
                current = parent
            pending = [root]
            while len(pending) > 0:
                parent = pending.pop(0)
                for relation in relations:
                    child = relation["child"]
                    parent_col, child_col = relation["parent_column"], relation["child_column"]
                    if relation["parent"] != parent or child not in group:
                        continue
                    parent_filter = related_filter(child_col, parent, parent_col, scopes[parent])
                    if child not in scopes:
                        scopes[child] = await tables[child].fetchScope(parent_filter)
                    elif scopes[parent].rows is not None and scopes[child].rows is not None:
                        # Child rows must have a parent within the returned parent table limit
                        ids = set(str(row[parent_col]) for row in scopes[parent].rows)
                        if any(str(row[child_col]) not in ids for row in scopes[child].rows):
                            scopes[child] = await tables[child].fetchScope(
                                {
                                    "kind": "and",
                                    "children": [scopes[child].filter, parent_filter]
                                    if scopes[child].filter
                                    else [parent_filter],
                                }
                            )
                    if generation != state["generations"][root]:
                        return False
                    pending.append(child)
            if generation != state["generations"][root]:
                return False
            # Replace the other scopes of the group before widgets render, so related tables stay consistent
            for name in group:
                if name != key or scopes[name] is not shown:
                    tables[name].setScope(scopes[name], False, filters if name == key else None)
            for name in group:
                tables[name].notifySubscribers()
            return True
        except Exception as error:
            if generation == state["generations"][root]:
                for name in group:
                    tables[name].setStatus(None, str(error))
            return False

    def subscribe_table(key):
        # Provider revisions refresh related query results after Store edits
        frame = tables[key]
        revision = {"value": frame.revision}

        def changed():
            if frame.revision == revision["value"]:
                return
            revision["value"] = frame.revision
            if key == root_for(key) and frame.scope is not None and frame.scope.revision != frame.revision:
                query_from(key, frame.scope.filter, frame.scope.offset or 0)

        def load_page(offset):
            return query_from(key, frame.scope.filter, offset)

        frame.loadPage = load_page
        return frame.subscribe(changed)

    def mount():
        """
        Widget mount effects share initialization, the last cleanup releases the group subscriptions
        """
        state["references"] += 1
        if state["references"] == 1:
            for key in tables.keys():
                state["subscriptions"].append(subscribe_table(key))
            for root in set(root_for(key) for key in tables.keys()):
                if any(tables[key].scope is None for key in tables.keys() if root_for(key) == root):
                    query_from(root, None)

        def cleanup():
            state["references"] -= 1
            if state["references"] == 0:
                for root in state["generations"].keys():
                    state["generations"][root] += 1
                for unsubscribe in state["subscriptions"]:
                    unsubscribe()
                state["subscriptions"].clear()
                for key in tables.keys():
                    tables[key].loadPage = None
                    tables[key].setStatus(None, tables[key].error)

        return cleanup

    return mount, query_from
