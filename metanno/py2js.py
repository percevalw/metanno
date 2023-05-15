import ast
import contextlib
import inspect
import json
import os
import re
import sys
from collections import defaultdict
from io import StringIO
from pathlib import Path
from textwrap import dedent
from typing import Generic, Any, Tuple, Sequence, Mapping, Callable, Iterable, Dict
from weakref import WeakValueDictionary

import astunparse

from .state import State
from metanno_transcrypt.__main__ import main as transcrypt

TEMP_DIR = Path("/tmp/metanno-transcrypt")
VARIABLE_STORE = "variableStore"
REMOTE_FUNCTION = "getRemoteFunction"
DESERIALIZE = "deserialize"
GET_STATE = "getState"


def format_node(node: ast.AST, code: str) -> str:
    """
    Prettily formats an AST node inside a piece of code

    Parameters
    ----------
    node: ast.AST
    code: str

    Returns
    -------
    str
    """
    try:
        lines = code.split("\n")
        lines[node.end_lineno - 1] = (
              lines[node.end_lineno - 1][:node.end_col_offset] + "\033[1;31m]\033[0m" +
              lines[node.end_lineno - 1][node.end_col_offset:]
        )
        lines[node.lineno - 1] = (
              lines[node.lineno - 1][:node.col_offset] + "\033[1;31m[\033[0m" +
              lines[node.lineno - 1][node.col_offset:]
        )
        lines = [str(i).ljust(3) + line for i, line in enumerate(lines)]
        lines = lines[node.lineno - 2:node.end_lineno + 1]
        return "\n".join(lines)
    except AttributeError:
        return str(node)


def make_async_function_def(node):
    if hasattr(node, 'type_comment'):
        return ast.AsyncFunctionDef(
            name=node.name,
            args=node.args,
            body=node.body,
            decorator_list=node.decorator_list,
            returns=node.returns,
            type_comment=node.type_comment,
        )
    else:
        return ast.AsyncFunctionDef(
            name=node.name,
            args=node.args,
            body=node.body,
            decorator_list=node.decorator_list,
            returns=node.returns,
        )


@contextlib.contextmanager
def redirect_argv(*args):
    argv = sys.argv[:]
    sys.argv = list(map(str, args))
    yield
    sys.argv = argv


@contextlib.contextmanager
def capture_stdout():
    new_target = StringIO()
    old_target = sys.stdout
    sys.stdout = new_target
    try:
        yield new_target
    finally:
        sys.stdout = old_target


def get_code_transcrypt(
      my_code: str,
      args=('-b', '-n', '-m', '-p', 'window', '--fcall', '--kwargs'),
):
    os.makedirs(TEMP_DIR, exist_ok=True)
    with open(TEMP_DIR / 'test.py', 'w') as f:
        f.write(my_code)
    with redirect_argv(*args, TEMP_DIR / 'test.py'):
        with capture_stdout() as output:
            transcrypt()
        if "Saving" not in output.getvalue() or "Error" in output.getvalue():
            raise Exception("Could not export your Python app to Javascript with Transcrypt. Here is the log: \n{}".format(output.getvalue()))
    res = (TEMP_DIR / '__target__' / 'test.js').read_text()
    sourcemap = json.loads((TEMP_DIR / '__target__' / 'test.map').read_text())
    res = re.sub('export var ', 'var        ', res)
    res = re.sub(r"(import[^;]+from\s+[^;]+;)", r"", res)
    return res, sourcemap


class SerializationError(Exception):
    def __init__(self, root, obj, path, node=None, code=None):
        self.root = root
        self.obj = obj
        self.path = path
        self.node = node
        self.code = code

    def __str__(self):
        if len(self.path):
            path_str = " in " + repr(self.root) + "→" + "→".join(str(part) for part in self.path)
        else:
            path_str = ""
        obj_repr = repr(self.obj) if self.obj is not None else 'object'
        if self.node is None:
            return f"Could not serialize {obj_repr}{path_str}"
        else:
            return f"Could not serialize {obj_repr}{path_str}, used here:\n{format_node(self.node, self.code)}"


