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


def get_code_transkrypt(my_code, args=('-b', '-n'), silent=True):
    with open('test.py', 'w') as f:
        f.write(my_code)
    with redirect_argv(*args, 'test.py'):
        with capture_stdout() as output:
            transcrypt()
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


def transkrypt_class(cls, return_python=False, silent=True):
    def fullname(o):
        module = o.__module__
        if module is None or module == str.__class__.__module__:
            return o.__name__  # Avoid reporting __builtin__
        else:
            return module + '.' + o.__name__

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

    if return_python:
        return appcode

    codeString, sourcemap = get_code_transkrypt(appcode, ('-b', '-n', '-m', '-p', 'window'), silent=silent)
    codeString = re.sub('export var ', 'var        ', codeString)
    codeString = re.sub("(import[^;]+from\s+[^;]+;)", r"", codeString)
    codeString = f"{codeString}\nvar IS_JS=true;\n{cls.__name__}"
    return codeString, appcode, sourcemap["mappings"]
