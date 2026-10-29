"""
Metanno application helpers and lazily loaded widget APIs
"""

from .version import __version__

__all__ = [
    "AnnotatedText",
    "AnnotatedImage",
    "Table",
    "DataRelation",
    "DataWidgetFactory",
    "view_opener",
    "Column",
    "RecipeTable",
]


def __getattr__(name):
    """
    Load application and widget APIs on first use
    """
    if name in ("AnnotatedText", "AnnotatedImage", "Table"):
        from . import ui as module
    elif name in ("DataRelation", "DataWidgetFactory"):
        from .recipes import data_widget_factory as module
    elif name == "view_opener":
        from .viewer import view_opener as module
    elif name in ("Column", "RecipeTable"):
        from .viewer import recipes as module
    else:
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
    value = getattr(module, name)
    globals()[name] = value
    return value