def get_expanded_variables_nodes(
      tree: ast.AST,
      variables: Sequence[str]
) -> Sequence[ast.AST]:
    """
    Extract nodes that correspond to children of given variables
    For instance, if variables is [foo], and the piece of code is
    <func(5, foo.bar + 2)>
    The function will return [<foo.bar>]

    Parameters
    ----------
    tree: ast.AST
    variables: Sequence[str]

    Returns
    -------
    Sequence[ast.AST]
    """
    try:
        if tree.id in variables:
            return [tree]
    except AttributeError:
        pass
    global_variables = list(dict.fromkeys([
        v
        for node in ast.iter_child_nodes(tree)
        for v in get_expanded_variables_nodes(node, variables)
    ]))
    if isinstance(tree, ast.Attribute):
        if len(global_variables):
            return [tree]
    return global_variables


def replace_in_tree(tree: ast.AST, mapping: Mapping[ast.AST, ast.AST]) -> ast.AST:
    """
    Look in `tree` for keys of `mapping` and replace them with their
    associated value.
    This operation is in-place.

    Parameters
    ----------
    tree: ast.AST
    mapping: Mapping[ast.AST, ast.AST]

    Returns
    -------
    ast.AST
    """
    if not len(mapping):
        return tree

    class MapTransformer(ast.NodeTransformer):
        def generic_visit(self, node):
            super().generic_visit(node)
            new_node = mapping.pop(node, None)
            if new_node is not None:
                # print("Found one !", astunparse.unparse(node))
                return new_node
            return node

    res = MapTransformer().visit(tree)

    return res


def make_async_closure(
      calls: Mapping[Callable, Tuple[Callable, ast.AST, ast.AST]],
      rpc_mapping: Iterable[Callable],
) -> Dict[ast.AST, ast.AST]:
    """
    Propagate async/await keywords using parsed
    call statements, and returns a mapping from

    Parameters
    ----------
    calls: Mapping[Callable, Tuple[Callable, ast.AST, ast.AST]]
    rpc_mapping: Iterable[Callable]

    Returns
    -------
    Dict[ast.AST, ast.AST]
    """
    queue = list(rpc_mapping)
    node_mapping = {}
    while len(queue):
        fn = queue.pop(0)
        for caller, function_node, call_node in calls[fn]:
            node_mapping[call_node] = ast.Await(call_node)
            node_mapping[function_node] = make_async_function_def(function_node)
            queue.append(caller)
    return node_mapping


