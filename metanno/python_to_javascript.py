import weakref

import contextlib
import inspect
import os
import re
import sys
from io import StringIO
from textwrap import dedent, indent
from transcrypt.__main__ import main as transcrypt
import json

from collections import defaultdict
import ast
import astunparse


class weakmethod:
    def __init__(self, cls_method):
        self.cls_method = cls_method
        self.instance = None
        self.owner = None

    def __get__(self, instance, owner):
        self.instance = weakref.ref(instance)
        self.owner = owner
        return self

    def __call__(self, *args, **kwargs):
        if self.owner is None:
            raise Exception(f"Function was never bound to a class scope, you should use it as a decorator on a method")
        instance = self.instance()
        if instance is None:
            raise Exception(f"Cannot call {self.owner.__name__}.{self.cls_method.__name__} because instance has been destroyed")
        return self.cls_method(instance, *args, **kwargs)


@contextlib.contextmanager
def redirect_argv(*args):
    sys._argv = sys.argv[:]
    sys.argv = list(args)
    yield
    sys.argv = sys._argv


@contextlib.contextmanager
def capture_stdout():
    new_target = StringIO()
    old_target = sys.stdout
    sys.stdout = new_target
    try:
        yield new_target
    finally:
        sys.stdout = old_target


def get_code_transcrypt(my_code, args=('-b', '-n'), silent=True):
    with open('test.py', 'w') as f:
        f.write(my_code)
    with redirect_argv(*args, 'test.py'):
        with capture_stdout() as output:
            transcrypt()
        print(output.getvalue())
        if "Saving" not in output.getvalue() or "Error" in output.getvalue():
            raise Exception("Could not export your Python app to Javascript with Transcrypt. Here is the log: \n{}".format(output.getvalue()))
    # with open('__target__/org.transcrypt.__runtime__.js') as f:
    #    res = f.read()
    with open('__target__/test.js') as f:
        # re.sub("import([^;]+)from\s+([^;]+)", r"const \1 = require(\2)", res)
        res = f.read()  # re.sub("(import[^;]+from\s+[^;]+;)", r"", f.read())
    with open('__target__/test.map') as f:
        # re.sub("import([^;]+)from\s+([^;]+)", r"const \1 = require(\2)", res)
        sourcemap = json.load(f)  # re.sub("(import[^;]+from\s+[^;]+;)", r"", f.read())
    os.remove('test.py')
    # os.remove('__target__/test.js')
    # os.remove('__target__/test.project')
    # os.remove('__target__/org.transcrypt.__runtime__.js')
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
        # body, index = info["set_info"]

        # if the method is async (ie, kernel_only)
        if method["is_async"] or method["is_rpc"]:
            # for each call to that function, make it an await call
            for call in calls[key]:
                if not call["is_await"]:
                    call["is_await"] = True

                    # make the methods containing these calls async and add them to the queue
                    methods[call["method"]]["is_async"] = True
                    methods_queue.add(call["method"])

#    for key, method in methods.items():
#        print("METHOD", key, "IS ASYNC:", method["is_async"])
#
#    for key, call_set in calls.items():
#        for call in call_set:
#            print("CALL TO", key, "FROM", call["method"], "IS AWAIT", call["is_await"])

    new_async_methods = [method for key, method in methods.items() if method["is_async"]]
    new_await_calls = [call for key, call_set in calls.items() for call in call_set if call["is_await"]]

    nodes_map = {}

    for info in new_async_methods:
        node = info["node"]
        nodes_map[node] = ast.AsyncFunctionDef(
            name=node.name,
            args=node.args,
            body=node.body,
            decorator_list=node.decorator_list,
            returns=node.returns,
            type_comment=node.type_comment,
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
            except:
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
    for super_cls in cls.__mro__[::-1]:
        if super_cls is object:
            continue
        if len(super_cls.__mro__) >= 2:
            cls_code = f"class {super_cls.__name__}({super_cls.__mro__[1].__name__}):\n"
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
        if counter == 0:
            cls_code += indent("pass", "    ") + "\n"
        appcode += cls_code + "\n"

    appcode = make_async(appcode)

    if return_python:
        return appcode

    code_string, sourcemap = get_code_transcrypt(appcode, ('-b', '-n', '-m', '-p', 'window',), silent=silent)
    code_string = re.sub('export var ', 'var        ', code_string)
    code_string = re.sub("(import[^;]+from\s+[^;]+;)", r"", code_string)
    code_string = f"{code_string}\nvar IS_JS=true;\n{cls.__name__}"
    return code_string, appcode, sourcemap["mappings"]
