"""
Generate executable notebook queries and annotation preparation from an open source view
"""

import datetime
import inspect
import pkgutil
from decimal import Decimal

from pret import DataFrame
from pret.dataframe_external import coerce_ibis_literal

from .source_provider import SourceDataFrameProvider, unwrap_added_columns
from .sources import file_table_uri


def export_view_code(store, view_definition, config_dir, purpose="annotation"):
    """
    Generate notebook code for the Metanno Copy code menu

    Parameters
    ----------
    view_definition
        Saved view or table view of the tab, None for a table view
    purpose
        query emits source expressions, annotation also prepares fields and saves editable data
    """
    import keyword
    import re
    from pathlib import Path

    from .recipes import load_recipes

    if purpose not in {"annotation", "query"}:
        raise ValueError("Copy purpose must be annotation or query")
    frames = {}
    additions = {}
    names = {}
    for key in store:
        frame = store[key]
        if not isinstance(frame, DataFrame):
            raise ValueError(f"Cannot export source code for non DataFrame entry {key!r}")
        names[frame.resource_id] = key
        frame, defaults = unwrap_added_columns(frame)
        names[frame.resource_id] = key
        if not isinstance(frame.provider, SourceDataFrameProvider):
            raise ValueError(f"No source query is available for {key!r}")
        if any(callable(value) for value in defaults.values()):
            raise ValueError(f"Copying arbitrary computed columns is unsupported for {key!r}")
        if frame.provider.last_query is None:
            raise ValueError(f"Wait for {key!r} to finish its source query before copying")
        frames[key] = frame
        additions[key] = defaults
    # The catalog of the open view also knows the databases listed by a `databases` source
    sources = next(iter(frames.values())).provider.sources
    config = sources.config
    imports = []
    project_imports = []
    connection_lines = []
    connection_names = {}
    lines = ["# Queries select source records, change the filters and limits for your cohort"]
    query_names = {}
    collected_tables = {}
    used_names = {
        "config_path",
        "store",
        "tables",
        "parameters",
        "destination",
        "DataFrame",
        "_",
        "ibis",
        "sys",
        "ExitStack",
        "connections",
        "datetime",
        "Decimal",
        "create_store",
        "save_store",
        "view_opener",
        "Path",
        "F",
        "ordering",
        "uuid",
        "ANNOTATION_NAME",
    }

    def unique_name(name):
        """
        Return a Python identifier based on name that no other generated variable uses
        """
        base = re.sub(r"\W", "_", name)
        if not base or base[0].isdigit() or keyword.iskeyword(base):
            base = "table_" + base
        unique = base
        suffix = 1
        while unique in used_names or unique + "_data" in used_names:
            suffix += 1
            unique = f"{base}_{suffix}"
        used_names.update((unique, unique + "_data"))
        return unique

    def emit_connection(name):
        """
        Append the statements opening a metanno.yaml connection once and return its Python variable name

        A URL becomes `ibis.connect(url)`, a factory is imported from its module and entered with an ExitStack
        when it is a context manager, so the copied queries depend on Ibis and the project code only
        """
        if name in connection_names:
            return connection_names[name]
        connection = config.connections[name]
        arguments = ", ".join(f"{key}={value!r}" for key, value in connection.kwargs.items())
        if connection.url:
            imports.append("import ibis")
            call = f"ibis.connect({connection.url!r}" + (f", {arguments}" if arguments else "") + ")"
        else:
            module, attribute = connection.factory.split(":", 1)
            statement = f"from {module} import {attribute.split('.')[0]}"
            if (config.directory / (module + ".py")).is_file():
                # A module beside metanno.yaml is imported after adding its directory to the import path
                if "import sys" not in imports:
                    imports.append("import sys")
                    project_imports.append(f"sys.path.insert(0, {str(config.directory)!r})")
                if statement not in project_imports:
                    project_imports.append(statement)
            else:
                imports.append(statement)
            used_names.add(attribute.split(".")[0])
            call = f"{attribute}({arguments})"
            factory = inspect.unwrap(pkgutil.resolve_name(connection.factory))
            if inspect.isgeneratorfunction(factory) or isinstance(factory, type) and hasattr(factory, "__enter__"):
                if "from contextlib import ExitStack" not in imports:
                    imports.append("from contextlib import ExitStack")
                    connection_lines.insert(0, "connections = ExitStack()")
                call = f"connections.enter_context({call})"
        connection_names[name] = unique_name(name)
        connection_lines.append(f"{connection_names[name]} = {call}")
        return connection_names[name]

    def render_filter(node, schema):
        """
        Write a widget filter as an Ibis predicate on the deferred table `_`, used by emit_query in `.filter(...)`

        Literals get the source column type recorded by the last query, e.g. `datetime.date(2026, 1, 1)`
        """
        if node["kind"] in {"and", "or"}:
            return f" {'&' if node['kind'] == 'and' else '|'} ".join(
                f"({render_filter(child, schema)})" for child in node["children"]
            )
        if node["kind"] == "not":
            return f"~({render_filter(node['child'], schema)})"
        column = f"_[{node['column']!r}]"
        value = node.get("value")
        if schema is not None and node["operator"] not in {"is_null", "is_not_null"}:
            value = coerce_ibis_literal(schema[node["column"]], value, node["operator"])
        if node["operator"] == "icontains":
            column, value = f"{column}.lower()", value.lower()
        for item in value if isinstance(value, list) else [value]:
            if isinstance(item, (datetime.date, datetime.datetime)):
                imports.append("import datetime")
            if isinstance(item, Decimal):
                imports.append("from decimal import Decimal")
        return {
            "eq": "{} == {!r}",
            "ne": "{} != {!r}",
            "lt": "{} < {!r}",
            "lte": "{} <= {!r}",
            "gt": "{} > {!r}",
            "gte": "{} >= {!r}",
            "icontains": "{}.contains({!r})",
            "contains": "{}.contains({!r})",
            "starts_with": "{}.startswith({!r})",
            "ends_with": "{}.endswith({!r})",
            "in": "{}.isin({!r})",
            "is_null": "{}.isnull()",
            "is_not_null": "{}.notnull()",
        }[node["operator"]].format(column, value)

    def emit_query(key, options):
        """
        Append notebook statements for this table query and return its Python variable name
        """
        # Related previews record the parent query at execution time, including earlier selections of the same table
        signature = (
            key,
            repr(options.get("filter")),
            repr(options.get("sort") or []),
            tuple(options.get("columns") or []),
            options.get("offset", 0),
            options.get("paging", False),
        )
        if signature in query_names:
            return query_names[signature]
        query = query_names[signature] = unique_name(key)
        filters = options.get("filter")
        nodes = [filters]
        related = False
        provider = frames[key].provider
        source = sources.source(provider.source)
        backend = emit_connection(provider.connection or source.connection)
        if source.kind == "files":
            reader = "read_delta" if source.format == "delta" else "read_parquet"
            expression = f"{backend}.{reader}({file_table_uri(config, source, provider.table)!r})"
        else:
            database = sources.database_name(source)
            expression = f"{backend}.table({provider.table!r}" + (f", database={database!r}" if database else "") + ")"
        statements = []
        while nodes:
            node = nodes.pop(0)
            if node is None:
                continue
            if node["kind"] == "and":
                nodes[0:0] = node["children"]
                continue
            relation = node if node["kind"] == "relation" else node.get("source_relation")
            if relation:
                related = True
                parent = names[relation["resource_id"]]
                parent_filter = relation.get("filter")
                parent_query = emit_query(
                    parent,
                    {
                        "filter": parent_filter,
                        "offset": relation.get("offset", 0),
                        "paging": relation.get("paging", False),
                    },
                )
                if purpose == "annotation":
                    if parent_query not in collected_tables:
                        collected_tables[parent_query] = parent_query + "_data"
                        lines.extend(
                            [
                                "# Collect the parent once so its saved rows and child selection use the same cohort",
                                f"{collected_tables[parent_query]} = DataFrame({parent_query}).materialize()",
                                "",
                            ]
                        )
                    imports.append("from ibis import _")
                    statements.append(f"{query} = {expression}")
                    expression = (
                        f"{query}.filter(_[{node['column']!r}].isin("
                        f"{collected_tables[parent_query]}[{relation['parent_column']!r}].to_pylist()))"
                    )
                else:
                    statements.append(f"{query} = {expression}")
                    expression = (
                        f"{query}.join({parent_query}.select({relation['parent_column']!r}), "
                        f"{query}[{node['column']!r}] == {parent_query}[{relation['parent_column']!r}], how='semi')"
                    )
            else:
                imports.append("from ibis import _")
                statements.append(f"{query} = {expression}")
                expression = f"{query}.filter({render_filter(node, provider.last_schema)})"
        statements.append(f"{query} = {expression}")
        if options.get("sort") or options.get("paging"):
            sort = options.get("sort", [])
            columns = ", ".join(f"{query}[{term['column']!r}].{term['direction']}()" for term in sort)
            statements.append(f"ordering = [{columns}]")
            if options.get("paging"):
                statements.append(
                    f"ordering += [{query}[name].asc() for name, dtype in {query}.schema().items() "
                    f"if name not in {[term['column'] for term in sort]!r} "
                    "and not (dtype.is_array() or dtype.is_map() or dtype.is_struct())]"
                )
            statements.append(f"{query} = {query}.order_by(*ordering)")
        if options.get("columns"):
            statements.append(f"{query} = {query}.select({options['columns']!r})")
        if purpose == "annotation":
            limit = options.get("limit", frames[key].provider.last_query.get("limit", 500))
            offset = options.get("offset", 0)
            statements.append(f"{query} = {query}.limit({limit!r}" + (f", offset={offset}" if offset else "") + ")")
        # Consecutive operations on one expression become a single readable call chain
        chained = []
        for statement in statements:
            prefix = f"{query} = {query}."
            if (
                chained
                and statement.startswith(prefix)
                and chained[-1].startswith(f"{query} = ")
                and f"{query}[" not in statement
            ):
                chained[-1] += "\n    ." + statement[len(prefix) :]
            else:
                chained.append(statement)
        for statement in chained:
            if "\n" in statement:
                statement = statement.replace(f"{query} = ", f"{query} = (\n    ", 1) + "\n)"
            lines.append(statement)
        if related and purpose == "annotation":
            lines.append(
                "# This child limit can omit related records, increase or remove it for a complete annotation set"
            )
        lines.append("")
        return query

    outputs = {key: emit_query(key, frame.provider.last_query) for key, frame in frames.items()}
    imports += [
        "from pret import DataFrame, create_store" + (", load_store, save_store" if purpose == "annotation" else ""),
        "from metanno import view_opener",
    ]
    if purpose == "annotation":
        imports.append("from pathlib import Path")
    recipe = view_definition.recipe if view_definition else "table"
    parameters = dict(view_definition.parameters) if view_definition else {}
    annotation_setup = ""
    if purpose == "annotation":
        application = load_recipes(config.directory / "views")[recipe]
        if application.annotation_setup_code is not None:
            annotation_setup = application.annotation_setup_code(parameters).rstrip()
    lines += [
        "# Tables maps the prepared data to the Store keys expected by the view recipe",
        "tables = {",
        *[f"    {key!r}: DataFrame({collected_tables.get(query, query)})," for key, query in outputs.items()],
        "}",
    ]
    for key, defaults in additions.items():
        if defaults:
            lines.append(f"tables[{key!r}] = tables[{key!r}].with_columns(**{defaults!r})")
    if annotation_setup:
        lines += ["", annotation_setup]
    lines += [
        "",
        "# Parameters are keyword arguments for the view recipe, they do not change the source queries",
        f"parameters = {parameters!r}",
        "",
    ]
    if purpose == "annotation":
        lines += [
            "# Save editable copies of the query results and added fields, without changing the source database.",
            "# Name the annotation campaign, each name gets its own Store file",
            "ANNOTATION_NAME = ",
            f"destination = Path({str(config.directory)!r}) / 'annotations' / f'{{ANNOTATION_NAME}}.pret'",
            "# Annotation views copy every table into the page so filters and edits apply at once, up to 50 MB.",
            "# The options are saved with the Store and used again when it is reopened",
            "options = {'dataframe_sync': 'full', 'dataframe_max_bytes': 50 * 1024 * 1024}",
            "save_store(create_store(tables, sync=True), destination, metadata={",
            f"    'view': {recipe!r}, 'parameters': parameters, 'config_path': config_path, **options,",
            "})",
            "store = load_store(destination, **options)",
        ]
    else:
        lines += [
            "# Open the source queries together as a read only exploration using the selected view",
            "store = create_store(tables, sync=True)",
        ]
    lines += [
        f"view_opener(store, view={recipe!r}, parameters=parameters, config_path=config_path, read_only=True)"
        if purpose == "query"
        else "view_opener(store)",
        "",
    ]
    lines = [
        f"config_path = {str(Path(config_dir).resolve())!r}",
        "",
        "# Connections of metanno.yaml, rerun this cell if a connection is lost",
        *project_imports,
        *connection_lines,
        "",
        *lines,
    ]
    # Imports are grouped as standard library, Ibis, project connection modules, then PRET and Metanno
    groups = {"sys": 0, "datetime": 0, "contextlib": 0, "decimal": 0, "pathlib": 0, "ibis": 1, "pret": 3, "metanno": 3}
    blocks = {}
    for line in dict.fromkeys(imports):
        blocks.setdefault(groups.get(line.split()[1].split(".")[0], 2), []).append(line)
    return "\n\n".join("\n".join(blocks[group]) for group in sorted(blocks)) + "\n\n\n" + "\n".join(lines)
