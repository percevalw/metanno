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
from textwrap import dedent, indent
from typing import Generic

import astunparse

from metanno_transcrypt.__main__ import main as transcrypt

TEMP_DIR = Path("/tmp/metanno-transcrypt")


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


def get_code_transcrypt(my_code, args=('-b', '-n')):
    os.makedirs(TEMP_DIR, exist_ok=True)
    with open(TEMP_DIR/'test.py', 'w') as f:
        f.write(my_code)
    with redirect_argv(*args, TEMP_DIR/'test.py'):
        with capture_stdout() as output:
            transcrypt()
        print(output.getvalue())
        if "Saving" not in output.getvalue() or "Error" in output.getvalue():
            raise Exception("Could not export your Python app to Javascript with Transcrypt. Here is the log: \n{}".format(output.getvalue()))
    res = (TEMP_DIR/'__target__'/'test.js').read_text()
    sourcemap = json.loads((TEMP_DIR/'__target__'/'test.map').read_text())
    return res, sourcemap


kernel_only_js_template = """
@kernel_only
def {func_name}(self, *args):
    return "{func_name}"
"""

produce_js_template = """
@produce
def {func_name}(self, *args):
    return "{func_name}"
"""


def make_async(code):
    tree = ast.parse(code)

    # list every app methods
    # and every call to those methods
    calls = defaultdict(lambda: [])
    methods = {}

    for class_node in ast.walk(tree):
        if not isinstance(class_node, ast.ClassDef):
            continue
        for i, method_node in enumerate(class_node.body):
            if not isinstance(method_node, ast.FunctionDef):
                continue

            # Check if it has a decorator
            is_rpc = is_static = False
            for decorator in method_node.decorator_list:
                if isinstance(decorator, ast.Name) and decorator.id == 'staticmethod':
                    is_static = True
                if isinstance(decorator, ast.Name) and decorator.id == 'kernel_only':
                    is_rpc = True

            methods[(class_node.name, method_node.name)] = {
                "node": method_node,
                "is_async": False,
                "is_rpc": is_rpc,
            }
            for node in ast.walk(method_node):
                try:
                    if node.func.value.id == "self":
                        calls[(class_node.name, node.func.attr)].append({
                            "node": node,
                            "is_await": False,
                            "method": (class_node.name, method_node.name),
                        })
                except AttributeError:  # only expect id to exist for Name objs
                    pass

    methods_queue = set(methods.keys())  # keys of methods
    while len(methods_queue):
        key = methods_queue.pop()
        method = methods[key]

        # if the method is async (ie, kernel_only)
        if method["is_async"] or method["is_rpc"]:
            # for each call to that function, make it an await call
            for call in calls[key]:
                if not call["is_await"]:
                    call["is_await"] = True

                    # make the methods containing these calls async and add them to the queue
                    methods[call["method"]]["is_async"] = True
                    methods_queue.add(call["method"])

    new_async_methods = [method for key, method in methods.items() if method["is_async"]]
    new_await_calls = [call for key, call_set in calls.items() for call in call_set if call["is_await"]]

    nodes_map = {}

    for info in new_async_methods:
        node = info["node"]
        if hasattr(node, 'type_comment'):
            nodes_map[node] = ast.AsyncFunctionDef(
                name=node.name,
                args=node.args,
                body=node.body,
                decorator_list=node.decorator_list,
                returns=node.returns,
                type_comment=node.type_comment,
            )
        else:
            nodes_map[node] = ast.AsyncFunctionDef(
                name=node.name,
                args=node.args,
                body=node.body,
                decorator_list=node.decorator_list,
                returns=node.returns,
            )

    for info in new_await_calls:
        node = info["node"]
        nodes_map[node] = ast.Await(
            node
        )

    class MapTransformer(ast.NodeTransformer):
        def generic_visit(self, node):
            super().generic_visit(node)
            new_node = nodes_map.pop(node, None)
            if new_node is not None:
                return new_node
            try:
                attr = node.func.attr
                if attr == "values":
                    return ast.Call(ast.Name("__values__"), [node.func.value], {})
                if attr == "keys":
                    return ast.Call(ast.Name("__keys__"), [node.func.value], {})
                if attr == "items":
                    return ast.Call(ast.Name("__items__"), [node.func.value], {})
            except Exception:
                pass
            return node

    tree = ast.fix_missing_locations(MapTransformer().visit(tree))

    if hasattr(ast, 'unparse'):
        return ast.unparse(tree)
    else:
        return astunparse.unparse(tree)


def transcrypt_class(cls, return_python=False, silent=True):
    appcode = ""
    seen_functions = set()
    last_super_cls = None
    for super_cls in cls.__mro__[::-1]:
        if last_super_cls is not None:
            cls_code = f"class {super_cls.__name__}({last_super_cls.__name__}):\n"
        else:
            cls_code = f"class {super_cls.__name__}:\n"
        counter = 0
        for name, func in inspect.getmembers(super_cls, predicate=inspect.isfunction):
            if func in seen_functions:
                continue
            if getattr(func, '_kernel_only', False):
                func_code = kernel_only_js_template.format(func_name=func.__name__)
            else:
                func_code = dedent(inspect.getsource(func))
            counter += 1
            seen_functions.add(func)
            cls_code += indent(func_code, "    ") + "\n"

        for name, prop_func in inspect.getmembers(super_cls, predicate=lambda o: isinstance(o, property)):
            for mode, func in [("get", prop_func.fget), ("set", prop_func.fset), ("del", prop_func.fdel)]:
                if func is None:
                    continue
                if func in seen_functions:
                    continue
                if getattr(func, '_kernel_only', False):
                    func_code = kernel_only_js_template.format(func_name=func.__name__)
                else:
                    func_code = dedent(inspect.getsource(func))
                # if mode == "get":
                #     func_code = f"@property\n{func_code}"
                # elif mode == "set":
                #     func_code = f"@{name}.setter\n{func_code}"
                # elif mode == "del":
                #     func_code = f"@{name}.deleter\n{func_code}"
                counter += 1
                seen_functions.add(func)
                cls_code += indent(func_code, "    ") + "\n"

        if counter == 0:
            cls_code += indent("pass", "    ") + "\n"

        if super_cls in (object, Generic):
            continue

        appcode += cls_code + "\n"
        last_super_cls = super_cls

    appcode = make_async(appcode)

    if return_python:
        return appcode

    code_string, sourcemap = get_code_transcrypt(
        appcode,
        ('-b', '-n', '-m', '-p', 'window',)
    )
    code_string = re.sub('export var ', 'var        ', code_string)
    code_string = re.sub(r"(import[^;]+from\s+[^;]+;)", r"", code_string)
    code_string = f"{code_string}\nvar IS_JS=true;\n{cls.__name__}"
    return code_string, appcode, sourcemap["mappings"]