def pack(
      obj,
):
    def serialize(root, instructions):
        def register_variable(obj):
            variable_name = f"var_{id(obj)}"
            object_to_variable[id(obj)] = variable_name
            return variable_name

        def rec(obj: Any, path: Tuple = ()):
            if id(obj) in object_to_variable:
                return ast.Attribute(
                    ast.Name(VARIABLE_STORE),
                    object_to_variable[id(obj)],
                )
            # if isinstance(obj, State):
            #     variable_name = register_variable(obj)
            #     instructions.append(
            #         ast.Assign(
            #             [ast.Attribute(ast.Name(VARIABLE_STORE), variable_name)],
            #             ast.Call(ast.Name(GET_STATE), [ast.Constant(obj._state_id)], {})
            #         ))
            #     return ast.Attribute(ast.Name(VARIABLE_STORE), variable_name)

            # ------ Handle builtins ------
            if obj is None:
                return ast.Constant(None)
            if isinstance(obj, (int, float, bool, str)):
                return ast.Constant(obj)
            # Handle lists and tuples
            elif isinstance(obj, list):
                variable_name = register_variable(obj)
                instructions.append(
                    ast.Assign(
                        [ast.Attribute(ast.Name(VARIABLE_STORE), variable_name)],
                        ast.List([rec(item, (*path, i)) for i, item in enumerate(obj)]),
                    ))
                return ast.Attribute(ast.Name(VARIABLE_STORE), variable_name)
            elif isinstance(obj, tuple):
                variable_name = register_variable(obj)
                instructions.append(
                    ast.Assign(
                        [ast.Attribute(ast.Name(VARIABLE_STORE), variable_name)],
                        ast.Tuple([rec(item, (*path, i)) for i, item in enumerate(obj)]),
                    ))
                return ast.Attribute(ast.Name(VARIABLE_STORE), variable_name)
            elif isinstance(obj, dict):
                variable_name = register_variable(obj)
                instructions.append(
                    ast.Assign(
                        [ast.Attribute(ast.Name(VARIABLE_STORE), variable_name)],
                        ast.Dict(
                            [rec(item, (*path, i)) for i, item in enumerate(obj.keys())],
                            [rec(item, (*path, key)) for key, item in obj.items()],
                        )
                    ))
                return ast.Attribute(ast.Name(VARIABLE_STORE), variable_name)
            elif inspect.isfunction(obj) or inspect.ismethod(obj):
                if getattr(obj, '_transpilable', False):
                    transpile_queue.append(obj)
                    # TODO
                    return ast.Name(obj.__name__)
                else:
                    variable_name = register_variable(obj)
                    rpc_mapping[obj] = variable_name
                    instructions.append(
                        ast.Assign(
                            [ast.Attribute(ast.Name(VARIABLE_STORE), variable_name)],
                            ast.Call(
                                ast.Name(REMOTE_FUNCTION),
                                [ast.Constant(variable_name)],
                                {},
                            ),
                        ))
                    return ast.Attribute(ast.Name(VARIABLE_STORE), variable_name)
                    # = f"{obj.__module__}_{obj.__name__}_{len(rpc_mapping)}"]
            elif hasattr(obj, '__dict__') and getattr(obj.__class__, '_transpilable', False):
                transpile_queue.append(obj)

                variable_name = register_variable(obj)
                instructions.append(
                    ast.Assign(
                        [ast.Attribute(ast.Name(VARIABLE_STORE), variable_name)],
                        ast.Call(
                            ast.Name(DESERIALIZE),
                            [ast.Name(obj.__class__.__name__), rec(obj.__dict__, path)],
                            {},
                        )))
                return ast.Attribute(ast.Name(VARIABLE_STORE), variable_name)

            elif isinstance(obj, type) and getattr(obj, '_transpilable', False):
                transpile_queue.append(obj)
                # TODO
                return ast.Name(obj.__name__)
            else:
                raise SerializationError(root, obj, path)

        return rec(root)

    def prepare_function(fn):
        code = dedent(inspect.getsource(fn))
        tree = ast.parse(code).body[0]

        closure_vars = inspect.getclosurevars(fn)

        node_mapping = {}

        instructions = []
        context = {}

        # For every node that was in the function locals

        def replace_context_in_tree(tree):

            error = first_error = None
            try_to_serialize = False

            # If the node is directly referring to an out of context
            # variable, we will try to serialize it
            if isinstance(tree, ast.Name) and tree.id in closure_vars.globals:
                try_to_serialize = True
            else:
                for node in ast.iter_child_nodes(tree):
                    child_error = replace_context_in_tree(node)
                    if child_error is not None:
                        first_error = child_error
                        break
                if (
                      first_error is not None and (
                      isinstance(tree, ast.Attribute) or
                      isinstance(tree, ast.Subscript))
                ):
                    try_to_serialize = True
            if try_to_serialize:
                node_str = astunparse.unparse(tree)
                try:
                    val = eval(node_str, dict(closure_vars.globals), {})
                except Exception:
                    pass
                else:
                    try:
                        serialized = serialize(val, instructions)
                        if serialized is not None:
                            node_mapping[tree] = serialized
                        return None
                    except SerializationError as e:
                        error = e
                        error.node = tree
                        error.code = code
            return first_error if first_error is not None else error

        error = replace_context_in_tree(tree)
        if error is not None:
            raise error

            # print("MAP:", astunparse.unparse(key).strip(), "=>", astunparse.unparse(node_mapping[key]).strip())

        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                node_str = astunparse.unparse(node.func).strip()
                self_name = fn.__code__.co_varnames[0]
                try:
                    call_func_value = eval(
                        node_str,
                        dict(closure_vars.globals),
                        {self_name: fn.__self__}
                    )
                    calls[call_func_value].append((fn, tree, node_mapping.get(node, node)))
                except (AttributeError, NameError, RuntimeError) as e:
                    pass
                except Exception as e:
                    raise SerializationError(tree, None, (), node, code)

        tree = replace_in_tree(
            tree=tree,
            mapping=node_mapping
        )

        return instructions, [tree]

    def prepare_class(obj):
        seen_functions = set()
        last_super_cls = None

        if isinstance(obj, type):
            cls = obj
            obj = None
        else:
            cls = obj.__class__

        module_class_definitions = []
        module_global_instructions = []

        for super_cls in cls.__mro__[::-1]:

            class_body = []

            counter = 0
            for name, member in inspect.getmembers(super_cls, predicate=lambda o: inspect.isfunction(o) or isinstance(o, property)):
                for mode, func in (
                      [("get", member.fget), ("set", member.fset), ("del", member.fdel)]
                      if isinstance(member, property) else [(None, member)]
                ):
                    if func in seen_functions:
                        continue
                    if not getattr(func, '_transpilable', True):
                        code = dedent(inspect.getsource(func))
                        tree: ast.FunctionDef = ast.parse(code).body[0]
                        globals_instructions = []
                        serialized_func = serialize(func, globals_instructions)
                        module_global_instructions.extend(globals_instructions)
                        call = ast.Call(
                            serialized_func,
                            [ast.Name(a.arg) for a in tree.args.args][1 if hasattr(func, '__self__') else 0:],
                            [ast.keyword(value=tree.args.kwarg)] if tree.args.kwarg else [],
                        )
                        method_tree = ast.AsyncFunctionDef(
                            name=tree.name,
                            args=tree.args,
                            body=[ast.Return(ast.Await(call))],
                            decorator_list=[],
                            returns=None,
                            **(dict(type_comment=tree.type_comment) if hasattr(tree, 'type_comment') else {}),
                        )
                        class_body.append(method_tree)
                        rpc_mapping[getattr(obj, name) if obj is not None else func] = None
                    else:
                        globals_instructions, method_tree = prepare_function(
                            func.__get__(obj) if obj is not None else func,
                        )
                        class_body.extend(method_tree)
                        module_global_instructions.extend(globals_instructions)

                    counter += 1
                    seen_functions.add(func)

            if super_cls in (object, Generic):
                continue

            class_tree = ast.ClassDef(
                super_cls.__name__,
                [ast.Name(last_super_cls.__name__)] if last_super_cls is not None else [],
                {},
                class_body,
                [],
            )

            module_class_definitions.append(class_tree)
            last_super_cls = super_cls

        return module_global_instructions, module_class_definitions

    module_body = []
    transpile_queue = []

    rpc_mapping = {}
    object_to_variable: Dict[Any, str] = {}
    calls = defaultdict(lambda: [])

    if inspect.isfunction(obj) or inspect.ismethod(obj):
        obj = transpilable(obj)

    module_body.append(ast.Assign([ast.Name('IS_JS')], ast.Constant(True)))
    instruction = serialize(obj, module_body)
    if instruction is not None:
        module_body.append(ast.Expr(instruction))
    else:
        module_body.append(ast.Expr(ast.Name(obj.__name__)))

    seen = set()
    while len(transpile_queue):
        to_be_transpiled = transpile_queue.pop(0)

        if inspect.isfunction(to_be_transpiled) or inspect.ismethod(to_be_transpiled):
            if to_be_transpiled in seen:
                continue
            seen.add(to_be_transpiled)
            globals_instructions, trees = prepare_function(
                to_be_transpiled,
            )
        else:
            if not isinstance(to_be_transpiled, type):
                cls = to_be_transpiled.__class__
            else:
                cls = to_be_transpiled

            if cls in seen:
                continue
            seen.add(cls)

            globals_instructions, trees = prepare_class(
                to_be_transpiled,
            )

        module_body[:0] = globals_instructions
        module_body[:0] = trees

    async_node_mapping = make_async_closure(calls, rpc_mapping)

    module_body = [
        replace_in_tree(item, async_node_mapping)
        for item in module_body
    ]

    module = ast.fix_missing_locations(ast.Module(module_body))

    return astunparse.unparse(module), {
        f"var_{id(fn)}": fn for fn in rpc_mapping.keys()
    }


def transpilable(flag):
    def decorate(fn):
        fn._transpilable = flag
        return fn

    if not isinstance(flag, bool):
        return transpilable(True)(flag)
    return decorate


