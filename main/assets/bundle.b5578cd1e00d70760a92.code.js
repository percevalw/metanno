if(window.pret_modules===undefined){window.pret_modules={};}
var pret_modules=window.pret_modules;
pret_modules.js=window;
pret_modules['json']=(function(){var __name__ = "json";


function __ensure_ascii(s) {
  return s.replace(/[\u007F-\uFFFF]/g,
    function(c) {
      var hex = c.charCodeAt(0).toString(16).padStart(4, "0");
      return "\\u" + hex;
    });
}

function __sort_keys(value) {
  if (Array.isArray(value)) {
    return value.map(__sort_keys);
  } else if (value !== null && typeof value === "object") {
    var out = {};
    Object.keys(value).sort().forEach(function(k) {
      out [k] = __sort_keys(value [k]);
    });
    return out;
  }
  return value;
}

function dumps(obj /* …kwargs */) {

  var kwargs = arguments.length > 1 ? arguments [arguments.length - 1] : null;
  if (!kwargs || !kwargs.__kwargtrans__) {
    kwargs = {};
  }

  var indent = kwargs.indent ?? null;
  var sort_keys = kwargs.sort_keys ?? false;
  var ensure_ascii = kwargs.ensure_ascii ?? true;
  var default_fn = kwargs.default ?? null;
  var allow_nan = kwargs.allow_nan ?? true;


  function replacer(key, value) {

    var val = value;

    if (typeof val === "number") {
      if (!allow_nan && (!isFinite(val))) {
        throw __builtins__.ValueError("Out of range float values are not JSON compliant");
      }

    }
    if (val === undefined || typeof val === "function" || typeof val === "symbol") {

      return undefined;
    }
    if (val !== null && typeof val === "object") {
      return val;
    }
    return val;
  }


  var to_dump = sort_keys ? __sort_keys(obj) : obj;

  var jsonStr = JSON.stringify(
    to_dump,
    default_fn
      ? function(k, v) {

        try {
          return replacer(k, v);
        } catch (e) {
          throw e;
        }

      }
      : replacer,
    indent
  );

  if (ensure_ascii) {
    jsonStr = __ensure_ascii(jsonStr);
  }
  return jsonStr;
}

function loads(s /* …kwargs */) {
  var kwargs = arguments.length > 1 ? arguments [arguments.length - 1] : null;
  if (!kwargs || !kwargs.__kwargtrans__) {
    kwargs = {};
  }

  var object_hook = kwargs.object_hook ?? null;
  var parse_float = kwargs.parse_float ?? null;
  var parse_int = kwargs.parse_int ?? null;
  var parse_constant = kwargs.parse_constant ?? null;


  function reviver(key, value) {
    if (typeof value === "string") {
      if (parse_constant && (value === "NaN" || value === "Infinity" || value === "-Infinity")) {
        return parse_constant(value);
      }
    }
    if (typeof value === "number") {
      if (!Number.isInteger(value) && parse_float) {
        return parse_float(String(value));
      } else if (Number.isInteger(value) && parse_int) {
        return parse_int(String(value));
      }
    }
    return value;
  }

  var result = JSON.parse(s, (parse_float || parse_int || parse_constant) ? reviver : undefined);

  if (object_hook && result !== null && typeof result === "object" && !Array.isArray(result)) {
    return object_hook(result);
  }
  return result;
}


//# sourceMappingURL=json.map
return {dumps, loads};})();

pret_modules['typing']=(function(){// Transcrypt'ed from Python, 2026-05-09 22:39:58
var { AssertionError, AttributeError, BaseException, DeprecationWarning, Exception, IndexError, IterableError, KeyError, NotImplementedError, RuntimeWarning, StopIteration, UserWarning, ValueError, Warning, __JsIterator__, __PyIterator__, __Terminal__, __add__, __and__, __call__, __envir__, __eq__, __floordiv__, __ge__, __get__, __getcm__, __getitem__, __getslice__, __getsm__, __gt__, __i__, __iadd__, __iand__, __idiv__, __ijsmod__, __ilshift__, __imatmul__, __imod__, __imul__, __in__, __init__, __ior__, __ipow__, __irshift__, __isub__, __ixor__, __jsUsePyNext__, __jsmod__, __k__, __kwargtrans__, __le__, __lshift__, __lt__, __matmul__, __mergefields__, __mergekwargtrans__, __mod__, __mul__, __ne__, __neg__, __nest__, __or__, __pow__, __pragma__, __proxy__, __pyUseJsNext__, __rshift__, __setitem__, __setproperty__, __setslice__, __sort__, __specialattrib__, __sub__, __super__, __t__, __terminal__, __truediv__, __withblock__, __xor__, _class_, abs, all, any, assert, bool, bytearray, bytes, callable, chr, copy, deepcopy, delattr, dict, dir, divmod, enumerate, filter, float, getattr, hasattr, input, int, isinstance, issubclass, len, list, map, max, min, object, ord, pow, print, property, py_TypeError, py_iter, py_metatype, py_next, py_reversed, py_typeof, range, repr, round, set, setattr, sorted, str, sum, tuple, zip } = pret_modules['org.transcrypt.__runtime__'];
var __name__ = 'typing';var ClassVar = 'ClassVar';

//# sourceMappingURL=typing.map
return {ClassVar};})();

pret_modules['weakref']=(function(){var { _class_, object, __get__, py_TypeError, py_KeyError } = pret_modules['org.transcrypt.__runtime__'];

var __name__ = "weakref";

var ref = _class_("ref", [object], {
  __module__: __name__,

  get __init__() {
    return __get__(this, function(self, obj, callback) {
      // obj: the target object to reference weakly
      // callback: optional function to call with the ref instance when obj is GC’ed

      // Store a WeakRef to the target object
      self._ref = new WeakRef(obj);

      if (callback !== undefined && callback !== null) {
        // Capture `self` to use inside the FinalizationRegistry callback
        var _self = self;
        // Create a FinalizationRegistry that will invoke `callback(_self)`
        self._registry = new FinalizationRegistry(function(heldValue) {
          // heldValue is the ref instance (i.e., _self)
          try {
            // Invoke callback, passing the weakref instance
            callback(heldValue);
          } catch (err) {
            // Silently ignore exceptions in the user’s callback
          }
        });
        // Register the target object with the registry, holding `self` as token
        self._registry.register(obj, _self);
      }
    });
  },

  // __call__ returns the referenced object or null if it has been collected
  get __call__() {
    return __get__(this, function(self) {
      var deref = self._ref.deref();
      // In JavaScript, WeakRef.deref() returns `undefined` if collected
      return (deref === undefined ? null : deref);
    });
  },

  // Optionally, allow checking if the referent is still alive:
  get alive() {
    return __get__(this, function(self) {
      return (self._ref.deref() !== undefined);
    });
  }
});

var WeakKeyDictionary = _class_("WeakKeyDictionary", [object], {
  __module__: __name__,

  get __init__() {
    return __get__(this, function(self) {
      // Underlying WeakMap holds keys weakly
      self._wm = new WeakMap();
    });
  },

  get __setitem__() {
    return __get__(this, function(self, key, value) {
      // Keys must be non-null objects
      if ((typeof key !== "object" && typeof key !== "function") || key === null) {
        throw py_TypeError("WeakKeyDictionary keys must be objects");
      }
      self._wm.set(key, value);
    });
  },

  get __getitem__() {
    return __get__(this, function(self, key) {
      var val = self._wm.get(key);
      if (val === undefined) {
        // If `undefined`, either key not present or stored value was actually `undefined`.
        // We assume no one stores literal `undefined` as a value; mimic Python KeyError.
        throw py_KeyError(key);
      }
      return val;
    });
  },

  get __delitem__() {
    return __get__(this, function(self, key) {
      var success = self._wm.delete(key);
      if (!success) {
        throw py_KeyError(key);
      }
    });
  },

  get __contains__() {
    return __get__(this, function(self, key) {
      return self._wm.has(key);
    });
  },

  // get(key, default=None)
  get get() {
    return __get__(this, function(self, key, defaultValue) {
      if (defaultValue === undefined) {
        defaultValue = null;  // Transcrypt maps None → null
      }
      var val = self._wm.get(key);
      return (val === undefined ? defaultValue : val);
    });
  },

  // pop(key, default=_marker): if key missing and default not given, raise KeyError
  get pop() {
    return __get__(this, function(self, key, defaultValue) {
      var has = self._wm.has(key);
      if (!has) {
        if (defaultValue === undefined) {
          throw py_KeyError(key);
        }
        return defaultValue;
      }
      var val = self._wm.get(key);
      self._wm.delete(key);
      return val;
    });
  },

  // Optional: clear all entries (not typical in a real WeakMap, but we can recreate it)
  get clear() {
    return __get__(this, function(self) {
      self._wm = new WeakMap();
    });
  }
});

var WeakValueDictionary = _class_("WeakValueDictionary", [object], {
  __module__: __name__,

  get __init__() {
    return __get__(this, function(self) {
      // Underlying Map holds keys → WeakRef(value)
      self._map = new Map();

      // FinalizationRegistry will receive the key as “heldValue” when a value is GC’ed
      var _self = self;
      self._registry = new FinalizationRegistry(function(heldKey) {
        // Remove the entry for that key when its value is collected
        try {
          _self._map.delete(heldKey);
        } catch (err) {
          // Silently ignore if deletion fails
        }
      });
    });
  },

  get __setitem__() {
    return __get__(this, function(self, key, value) {
      // Create a WeakRef to the value
      var wref = new WeakRef(value);
      self._map.set(key, wref);
      // Register the value; when it’s GC’ed, callback gets “heldKey”
      self._registry.register(value, key);
    });
  },

  get __getitem__() {
    return __get__(this, function(self, key) {
      var wref = self._map.get(key);
      if (wref === undefined) {
        throw py_KeyError(key);
      }
      var val = wref.deref();
      if (val === undefined) {
        // Value was collected; remove stale entry and raise KeyError
        self._map.delete(key);
        throw py_KeyError(key);
      }
      return val;
    });
  },

  get __delitem__() {
    return __get__(this, function(self, key) {
      var existed = self._map.delete(key);
      if (!existed) {
        throw py_KeyError(key);
      }
    });
  },

  get __contains__() {
    return __get__(this, function(self, key) {
      var wref = self._map.get(key);
      if (wref === undefined) {
        return false;
      }
      var val = wref.deref();
      if (val === undefined) {
        // Stale entry; clean it up
        self._map.delete(key);
        return false;
      }
      return true;
    });
  },

  // get(key, default=None)
  get py_get() {
    return __get__(this, function(self, key, defaultValue) {
      if (defaultValue === undefined) {
        defaultValue = null;
      }
      var wref = self._map.get(key);
      if (wref === undefined) {
        return defaultValue;
      }
      var val = wref.deref();
      if (val === undefined) {
        self._map.delete(key);
        return defaultValue;
      }
      return val;
    });
  },

  // pop(key, default=_marker)
  get py_pop() {
    return __get__(this, function(self, key, defaultValue) {
      var wref = self._map.get(key);
      if (wref === undefined) {
        if (defaultValue === undefined) {
          throw py_KeyError(key);
        }
        return defaultValue;
      }
      var val = wref.deref();
      self._map.delete(key);
      if (val === undefined) {
        if (defaultValue === undefined) {
          throw py_KeyError(key);
        }
        return defaultValue;
      }
      return val;
    });
  },

  // items(): generator that yields [key, value] pairs for live values
  get py_items() {
    return __get__(this, function* (self) {
      for (var pair of self._map.entries()) {
        var key = pair[0];
        var wref = pair[1];
        var val = wref.deref();
        if (val === undefined) {
          // Clean up stale
          self._map.delete(key);
        } else {
          yield [key, val];
        }
      }
    });
  },

  // clear all entries
  get py_clear() {
    return __get__(this, function(self) {
      self._map = new Map();
    });
  },

  get py_keys() {
    return __get__(this, function* (self) {
      for (var pair of self._map.entries()) {
        var key = pair[0];
        var wref = pair[1];
        var val = wref.deref();
        if (val === undefined) {
          self._map.delete(key);
        } else {
          yield key;
        }
      }
    });
  }
});

//# sourceMappingURL=weakref.map
return {ref, WeakKeyDictionary, WeakValueDictionary};})();

// Transcrypt'ed from Python, 2026-05-09 22:39:57
var { AssertionError, AttributeError, BaseException, DeprecationWarning, Exception, IndexError, IterableError, KeyError, NotImplementedError, RuntimeWarning, StopIteration, UserWarning, ValueError, Warning, __JsIterator__, __PyIterator__, __Terminal__, __add__, __and__, __call__, __envir__, __eq__, __floordiv__, __ge__, __get__, __getcm__, __getitem__, __getslice__, __getsm__, __gt__, __i__, __iadd__, __iand__, __idiv__, __ijsmod__, __ilshift__, __imatmul__, __imod__, __imul__, __in__, __init__, __ior__, __ipow__, __irshift__, __isub__, __ixor__, __jsUsePyNext__, __jsmod__, __k__, __kwargtrans__, __le__, __lshift__, __lt__, __matmul__, __mergefields__, __mergekwargtrans__, __mod__, __mul__, __ne__, __neg__, __nest__, __or__, __pow__, __pragma__, __proxy__, __pyUseJsNext__, __rshift__, __setitem__, __setproperty__, __setslice__, __sort__, __specialattrib__, __sub__, __super__, __t__, __terminal__, __truediv__, __withblock__, __xor__, _class_, abs, all, any, assert, bool, bytearray, bytes, callable, chr, copy, deepcopy, delattr, dict, dir, divmod, enumerate, filter, float, getattr, hasattr, input, int, isinstance, issubclass, len, list, map, max, min, ord, pow, print, property, py_TypeError, py_iter, py_metatype, py_next, py_reversed, py_typeof, range, repr, round, set, setattr, sorted, str, sum, tuple, zip } = pret_modules['org.transcrypt.__runtime__'];
var { dumps } = pret_modules['json'];
var { loads } = pret_modules['json'];
var { WeakValueDictionary } = pret_modules['weakref'];
var { WeakKeyDictionary } = pret_modules['weakref'];
var { Sequence } = pret_modules['typing'];
var { object } = pret_modules['org.transcrypt.__runtime__'];
var { Optional } = pret_modules['typing'];
var { List } = pret_modules['typing'];
var { Dict } = pret_modules['typing'];
var { Any } = pret_modules['typing'];
var __name__ = '__main__';var pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_0 = function (children, props, py_to_react) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'children': var children = __allkwargs0__ [__attrib0__]; break;
					case 'props': var props = __allkwargs0__ [__attrib0__]; break;
					case 'py_to_react': var py_to_react = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var render = function () {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
				}
			}
		}
		else {
		}
		return py_to_react (...(children), __kwargtrans__ (props));
	};
	return render;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_1 = function (children, props, py_to_react) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'children': var children = __allkwargs0__ [__attrib0__]; break;
					case 'props': var props = __allkwargs0__ [__attrib0__]; break;
					case 'py_to_react': var py_to_react = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var render = function () {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
				}
			}
		}
		else {
		}
		return py_to_react (...(children), __kwargtrans__ (props));
	};
	return render;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_2 = function (children, props, py_to_react) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'children': var children = __allkwargs0__ [__attrib0__]; break;
					case 'props': var props = __allkwargs0__ [__attrib0__]; break;
					case 'py_to_react': var py_to_react = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var render = function () {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
				}
			}
		}
		else {
		}
		return py_to_react (...(children), __kwargtrans__ (props));
	};
	return render;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_x_3 = function (children, create_fn, props) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'children': var children = __allkwargs0__ [__attrib0__]; break;
					case 'create_fn': var create_fn = __allkwargs0__ [__attrib0__]; break;
					case 'props': var props = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var render_x = function () {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
				}
			}
		}
		else {
		}
		return create_fn (...(children), __kwargtrans__ (props));
	};
	return render_x;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_TextWidget_6 = function (AnnotatedText, Any, Dict, List, Optional, Ref, Sequence, div, get_first_selected_row_idx, normalize_selected_rows, transact, use_effect, use_event_callback, use_imperative_handle, use_ref, use_state, use_store_snapshot, begin_key, button_key, container_renderer, data_store, deep_get_store, docs_mode, empty_store, end_key, get_adjacent_doc_idx, get_selected_span_indices, handle, handles, label_formatter, label_key, labels, local_spans_store, on_add_span, on_change_text_id, on_click_span, on_hover_spans, selected_doc_rows_store, selected_rows_by_store, selected_span_rows_store, span_field_by_key, spans_path_parts, spans_primary_key, store_spans_key, store_text_key, style, style_key, sync_parent_widgets, sync_store_selection, text_key, text_path_parts, text_primary_key, toolbar_state, toolbar_view) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'AnnotatedText': var AnnotatedText = __allkwargs0__ [__attrib0__]; break;
					case 'Any': var Any = __allkwargs0__ [__attrib0__]; break;
					case 'Dict': var Dict = __allkwargs0__ [__attrib0__]; break;
					case 'List': var List = __allkwargs0__ [__attrib0__]; break;
					case 'Optional': var Optional = __allkwargs0__ [__attrib0__]; break;
					case 'Ref': var Ref = __allkwargs0__ [__attrib0__]; break;
					case 'Sequence': var Sequence = __allkwargs0__ [__attrib0__]; break;
					case 'div': var div = __allkwargs0__ [__attrib0__]; break;
					case 'get_first_selected_row_idx': var get_first_selected_row_idx = __allkwargs0__ [__attrib0__]; break;
					case 'normalize_selected_rows': var normalize_selected_rows = __allkwargs0__ [__attrib0__]; break;
					case 'transact': var transact = __allkwargs0__ [__attrib0__]; break;
					case 'use_effect': var use_effect = __allkwargs0__ [__attrib0__]; break;
					case 'use_event_callback': var use_event_callback = __allkwargs0__ [__attrib0__]; break;
					case 'use_imperative_handle': var use_imperative_handle = __allkwargs0__ [__attrib0__]; break;
					case 'use_ref': var use_ref = __allkwargs0__ [__attrib0__]; break;
					case 'use_state': var use_state = __allkwargs0__ [__attrib0__]; break;
					case 'use_store_snapshot': var use_store_snapshot = __allkwargs0__ [__attrib0__]; break;
					case 'begin_key': var begin_key = __allkwargs0__ [__attrib0__]; break;
					case 'button_key': var button_key = __allkwargs0__ [__attrib0__]; break;
					case 'container_renderer': var container_renderer = __allkwargs0__ [__attrib0__]; break;
					case 'data_store': var data_store = __allkwargs0__ [__attrib0__]; break;
					case 'deep_get_store': var deep_get_store = __allkwargs0__ [__attrib0__]; break;
					case 'docs_mode': var docs_mode = __allkwargs0__ [__attrib0__]; break;
					case 'empty_store': var empty_store = __allkwargs0__ [__attrib0__]; break;
					case 'end_key': var end_key = __allkwargs0__ [__attrib0__]; break;
					case 'get_adjacent_doc_idx': var get_adjacent_doc_idx = __allkwargs0__ [__attrib0__]; break;
					case 'get_selected_span_indices': var get_selected_span_indices = __allkwargs0__ [__attrib0__]; break;
					case 'handle': var handle = __allkwargs0__ [__attrib0__]; break;
					case 'handles': var handles = __allkwargs0__ [__attrib0__]; break;
					case 'label_formatter': var label_formatter = __allkwargs0__ [__attrib0__]; break;
					case 'label_key': var label_key = __allkwargs0__ [__attrib0__]; break;
					case 'labels': var labels = __allkwargs0__ [__attrib0__]; break;
					case 'local_spans_store': var local_spans_store = __allkwargs0__ [__attrib0__]; break;
					case 'on_add_span': var on_add_span = __allkwargs0__ [__attrib0__]; break;
					case 'on_change_text_id': var on_change_text_id = __allkwargs0__ [__attrib0__]; break;
					case 'on_click_span': var on_click_span = __allkwargs0__ [__attrib0__]; break;
					case 'on_hover_spans': var on_hover_spans = __allkwargs0__ [__attrib0__]; break;
					case 'selected_doc_rows_store': var selected_doc_rows_store = __allkwargs0__ [__attrib0__]; break;
					case 'selected_rows_by_store': var selected_rows_by_store = __allkwargs0__ [__attrib0__]; break;
					case 'selected_span_rows_store': var selected_span_rows_store = __allkwargs0__ [__attrib0__]; break;
					case 'span_field_by_key': var span_field_by_key = __allkwargs0__ [__attrib0__]; break;
					case 'spans_path_parts': var spans_path_parts = __allkwargs0__ [__attrib0__]; break;
					case 'spans_primary_key': var spans_primary_key = __allkwargs0__ [__attrib0__]; break;
					case 'store_spans_key': var store_spans_key = __allkwargs0__ [__attrib0__]; break;
					case 'store_text_key': var store_text_key = __allkwargs0__ [__attrib0__]; break;
					case 'style': var style = __allkwargs0__ [__attrib0__]; break;
					case 'style_key': var style_key = __allkwargs0__ [__attrib0__]; break;
					case 'sync_parent_widgets': var sync_parent_widgets = __allkwargs0__ [__attrib0__]; break;
					case 'sync_store_selection': var sync_store_selection = __allkwargs0__ [__attrib0__]; break;
					case 'text_key': var text_key = __allkwargs0__ [__attrib0__]; break;
					case 'text_path_parts': var text_path_parts = __allkwargs0__ [__attrib0__]; break;
					case 'text_primary_key': var text_primary_key = __allkwargs0__ [__attrib0__]; break;
					case 'toolbar_state': var toolbar_state = __allkwargs0__ [__attrib0__]; break;
					case 'toolbar_view': var toolbar_view = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var TextWidget = function () {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
				}
			}
		}
		else {
		}
		var parent_selected_idx = dict ({});
		for (var i = 1; i < len (text_path_parts); i++) {
			var parent_path = '.'.join (text_path_parts.__getslice__ (0, i, 1));
			var parent_rows = use_store_snapshot (selected_rows_by_store [parent_path]).py_get ('rows');
			parent_selected_idx [parent_path] = get_first_selected_row_idx (parent_rows);
		}
		if (spans_path_parts !== null) {
			for (var i = 1; i < len (spans_path_parts); i++) {
				var parent_path = '.'.join (spans_path_parts.__getslice__ (0, i, 1));
				var snap = use_store_snapshot (selected_rows_by_store [parent_path]);
				if (__in__ (parent_path, parent_selected_idx)) {
					continue;
				}
				var parent_rows = snap.py_get ('rows');
				parent_selected_idx [parent_path] = get_first_selected_row_idx (parent_rows);
			}
		}
		var text_context_key = '|'.join ((function () {
			var __accu0__ = [];
			for (var i = 1; i < len (text_path_parts); i++) {
				__accu0__.append ('{}:{}'.format ('.'.join (text_path_parts.__getslice__ (0, i, 1)), parent_selected_idx.py_get ('.'.join (text_path_parts.__getslice__ (0, i, 1)))));
			}
			return py_iter (__accu0__);
		}) ()) || 'root';
		var text_store = deep_get_store (data_store, text_path_parts, parent_selected_idx) || empty_store;
		var spans_store = (spans_path_parts !== null ? deep_get_store (data_store, spans_path_parts, parent_selected_idx) || empty_store : local_spans_store);
		var text_data = use_store_snapshot (text_store);
		var span_data = use_store_snapshot (spans_store);
		var selected_doc_rows_snapshot = use_store_snapshot (selected_doc_rows_store);
		var selected_span_rows_snapshot = use_store_snapshot (selected_span_rows_store);
		var toolbar_snapshot = use_store_snapshot (toolbar_state);
		var __left0__ = use_state (dict ({}));
		var selected_ranges_by_doc = __left0__ [0];
		var set_selected_ranges_by_doc = __left0__ [1];
		var __left0__ = use_state ([]);
		var highlighted = __left0__ [0];
		var set_highlighted = __left0__ [1];
		var last_action_id_ref = use_ref (0);
		var __left0__ = use_state (null);
		var active_doc_id = __left0__ [0];
		var set_active_doc_id = __left0__ [1];
		var text_ref = use_ref ();
		var text_refs_by_doc = use_ref (dict ({}));
		var pending_span_ids_ref = use_ref (null);
		var pending_scroll_top_doc_id_ref = use_ref (null);
		var pending_scroll_span_id_ref = use_ref (null);
		var pending_scroll_doc_id_ref = use_ref (null);
		var suppress_next_empty_select_clear_ref = use_ref (false);
		var is_mounting_ref = use_ref (true);
		var last_non_empty_selected_ranges_by_doc_ref = use_ref (dict ({}));
		var selected_doc_indices = normalize_selected_rows (selected_doc_rows_snapshot.py_get ('rows'), null, len (text_data));
		var lead_doc_idx = (len (selected_doc_indices) > 0 ? selected_doc_indices [0] : (len (text_data) > 0 ? 0 : null));
		if (docs_mode == 'all') {
			var visible_doc_indices = list (range (len (text_data)));
		}
		else if (docs_mode == 'selected') {
			var visible_doc_indices = selected_doc_indices;
		}
		else {
			var visible_doc_indices = (lead_doc_idx !== null ? [lead_doc_idx] : []);
		}
		var doc_idx_by_id = dict ({});
		for (var [idx, row] of enumerate (text_data)) {
			var doc_id = row.py_get (text_primary_key);
			if (doc_id === null) {
				continue;
			}
			doc_idx_by_id [str (doc_id)] = idx;
		}
		var visible_doc_ids = (function () {
			var __accu0__ = [];
			for (var idx of visible_doc_indices) {
				if (text_data [idx].py_get (text_primary_key) !== null) {
					__accu0__.append (str (text_data [idx].py_get (text_primary_key)));
				}
			}
			return __accu0__;
		}) ();
		var doc_ref_key_by_id = dict ({});
		var doc_ref_key_by_idx = dict ({});
		for (var doc_idx of visible_doc_indices) {
			if (doc_idx === null || !((0 <= doc_idx && doc_idx < len (text_data)))) {
				continue;
			}
			var doc_id = text_data [doc_idx].py_get (text_primary_key);
			if (doc_id !== null) {
				var ref_key = '{}|doc:{}'.format (text_context_key, doc_id);
				doc_ref_key_by_id [str (doc_id)] = ref_key;
			}
			else {
				var ref_key = '{}|idx:{}'.format (text_context_key, doc_idx);
			}
			doc_ref_key_by_idx [doc_idx] = ref_key;
		}
		if (docs_mode != 'lead') {
			var active_ref_keys = set (doc_ref_key_by_idx.py_values ());
			text_refs_by_doc.current = (function () {
				var __accu0__ = [];
				for (var [key, ref] of text_refs_by_doc.current.py_items ()) {
					if (__in__ (key, active_ref_keys)) {
						__accu0__.append ([key, ref]);
					}
				}
				return dict (__accu0__);
			}) ();
		}
		var selected_span_idx = get_first_selected_row_idx (selected_span_rows_snapshot.py_get ('rows'));
		var move_mode = bool (toolbar_snapshot.py_get ('move_mode', false));
		var selected_span_doc_id = null;
		if (isinstance (selected_span_idx, int) && !(isinstance (selected_span_idx, bool)) && (0 <= selected_span_idx && selected_span_idx < len (span_data))) {
			var span_doc_id = span_data [selected_span_idx].py_get (text_primary_key);
			if (span_doc_id !== null) {
				var selected_span_doc_id = str (span_doc_id);
			}
		}
		var get_doc_id_by_idx = function (idx) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'idx': var idx = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (idx === null || !((0 <= idx && idx < len (text_data)))) {
				return null;
			}
			return text_data [idx].py_get (text_primary_key);
		};
		var get_doc_text_ref = function (doc_ref_key) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'doc_ref_key': var doc_ref_key = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (doc_ref_key === null) {
				return text_ref;
			}
			var key = str (doc_ref_key);
			var existing = text_refs_by_doc.current.py_get (key);
			if (existing) {
				return existing;
			}
			var created = Ref (__kwargtrans__ ({current: null}));
			text_refs_by_doc.current [key] = created;
			return created;
		};
		var resolve_text_ref_for_doc_id = function (doc_id) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'doc_id': var doc_id = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (docs_mode == 'lead') {
				return text_ref;
			}
			if (doc_id === null) {
				return text_ref;
			}
			return get_doc_text_ref (doc_ref_key_by_id.py_get (str (doc_id)));
		};
		var ensure_active_doc = function () {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
					}
				}
			}
			else {
			}
			var current_active = (active_doc_id !== null ? str (active_doc_id) : null);
			var visible_doc_id_set = set (visible_doc_ids);
			if (__in__ (current_active, visible_doc_id_set)) {
				return ;
			}
			if (__in__ (selected_span_doc_id, visible_doc_id_set)) {
				set_active_doc_id (selected_span_doc_id);
				return ;
			}
			if (len (visible_doc_ids) > 0) {
				set_active_doc_id (visible_doc_ids [0]);
			}
			else {
				set_active_doc_id (null);
			}
		};
		use_effect (ensure_active_doc, [visible_doc_indices, selected_span_idx, len (text_data), len (span_data)]);
		var get_active_doc_id = function () {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
					}
				}
			}
			else {
			}
			if (active_doc_id !== null) {
				return str (active_doc_id);
			}
			if (selected_span_doc_id !== null && __in__ (selected_span_doc_id, set (visible_doc_ids))) {
				return selected_span_doc_id;
			}
			if (len (visible_doc_ids) > 0) {
				return visible_doc_ids [0];
			}
			return null;
		};
		var get_doc_selected_ranges = function (doc_id) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'doc_id': var doc_id = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (doc_id === null) {
				return [];
			}
			return selected_ranges_by_doc.py_get (str (doc_id), []);
		};
		var set_doc_selected_ranges = function (doc_id, ranges) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'doc_id': var doc_id = __allkwargs0__ [__attrib0__]; break;
							case 'ranges': var ranges = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (doc_id === null) {
				return ;
			}
			var key = str (doc_id);
			var next_ranges_by_doc = dict (selected_ranges_by_doc);
			if (ranges && len (ranges) > 0) {
				var normalized_ranges = list (ranges);
				next_ranges_by_doc [key] = normalized_ranges;
				var remembered = dict (last_non_empty_selected_ranges_by_doc_ref.current || dict ({}));
				remembered [key] = normalized_ranges;
				last_non_empty_selected_ranges_by_doc_ref.current = remembered;
			}
			else {
				next_ranges_by_doc.py_pop (key, null);
			}
			set_selected_ranges_by_doc (next_ranges_by_doc);
		};
		var get_selected_or_last_ranges = function (doc_id) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'doc_id': var doc_id = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (doc_id === null) {
				return [];
			}
			var selected_ranges = get_doc_selected_ranges (doc_id);
			if (len (selected_ranges) > 0) {
				return list (selected_ranges);
			}
			var remembered = dict (last_non_empty_selected_ranges_by_doc_ref.current || dict ({}));
			return list (remembered.py_get (str (doc_id)) || []);
		};
		var set_selected_span_rows = function (selected_rows) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'selected_rows': var selected_rows = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (typeof selected_rows == 'undefined' || (selected_rows != null && selected_rows.hasOwnProperty ("__kwargtrans__"))) {;
				var selected_rows = null;
			};
			selected_span_rows_store ['rows'] = normalize_selected_rows (selected_rows, null, len (span_data));
		};
		var set_selected_span = function (span_id) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'span_id': var span_id = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (span_id === null) {
				set_selected_span_rows ([]);
				return ;
			}
			var idx = py_next ((function () {
				var __accu0__ = [];
				for (var [i, span] of enumerate (span_data)) {
					if (str (span.py_get (spans_primary_key)) == str (span_id)) {
						__accu0__.append (i);
					}
				}
				return py_iter (__accu0__);
			}) (), null);
			if (idx === null) {
				set_selected_span_rows ([]);
				return ;
			}
			set_selected_span_rows ([idx]);
		};
		var set_move_mode = function (enabled) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'enabled': var enabled = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			toolbar_state ['move_mode'] = bool (enabled);
		};
		var toggle_move_mode = function () {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
					}
				}
			}
			else {
			}
			toolbar_state ['move_mode'] = !(bool (toolbar_state ['move_mode']));
		};
		var get_current_selected_span_indices = function () {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
					}
				}
			}
			else {
			}
			return get_selected_span_indices (span_data, selected_span_rows_snapshot.py_get ('rows'));
		};
		var set_doc_idx = function (idx) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'idx': var idx = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (idx === null) {
				return ;
			}
			if (text_data && (idx < 0 || idx >= len (text_data))) {
				var idx = 0;
			}
			selected_doc_rows_store ['rows'] = [idx];
			var doc_id = get_doc_id_by_idx (idx);
			if (doc_id !== null) {
				set_active_doc_id (str (doc_id));
			}
		};
		var scroll_to_top = function () {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
					}
				}
			}
			else {
			}
			var lead_doc_id = get_doc_id_by_idx (lead_doc_idx);
			if (is_mounting_ref.current) {
				if (lead_doc_id !== null) {
					is_mounting_ref.current = false;
				}
				return ;
			}
			if (lead_doc_id === null) {
				return ;
			}
			var target_ref = resolve_text_ref_for_doc_id (lead_doc_id);
			if (target_ref !== null && target_ref.current !== null) {
				target_ref.current.scroll_to_line (0, 'smooth', 'start');
				pending_scroll_top_doc_id_ref.current = null;
				return ;
			}
			pending_scroll_top_doc_id_ref.current = (lead_doc_id !== null ? str (lead_doc_id) : null);
		};
		var handle_text_change = function (new_doc_idx) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'new_doc_idx': var new_doc_idx = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (new_doc_idx === null) {
				return ;
			}
			var new_doc_id = get_doc_id_by_idx (new_doc_idx);
			if (new_doc_id === null) {
				return ;
			}
			sync_store_selection (store_text_key, new_doc_idx, handle, true);
			sync_parent_widgets (store_text_key, new_doc_idx);
			set_active_doc_id (str (new_doc_id));
			if (on_change_text_id) {
				on_change_text_id (new_doc_id);
			}
		};
		var ensure_initial_doc_selection = function () {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
					}
				}
			}
			else {
			}
			if (len (selected_doc_rows_store ['rows']) == 0 && len (text_data) > 0) {
				selected_doc_rows_store ['rows'] = [0];
			}
		};
		use_effect (ensure_initial_doc_selection, [text_store]);
		use_effect (scroll_to_top, [lead_doc_idx, docs_mode]);
		var flush_pending_top_scroll_request = function () {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
					}
				}
			}
			else {
			}
			var pending_doc_id = pending_scroll_top_doc_id_ref.current;
			if (pending_doc_id === null) {
				return ;
			}
			var target_ref = resolve_text_ref_for_doc_id (pending_doc_id);
			if (target_ref === null || target_ref.current === null) {
				return ;
			}
			target_ref.current.scroll_to_line (0, 'smooth', 'start');
			pending_scroll_top_doc_id_ref.current = null;
		};
		use_effect (flush_pending_top_scroll_request);
		var flush_pending_span_scroll_request = function () {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
					}
				}
			}
			else {
			}
			var pending_span_id = pending_scroll_span_id_ref.current;
			if (pending_span_id === null) {
				return ;
			}
			var pending_doc_id = pending_scroll_doc_id_ref.current;
			var target_ref = resolve_text_ref_for_doc_id (pending_doc_id);
			if (target_ref === null || target_ref.current === null) {
				return ;
			}
			target_ref.current.scroll_to_span (pending_span_id);
			pending_scroll_span_id_ref.current = null;
			pending_scroll_doc_id_ref.current = null;
		};
		use_effect (flush_pending_span_scroll_request);
		var scroll_to_span = function (span_id) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'span_id': var span_id = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (span_id === null) {
				return ;
			}
			var idx = py_next ((function () {
				var __accu0__ = [];
				for (var [i, span] of enumerate (span_data)) {
					if (str (span.py_get (spans_primary_key)) == str (span_id)) {
						__accu0__.append (i);
					}
				}
				return py_iter (__accu0__);
			}) (), null);
			if (idx === null) {
				return ;
			}
			var target_span_id = span_data [idx].py_get (spans_primary_key);
			var span_doc_id = span_data [idx].py_get (text_primary_key);
			set_highlighted ([target_span_id]);
			if (span_doc_id !== null) {
				set_active_doc_id (str (span_doc_id));
				var span_doc_idx = doc_idx_by_id.py_get (str (span_doc_id));
				if (docs_mode == 'lead' && span_doc_idx !== null) {
					selected_doc_rows_store ['rows'] = [span_doc_idx];
				}
			}
			pending_scroll_span_id_ref.current = target_span_id;
			pending_scroll_doc_id_ref.current = (span_doc_id !== null ? str (span_doc_id) : null);
		};
		var ensure_unique_span_id = function (base_span_id, existing_ids) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'base_span_id': var base_span_id = __allkwargs0__ [__attrib0__]; break;
							case 'existing_ids': var existing_ids = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			var candidate = str (base_span_id);
			if (!__in__ (candidate, existing_ids)) {
				existing_ids.add (candidate);
				return candidate;
			}
			var suffix = 1;
			while (true) {
				var next_candidate = '{}-{}'.format (candidate, suffix);
				if (!__in__ (next_candidate, existing_ids)) {
					existing_ids.add (next_candidate);
					return next_candidate;
				}
				suffix += 1;
			}
		};
		var add_spans_for_doc = function (target_doc_id, selected_ranges, span_values) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'target_doc_id': var target_doc_id = __allkwargs0__ [__attrib0__]; break;
							case 'selected_ranges': var selected_ranges = __allkwargs0__ [__attrib0__]; break;
							case 'span_values': var span_values = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (typeof span_values == 'undefined' || (span_values != null && span_values.hasOwnProperty ("__kwargtrans__"))) {;
				var span_values = null;
			};
			if (target_doc_id === null) {
				return [];
			}
			var target_doc_idx = doc_idx_by_id.py_get (str (target_doc_id));
			if (target_doc_idx === null || !((0 <= target_doc_idx && target_doc_idx < len (text_data)))) {
				return [];
			}
			var target_doc = text_data [target_doc_idx];
			var doc_text = target_doc.py_get (text_key) || '';
			var normalized_ranges = [];
			for (var selected_range of selected_ranges || []) {
				var begin = selected_range.py_get ('begin');
				var end = selected_range.py_get ('end');
				if (begin === null || end === null) {
					continue;
				}
				var begin = int (begin);
				var end = int (end);
				if (end <= begin) {
					continue;
				}
				normalized_ranges.append (dict ([['begin', begin], ['end', end]]));
			}
			if (len (normalized_ranges) == 0) {
				return [];
			}
			var span_values = dict (span_values || dict ({}));
			var provided_span_id = span_values.py_pop (spans_primary_key, null);
			span_values.py_pop (begin_key, null);
			span_values.py_pop (end_key, null);
			span_values.py_pop (text_primary_key, null);
			span_values.py_pop ('text', null);
			var button_value = span_values.py_get (button_key);
			var span_defaults = (__in__ (button_value, labels) ? labels [button_value].py_get ('defaults', dict ({})) : dict ({}));
			var span_template = dict ([...(span_defaults).py_items(), ...(span_values).py_items()]);
			if (provided_span_id !== null && len (normalized_ranges) != 1) {
				var provided_span_id = null;
			}
			var existing_span_ids = (function () {
				var __accu0__ = [];
				for (var span of span_data) {
					if (span.py_get (spans_primary_key) !== null) {
						__accu0__.append (str (span.py_get (spans_primary_key)));
					}
				}
				return set (__accu0__);
			}) ();
			var added_span_ids = [];
			for (var selected_range of normalized_ranges) {
				var begin = selected_range ['begin'];
				var end = selected_range ['end'];
				var text_content = doc_text.__getslice__ (begin, end, 1);
				var default_id = '{}-{}-{}-{}'.format (target_doc_id, begin, end, span_template.py_get (button_key) || 'span');
				var span_id = ensure_unique_span_id ((provided_span_id !== null ? provided_span_id : default_id), existing_span_ids);
				spans_store.append (dict ([['text', text_content], [spans_primary_key, span_id], [begin_key, begin], [end_key, end], [button_key, span_template.py_get (button_key)], [text_primary_key, target_doc_id], ...(span_template).py_items()]));
				added_span_ids.append (span_id);
			}
			if (len (added_span_ids) > 0) {
				var remembered = dict (last_non_empty_selected_ranges_by_doc_ref.current || dict ({}));
				remembered.py_pop (str (target_doc_id), null);
				last_non_empty_selected_ranges_by_doc_ref.current = remembered;
				set_doc_selected_ranges (target_doc_id, []);
				if (docs_mode == 'lead' && text_ref.current) {
					text_ref.current.clear_current_mouse_selection ();
				}
				set_move_mode (false);
				pending_span_ids_ref.current = added_span_ids;
			}
			return added_span_ids;
		};
		var add_spans_from_current_selection = function (span_values) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'span_values': var span_values = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (typeof span_values == 'undefined' || (span_values != null && span_values.hasOwnProperty ("__kwargtrans__"))) {;
				var span_values = null;
			};
			var target_doc_id = get_active_doc_id ();
			if (target_doc_id === null) {
				return [];
			}
			var selected_ranges = get_selected_or_last_ranges (target_doc_id);
			return add_spans_for_doc (target_doc_id, selected_ranges, span_values);
		};
		var get_current_selected_ranges = function () {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
					}
				}
			}
			else {
			}
			var target_doc_id = get_active_doc_id ();
			if (target_doc_id === null) {
				return [];
			}
			return list (get_selected_or_last_ranges (target_doc_id));
		};
		var get_current_selected_text = function () {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
					}
				}
			}
			else {
			}
			var target_doc_id = get_active_doc_id ();
			if (target_doc_id === null) {
				return null;
			}
			var target_doc_idx = doc_idx_by_id.py_get (str (target_doc_id));
			if (target_doc_idx === null || !((0 <= target_doc_idx && target_doc_idx < len (text_data)))) {
				return null;
			}
			var selected_ranges = get_selected_or_last_ranges (target_doc_id);
			if (len (selected_ranges) == 0) {
				return null;
			}
			var first_range = selected_ranges [0];
			var begin = first_range.py_get ('begin');
			var end = first_range.py_get ('end');
			if (begin === null || end === null) {
				return null;
			}
			var begin = int (begin);
			var end = int (end);
			if (end <= begin) {
				return null;
			}
			var doc_text = text_data [target_doc_idx].py_get (text_key) || '';
			return doc_text.__getslice__ (begin, end, 1);
		};
		use_imperative_handle (handle, (function __lambda__ () {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
					}
				}
			}
			else {
			}
			return dict ([['scroll_to_span', scroll_to_span], ['set_doc_idx', set_doc_idx], ['get_doc_idx', (function __lambda__ () {
				if (arguments.length) {
					var __ilastarg0__ = arguments.length - 1;
					if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
						var __allkwargs0__ = arguments [__ilastarg0__--];
						for (var __attrib0__ in __allkwargs0__) {
						}
					}
				}
				else {
				}
				return (docs_mode == 'lead' ? lead_doc_idx : doc_idx_by_id.py_get (get_active_doc_id () || ''));
			})], ['set_highlighted_spans', set_highlighted], ['set_selected_span', set_selected_span], ['get_active_doc_id', get_active_doc_id], ['get_selected_ranges', get_current_selected_ranges], ['get_selected_text', get_current_selected_text], ['add_span_from_selection', add_spans_from_current_selection]]);
		}), [text_data, span_data, lead_doc_idx, docs_mode, active_doc_id]);
		var handle_mouse_hover_spans = function (span_ids, mod_keys) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'span_ids': var span_ids = __allkwargs0__ [__attrib0__]; break;
							case 'mod_keys': var mod_keys = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			set_highlighted (span_ids);
			for (var other of handles.py_get (store_spans_key, [])) {
				if (other [0].current === null) {
					continue;
				}
				if (other [1] == 'table') {
					other [0].current.set_highlighted (span_ids);
				}
			}
			if (on_hover_spans) {
				on_hover_spans (span_ids, mod_keys);
			}
		};
		var update_selected_span = function (key, value) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'key': var key = __allkwargs0__ [__attrib0__]; break;
							case 'value': var value = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			var col = span_field_by_key.py_get (key);
			if (col && col.py_get ('kind') == 'boolean') {
				var value = bool (value);
			}
			var selected_indices = get_current_selected_span_indices ();
			if (!(selected_indices)) {
				return ;
			}
			for (var i of selected_indices) {
				spans_store [i] [key] = value;
			}
			if (selected_span_idx === null || selected_span_idx < 0) {
				set_selected_span_rows (selected_indices);
			}
		};
		var get_doc_spans = function (doc_id) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'doc_id': var doc_id = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			var selected_ids = (function () {
				var __accu0__ = [];
				for (var idx of get_current_selected_span_indices ()) {
					if ((0 <= idx && idx < len (span_data))) {
						__accu0__.append (span_data [idx].py_get (spans_primary_key));
					}
				}
				return set (__accu0__);
			}) ();
			return (function () {
				var __accu0__ = [];
				for (var span of span_data) {
					if ((!__in__ (text_primary_key, span) || str (span [text_primary_key]) == str (doc_id)) && (!(bool (span.py_get ('hidden'))) || __in__ (span [spans_primary_key], highlighted) || __in__ (span [spans_primary_key], selected_ids))) {
						__accu0__.append (dict ([['highlighted', __in__ (span [spans_primary_key], highlighted)], ['selected', __in__ (span [spans_primary_key], selected_ids)], ...(span).py_items()]));
					}
				}
				return __accu0__;
			}) ();
		};
		var flush_pending_span_scroll = function () {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
					}
				}
			}
			else {
			}
			if (pending_span_ids_ref.current === null) {
				return ;
			}
			var span_ids = pending_span_ids_ref.current;
			var span_ids_in_store = (function () {
				var __accu0__ = [];
				for (var span of span_data) {
					__accu0__.append (span.py_get (spans_primary_key));
				}
				return set (__accu0__);
			}) ();
			if (!(any ((function () {
				var __accu0__ = [];
				for (var span_id of span_ids) {
					__accu0__.append (__in__ (span_id, span_ids_in_store));
				}
				return py_iter (__accu0__);
			}) ()))) {
				return ;
			}
			pending_span_ids_ref.current = null;
			if (on_add_span) {
				var after_timeout = function () {
					if (arguments.length) {
						var __ilastarg0__ = arguments.length - 1;
						if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
							var __allkwargs0__ = arguments [__ilastarg0__--];
							for (var __attrib0__ in __allkwargs0__) {
							}
						}
					}
					else {
					}
					var last_span_id = span_ids [len (span_ids) - 1];
					var last_span_idx = py_next ((function () {
						var __accu0__ = [];
						for (var [i, span] of enumerate (spans_store)) {
							if (span [spans_primary_key] == last_span_id) {
								__accu0__.append (i);
							}
						}
						return py_iter (__accu0__);
					}) ());
					set_selected_span_rows ([last_span_idx]);
					if (store_spans_key !== null) {
						sync_store_selection (store_spans_key, last_span_idx, handle, false, [last_span_idx]);
					}
					on_add_span (span_ids);
				};
				setTimeout (after_timeout, 100);
			}
		};
		use_effect (flush_pending_span_scroll);
		var handle_add_span = use_event_callback (async function (label) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'label': var label = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			add_spans_from_current_selection (dict ([[button_key, label]]));
		});
		var on_delete = use_event_callback (function () {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
					}
				}
			}
			else {
			}
			var selected_indices = get_current_selected_span_indices ();
			if (selected_indices) {
				var to_remove = sorted (selected_indices, __kwargtrans__ ({reverse: true}));
				var __withid0__ = transact (spans_store);
				try {
					__withid0__.__enter__ ();
					for (var idx of to_remove) {
						delete spans_store [idx];
					}
					__withid0__.__exit__ ();
				}
				catch (__except0__) {
					if (! (__withid0__.__exit__ (__except0__.name, __except0__, __except0__.stack))) {
						throw __except0__;
					}
				}
				finally {
					__withid0__.__exit__ ();
				}
				set_selected_span_rows ([]);
				return ;
			}
			var target_doc_id = get_active_doc_id ();
			var selected_ranges = get_doc_selected_ranges (target_doc_id);
			var to_remove = [];
			for (var [idx, span] of enumerate (spans_store)) {
				if (__in__ (text_primary_key, span) && str (span.py_get (text_primary_key)) != str (target_doc_id)) {
					continue;
				}
				for (var r of selected_ranges) {
					if (!(span ['end'] <= r ['begin'] || r ['end'] <= span ['begin'])) {
						to_remove.append (idx);
						break;
					}
				}
			}
			var __withid0__ = transact (spans_store);
			try {
				__withid0__.__enter__ ();
				for (var item of sorted (to_remove, __kwargtrans__ ({reverse: true}))) {
					delete spans_store [item];
				}
				__withid0__.__exit__ ();
			}
			catch (__except0__) {
				if (! (__withid0__.__exit__ (__except0__.name, __except0__, __except0__.stack))) {
					throw __except0__;
				}
			}
			finally {
				__withid0__.__exit__ ();
			}
			if (to_remove) {
				set_doc_selected_ranges (target_doc_id, []);
			}
		});
		var handle_toggle_move = use_event_callback (function (event) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'event': var event = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (typeof event == 'undefined' || (event != null && event.hasOwnProperty ("__kwargtrans__"))) {;
				var event = null;
			};
			toggle_move_mode ();
		});
		var on_key_press = use_event_callback (function (k, modkeys, selection) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'k': var k = __allkwargs0__ [__attrib0__]; break;
							case 'modkeys': var modkeys = __allkwargs0__ [__attrib0__]; break;
							case 'selection': var selection = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			var next_idx = null;
			var current_idx = (docs_mode == 'lead' ? lead_doc_idx : doc_idx_by_id.py_get (get_active_doc_id () || ''));
			if (k == 'ArrowRight') {
				if (docs_mode == 'lead') {
					var next_idx = get_adjacent_doc_idx (current_idx, 1);
					if (next_idx === null && text_data && current_idx !== null) {
						var next_idx = __mod__ (current_idx + 1, len (text_data));
					}
				}
				else if (len (visible_doc_ids) > 0) {
					var current_doc_id = get_active_doc_id ();
					if (!__in__ (current_doc_id, set (visible_doc_ids))) {
						set_active_doc_id (visible_doc_ids [0]);
					}
					else {
						var current_pos = visible_doc_ids.index (current_doc_id);
						set_active_doc_id (visible_doc_ids [__mod__ (current_pos + 1, len (visible_doc_ids))]);
					}
				}
			}
			else if (k == 'ArrowLeft') {
				if (docs_mode == 'lead') {
					var next_idx = get_adjacent_doc_idx (current_idx, -(1));
					if (next_idx === null && text_data && current_idx !== null) {
						var next_idx = __mod__ (current_idx - 1, len (text_data));
					}
				}
				else if (len (visible_doc_ids) > 0) {
					var current_doc_id = get_active_doc_id ();
					if (!__in__ (current_doc_id, set (visible_doc_ids))) {
						set_active_doc_id (visible_doc_ids [0]);
					}
					else {
						var current_pos = visible_doc_ids.index (current_doc_id);
						set_active_doc_id (visible_doc_ids [__mod__ (current_pos - 1, len (visible_doc_ids))]);
					}
				}
			}
			if (next_idx !== null) {
				handle_text_change (next_idx);
				return ;
			}
			if (k == 'Backspace') {
				on_delete ();
			}
			else {
				for (var [label, cfg] of labels.py_items ()) {
					if (k == cfg.py_get ('shortcut')) {
						handle_add_span (label);
						break;
					}
				}
			}
		});
		var handle_doc_key_press = function (k, modkeys, selection, doc) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'k': var k = __allkwargs0__ [__attrib0__]; break;
							case 'modkeys': var modkeys = __allkwargs0__ [__attrib0__]; break;
							case 'selection': var selection = __allkwargs0__ [__attrib0__]; break;
							case 'doc': var doc = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			var doc_id = doc.py_get (text_primary_key);
			if (doc_id !== null) {
				set_active_doc_id (str (doc_id));
			}
			on_key_press (k, modkeys, selection);
		};
		var handle_toolbar_action = function () {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
					}
				}
			}
			else {
			}
			try {
				var action_id = toolbar_snapshot.py_get ('action_id', 0);
				if (action_id == last_action_id_ref.current) {
					return ;
				}
				last_action_id_ref.current = action_id;
				var action = toolbar_snapshot.py_get ('action');
				var payload = toolbar_snapshot.py_get ('action_payload') || dict ({});
				var selected_indices = get_current_selected_span_indices ();
				if (action == 'label_click') {
					var label = payload.py_get ('label');
					if (!(label)) {
						return ;
					}
					if (len (selected_indices) > 0) {
						update_selected_span (button_key, label);
					}
					else {
						handle_add_span (label);
					}
				}
				else if (action == 'delete') {
					on_delete ();
				}
				else if (action == 'toggle_move') {
					toggle_move_mode ();
				}
				else if (action == 'update_span') {
					var key = payload.py_get ('key');
					if (key === null) {
						return ;
					}
					update_selected_span (key, payload.py_get ('value'));
				}
			}
			catch (__except0__) {
				if (Error.isError(__except0__)) { __except0__ = BaseException((__except0__).toString()); }
				if (isinstance (__except0__, BaseException)) {
					var e = __except0__;
					print ('Got error during user toolbar action', e);
				}
				else {
					throw __except0__;
				}
			}
		};
		use_effect (handle_toolbar_action, [toolbar_snapshot.py_get ('action_id', 0)]);
		var handle_click_span = function (span_id, modkeys, doc_id) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'span_id': var span_id = __allkwargs0__ [__attrib0__]; break;
							case 'modkeys': var modkeys = __allkwargs0__ [__attrib0__]; break;
							case 'doc_id': var doc_id = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (doc_id !== null) {
				set_active_doc_id (str (doc_id));
			}
			if (span_id === null) {
				set_selected_span_rows ([]);
				return ;
			}
			var clicked_idx = py_next ((function () {
				var __accu0__ = [];
				for (var [i, span] of enumerate (spans_store)) {
					if (str (span.py_get (spans_primary_key)) == str (span_id)) {
						__accu0__.append (i);
					}
				}
				return py_iter (__accu0__);
			}) (), null);
			if (clicked_idx === null) {
				return ;
			}
			var shift_pressed = bool (modkeys && any ((function () {
				var __accu0__ = [];
				for (var key of modkeys) {
					__accu0__.append (str (key).lower () == 'shift');
				}
				return py_iter (__accu0__);
			}) ()));
			var current_selected_rows = selected_span_rows_snapshot.py_get ('rows') || [];
			var next_selected_rows = (shift_pressed ? normalize_selected_rows ([...(current_selected_rows), clicked_idx], clicked_idx, len (span_data)) : [clicked_idx]);
			suppress_next_empty_select_clear_ref.current = true;
			set_selected_span_rows (next_selected_rows);
			if (store_spans_key !== null && len (next_selected_rows) > 0) {
				sync_store_selection (store_spans_key, next_selected_rows [0], handle, false, next_selected_rows);
			}
			set_move_mode (false);
			for (var other of handles.py_get (store_spans_key, [])) {
				var other_handle = other [0];
				if (other_handle.current === null || other_handle == handle) {
					continue;
				}
				var set_highlighted = getattr (other_handle.current, 'set_highlighted', null);
				var scroll_to_row_id = getattr (other_handle.current, 'scroll_to_row_id', null);
				if (callable (set_highlighted)) {
					set_highlighted ([span_id]);
				}
				if (callable (scroll_to_row_id)) {
					scroll_to_row_id (span_id);
				}
			}
			if (on_click_span) {
				on_click_span (span_id, modkeys);
			}
		};
		var handle_mouse_select = function (ranges, modkeys, doc) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'ranges': var ranges = __allkwargs0__ [__attrib0__]; break;
							case 'modkeys': var modkeys = __allkwargs0__ [__attrib0__]; break;
							case 'doc': var doc = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			var doc_id = doc.py_get (text_primary_key);
			var doc_id_str = (doc_id !== null ? str (doc_id) : null);
			if (doc_id_str !== null) {
				set_active_doc_id (doc_id_str);
			}
			if (len (ranges) == 0 && suppress_next_empty_select_clear_ref.current) {
				suppress_next_empty_select_clear_ref.current = false;
				set_doc_selected_ranges (doc_id_str, ranges);
				return ;
			}
			var selected_span_doc_id = (selected_span_idx !== null && (0 <= selected_span_idx && selected_span_idx < len (span_data)) ? span_data [selected_span_idx].py_get (text_primary_key) || doc_id : doc_id);
			if (move_mode && selected_span_idx !== null && (0 <= selected_span_idx && selected_span_idx < len (spans_store)) && selected_span_doc_id == doc_id && len (ranges) > 0) {
				var r = ranges [0];
				spans_store [selected_span_idx] [begin_key] = r ['begin'];
				spans_store [selected_span_idx] [end_key] = r ['end'];
				spans_store [selected_span_idx] ['text'] = doc [text_key].__getslice__ (r ['begin'], r ['end'], 1);
				set_selected_span_rows ([selected_span_idx]);
				set_move_mode (false);
				set_doc_selected_ranges (doc_id_str, []);
				if (docs_mode == 'lead' && text_ref.current) {
					text_ref.current.clear_current_mouse_selection ();
				}
				return ;
			}
			else if (len (ranges) > 0) {
				set_selected_span_rows ([]);
			}
			else if (selected_span_idx !== null && selected_span_idx >= 0 || selected_span_rows_snapshot.py_get ('rows')) {
				set_selected_span_rows ([]);
			}
			set_doc_selected_ranges (doc_id_str, ranges);
		};
		if (len (visible_doc_indices) == 0) {
			return [div ('No document selected', __kwargtrans__ ({key: 'no-document-selected'}))];
		}
		var rendered_docs = [];
		var visible_doc_count = len (visible_doc_indices);
		for (var [note_idx, doc_idx] of enumerate (visible_doc_indices)) {
			if (doc_idx === null || !((0 <= doc_idx && doc_idx < len (text_data)))) {
				continue;
			}
			var doc = text_data [doc_idx];
			var doc_id = doc.py_get (text_primary_key);
			var doc_id_str = (doc_id !== null ? str (doc_id) : 'idx-{}'.format (doc_idx));
			var doc_text_ref = (docs_mode == 'lead' ? text_ref : get_doc_text_ref (doc_ref_key_by_idx.py_get (doc_idx, '{}|idx:{}'.format (text_context_key, doc_idx))));
			var annotated_text = AnnotatedText (__kwargtrans__ ({text: doc [text_key], spans: get_doc_spans (doc_id), annotation_styles: labels, mouse_selection: get_doc_selected_ranges ((doc_id !== null ? str (doc_id) : null)), primary_key: spans_primary_key, begin_key: begin_key, end_key: end_key, style_key: style_key, label_key: label_key, label_formatter: label_formatter, on_key_press: (function(_default_doc) { return ((function __lambda__ (k, modkeys, selection, d) {
				if (arguments.length) {
					var __ilastarg0__ = arguments.length - 1;
					if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
						var __allkwargs0__ = arguments [__ilastarg0__--];
						for (var __attrib0__ in __allkwargs0__) {
							switch (__attrib0__) {
								case 'k': var k = __allkwargs0__ [__attrib0__]; break;
								case 'modkeys': var modkeys = __allkwargs0__ [__attrib0__]; break;
								case 'selection': var selection = __allkwargs0__ [__attrib0__]; break;
								case 'd': var d = __allkwargs0__ [__attrib0__]; break;
							}
						}
					}
				}
				else {
				}
				if (typeof d == 'undefined' || (d != null && d.hasOwnProperty ("__kwargtrans__"))) {;
					var d = _default_doc;
				};
				return handle_doc_key_press (k, modkeys, selection, d);
			}));})(doc), on_mouse_select: (function(_default_doc) { return ((function __lambda__ (ranges, modkeys, d) {
				if (arguments.length) {
					var __ilastarg0__ = arguments.length - 1;
					if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
						var __allkwargs0__ = arguments [__ilastarg0__--];
						for (var __attrib0__ in __allkwargs0__) {
							switch (__attrib0__) {
								case 'ranges': var ranges = __allkwargs0__ [__attrib0__]; break;
								case 'modkeys': var modkeys = __allkwargs0__ [__attrib0__]; break;
								case 'd': var d = __allkwargs0__ [__attrib0__]; break;
							}
						}
					}
				}
				else {
				}
				if (typeof d == 'undefined' || (d != null && d.hasOwnProperty ("__kwargtrans__"))) {;
					var d = _default_doc;
				};
				return handle_mouse_select (ranges, modkeys, d);
			}));})(doc), on_mouse_hover_spans: handle_mouse_hover_spans, on_click_span: (function(_default_doc) { return ((function __lambda__ (span_id, modkeys, d) {
				if (arguments.length) {
					var __ilastarg0__ = arguments.length - 1;
					if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
						var __allkwargs0__ = arguments [__ilastarg0__--];
						for (var __attrib0__ in __allkwargs0__) {
							switch (__attrib0__) {
								case 'span_id': var span_id = __allkwargs0__ [__attrib0__]; break;
								case 'modkeys': var modkeys = __allkwargs0__ [__attrib0__]; break;
								case 'd': var d = __allkwargs0__ [__attrib0__]; break;
							}
						}
					}
				}
				else {
				}
				if (typeof d == 'undefined' || (d != null && d.hasOwnProperty ("__kwargtrans__"))) {;
					var d = _default_doc;
				};
				return handle_click_span (span_id, modkeys, d.py_get (text_primary_key));
			}));})(doc), handle: doc_text_ref, style: (docs_mode == 'lead' ? dict ([['flex', 1], ['minHeight', 0], ['overflow', 'scroll'], ...(style || dict ({})).py_items()]) : dict ([['minHeight', '180px'], ['overflow', 'scroll'], ...(style || dict ({})).py_items()]))}));
			var wrapper_key = (docs_mode == 'lead' ? 'doc-lead' : '{}:doc:{}:{}'.format (text_context_key, doc_idx, doc_id_str));
			var wrapped_component = container_renderer (doc, annotated_text, toolbar_view, __kwargtrans__ ({key: wrapper_key, note_idx: note_idx, note_count: visible_doc_count}));
			rendered_docs.append (wrapped_component);
		}
		return rendered_docs;
	};
	return TextWidget;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_Any_10 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	return Any;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_Dict_11 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	return Dict;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_List_12 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	return List;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_Optional_13 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	return Optional;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_object_14 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	return object;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92___init___15 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	var __init__ = function (self, current) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'current': var current = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		self.current = current;
	};
	return __init__;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_Sequence_16 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	return Sequence;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_get_first_selected_row_idx_18 = function (extract_selected_rows) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'extract_selected_rows': var extract_selected_rows = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var get_first_selected_row_idx = function (selected_rows) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'selected_rows': var selected_rows = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		var extracted = extract_selected_rows (selected_rows);
		if (len (extracted) > 0) {
			return extracted [0];
		}
		return null;
	};
	return get_first_selected_row_idx;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_extract_selected_rows_19 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	var extract_selected_rows = function (selected_rows) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'selected_rows': var selected_rows = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		var extracted = [];
		var seen = set ();
		for (var item of list (selected_rows || [])) {
			var idx = null;
			if (isinstance (item, bool)) {
				var idx = null;
			}
			else if (isinstance (item, int)) {
				var idx = item;
			}
			else {
				var idx = item.py_get ('row_idx', item.py_get ('rowIdx'));
			}
			if (!(isinstance (idx, int)) || idx < 0 || __in__ (idx, seen)) {
				continue;
			}
			extracted.append (idx);
			seen.add (idx);
		}
		return extracted;
	};
	return extract_selected_rows;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_normalize_selected_rows_20 = function (extract_selected_rows) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'extract_selected_rows': var extract_selected_rows = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var normalize_selected_rows = function (selected_rows, row_idx, row_count) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'selected_rows': var selected_rows = __allkwargs0__ [__attrib0__]; break;
						case 'row_idx': var row_idx = __allkwargs0__ [__attrib0__]; break;
						case 'row_count': var row_count = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (row_count <= 0) {
			return [];
		}
		var source = list (selected_rows || []);
		if (isinstance (row_idx, int) && !(isinstance (row_idx, bool)) && row_idx >= 0) {
			var source = [row_idx, ...(source)];
		}
		var normalized = [];
		var seen = set ();
		for (var idx of extract_selected_rows (source)) {
			if (idx >= row_count || __in__ (idx, seen)) {
				continue;
			}
			normalized.append (idx);
			seen.add (idx);
		}
		return sorted (normalized);
	};
	return normalize_selected_rows;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_use_effect_22 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	var use_effect = function (effect, dependencies) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'effect': var effect = __allkwargs0__ [__attrib0__]; break;
						case 'dependencies': var dependencies = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof effect == 'undefined' || (effect != null && effect.hasOwnProperty ("__kwargtrans__"))) {;
			var effect = null;
		};
		if (typeof dependencies == 'undefined' || (dependencies != null && dependencies.hasOwnProperty ("__kwargtrans__"))) {;
			var dependencies = null;
		};
		if (effect === null) {
			var decorator = function (func) {
				if (arguments.length) {
					var __ilastarg0__ = arguments.length - 1;
					if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
						var __allkwargs0__ = arguments [__ilastarg0__--];
						for (var __attrib0__ in __allkwargs0__) {
							switch (__attrib0__) {
								case 'func': var func = __allkwargs0__ [__attrib0__]; break;
							}
						}
					}
				}
				else {
				}
				return window.React.useEffect (func, dependencies);
			};
			return decorator;
		}
		return window.React.useEffect (effect, dependencies);
	};
	return use_effect;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_use_event_callback_23 = function (_use_event_callback_impl) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case '_use_event_callback_impl': var _use_event_callback_impl = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var use_event_callback = function (arg) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'arg': var arg = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof arg == 'undefined' || (arg != null && arg.hasOwnProperty ("__kwargtrans__"))) {;
			var arg = null;
		};
		if (callable (arg)) {
			return _use_event_callback_impl (arg, []);
		}
		var decorator = function (callback) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'callback': var callback = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			return _use_event_callback_impl (callback, arg);
		};
		return decorator;
	};
	return use_event_callback;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_default_container_renderer_29 = function (div) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'div': var div = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var default_container_renderer = function (row, component, toolbar, key, note_idx, note_count) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'row': var row = __allkwargs0__ [__attrib0__]; break;
						case 'component': var component = __allkwargs0__ [__attrib0__]; break;
						case 'toolbar': var toolbar = __allkwargs0__ [__attrib0__]; break;
						case 'key': var key = __allkwargs0__ [__attrib0__]; break;
						case 'note_idx': var note_idx = __allkwargs0__ [__attrib0__]; break;
						case 'note_count': var note_count = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		return div (component, __kwargtrans__ ({key: key}));
	};
	return default_container_renderer;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_get_standalone_client_manager_32 = function (StandaloneClientManager) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'StandaloneClientManager': var StandaloneClientManager = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var get_standalone_client_manager = function () {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
				}
			}
		}
		else {
		}
		if (StandaloneClientManager.manager === null) {
			StandaloneClientManager.manager = StandaloneClientManager ();
		}
		return StandaloneClientManager.manager;
	};
	return get_standalone_client_manager;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92___init___33 = function (WeakKeyDictionary, WeakValueDictionary, make_uuid) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'WeakKeyDictionary': var WeakKeyDictionary = __allkwargs0__ [__attrib0__]; break;
					case 'WeakValueDictionary': var WeakValueDictionary = __allkwargs0__ [__attrib0__]; break;
					case 'make_uuid': var make_uuid = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var __init__ = function (self) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		self.functions = dict ({});
		self.refs = dict ({});
		self.states = WeakValueDictionary ();
		self.states_subscriptions = WeakKeyDictionary ();
		self.call_futures = dict ({});
		self.disabled_state_sync = set ();
		self.outgoing_messages = [];
		self.is_draining_outgoing_messages = false;
		self.connection_state = dict ([['kind', 'unknown'], ['transport', null], ['connected', null], ['reason', null], ['kernel_connection_status', null], ['last_error', null], ['state_write_rejection_count', 0], ['last_state_write_rejection', null]]);
		self.connection_state_listeners = set ();
		self.state_sync = dict ({});
		self.state_sync_requests = dict ({});
		self.uid = make_uuid ();
		self.current_origin = self.uid;
		self.register_function (self.call_ref_method, '<ref_method>');
		self.last_messages = [];
	};
	return __init__;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_WeakKeyDictionary_34 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	return WeakKeyDictionary;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_WeakValueDictionary_35 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	return WeakValueDictionary;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_apply_state_update_37 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	var apply_state_update = function (self, sync_id, state, py_update, origin) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'sync_id': var sync_id = __allkwargs0__ [__attrib0__]; break;
						case 'state': var state = __allkwargs0__ [__attrib0__]; break;
						case 'py_update': var py_update = __allkwargs0__ [__attrib0__]; break;
						case 'origin': var origin = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		self.disabled_state_sync.add (sync_id);
		try {
			var previous_origin = self.current_origin;
			self.current_origin = (origin ? origin : previous_origin);
			try {
				state.apply_update (py_update);
			}
			finally {
				self.current_origin = previous_origin;
			}
		}
		finally {
			self.disabled_state_sync.discard (sync_id);
		}
	};
	return apply_state_update;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_assert_state_write_allowed_38 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	var assert_state_write_allowed = function (self, sync_id) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'sync_id': var sync_id = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		var connection = self.connection_state;
		if (connection.py_get ('connected') === false) {
			var reason = connection.py_get ('reason') || 'disconnected';
			self.notify_state_write_rejected (sync_id, reason);
			var __except0__ = Exception ('Cannot write synchronized state {}: connection is {}'.format (sync_id, reason));
			__except0__.__cause__ = null;
			throw __except0__;
		}
		var state_sync = self.ensure_state_sync (sync_id);
		if (state_sync ['status'] == 'blocked') {
			var reason = state_sync.py_get ('blocked_reason') || 'blocked';
			var __except0__ = Exception ('Cannot write synchronized state {}: sync is {}'.format (sync_id, reason));
			__except0__.__cause__ = null;
			throw __except0__;
		}
		if (state_sync ['status'] == 'resyncing') {
			var __except0__ = Exception ('Cannot write synchronized state {}: sync is resyncing'.format (sync_id));
			__except0__.__cause__ = null;
			throw __except0__;
		}
		return true;
	};
	return assert_state_write_allowed;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_block_state_sync_39 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	var block_state_sync = function (self, sync_id, reason, error, request_resync, update_connection) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'sync_id': var sync_id = __allkwargs0__ [__attrib0__]; break;
						case 'reason': var reason = __allkwargs0__ [__attrib0__]; break;
						case 'error': var error = __allkwargs0__ [__attrib0__]; break;
						case 'request_resync': var request_resync = __allkwargs0__ [__attrib0__]; break;
						case 'update_connection': var update_connection = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof error == 'undefined' || (error != null && error.hasOwnProperty ("__kwargtrans__"))) {;
			var error = null;
		};
		if (typeof request_resync == 'undefined' || (request_resync != null && request_resync.hasOwnProperty ("__kwargtrans__"))) {;
			var request_resync = true;
		};
		if (typeof update_connection == 'undefined' || (update_connection != null && update_connection.hasOwnProperty ("__kwargtrans__"))) {;
			var update_connection = false;
		};
		var state_sync = self.set_state_sync_status (sync_id, 'blocked', reason);
		if (isinstance (error, Exception)) {
			var exception = error;
		}
		else if (error) {
			var exception = Exception (str (error));
		}
		else {
			var exception = Exception (reason);
		}
		if (update_connection) {
			self.set_connection_status (__kwargtrans__ ({connected: false, reason: reason, last_error: str (exception)}));
		}
		var changes = [];
		var in_flight = state_sync ['in_flight'];
		if (in_flight) {
			changes.append (in_flight);
		}
		for (var change of state_sync ['pending_changes']) {
			if (change !== in_flight) {
				changes.append (change);
			}
		}
		var rollback_count = 0;
		for (var change of changes) {
			if (!(change ['future'].done ())) {
				change ['future'].set_exception (exception);
			}
			if (change.py_get ('rollbackable')) {
				rollback_count += 1;
			}
		}
		self.rollback_state_changes (sync_id, rollback_count);
		state_sync ['pending_changes'] = [];
		state_sync ['in_flight'] = null;
		state_sync ['processor_running'] = false;
		if (request_resync) {
			try {
				self.request_state_sync (sync_id);
			}
			catch (__except0__) {
				if (Error.isError(__except0__)) { __except0__ = BaseException((__except0__).toString()); }
				if (isinstance (__except0__, Exception)) {
					// pass;
				}
				else {
					throw __except0__;
				}
			}
		}
	};
	return block_state_sync;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_build_state_sync_request_40 = function (b64_encode, make_uuid) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'b64_encode': var b64_encode = __allkwargs0__ [__attrib0__]; break;
					case 'make_uuid': var make_uuid = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var build_state_sync_request = function (self, sync_id) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'sync_id': var sync_id = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof sync_id == 'undefined' || (sync_id != null && sync_id.hasOwnProperty ("__kwargtrans__"))) {;
			var sync_id = null;
		};
		var state_vectors = dict ({});
		for (var [sid, state] of self.states.py_items ()) {
			if (!(sync_id) || sid == sync_id) {
				state_vectors [sid] = b64_encode (state.get_state ());
			}
		}
		var payload = dict ([['request_id', make_uuid ()], ['state_vectors', state_vectors], ['origin', self.uid]]);
		if (sync_id) {
			payload ['sync_id'] = sync_id;
		}
		return payload;
	};
	return build_state_sync_request;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_call_ref_method_42 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	var call_ref_method = function (self, ref_id, method_name, args, kwargs) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'ref_id': var ref_id = __allkwargs0__ [__attrib0__]; break;
						case 'method_name': var method_name = __allkwargs0__ [__attrib0__]; break;
						case 'args': var args = __allkwargs0__ [__attrib0__]; break;
						case 'kwargs': var kwargs = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		var ref = self.refs.py_get (ref_id);
		if (!(ref)) {
			print ('Reference with id {} not found'.format (ref_id));
		}
		if (!(ref.current)) {
			return null;
		}
		var method = ref.current [method_name];
		return method (...(args), __kwargtrans__ (kwargs));
	};
	return call_ref_method;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_drain_outgoing_messages_43 = function (is_awaitable, start_async_task) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'is_awaitable': var is_awaitable = __allkwargs0__ [__attrib0__]; break;
					case 'start_async_task': var start_async_task = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var drain_outgoing_messages = async function (self) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		try {
			while (len (self.outgoing_messages)) {
				var queued = self.outgoing_messages.py_pop (0);
				var method = queued ['method'];
				var data = queued ['data'];
				var future = queued ['future'];
				var on_failure = queued.py_get ('on_failure');
				try {
					var sent = self.send_message (method, data);
					if (is_awaitable (sent)) {
						await sent;
					}
					future.set_result (null);
				}
				catch (__except0__) {
					if (Error.isError(__except0__)) { __except0__ = BaseException((__except0__).toString()); }
					if (isinstance (__except0__, Exception)) {
						var error = __except0__;
						var message_text = str (error);
						var reason = (__in__ ('PRET_COMM_TIMEOUT', message_text) ? 'send_timeout' : 'send_failed');
						self.set_connection_status (__kwargtrans__ ({connected: false, reason: reason, last_error: message_text}));
						try {
							if (on_failure !== null) {
								on_failure (error, method, data);
							}
						}
						finally {
							if (isinstance (error, Exception)) {
								future.set_exception (error);
							}
							else {
								future.set_exception (Exception (str (error)));
							}
						}
					}
					else {
						throw __except0__;
					}
				}
			}
		}
		finally {
			self.is_draining_outgoing_messages = false;
			if (len (self.outgoing_messages)) {
				self.is_draining_outgoing_messages = true;
				var task = self.drain_outgoing_messages ();
				if (is_awaitable (task)) {
					start_async_task (task);
				}
			}
		}
	};
	return drain_outgoing_messages;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_ensure_state_change_processor_46 = function (is_awaitable, start_async_task) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'is_awaitable': var is_awaitable = __allkwargs0__ [__attrib0__]; break;
					case 'start_async_task': var start_async_task = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var ensure_state_change_processor = function (self, sync_id) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'sync_id': var sync_id = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		var state_sync = self.ensure_state_sync (sync_id);
		if (state_sync ['processor_running']) {
			return ;
		}
		if (len (state_sync ['pending_changes']) == 0) {
			if (state_sync ['status'] == 'sent_change') {
				self.set_state_sync_status (sync_id, 'ready');
			}
			return ;
		}
		if (__in__ (state_sync ['status'], tuple (['blocked', 'resyncing']))) {
			return ;
		}
		if (self.connection_state.py_get ('connected') === false) {
			return ;
		}
		state_sync ['processor_running'] = true;
		var task = self.process_state_changes (sync_id);
		if (is_awaitable (task)) {
			start_async_task (task);
		}
	};
	return ensure_state_change_processor;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_ensure_state_sync_47 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	var ensure_state_sync = function (self, sync_id) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'sync_id': var sync_id = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		var state_sync = self.state_sync.py_get (sync_id);
		if (!(state_sync)) {
			var state_sync = dict ([['status', 'initialized'], ['pending_changes', []], ['in_flight', null], ['processor_running', false], ['blocked_reason', null], ['resync_request_id', null]]);
			self.state_sync [sync_id] = state_sync;
		}
		return state_sync;
	};
	return ensure_state_sync;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_get_connection_status_48 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	var get_connection_status = function (self) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		return self.connection_state;
	};
	return get_connection_status;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_get_state_sync_status_49 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	var get_state_sync_status = function (self, sync_id) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'sync_id': var sync_id = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof sync_id == 'undefined' || (sync_id != null && sync_id.hasOwnProperty ("__kwargtrans__"))) {;
			var sync_id = null;
		};
		if (sync_id) {
			var state_sync = self.ensure_state_sync (sync_id);
			return dict ([['status', state_sync ['status']], ['pending_count', len (state_sync ['pending_changes'])], ['in_flight', state_sync ['in_flight']], ['blocked_reason', state_sync ['blocked_reason']]]);
		}
		var result = dict ({});
		for (var sid of self.state_sync.py_keys ()) {
			result [sid] = self.get_state_sync_status (sid);
		}
		return result;
	};
	return get_state_sync_status;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_handle_call_failure_msg_50 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	var handle_call_failure_msg = function (self, data) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'data': var data = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (!(self.message_targets_this_manager (data))) {
			return null;
		}
		var __left0__ = tuple ([data ['callback_id'], data ['message']]);
		var callback_id = __left0__ [0];
		var message = __left0__ [1];
		var future = self.call_futures.py_pop (callback_id, null);
		if (!(future)) {
			return null;
		}
		future.set_exception (Exception (message));
	};
	return handle_call_failure_msg;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_handle_call_msg_51 = function (is_awaitable) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'is_awaitable': var is_awaitable = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var handle_call_msg = async function (self, data) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'data': var data = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		var __left0__ = tuple ([data ['function_id'], data ['args'], data ['kwargs'], data ['callback_id']]);
		var function_id = __left0__ [0];
		var args = __left0__ [1];
		var kwargs = __left0__ [2];
		var callback_id = __left0__ [3];
		try {
			var fn = self.functions.py_get (function_id);
			var result = fn (...(args), __kwargtrans__ (kwargs));
			var result = (is_awaitable (result) ? await result : result);
			return tuple (['call_success', dict ([['callback_id', callback_id], ['target_origin', data.py_get ('origin')], ['value', result]])]);
		}
		catch (__except0__) {
			if (Error.isError(__except0__)) { __except0__ = BaseException((__except0__).toString()); }
			if (isinstance (__except0__, Exception)) {
				var e = __except0__;
				return tuple (['call_failure', dict ([['callback_id', callback_id], ['target_origin', data.py_get ('origin')], ['message', str (e)]])]);
			}
			else {
				throw __except0__;
			}
		}
	};
	return handle_call_msg;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_handle_call_success_msg_52 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	var handle_call_success_msg = function (self, data) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'data': var data = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (!(self.message_targets_this_manager (data))) {
			return null;
		}
		var __left0__ = tuple ([data ['callback_id'], data.py_get ('value')]);
		var callback_id = __left0__ [0];
		var value = __left0__ [1];
		var future = self.call_futures.py_pop (callback_id, null);
		if (!(future)) {
			return null;
		}
		future.set_result (value);
	};
	return handle_call_success_msg;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_handle_message_53 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	var handle_message = function (self, method, data) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'method': var method = __allkwargs0__ [__attrib0__]; break;
						case 'data': var data = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		self.last_messages.append ([method, data]);
		if (method == 'call') {
			return self.handle_call_msg (data);
		}
		else if (method == 'state_change') {
			return self.handle_state_change_msg (data);
		}
		else if (method == 'state_change_result') {
			return self.handle_state_change_result_msg (data);
		}
		else if (method == 'call_success') {
			return self.handle_call_success_msg (data);
		}
		else if (method == 'call_failure') {
			return self.handle_call_failure_msg (data);
		}
		else if (method == 'state_sync_response') {
			return self.handle_state_sync_response_msg (data);
		}
		else {
			var __except0__ = Exception ('Unknown method: {}'.format (method));
			__except0__.__cause__ = null;
			throw __except0__;
		}
	};
	return handle_message;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_handle_state_change_msg_54 = function (b64_decode) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'b64_decode': var b64_decode = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var handle_state_change_msg = function (self, data) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'data': var data = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (data ['origin'] == self.uid) {
			return null;
		}
		var py_update = b64_decode (data ['update']);
		var sync_id = data ['sync_id'];
		var state = self.states.py_get (sync_id);
		if (!(state)) {
			return null;
		}
		try {
			self.apply_state_update (sync_id, state, py_update, data ['origin']);
		}
		catch (__except0__) {
			if (Error.isError(__except0__)) { __except0__ = BaseException((__except0__).toString()); }
			if (isinstance (__except0__, Exception)) {
				return null;
			}
			else {
				throw __except0__;
			}
		}
		return null;
	};
	return handle_state_change_msg;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_handle_state_change_result_msg_56 = function (b64_decode) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'b64_decode': var b64_decode = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var handle_state_change_result_msg = function (self, data) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'data': var data = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (!(self.message_targets_this_manager (data))) {
			return null;
		}
		var sync_id = data ['sync_id'];
		var state_sync = self.ensure_state_sync (sync_id);
		var change = state_sync ['in_flight'];
		if (!(change)) {
			return null;
		}
		var future = change ['future'];
		if (change ['state_change_id'] != data ['state_change_id']) {
			return null;
		}
		if (data ['status'] == 'failed') {
			var exception = Exception (data ['message']);
			if (!(future.done ())) {
				future.set_exception (exception);
			}
		}
		else {
			var missing_update = data.py_get ('missing_update');
			if (missing_update) {
				var state = self.states.py_get (sync_id);
				if (state) {
					self.apply_state_update (sync_id, state, b64_decode (missing_update), data.py_get ('origin'));
				}
			}
			if (!(future.done ())) {
				future.set_result (null);
			}
		}
	};
	return handle_state_change_result_msg;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_handle_state_sync_response_msg_57 = function (b64_decode) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'b64_decode': var b64_decode = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var handle_state_sync_response_msg = function (self, data) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'data': var data = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof data == 'undefined' || (data != null && data.hasOwnProperty ("__kwargtrans__"))) {;
			var data = null;
		};
		if (!(self.message_targets_this_manager (data))) {
			return null;
		}
		var sync_id = (data ? data.py_get ('sync_id') : null);
		var request_id = (data ? data.py_get ('request_id') : null);
		var updates = (data ? data.py_get ('updates', dict ({})) : dict ({}));
		var state_vectors = (data ? data.py_get ('state_vectors', dict ({})) : dict ({}));
		var origin = (data ? data.py_get ('origin') : null);
		if (request_id && __in__ (request_id, self.state_sync_requests)) {
			self.state_sync_requests [request_id] ['active'] = false;
			self.state_sync_requests.py_pop (request_id, null);
		}
		for (var [sid, update_b64] of updates.py_items ()) {
			if (sync_id && sid != sync_id) {
				continue;
			}
			var state = self.states.py_get (sid);
			if (!(state)) {
				continue;
			}
			var state_sync = self.ensure_state_sync (sid);
			var active_request_id = state_sync.py_get ('resync_request_id');
			if (active_request_id && request_id && active_request_id != request_id) {
				continue;
			}
			self.apply_state_update (sid, state, b64_decode (update_b64), origin);
		}
		for (var [sid, state_vector] of state_vectors.py_items ()) {
			if (sync_id && sid != sync_id) {
				continue;
			}
			var state = self.states.py_get (sid);
			if (!(state)) {
				continue;
			}
			var state_sync = self.ensure_state_sync (sid);
			var active_request_id = state_sync.py_get ('resync_request_id');
			if (active_request_id && request_id && active_request_id != request_id) {
				continue;
			}
			var py_update = state.get_update (b64_decode (state_vector));
			var has_pending = len (state_sync ['pending_changes']) > 0 || state_sync ['in_flight'];
			if (len (py_update) && !(has_pending)) {
				self.send_state_change (py_update, sid);
			}
			state_sync ['resync_request_id'] = null;
			self.set_state_sync_status (sid, 'ready');
			self.ensure_state_change_processor (sid);
		}
	};
	return handle_state_sync_response_msg;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_message_targets_this_manager_58 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	var message_targets_this_manager = function (self, data) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'data': var data = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		var target_origin = (data ? data.py_get ('target_origin') : null);
		return !(target_origin) || target_origin == self.uid;
	};
	return message_targets_this_manager;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_notify_connection_status_listeners_59 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	var notify_connection_status_listeners = function (self) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		for (var callback of tuple (self.connection_state_listeners)) {
			try {
				callback ();
			}
			catch (__except0__) {
				if (Error.isError(__except0__)) { __except0__ = BaseException((__except0__).toString()); }
				if (isinstance (__except0__, Exception)) {
					// pass;
				}
				else {
					throw __except0__;
				}
			}
		}
	};
	return notify_connection_status_listeners;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_notify_state_write_rejected_60 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	var notify_state_write_rejected = function (self, sync_id, reason) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'sync_id': var sync_id = __allkwargs0__ [__attrib0__]; break;
						case 'reason': var reason = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		var new_state = dict (self.connection_state);
		new_state ['state_write_rejection_count'] = (self.connection_state.py_get ('state_write_rejection_count') || 0) + 1;
		new_state ['last_state_write_rejection'] = dict ([['sync_id', sync_id], ['reason', reason]]);
		self.connection_state = new_state;
		self.notify_connection_status_listeners ();
	};
	return notify_state_write_rejected;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_process_state_changes_61 = function (STATE_CHANGE_TIMEOUT, is_awaitable) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'STATE_CHANGE_TIMEOUT': var STATE_CHANGE_TIMEOUT = __allkwargs0__ [__attrib0__]; break;
					case 'is_awaitable': var is_awaitable = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var process_state_changes = async function (self, sync_id) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'sync_id': var sync_id = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		var state_sync = self.ensure_state_sync (sync_id);
		try {
			while (len (state_sync ['pending_changes']) > 0) {
				if (__in__ (state_sync ['status'], tuple (['blocked', 'resyncing']))) {
					return ;
				}
				if (self.connection_state.py_get ('connected') === false) {
					return ;
				}
				var change = state_sync ['pending_changes'] [0];
				state_sync ['in_flight'] = change;
				self.set_state_sync_status (sync_id, 'sent_change');
				var on_timeout = function () {
					if (arguments.length) {
						var __ilastarg0__ = arguments.length - 1;
						if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
							var __allkwargs0__ = arguments [__ilastarg0__--];
							for (var __attrib0__ in __allkwargs0__) {
							}
						}
					}
					else {
					}
					var current = state_sync ['in_flight'];
					if (current === change && !(change ['future'].done ())) {
						self.block_state_sync (sync_id, 'state_change_timeout', Exception ('State change timed out before it was acknowledged'), __kwargtrans__ ({request_resync: true, update_connection: true}));
					}
				};
				self.set_timeout (on_timeout, STATE_CHANGE_TIMEOUT);
				try {
					var on_send_failure = function (error, method, data) {
						if (arguments.length) {
							var __ilastarg0__ = arguments.length - 1;
							if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
								var __allkwargs0__ = arguments [__ilastarg0__--];
								for (var __attrib0__ in __allkwargs0__) {
									switch (__attrib0__) {
										case 'error': var error = __allkwargs0__ [__attrib0__]; break;
										case 'method': var method = __allkwargs0__ [__attrib0__]; break;
										case 'data': var data = __allkwargs0__ [__attrib0__]; break;
									}
								}
							}
						}
						else {
						}
						self.block_state_sync (sync_id, 'state_change_send_failed', error, __kwargtrans__ ({request_resync: true, update_connection: true}));
					};
					var sent = self.send_outgoing_message ('state_change', change ['payload'], __kwargtrans__ ({on_failure: on_send_failure}));
					if (is_awaitable (sent)) {
						await sent;
					}
					await change ['future'];
				}
				catch (__except0__) {
					if (Error.isError(__except0__)) { __except0__ = BaseException((__except0__).toString()); }
					if (isinstance (__except0__, Exception)) {
						var error = __except0__;
						if (!__in__ (state_sync ['status'], tuple (['blocked', 'resyncing']))) {
							self.block_state_sync (sync_id, 'state_change_failed', error, __kwargtrans__ ({request_resync: true}));
						}
						return ;
					}
					else {
						throw __except0__;
					}
				}
				if (len (state_sync ['pending_changes']) > 0 && state_sync ['pending_changes'] [0] === change) {
					state_sync ['pending_changes'].py_pop (0);
				}
				state_sync ['in_flight'] = null;
			}
			self.set_state_sync_status (sync_id, 'ready');
		}
		finally {
			state_sync ['processor_running'] = false;
			if (len (state_sync ['pending_changes']) > 0 && state_sync ['status'] == 'ready') {
				self.ensure_state_change_processor (sync_id);
			}
		}
	};
	return process_state_changes;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_register_call_future_62 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	var register_call_future = function (self, callback_id, future) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'callback_id': var callback_id = __allkwargs0__ [__attrib0__]; break;
						case 'future': var future = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		self.call_futures [callback_id] = future;
	};
	return register_call_future;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_register_function_63 = function (function_identifier) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'function_identifier': var function_identifier = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var register_function = function (self, fn, identifier) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'fn': var fn = __allkwargs0__ [__attrib0__]; break;
						case 'identifier': var identifier = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof identifier == 'undefined' || (identifier != null && identifier.hasOwnProperty ("__kwargtrans__"))) {;
			var identifier = null;
		};
		if (!(identifier)) {
			var identifier = function_identifier (fn);
		}
		self.functions.__setitem__ (identifier, fn);
		return identifier;
	};
	return register_function;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_register_ref_65 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	var register_ref = function (self, ref_id, ref) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'ref_id': var ref_id = __allkwargs0__ [__attrib0__]; break;
						case 'ref': var ref = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		self.refs [ref_id] = ref;
	};
	return register_ref;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_register_state_66 = function (ensure_store_undo_manager, install_store_sync_guard) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'ensure_store_undo_manager': var ensure_store_undo_manager = __allkwargs0__ [__attrib0__]; break;
					case 'install_store_sync_guard': var install_store_sync_guard = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var register_state = function (self, sync_id, doc) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'sync_id': var sync_id = __allkwargs0__ [__attrib0__]; break;
						case 'doc': var doc = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		self.states.__setitem__ (sync_id, doc);
		self.set_state_sync_status (sync_id, 'ready');
		ensure_store_undo_manager (doc);
		install_store_sync_guard (doc, (function __lambda__ () {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
					}
				}
			}
			else {
			}
			return self.assert_state_write_allowed (sync_id);
		}));
		self.states_subscriptions [doc] = doc.on_update ((function __lambda__ (py_update) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'py_update': var py_update = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			return self.send_state_change (py_update, __kwargtrans__ ({sync_id: sync_id}));
		}));
	};
	return register_state;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_remote_call_ref_method_69 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	var remote_call_ref_method = function (self, ref_id, method_name, args, kwargs) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'ref_id': var ref_id = __allkwargs0__ [__attrib0__]; break;
						case 'method_name': var method_name = __allkwargs0__ [__attrib0__]; break;
						case 'args': var args = __allkwargs0__ [__attrib0__]; break;
						case 'kwargs': var kwargs = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		return self.send_call ('<ref_method>', tuple ([ref_id, method_name, args, kwargs]), dict ({}));
	};
	return remote_call_ref_method;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_request_state_sync_70 = function (STATE_SYNC_TIMEOUT) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'STATE_SYNC_TIMEOUT': var STATE_SYNC_TIMEOUT = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var request_state_sync = function (self, sync_id) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'sync_id': var sync_id = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof sync_id == 'undefined' || (sync_id != null && sync_id.hasOwnProperty ("__kwargtrans__"))) {;
			var sync_id = null;
		};
		var payload = self.build_state_sync_request (sync_id);
		var request_id = payload ['request_id'];
		var sync_ids = [];
		if (!(sync_id)) {
			for (var sid of tuple (self.states.py_keys ())) {
				var state_sync = self.set_state_sync_status (sid, 'resyncing');
				state_sync ['resync_request_id'] = request_id;
				sync_ids.append (sid);
			}
		}
		else {
			var state_sync = self.set_state_sync_status (sync_id, 'resyncing');
			state_sync ['resync_request_id'] = request_id;
			sync_ids.append (sync_id);
		}
		self.state_sync_requests [request_id] = dict ([['sync_ids', sync_ids], ['active', true]]);
		var on_timeout = function () {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
					}
				}
			}
			else {
			}
			var request = self.state_sync_requests.py_get (request_id);
			if (!(request) || !(request.py_get ('active'))) {
				return ;
			}
			self.state_sync_requests.py_pop (request_id, null);
			for (var sid of tuple (request ['sync_ids'])) {
				var state_sync = self.ensure_state_sync (sid);
				if (state_sync.py_get ('resync_request_id') == request_id && state_sync ['status'] == 'resyncing') {
					self.block_state_sync (sid, 'state_sync_timeout', Exception ('State sync timed out before the backend responded'), __kwargtrans__ ({request_resync: true}));
				}
			}
		};
		self.set_timeout (on_timeout, STATE_SYNC_TIMEOUT);
		return self.send_outgoing_message ('state_sync_request', payload);
	};
	return request_state_sync;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_resume_state_sync_processors_71 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	var resume_state_sync_processors = function (self) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		for (var sync_id of tuple (self.state_sync.py_keys ())) {
			self.ensure_state_change_processor (sync_id);
		}
	};
	return resume_state_sync_processors;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_rollback_state_changes_72 = function (rollback_store_state) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'rollback_store_state': var rollback_store_state = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var rollback_state_changes = function (self, sync_id, count) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'sync_id': var sync_id = __allkwargs0__ [__attrib0__]; break;
						case 'count': var count = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (count <= 0) {
			return 0;
		}
		var state = self.states.py_get (sync_id);
		if (!(state)) {
			return 0;
		}
		self.disabled_state_sync.add (sync_id);
		try {
			return rollback_store_state (state, count);
		}
		finally {
			self.disabled_state_sync.discard (sync_id);
		}
	};
	return rollback_state_changes;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_send_call_74 = function (Future, make_uuid) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'Future': var Future = __allkwargs0__ [__attrib0__]; break;
					case 'make_uuid': var make_uuid = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var send_call = function (self, function_id, args, kwargs) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'function_id': var function_id = __allkwargs0__ [__attrib0__]; break;
						case 'args': var args = __allkwargs0__ [__attrib0__]; break;
						case 'kwargs': var kwargs = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		var callback_id = make_uuid ();
		var payload = dict ([['function_id', function_id], ['args', args], ['kwargs', kwargs], ['callback_id', callback_id], ['origin', self.uid]]);
		var future = Future ();
		self.register_call_future (callback_id, future);
		var on_send_failure = function (error, method, data) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'error': var error = __allkwargs0__ [__attrib0__]; break;
							case 'method': var method = __allkwargs0__ [__attrib0__]; break;
							case 'data': var data = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			var call_future = self.call_futures.py_pop (callback_id, null);
			if (call_future && !(call_future.done ())) {
				if (isinstance (error, Exception)) {
					call_future.set_exception (error);
				}
				else {
					call_future.set_exception (Exception (str (error)));
				}
			}
		};
		self.send_outgoing_message ('call', payload, __kwargtrans__ ({on_failure: on_send_failure}));
		return future;
	};
	return send_call;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_send_message_76 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	var send_message = function (self, method, data) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'method': var method = __allkwargs0__ [__attrib0__]; break;
						case 'data': var data = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		var __except0__ = NotImplementedError ();
		__except0__.__cause__ = null;
		throw __except0__;
	};
	return send_message;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_send_outgoing_message_77 = function (Future, is_awaitable, start_async_task) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'Future': var Future = __allkwargs0__ [__attrib0__]; break;
					case 'is_awaitable': var is_awaitable = __allkwargs0__ [__attrib0__]; break;
					case 'start_async_task': var start_async_task = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var send_outgoing_message = function (self, method, data, on_failure) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'method': var method = __allkwargs0__ [__attrib0__]; break;
						case 'data': var data = __allkwargs0__ [__attrib0__]; break;
						case 'on_failure': var on_failure = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof on_failure == 'undefined' || (on_failure != null && on_failure.hasOwnProperty ("__kwargtrans__"))) {;
			var on_failure = null;
		};
		var future = Future ();
		self.outgoing_messages.append (dict ([['method', method], ['data', data], ['future', future], ['on_failure', on_failure]]));
		if (!(self.is_draining_outgoing_messages)) {
			self.is_draining_outgoing_messages = true;
			var task = self.drain_outgoing_messages ();
			if (is_awaitable (task)) {
				start_async_task (task);
			}
		}
		return future;
	};
	return send_outgoing_message;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_send_state_change_78 = function (Future, b64_encode, make_uuid) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'Future': var Future = __allkwargs0__ [__attrib0__]; break;
					case 'b64_encode': var b64_encode = __allkwargs0__ [__attrib0__]; break;
					case 'make_uuid': var make_uuid = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var send_state_change = function (self, py_update, sync_id) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'py_update': var py_update = __allkwargs0__ [__attrib0__]; break;
						case 'sync_id': var sync_id = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (__in__ (sync_id, self.disabled_state_sync)) {
			return null;
		}
		var state = self.states.py_get (sync_id);
		if (!(state)) {
			return null;
		}
		var state_sync = self.ensure_state_sync (sync_id);
		var state_change_id = make_uuid ();
		var payload = dict ([['state_change_id', state_change_id], ['update', b64_encode (py_update)], ['state_vector', b64_encode (state.get_state ())], ['sync_id', sync_id], ['origin', self.current_origin]]);
		var state_change_future = Future ();
		var change = dict ([['state_change_id', state_change_id], ['payload', payload], ['future', state_change_future], ['rollbackable', payload ['origin'] == self.uid]]);
		state_sync ['pending_changes'].append (change);
		self.ensure_state_change_processor (sync_id);
		return state_change_future;
	};
	return send_state_change;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_set_connection_status_79 = function (UNSET) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'UNSET': var UNSET = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var set_connection_status = (function(UNSET, UNSET, UNSET, UNSET, UNSET) { return (function (self, connected, reason, transport, kernel_connection_status, last_error) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'connected': var connected = __allkwargs0__ [__attrib0__]; break;
						case 'reason': var reason = __allkwargs0__ [__attrib0__]; break;
						case 'transport': var transport = __allkwargs0__ [__attrib0__]; break;
						case 'kernel_connection_status': var kernel_connection_status = __allkwargs0__ [__attrib0__]; break;
						case 'last_error': var last_error = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof connected == 'undefined' || (connected != null && connected.hasOwnProperty ("__kwargtrans__"))) {;
			var connected = UNSET;
		};
		if (typeof reason == 'undefined' || (reason != null && reason.hasOwnProperty ("__kwargtrans__"))) {;
			var reason = UNSET;
		};
		if (typeof transport == 'undefined' || (transport != null && transport.hasOwnProperty ("__kwargtrans__"))) {;
			var transport = UNSET;
		};
		if (typeof kernel_connection_status == 'undefined' || (kernel_connection_status != null && kernel_connection_status.hasOwnProperty ("__kwargtrans__"))) {;
			var kernel_connection_status = UNSET;
		};
		if (typeof last_error == 'undefined' || (last_error != null && last_error.hasOwnProperty ("__kwargtrans__"))) {;
			var last_error = UNSET;
		};
		var current_state = self.connection_state;
		var new_state = dict (current_state);
		var has_changed = false;
		if (connected !== UNSET && connected != current_state ['connected']) {
			new_state ['connected'] = connected;
			var has_changed = true;
		}
		if (reason !== UNSET && reason != current_state ['reason']) {
			new_state ['reason'] = reason;
			var has_changed = true;
		}
		if (transport !== UNSET && transport != current_state ['transport']) {
			new_state ['transport'] = transport;
			var has_changed = true;
		}
		if (kernel_connection_status !== UNSET && kernel_connection_status != current_state ['kernel_connection_status']) {
			new_state ['kernel_connection_status'] = kernel_connection_status;
			var has_changed = true;
		}
		if (last_error !== UNSET && last_error != current_state ['last_error']) {
			new_state ['last_error'] = last_error;
			var has_changed = true;
		}
		if (has_changed) {
			self.connection_state = new_state;
			self.notify_connection_status_listeners ();
			if (new_state ['connected'] === true) {
				self.resume_state_sync_processors ();
			}
		}
		return self.connection_state;
	});})(UNSET, UNSET, UNSET, UNSET, UNSET);
	return set_connection_status;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_set_state_sync_status_80 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	var set_state_sync_status = function (self, sync_id, status, reason) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'sync_id': var sync_id = __allkwargs0__ [__attrib0__]; break;
						case 'status': var status = __allkwargs0__ [__attrib0__]; break;
						case 'reason': var reason = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof reason == 'undefined' || (reason != null && reason.hasOwnProperty ("__kwargtrans__"))) {;
			var reason = null;
		};
		var state_sync = self.ensure_state_sync (sync_id);
		state_sync ['status'] = status;
		state_sync ['blocked_reason'] = reason;
		return state_sync;
	};
	return set_state_sync_status;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_set_timeout_81 = function (schedule_timeout) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'schedule_timeout': var schedule_timeout = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var set_timeout = function (self, callback, timeout) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'callback': var callback = __allkwargs0__ [__attrib0__]; break;
						case 'timeout': var timeout = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		return schedule_timeout (callback, timeout);
	};
	return set_timeout;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_subscribe_connection_status_83 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	var subscribe_connection_status = function (self, callback) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'callback': var callback = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		self.connection_state_listeners.add (callback);
		var unsubscribe = function () {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
					}
				}
			}
			else {
			}
			self.connection_state_listeners.discard (callback);
		};
		return unsubscribe;
	};
	return subscribe_connection_status;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92___init___84 = function (is_awaitable, loads, make_websocket, start_async_task) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'is_awaitable': var is_awaitable = __allkwargs0__ [__attrib0__]; break;
					case 'loads': var loads = __allkwargs0__ [__attrib0__]; break;
					case 'make_websocket': var make_websocket = __allkwargs0__ [__attrib0__]; break;
					case 'start_async_task': var start_async_task = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var __init__ = function (self) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		__super__ (self.__class__, '__init__') (self);
		self.connection_state ['kind'] = 'standalone_client';
		self.connection_state ['transport'] = 'standalone-http';
		self.connection_state ['connected'] = false;
		self.connection_state ['reason'] = 'initializing';
		self.websocket = make_websocket ('/ws');
		var on_message = function (event) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'event': var event = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			var data = event.data;
			var data = loads (data);
			var result = self.handle_message (data ['method'], data ['data']);
			if (result) {
				var send_result = async function () {
					if (arguments.length) {
						var __ilastarg0__ = arguments.length - 1;
						if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
							var __allkwargs0__ = arguments [__ilastarg0__--];
							for (var __attrib0__ in __allkwargs0__) {
							}
						}
					}
					else {
					}
					var resolved_result = (is_awaitable (result) ? await result : result);
					if (resolved_result) {
						var send_future = self.send_outgoing_message (...(resolved_result));
						if (is_awaitable (send_future)) {
							await send_future;
						}
					}
				};
				var task = send_result ();
				if (is_awaitable (task)) {
					start_async_task (task);
				}
			}
		};
		var on_open = function (event) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'event': var event = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			self.set_connection_status (__kwargtrans__ ({connected: true, transport: 'websocket', reason: 'websocket_open', last_error: null}));
			self.request_state_sync ();
		};
		var on_close = function (event) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'event': var event = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			self.set_connection_status (__kwargtrans__ ({connected: false, transport: 'websocket', reason: 'websocket_closed'}));
		};
		var on_error = function (event) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'event': var event = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			self.set_connection_status (__kwargtrans__ ({connected: false, transport: 'websocket', reason: 'websocket_error'}));
		};
		self.websocket.addEventListener ('message', on_message);
		self.websocket.addEventListener ('open', on_open);
		self.websocket.addEventListener ('close', on_close);
		self.websocket.addEventListener ('error', on_error);
	};
	return __init__;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_loads_85 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	return loads;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_send_message_87 = function (dumps, fetch, is_awaitable) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'dumps': var dumps = __allkwargs0__ [__attrib0__]; break;
					case 'fetch': var fetch = __allkwargs0__ [__attrib0__]; break;
					case 'is_awaitable': var is_awaitable = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var send_message = async function (self, method, data) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'self': var self = __allkwargs0__ [__attrib0__]; break;
						case 'method': var method = __allkwargs0__ [__attrib0__]; break;
						case 'data': var data = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		try {
			var response = await fetch ('method', dict ([['method', 'POST'], ['body', dumps (dict ([['method', method], ['data', data]]))], ['headers', dict ([['Content-Type', 'application/json']])]]));
			if (response.ok === false) {
				var __except0__ = Exception ('Failed to POST method call: {}'.format (response.status));
				__except0__.__cause__ = null;
				throw __except0__;
			}
			var result = await response.json ();
			if (__in__ ('method', result) && __in__ ('data', result)) {
				var future = self.handle_message (result ['method'], result ['data']);
				if (is_awaitable (future)) {
					await future;
				}
			}
			self.set_connection_status (__kwargtrans__ ({connected: true, transport: 'standalone-http', reason: 'send_ok', last_error: null}));
		}
		catch (__except0__) {
			if (Error.isError(__except0__)) { __except0__ = BaseException((__except0__).toString()); }
			if (isinstance (__except0__, BaseException)) {
				var error = __except0__;
				self.set_connection_status (__kwargtrans__ ({connected: false, transport: 'standalone-http', reason: 'send_failed', last_error: str (error)}));
				var __except1__ = Exception ('Could not communicate with server');
				__except1__.__cause__ = null;
				throw __except1__;
			}
			else {
				throw __except0__;
			}
		}
	};
	return send_message;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_dumps_88 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	return dumps;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92__deep_get_store_90 = function () {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
			}
		}
	}
	else {
	}
	var _deep_get_store = function (data_store, path_parts, selected_row_idx_by_store) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'data_store': var data_store = __allkwargs0__ [__attrib0__]; break;
						case 'path_parts': var path_parts = __allkwargs0__ [__attrib0__]; break;
						case 'selected_row_idx_by_store': var selected_row_idx_by_store = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (!(path_parts)) {
			return null;
		}
		var store = data_store [path_parts [0]];
		if (len (path_parts) == 1) {
			return store;
		}
		var prefix = path_parts [0];
		for (var part of path_parts.__getslice__ (1, null, 1)) {
			if (store === null || len (store) == 0) {
				return null;
			}
			var row_idx = selected_row_idx_by_store.py_get (prefix, 0);
			if (row_idx === null || row_idx < 0) {
				return null;
			}
			if (row_idx >= len (store)) {
				var row_idx = 0;
			}
			var row = store [row_idx];
			if (row === null) {
				return null;
			}
			var child_store = row.py_get (part);
			if (child_store === null) {
				return null;
			}
			var store = child_store;
			var prefix = '{}.{}'.format (prefix, part);
		}
		return store;
	};
	return _deep_get_store;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_get_adjacent_doc_idx_92 = function (handles, store_text_key) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'handles': var handles = __allkwargs0__ [__attrib0__]; break;
					case 'store_text_key': var store_text_key = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var get_adjacent_doc_idx = function (current_doc_idx, delta) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'current_doc_idx': var current_doc_idx = __allkwargs0__ [__attrib0__]; break;
						case 'delta': var delta = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		var table_handle = null;
		for (var other of handles.py_get (store_text_key, [])) {
			if (other [1] == 'table') {
				var table_handle = other [0];
				break;
			}
		}
		if (table_handle !== null) {
			return table_handle.current.get_adjacent_row_idx (current_doc_idx, delta);
		}
	};
	return get_adjacent_doc_idx;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_make_client_ref_93 = function (get_manager) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'get_manager': var get_manager = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var make_client_ref = function (_id) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case '_id': var _id = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		var ref = window.React.createRef ();
		get_manager ().register_ref (_id, ref);
		return ref;
	};
	return make_client_ref;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_get_selected_span_indices_94 = function (normalize_selected_rows) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'normalize_selected_rows': var normalize_selected_rows = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var get_selected_span_indices = function (span_data, selected_rows) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'span_data': var span_data = __allkwargs0__ [__attrib0__]; break;
						case 'selected_rows': var selected_rows = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		return normalize_selected_rows (selected_rows, null, len (span_data));
	};
	return get_selected_span_indices;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_sync_parent_widgets_97 = function (get_first_selected_row_idx, data_store, deep_get_store, primary_keys, selected_rows_by_store, sync_store_selection) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'get_first_selected_row_idx': var get_first_selected_row_idx = __allkwargs0__ [__attrib0__]; break;
					case 'data_store': var data_store = __allkwargs0__ [__attrib0__]; break;
					case 'deep_get_store': var deep_get_store = __allkwargs0__ [__attrib0__]; break;
					case 'primary_keys': var primary_keys = __allkwargs0__ [__attrib0__]; break;
					case 'selected_rows_by_store': var selected_rows_by_store = __allkwargs0__ [__attrib0__]; break;
					case 'sync_store_selection': var sync_store_selection = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var sync_parent_widgets = function (store_key, row_idx) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'store_key': var store_key = __allkwargs0__ [__attrib0__]; break;
						case 'row_idx': var row_idx = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (row_idx === null) {
			return ;
		}
		var path_parts = str (store_key).py_split ('.');
		var parent_selected_idx = dict ({});
		for (var i = 1; i < len (path_parts); i++) {
			var parent_path = '.'.join (path_parts.__getslice__ (0, i, 1));
			var parent_store = selected_rows_by_store.py_get (parent_path);
			parent_selected_idx [parent_path] = (parent_store !== null ? get_first_selected_row_idx (parent_store ['rows']) : null);
		}
		var data = deep_get_store (data_store, path_parts, parent_selected_idx);
		if (data === null || len (data) == 0 || row_idx < 0 || row_idx >= len (data)) {
			return ;
		}
		var row = data [row_idx];
		for (var [parent_store_key, parent_key] of primary_keys.py_items ()) {
			if (parent_store_key == store_key) {
				continue;
			}
			var parent_id = row.py_get (parent_key);
			if (parent_id === null) {
				continue;
			}
			var parent_parts = str (parent_store_key).py_split ('.');
			var parent_selected_idx = dict ({});
			for (var i = 1; i < len (parent_parts); i++) {
				var parent_path = '.'.join (parent_parts.__getslice__ (0, i, 1));
				var parent_store = selected_rows_by_store.py_get (parent_path);
				parent_selected_idx [parent_path] = (parent_store !== null ? get_first_selected_row_idx (parent_store ['rows']) : null);
			}
			var parent_data = deep_get_store (data_store, parent_parts, parent_selected_idx);
			if (parent_data === null || len (parent_data) == 0) {
				continue;
			}
			var parent_pk = primary_keys [parent_store_key];
			var parent_idx = null;
			for (var [i, item] of enumerate (parent_data)) {
				if (str (item.py_get (parent_pk)) == str (parent_id)) {
					var parent_idx = i;
					break;
				}
			}
			if (parent_idx === null) {
				continue;
			}
			sync_store_selection (parent_store_key, parent_idx, null, false);
		}
	};
	return sync_parent_widgets;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_sync_store_selection_98 = function (get_first_selected_row_idx, normalize_selected_rows, data_store, deep_get_store, filter_related_tables, handles, primary_keys, selected_rows_by_store) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'get_first_selected_row_idx': var get_first_selected_row_idx = __allkwargs0__ [__attrib0__]; break;
					case 'normalize_selected_rows': var normalize_selected_rows = __allkwargs0__ [__attrib0__]; break;
					case 'data_store': var data_store = __allkwargs0__ [__attrib0__]; break;
					case 'deep_get_store': var deep_get_store = __allkwargs0__ [__attrib0__]; break;
					case 'filter_related_tables': var filter_related_tables = __allkwargs0__ [__attrib0__]; break;
					case 'handles': var handles = __allkwargs0__ [__attrib0__]; break;
					case 'primary_keys': var primary_keys = __allkwargs0__ [__attrib0__]; break;
					case 'selected_rows_by_store': var selected_rows_by_store = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var sync_store_selection = function (store_key, row_idx, source_handle, sync_related_tables, selected_rows) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'store_key': var store_key = __allkwargs0__ [__attrib0__]; break;
						case 'row_idx': var row_idx = __allkwargs0__ [__attrib0__]; break;
						case 'source_handle': var source_handle = __allkwargs0__ [__attrib0__]; break;
						case 'sync_related_tables': var sync_related_tables = __allkwargs0__ [__attrib0__]; break;
						case 'selected_rows': var selected_rows = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof selected_rows == 'undefined' || (selected_rows != null && selected_rows.hasOwnProperty ("__kwargtrans__"))) {;
			var selected_rows = null;
		};
		if (row_idx === null) {
			return ;
		}
		var path_parts = str (store_key).py_split ('.');
		var parent_selected_idx = dict ({});
		for (var i = 1; i < len (path_parts); i++) {
			var parent_path = '.'.join (path_parts.__getslice__ (0, i, 1));
			var parent_store = selected_rows_by_store.py_get (parent_path);
			parent_selected_idx [parent_path] = (parent_store !== null ? get_first_selected_row_idx (parent_store ['rows']) : null);
		}
		var data = deep_get_store (data_store, path_parts, parent_selected_idx);
		if (data === null || len (data) == 0 || row_idx < 0 || row_idx >= len (data)) {
			return ;
		}
		var selected_rows_store = selected_rows_by_store.py_get (store_key);
		var previous_lead_idx = (selected_rows_store !== null ? get_first_selected_row_idx (selected_rows_store ['rows']) : null);
		var normalized_selected_rows = normalize_selected_rows (selected_rows, row_idx, len (data));
		if (selected_rows_store !== null) {
			selected_rows_store ['rows'] = normalized_selected_rows;
		}
		var next_lead_idx = get_first_selected_row_idx (normalized_selected_rows);
		if (previous_lead_idx != next_lead_idx) {
			var descendant_prefix = '{}.'.format (store_key);
			for (var [candidate_store_key, candidate_rows_store] of selected_rows_by_store.py_items ()) {
				if (str (candidate_store_key).startswith (descendant_prefix)) {
					candidate_rows_store ['rows'] = [];
				}
			}
		}
		var row = data [row_idx];
		var primary_key = primary_keys [store_key];
		var row_id = row [primary_key];
		for (var other of handles.py_get (store_key, [])) {
			var other_handle = other [0];
			var other_kind = other [1];
			if (other_handle.current === null) {
				continue;
			}
			if (other_handle == source_handle) {
				continue;
			}
			if (other_kind == 'spans') {
				other_handle.current.scroll_to_span (row_id);
			}
			else if (other_kind == 'table') {
				other_handle.current.scroll_to_row_id (row_id);
			}
		}
		if (sync_related_tables) {
			filter_related_tables (primary_key, row_id, store_key, source_handle);
		}
	};
	return sync_store_selection;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_filter_related_tables_99 = function (handles) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'handles': var handles = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var filter_related_tables = function (filter_key, filter_value, source_store_key, source_handle) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'filter_key': var filter_key = __allkwargs0__ [__attrib0__]; break;
						case 'filter_value': var filter_value = __allkwargs0__ [__attrib0__]; break;
						case 'source_store_key': var source_store_key = __allkwargs0__ [__attrib0__]; break;
						case 'source_handle': var source_handle = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		for (var [other_store_key, handle_list] of handles.py_items ()) {
			if (other_store_key == source_store_key) {
				continue;
			}
			for (var handle_item of handle_list) {
				var other_handle = handle_item [0];
				var other_kind = handle_item [1];
				var accept_related_filter_keys = (len (handle_item) > 2 ? handle_item [2] : true);
				if (other_kind != 'table' || other_handle.current === null) {
					continue;
				}
				if (other_handle == source_handle) {
					continue;
				}
				if (accept_related_filter_keys === false) {
					continue;
				}
				if (accept_related_filter_keys !== true && accept_related_filter_keys !== null && !__in__ (filter_key, accept_related_filter_keys)) {
					continue;
				}
				other_handle.current.set_filter (filter_key, str (filter_value));
			}
		}
	};
	return filter_related_tables;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_x_101 = function (children, create_fn, props) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'children': var children = __allkwargs0__ [__attrib0__]; break;
					case 'create_fn': var create_fn = __allkwargs0__ [__attrib0__]; break;
					case 'props': var props = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var render_x = function () {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
				}
			}
		}
		else {
		}
		return create_fn (...(children), __kwargtrans__ (props));
	};
	return render_x;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_ToolbarWidget_104 = function (get_first_selected_row_idx, use_ref, use_store_snapshot, Toolbar, build_field_state_by_key, data_store, deep_get_store, empty_store, get_selected_span_indices, local_spans_store, selected_rows_by_store, selected_span_rows_store, span_fields, spans_path_parts, toolbar_state) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'get_first_selected_row_idx': var get_first_selected_row_idx = __allkwargs0__ [__attrib0__]; break;
					case 'use_ref': var use_ref = __allkwargs0__ [__attrib0__]; break;
					case 'use_store_snapshot': var use_store_snapshot = __allkwargs0__ [__attrib0__]; break;
					case 'Toolbar': var Toolbar = __allkwargs0__ [__attrib0__]; break;
					case 'build_field_state_by_key': var build_field_state_by_key = __allkwargs0__ [__attrib0__]; break;
					case 'data_store': var data_store = __allkwargs0__ [__attrib0__]; break;
					case 'deep_get_store': var deep_get_store = __allkwargs0__ [__attrib0__]; break;
					case 'empty_store': var empty_store = __allkwargs0__ [__attrib0__]; break;
					case 'get_selected_span_indices': var get_selected_span_indices = __allkwargs0__ [__attrib0__]; break;
					case 'local_spans_store': var local_spans_store = __allkwargs0__ [__attrib0__]; break;
					case 'selected_rows_by_store': var selected_rows_by_store = __allkwargs0__ [__attrib0__]; break;
					case 'selected_span_rows_store': var selected_span_rows_store = __allkwargs0__ [__attrib0__]; break;
					case 'span_fields': var span_fields = __allkwargs0__ [__attrib0__]; break;
					case 'spans_path_parts': var spans_path_parts = __allkwargs0__ [__attrib0__]; break;
					case 'toolbar_state': var toolbar_state = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var ToolbarWidget = function () {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
				}
			}
		}
		else {
		}
		var toolbar_snapshot = use_store_snapshot (toolbar_state);
		var selected_span_rows_snapshot = use_store_snapshot (selected_span_rows_store);
		var action_id_ref = use_ref (toolbar_snapshot.py_get ('action_id', 0));
		var parent_selected_idx = dict ({});
		if (spans_path_parts !== null) {
			for (var i = 1; i < len (spans_path_parts); i++) {
				var parent_path = '.'.join (spans_path_parts.__getslice__ (0, i, 1));
				var parent_rows = use_store_snapshot (selected_rows_by_store [parent_path]).py_get ('rows');
				parent_selected_idx [parent_path] = get_first_selected_row_idx (parent_rows);
			}
		}
		var toolbar_spans_store = (spans_path_parts !== null ? deep_get_store (data_store, spans_path_parts, parent_selected_idx) || empty_store : local_spans_store);
		var toolbar_span_data = use_store_snapshot (toolbar_spans_store);
		var selected_span_indices = get_selected_span_indices (toolbar_span_data, selected_span_rows_snapshot.py_get ('rows'));
		var selected_spans = (function () {
			var __accu0__ = [];
			for (var idx of selected_span_indices) {
				__accu0__.append (toolbar_span_data [idx]);
			}
			return __accu0__;
		}) ();
		var selected_span = (len (selected_spans) > 0 ? selected_spans [0] : null);
		var field_state_by_key = build_field_state_by_key (selected_spans, selected_span);
		var emit_action = function (action, payload) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'action': var action = __allkwargs0__ [__attrib0__]; break;
							case 'payload': var payload = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (typeof payload == 'undefined' || (payload != null && payload.hasOwnProperty ("__kwargtrans__"))) {;
				var payload = null;
			};
			action_id_ref.current += 1;
			toolbar_state ['action_id'] = action_id_ref.current;
			toolbar_state ['action'] = action;
			toolbar_state ['action_payload'] = payload;
		};
		var handle_add_or_update = function (label) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'label': var label = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			emit_action ('label_click', dict ([['label', label]]));
		};
		var handle_delete = function (event) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'event': var event = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (typeof event == 'undefined' || (event != null && event.hasOwnProperty ("__kwargtrans__"))) {;
				var event = null;
			};
			emit_action ('delete');
		};
		var handle_toggle_move = function (event) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'event': var event = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (typeof event == 'undefined' || (event != null && event.hasOwnProperty ("__kwargtrans__"))) {;
				var event = null;
			};
			emit_action ('toggle_move');
		};
		var handle_update_span = function (key, value) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'key': var key = __allkwargs0__ [__attrib0__]; break;
							case 'value': var value = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			emit_action ('update_span', dict ([['key', key], ['value', value]]));
		};
		return Toolbar (__kwargtrans__ ({on_add_span_click: handle_add_or_update, on_delete: handle_delete, selected_span: selected_span, on_update_span: handle_update_span, span_fields: span_fields, field_state_by_key: field_state_by_key, move_mode: toolbar_snapshot.py_get ('move_mode', false), on_toggle_move: handle_toggle_move}));
	};
	return ToolbarWidget;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_Toolbar_107 = function (Button, ButtonGroup, FormControl, FormLabel, Stack, render_field, button_field_name, button_key, labels) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'Button': var Button = __allkwargs0__ [__attrib0__]; break;
					case 'ButtonGroup': var ButtonGroup = __allkwargs0__ [__attrib0__]; break;
					case 'FormControl': var FormControl = __allkwargs0__ [__attrib0__]; break;
					case 'FormLabel': var FormLabel = __allkwargs0__ [__attrib0__]; break;
					case 'Stack': var Stack = __allkwargs0__ [__attrib0__]; break;
					case 'render_field': var render_field = __allkwargs0__ [__attrib0__]; break;
					case 'button_field_name': var button_field_name = __allkwargs0__ [__attrib0__]; break;
					case 'button_key': var button_key = __allkwargs0__ [__attrib0__]; break;
					case 'labels': var labels = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var Toolbar = function (on_add_span_click, on_delete, selected_span, on_update_span, span_fields, field_state_by_key, move_mode, on_toggle_move) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'on_add_span_click': var on_add_span_click = __allkwargs0__ [__attrib0__]; break;
						case 'on_delete': var on_delete = __allkwargs0__ [__attrib0__]; break;
						case 'selected_span': var selected_span = __allkwargs0__ [__attrib0__]; break;
						case 'on_update_span': var on_update_span = __allkwargs0__ [__attrib0__]; break;
						case 'span_fields': var span_fields = __allkwargs0__ [__attrib0__]; break;
						case 'field_state_by_key': var field_state_by_key = __allkwargs0__ [__attrib0__]; break;
						case 'move_mode': var move_mode = __allkwargs0__ [__attrib0__]; break;
						case 'on_toggle_move': var on_toggle_move = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof on_add_span_click == 'undefined' || (on_add_span_click != null && on_add_span_click.hasOwnProperty ("__kwargtrans__"))) {;
			var on_add_span_click = null;
		};
		if (typeof on_delete == 'undefined' || (on_delete != null && on_delete.hasOwnProperty ("__kwargtrans__"))) {;
			var on_delete = null;
		};
		if (typeof selected_span == 'undefined' || (selected_span != null && selected_span.hasOwnProperty ("__kwargtrans__"))) {;
			var selected_span = null;
		};
		if (typeof on_update_span == 'undefined' || (on_update_span != null && on_update_span.hasOwnProperty ("__kwargtrans__"))) {;
			var on_update_span = null;
		};
		if (typeof span_fields == 'undefined' || (span_fields != null && span_fields.hasOwnProperty ("__kwargtrans__"))) {;
			var span_fields = null;
		};
		if (typeof field_state_by_key == 'undefined' || (field_state_by_key != null && field_state_by_key.hasOwnProperty ("__kwargtrans__"))) {;
			var field_state_by_key = null;
		};
		if (typeof move_mode == 'undefined' || (move_mode != null && move_mode.hasOwnProperty ("__kwargtrans__"))) {;
			var move_mode = false;
		};
		if (typeof on_toggle_move == 'undefined' || (on_toggle_move != null && on_toggle_move.hasOwnProperty ("__kwargtrans__"))) {;
			var on_toggle_move = null;
		};
		var field_state_by_key = field_state_by_key || dict ({});
		var button_state = field_state_by_key.py_get (button_key, dict ({}));
		var button_is_mixed = button_state.py_get ('is_mixed', false);
		var btns = [];
		for (var [label, cfg] of labels.py_items ()) {
			if (!(selected_span) || !(button_is_mixed) && selected_span.py_get (button_key) == label) {
				var sx = dict ([['backgroundColor', cfg ['color']], ['color', 'black'], ['whiteSpace', 'nowrap']]);
			}
			else {
				var sx = dict ({});
			}
			var _handle_button_click = (function(label) { return (function (event, lab) {
				if (arguments.length) {
					var __ilastarg0__ = arguments.length - 1;
					if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
						var __allkwargs0__ = arguments [__ilastarg0__--];
						for (var __attrib0__ in __allkwargs0__) {
							switch (__attrib0__) {
								case 'event': var event = __allkwargs0__ [__attrib0__]; break;
								case 'lab': var lab = __allkwargs0__ [__attrib0__]; break;
							}
						}
					}
				}
				else {
				}
				if (typeof event == 'undefined' || (event != null && event.hasOwnProperty ("__kwargtrans__"))) {;
					var event = null;
				};
				if (typeof lab == 'undefined' || (lab != null && lab.hasOwnProperty ("__kwargtrans__"))) {;
					var lab = label;
				};
				if (selected_span && on_update_span) {
					on_update_span (button_key, lab);
				}
				else {
					on_add_span_click (lab);
				}
			});})(label);
			btns.append (ButtonGroup (Button (label, __kwargtrans__ ({on_click: _handle_button_click, size: 'sm', variant: 'soft', sx: sx})), (cfg.py_get ('shortcut') ? Button (cfg ['shortcut'], __kwargtrans__ ({size: 'sm', variant: 'soft', sx: sx})) : null), __kwargtrans__ ({sx: dict ([['display', 'inline-flex'], ['alignItems', 'flex-end']])})));
		}
		var span_inputs = [];
		if (selected_span && on_update_span && span_fields) {
			for (var col of span_fields) {
				if (col ['key'] != button_key) {
					var field_state = field_state_by_key.py_get (col ['key'], dict ({}));
					span_inputs.append (render_field (selected_span, col, on_update_span, __kwargtrans__ ({min_input_width: null, align_self: 'stretch', value: field_state.py_get ('value'), is_mixed: field_state.py_get ('is_mixed', false), use_explicit_value: true})));
				}
			}
		}
		return Stack (FormControl (FormLabel (button_field_name), Stack (...(btns), Button ('Delete ⌫', __kwargtrans__ ({color: 'danger', size: 'sm', on_click: on_delete, sx: dict ([['p', '0 8px']])})), (selected_span ? Button ('Move', __kwargtrans__ ({size: 'sm', variant: (move_mode ? 'solid' : 'soft'), color: (move_mode ? 'primary' : 'neutral'), on_click: on_toggle_move, sx: dict ([['p', '0 8px']])})) : null), __kwargtrans__ ({direction: 'row', spacing: 1, use_flex_gap: true, sx: dict ([['alignItems', 'flex-end'], ['flexWrap', 'wrap']])}))), (span_inputs ? Stack (...(span_inputs), __kwargtrans__ ({direction: 'row', spacing: 1, use_flex_gap: true, sx: dict ([['alignItems', 'flex-end'], ['flex', 1]])})) : null), __kwargtrans__ ({direction: 'row', spacing: 1, use_flex_gap: true, sx: dict ([['alignItems', 'flex-end'], ['flexWrap', 'wrap']])}));
	};
	return Toolbar;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_field_118 = function (render_boolean_field, render_select_field, render_text_field) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'render_boolean_field': var render_boolean_field = __allkwargs0__ [__attrib0__]; break;
					case 'render_select_field': var render_select_field = __allkwargs0__ [__attrib0__]; break;
					case 'render_text_field': var render_text_field = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var render_field = function (current_row, col, on_field_change, min_input_width, align_self, value, is_mixed, use_explicit_value) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'current_row': var current_row = __allkwargs0__ [__attrib0__]; break;
						case 'col': var col = __allkwargs0__ [__attrib0__]; break;
						case 'on_field_change': var on_field_change = __allkwargs0__ [__attrib0__]; break;
						case 'min_input_width': var min_input_width = __allkwargs0__ [__attrib0__]; break;
						case 'align_self': var align_self = __allkwargs0__ [__attrib0__]; break;
						case 'value': var value = __allkwargs0__ [__attrib0__]; break;
						case 'is_mixed': var is_mixed = __allkwargs0__ [__attrib0__]; break;
						case 'use_explicit_value': var use_explicit_value = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof align_self == 'undefined' || (align_self != null && align_self.hasOwnProperty ("__kwargtrans__"))) {;
			var align_self = null;
		};
		if (typeof value == 'undefined' || (value != null && value.hasOwnProperty ("__kwargtrans__"))) {;
			var value = null;
		};
		if (typeof is_mixed == 'undefined' || (is_mixed != null && is_mixed.hasOwnProperty ("__kwargtrans__"))) {;
			var is_mixed = false;
		};
		if (typeof use_explicit_value == 'undefined' || (use_explicit_value != null && use_explicit_value.hasOwnProperty ("__kwargtrans__"))) {;
			var use_explicit_value = false;
		};
		var key = col ['key'];
		if (!(use_explicit_value)) {
			var value = (current_row !== null ? current_row.py_get (key) : null);
		}
		var options = col.py_get ('options');
		var editable = col.py_get ('editable', false);
		var label = col.py_get ('name', key);
		var kind = col.py_get ('kind', 'text');
		if (__in__ (kind, tuple (['select', 'radio', 'autocomplete'])) && options !== null) {
			return render_select_field (key, label, kind, value, current_row, editable, options, on_field_change, min_input_width, align_self, __kwargtrans__ ({is_mixed: is_mixed}));
		}
		if (col.py_get ('kind') == 'boolean') {
			return render_boolean_field (key, label, value, current_row, editable, on_field_change, min_input_width, align_self, __kwargtrans__ ({is_mixed: is_mixed}));
		}
		return render_text_field (key, label, value, current_row, editable, on_field_change, min_input_width, align_self, __kwargtrans__ ({is_mixed: is_mixed}));
	};
	return render_field;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_boolean_field_119 = function (Checkbox, FormControl, FormLabel, make_field_label) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'Checkbox': var Checkbox = __allkwargs0__ [__attrib0__]; break;
					case 'FormControl': var FormControl = __allkwargs0__ [__attrib0__]; break;
					case 'FormLabel': var FormLabel = __allkwargs0__ [__attrib0__]; break;
					case 'make_field_label': var make_field_label = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var render_boolean_field = function (key, label, value, data, editable, on_field_change, min_input_width, align_self, is_mixed) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'key': var key = __allkwargs0__ [__attrib0__]; break;
						case 'label': var label = __allkwargs0__ [__attrib0__]; break;
						case 'value': var value = __allkwargs0__ [__attrib0__]; break;
						case 'data': var data = __allkwargs0__ [__attrib0__]; break;
						case 'editable': var editable = __allkwargs0__ [__attrib0__]; break;
						case 'on_field_change': var on_field_change = __allkwargs0__ [__attrib0__]; break;
						case 'min_input_width': var min_input_width = __allkwargs0__ [__attrib0__]; break;
						case 'align_self': var align_self = __allkwargs0__ [__attrib0__]; break;
						case 'is_mixed': var is_mixed = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof align_self == 'undefined' || (align_self != null && align_self.hasOwnProperty ("__kwargtrans__"))) {;
			var align_self = null;
		};
		if (typeof is_mixed == 'undefined' || (is_mixed != null && is_mixed.hasOwnProperty ("__kwargtrans__"))) {;
			var is_mixed = false;
		};
		var _on_change = function (event, checked) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'event': var event = __allkwargs0__ [__attrib0__]; break;
							case 'checked': var checked = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (typeof event == 'undefined' || (event != null && event.hasOwnProperty ("__kwargtrans__"))) {;
				var event = null;
			};
			if (typeof checked == 'undefined' || (checked != null && checked.hasOwnProperty ("__kwargtrans__"))) {;
				var checked = null;
			};
			var new_val = (checked !== null ? bool (checked) : getattr (getattr (event, 'target', null), 'checked', null));
			on_field_change (key, bool (new_val));
		};
		return FormControl (FormLabel (make_field_label (label, is_mixed)), Checkbox (__kwargtrans__ ({checked: (is_mixed ? false : bool (value)), indeterminate: is_mixed, on_change: _on_change, disabled: !(editable), size: 'md', sx: dict ([['flex', 1], ['alignItems', 'center']])})), __kwargtrans__ ({sx: dict ([['minWidth', min_input_width], ['alignSelf', align_self || 'flex-start'], ['gridArea', key]])}));
	};
	return render_boolean_field;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_make_field_label_122 = function (MIXED_VALUES_LABEL, div) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'MIXED_VALUES_LABEL': var MIXED_VALUES_LABEL = __allkwargs0__ [__attrib0__]; break;
					case 'div': var div = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var make_field_label = function (label, is_mixed) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'label': var label = __allkwargs0__ [__attrib0__]; break;
						case 'is_mixed': var is_mixed = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (!(is_mixed)) {
			return label;
		}
		var suffix = ' ({})'.format (MIXED_VALUES_LABEL);
		if (isinstance (label, str)) {
			return '{}{}'.format (label, suffix);
		}
		return div (label, suffix);
	};
	return make_field_label;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_select_field_123 = function (Autocomplete, FormControl, FormLabel, MIXED_VALUES_LABEL, Option, Radio, RadioGroup, Select, make_field_label) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'Autocomplete': var Autocomplete = __allkwargs0__ [__attrib0__]; break;
					case 'FormControl': var FormControl = __allkwargs0__ [__attrib0__]; break;
					case 'FormLabel': var FormLabel = __allkwargs0__ [__attrib0__]; break;
					case 'MIXED_VALUES_LABEL': var MIXED_VALUES_LABEL = __allkwargs0__ [__attrib0__]; break;
					case 'Option': var Option = __allkwargs0__ [__attrib0__]; break;
					case 'Radio': var Radio = __allkwargs0__ [__attrib0__]; break;
					case 'RadioGroup': var RadioGroup = __allkwargs0__ [__attrib0__]; break;
					case 'Select': var Select = __allkwargs0__ [__attrib0__]; break;
					case 'make_field_label': var make_field_label = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var render_select_field = function (key, label, kind, value, data, editable, options, on_field_change, min_input_width, align_self, all_label, is_mixed) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'key': var key = __allkwargs0__ [__attrib0__]; break;
						case 'label': var label = __allkwargs0__ [__attrib0__]; break;
						case 'kind': var kind = __allkwargs0__ [__attrib0__]; break;
						case 'value': var value = __allkwargs0__ [__attrib0__]; break;
						case 'data': var data = __allkwargs0__ [__attrib0__]; break;
						case 'editable': var editable = __allkwargs0__ [__attrib0__]; break;
						case 'options': var options = __allkwargs0__ [__attrib0__]; break;
						case 'on_field_change': var on_field_change = __allkwargs0__ [__attrib0__]; break;
						case 'min_input_width': var min_input_width = __allkwargs0__ [__attrib0__]; break;
						case 'align_self': var align_self = __allkwargs0__ [__attrib0__]; break;
						case 'all_label': var all_label = __allkwargs0__ [__attrib0__]; break;
						case 'is_mixed': var is_mixed = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof align_self == 'undefined' || (align_self != null && align_self.hasOwnProperty ("__kwargtrans__"))) {;
			var align_self = null;
		};
		if (typeof all_label == 'undefined' || (all_label != null && all_label.hasOwnProperty ("__kwargtrans__"))) {;
			var all_label = null;
		};
		if (typeof is_mixed == 'undefined' || (is_mixed != null && is_mixed.hasOwnProperty ("__kwargtrans__"))) {;
			var is_mixed = false;
		};
		var field_label = make_field_label (label, is_mixed);
		if (callable (options)) {
			var options = options (data);
		}
		var value = data [key];
		var select_options = list (options);
		if (len (select_options) == 0) {
			return ;
		}
		if (kind == 'autocomplete') {
			if (all_label !== null) {
				var select_options = [all_label, ...(select_options)];
				var value = (__in__ (value, tuple ([null, ''])) ? all_label : value);
			}
			var _on_change = function (event, val) {
				if (arguments.length) {
					var __ilastarg0__ = arguments.length - 1;
					if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
						var __allkwargs0__ = arguments [__ilastarg0__--];
						for (var __attrib0__ in __allkwargs0__) {
							switch (__attrib0__) {
								case 'event': var event = __allkwargs0__ [__attrib0__]; break;
								case 'val': var val = __allkwargs0__ [__attrib0__]; break;
							}
						}
					}
				}
				else {
				}
				if (all_label !== null && val == all_label) {
					on_field_change (key, '');
				}
				else {
					on_field_change (key, val);
				}
			};
			return FormControl (FormLabel (field_label), Autocomplete (__kwargtrans__ ({options: select_options, value: (is_mixed ? null : value), on_change: _on_change, disabled: !(editable), placeholder: (is_mixed ? MIXED_VALUES_LABEL : null), size: 'sm', sx: dict ([['flex', 1]])})), __kwargtrans__ ({sx: dict ([['minWidth', min_input_width || 0], ['width', 'fit-content'], ['alignSelf', align_self], ['gridArea', key], ['flex', 1]])}));
		}
		else if (kind == 'select') {
			if (all_label !== null && __in__ (value, tuple ([null, '']))) {
				var value = '';
			}
			var select_default_option = (all_label !== null ? [Option (all_label, __kwargtrans__ ({value: ''}))] : []);
			return FormControl (FormLabel (field_label), Select (...(select_default_option), ...((function () {
				var __accu0__ = [];
				for (var c of select_options) {
					__accu0__.append (Option (str (c), __kwargtrans__ ({value: c})));
				}
				return py_iter (__accu0__);
			}) ()), __kwargtrans__ ({value: (is_mixed ? null : value), on_change: (function __lambda__ (event, val) {
				if (arguments.length) {
					var __ilastarg0__ = arguments.length - 1;
					if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
						var __allkwargs0__ = arguments [__ilastarg0__--];
						for (var __attrib0__ in __allkwargs0__) {
							switch (__attrib0__) {
								case 'event': var event = __allkwargs0__ [__attrib0__]; break;
								case 'val': var val = __allkwargs0__ [__attrib0__]; break;
							}
						}
					}
				}
				else {
				}
				return on_field_change (key, val);
			}), disabled: !(editable), placeholder: (is_mixed ? MIXED_VALUES_LABEL : null), size: 'sm', sx: dict ([['flex', 1]])})), __kwargtrans__ ({sx: dict ([['minWidth', min_input_width], ['alignSelf', align_self], ['gridArea', key], ['flex', 1]])}));
		}
		else if (kind == 'radio') {
			return FormControl (FormLabel (field_label), RadioGroup (...((function () {
				var __accu0__ = [];
				for (var c of options) {
					__accu0__.append (Radio (__kwargtrans__ ({label: str (c), value: c, size: 'sm'})));
				}
				return py_iter (__accu0__);
			}) ()), __kwargtrans__ ({value: value, on_change: (function __lambda__ (event) {
				if (arguments.length) {
					var __ilastarg0__ = arguments.length - 1;
					if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
						var __allkwargs0__ = arguments [__ilastarg0__--];
						for (var __attrib0__ in __allkwargs0__) {
							switch (__attrib0__) {
								case 'event': var event = __allkwargs0__ [__attrib0__]; break;
							}
						}
					}
				}
				else {
				}
				return on_field_change (key, event.target.value);
			}), disabled: !(editable), size: 'sm'})), __kwargtrans__ ({sx: dict ([['gridArea', key], ['alignSelf', align_self]])}));
		}
		else {
			print ('Unsupported select field kind: {}'.format (kind));
		}
	};
	return render_select_field;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_text_field_134 = function (FormControl, FormLabel, Input, MIXED_VALUES_LABEL, make_field_label) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'FormControl': var FormControl = __allkwargs0__ [__attrib0__]; break;
					case 'FormLabel': var FormLabel = __allkwargs0__ [__attrib0__]; break;
					case 'Input': var Input = __allkwargs0__ [__attrib0__]; break;
					case 'MIXED_VALUES_LABEL': var MIXED_VALUES_LABEL = __allkwargs0__ [__attrib0__]; break;
					case 'make_field_label': var make_field_label = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var render_text_field = function (key, label, value, data, editable, on_field_change, min_input_width, align_self, is_mixed) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'key': var key = __allkwargs0__ [__attrib0__]; break;
						case 'label': var label = __allkwargs0__ [__attrib0__]; break;
						case 'value': var value = __allkwargs0__ [__attrib0__]; break;
						case 'data': var data = __allkwargs0__ [__attrib0__]; break;
						case 'editable': var editable = __allkwargs0__ [__attrib0__]; break;
						case 'on_field_change': var on_field_change = __allkwargs0__ [__attrib0__]; break;
						case 'min_input_width': var min_input_width = __allkwargs0__ [__attrib0__]; break;
						case 'align_self': var align_self = __allkwargs0__ [__attrib0__]; break;
						case 'is_mixed': var is_mixed = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof align_self == 'undefined' || (align_self != null && align_self.hasOwnProperty ("__kwargtrans__"))) {;
			var align_self = null;
		};
		if (typeof is_mixed == 'undefined' || (is_mixed != null && is_mixed.hasOwnProperty ("__kwargtrans__"))) {;
			var is_mixed = false;
		};
		var _on_change = function (event) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'event': var event = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (typeof event == 'undefined' || (event != null && event.hasOwnProperty ("__kwargtrans__"))) {;
				var event = null;
			};
			var target = getattr (event, 'target', null);
			on_field_change (key, getattr (target, 'value', ''));
		};
		var value = data [key];
		return FormControl (FormLabel (make_field_label (label, is_mixed)), Input (__kwargtrans__ ({value: (is_mixed || value === null ? '' : value), on_change: _on_change, read_only: !(editable), disabled: !(editable), placeholder: (is_mixed ? MIXED_VALUES_LABEL : null), size: 'sm'})), __kwargtrans__ ({sx: dict ([['minWidth', min_input_width], ['alignSelf', align_self], ['gridArea', key]])}));
	};
	return render_text_field;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_build_field_state_by_key_137 = function (span_fields) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'span_fields': var span_fields = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var build_field_state_by_key = function (selected_spans, fallback_span) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'selected_spans': var selected_spans = __allkwargs0__ [__attrib0__]; break;
						case 'fallback_span': var fallback_span = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		var field_state = dict ({});
		for (var col of span_fields) {
			var key = col.py_get ('key');
			if (key === null) {
				continue;
			}
			if (len (selected_spans) > 0) {
				var first_value = selected_spans [0].py_get (key);
				var is_mixed = any ((function () {
					var __accu0__ = [];
					for (var span of selected_spans.__getslice__ (1, null, 1)) {
						__accu0__.append (span.py_get (key) != first_value);
					}
					return py_iter (__accu0__);
				}) ());
				if (is_mixed) {
					var value = (fallback_span !== null ? fallback_span.py_get (key) : first_value);
				}
				else {
					var value = first_value;
				}
			}
			else {
				var value = (fallback_span !== null ? fallback_span.py_get (key) : null);
				var is_mixed = false;
			}
			field_state [key] = dict ([['value', value], ['is_mixed', is_mixed]]);
		}
		return field_state;
	};
	return build_field_state_by_key;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_x_138 = function (children, create_fn, props) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'children': var children = __allkwargs0__ [__attrib0__]; break;
					case 'create_fn': var create_fn = __allkwargs0__ [__attrib0__]; break;
					case 'props': var props = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var render_x = function () {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
				}
			}
		}
		else {
		}
		return create_fn (...(children), __kwargtrans__ (props));
	};
	return render_x;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_SelectedFieldView_141 = function (get_first_selected_row_idx, use_store_snapshot, data_store, deep_get_store, empty_store, fallback, path_parts, selected_rows_by_store, selected_rows_store, shown_key) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'get_first_selected_row_idx': var get_first_selected_row_idx = __allkwargs0__ [__attrib0__]; break;
					case 'use_store_snapshot': var use_store_snapshot = __allkwargs0__ [__attrib0__]; break;
					case 'data_store': var data_store = __allkwargs0__ [__attrib0__]; break;
					case 'deep_get_store': var deep_get_store = __allkwargs0__ [__attrib0__]; break;
					case 'empty_store': var empty_store = __allkwargs0__ [__attrib0__]; break;
					case 'fallback': var fallback = __allkwargs0__ [__attrib0__]; break;
					case 'path_parts': var path_parts = __allkwargs0__ [__attrib0__]; break;
					case 'selected_rows_by_store': var selected_rows_by_store = __allkwargs0__ [__attrib0__]; break;
					case 'selected_rows_store': var selected_rows_store = __allkwargs0__ [__attrib0__]; break;
					case 'shown_key': var shown_key = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var SelectedFieldView = function () {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
				}
			}
		}
		else {
		}
		var parent_selected_idx = dict ({});
		for (var i = 1; i < len (path_parts); i++) {
			var parent_path = '.'.join (path_parts.__getslice__ (0, i, 1));
			var parent_rows = use_store_snapshot (selected_rows_by_store [parent_path]).py_get ('rows');
			parent_selected_idx [parent_path] = get_first_selected_row_idx (parent_rows);
		}
		var view_store = deep_get_store (data_store, path_parts, parent_selected_idx) || empty_store;
		var rows = use_store_snapshot (view_store);
		var row_idx = get_first_selected_row_idx (use_store_snapshot (selected_rows_store).py_get ('rows'));
		var current_idx = null;
		if (isinstance (row_idx, int) && rows && (0 <= row_idx && row_idx < len (rows))) {
			var current_idx = row_idx;
		}
		if (current_idx === null) {
			return fallback;
		}
		var row = rows [current_idx];
		return row.py_get (shown_key, fallback);
	};
	return SelectedFieldView;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_145 = function (children, props, py_to_react) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'children': var children = __allkwargs0__ [__attrib0__]; break;
					case 'props': var props = __allkwargs0__ [__attrib0__]; break;
					case 'py_to_react': var py_to_react = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var render = function () {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
				}
			}
		}
		else {
		}
		return py_to_react (...(children), __kwargtrans__ (props));
	};
	return render;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_146 = function (children, props, py_to_react) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'children': var children = __allkwargs0__ [__attrib0__]; break;
					case 'props': var props = __allkwargs0__ [__attrib0__]; break;
					case 'py_to_react': var py_to_react = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var render = function () {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
				}
			}
		}
		else {
		}
		return py_to_react (...(children), __kwargtrans__ (props));
	};
	return render;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_147 = function (children, props, py_to_react) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'children': var children = __allkwargs0__ [__attrib0__]; break;
					case 'props': var props = __allkwargs0__ [__attrib0__]; break;
					case 'py_to_react': var py_to_react = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var render = function () {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
				}
			}
		}
		else {
		}
		return py_to_react (...(children), __kwargtrans__ (props));
	};
	return render;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_x_148 = function (children, create_fn, props) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'children': var children = __allkwargs0__ [__attrib0__]; break;
					case 'create_fn': var create_fn = __allkwargs0__ [__attrib0__]; break;
					case 'props': var props = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var render_x = function () {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
				}
			}
		}
		else {
		}
		return create_fn (...(children), __kwargtrans__ (props));
	};
	return render_x;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_FormWidget_151 = function (Any, Button, Dict, Stack, div, get_first_selected_row_idx, normalize_selected_rows, render_field, transact, use_effect, use_event_callback, use_imperative_handle, use_store_snapshot, add_navigation_buttons, data_store, deep_get_store, empty_store, fields, handle, handles, min_input_width, path_parts, selected_rows_by_store, selected_rows_store, store_key, style, sync_parent_widgets, sync_store_selection) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'Any': var Any = __allkwargs0__ [__attrib0__]; break;
					case 'Button': var Button = __allkwargs0__ [__attrib0__]; break;
					case 'Dict': var Dict = __allkwargs0__ [__attrib0__]; break;
					case 'Stack': var Stack = __allkwargs0__ [__attrib0__]; break;
					case 'div': var div = __allkwargs0__ [__attrib0__]; break;
					case 'get_first_selected_row_idx': var get_first_selected_row_idx = __allkwargs0__ [__attrib0__]; break;
					case 'normalize_selected_rows': var normalize_selected_rows = __allkwargs0__ [__attrib0__]; break;
					case 'render_field': var render_field = __allkwargs0__ [__attrib0__]; break;
					case 'transact': var transact = __allkwargs0__ [__attrib0__]; break;
					case 'use_effect': var use_effect = __allkwargs0__ [__attrib0__]; break;
					case 'use_event_callback': var use_event_callback = __allkwargs0__ [__attrib0__]; break;
					case 'use_imperative_handle': var use_imperative_handle = __allkwargs0__ [__attrib0__]; break;
					case 'use_store_snapshot': var use_store_snapshot = __allkwargs0__ [__attrib0__]; break;
					case 'add_navigation_buttons': var add_navigation_buttons = __allkwargs0__ [__attrib0__]; break;
					case 'data_store': var data_store = __allkwargs0__ [__attrib0__]; break;
					case 'deep_get_store': var deep_get_store = __allkwargs0__ [__attrib0__]; break;
					case 'empty_store': var empty_store = __allkwargs0__ [__attrib0__]; break;
					case 'fields': var fields = __allkwargs0__ [__attrib0__]; break;
					case 'handle': var handle = __allkwargs0__ [__attrib0__]; break;
					case 'handles': var handles = __allkwargs0__ [__attrib0__]; break;
					case 'min_input_width': var min_input_width = __allkwargs0__ [__attrib0__]; break;
					case 'path_parts': var path_parts = __allkwargs0__ [__attrib0__]; break;
					case 'selected_rows_by_store': var selected_rows_by_store = __allkwargs0__ [__attrib0__]; break;
					case 'selected_rows_store': var selected_rows_store = __allkwargs0__ [__attrib0__]; break;
					case 'store_key': var store_key = __allkwargs0__ [__attrib0__]; break;
					case 'style': var style = __allkwargs0__ [__attrib0__]; break;
					case 'sync_parent_widgets': var sync_parent_widgets = __allkwargs0__ [__attrib0__]; break;
					case 'sync_store_selection': var sync_store_selection = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var FormWidget = function () {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
				}
			}
		}
		else {
		}
		var parent_selected_idx = dict ({});
		for (var i = 1; i < len (path_parts); i++) {
			var parent_path = '.'.join (path_parts.__getslice__ (0, i, 1));
			var parent_rows = use_store_snapshot (selected_rows_by_store [parent_path]).py_get ('rows');
			parent_selected_idx [parent_path] = get_first_selected_row_idx (parent_rows);
		}
		var view_store = deep_get_store (data_store, path_parts, parent_selected_idx) || empty_store;
		var rows = use_store_snapshot (view_store);
		var selected_rows_snapshot = use_store_snapshot (selected_rows_store);
		var row_idx = get_first_selected_row_idx (selected_rows_snapshot.py_get ('rows'));
		var default_row_idx = (row_idx === null && len (rows) > 0 ? 0 : null);
		var current_idx = null;
		if (isinstance (row_idx, int) && rows && (0 <= row_idx && row_idx < len (rows))) {
			var current_idx = row_idx;
		}
		else if (default_row_idx !== null) {
			var current_idx = default_row_idx;
		}
		var current_row = (current_idx !== null ? rows [current_idx] : null);
		var selected_row_indices = normalize_selected_rows (selected_rows_snapshot.py_get ('rows'), default_row_idx, len (rows));
		var selected_rows_data = (function () {
			var __accu0__ = [];
			for (var idx of selected_row_indices) {
				__accu0__.append (rows [idx]);
			}
			return __accu0__;
		}) ();
		var ensure_initial_row_selection = function () {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
					}
				}
			}
			else {
			}
			if (len (selected_rows_store ['rows']) == 0 && len (rows) > 0) {
				selected_rows_store ['rows'] = [0];
			}
		};
		use_effect (ensure_initial_row_selection, []);
		var get_table_handle = function () {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
					}
				}
			}
			else {
			}
			for (var other of handles.py_get (store_key, [])) {
				if (other [1] == 'table' && other [0].current !== null) {
					return other [0];
				}
			}
			return null;
		};
		var set_row_idx = function (idx, sync) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'idx': var idx = __allkwargs0__ [__attrib0__]; break;
							case 'sync': var sync = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (typeof sync == 'undefined' || (sync != null && sync.hasOwnProperty ("__kwargtrans__"))) {;
				var sync = false;
			};
			if (idx === null) {
				return ;
			}
			if (rows && (idx < 0 || idx >= len (rows))) {
				var idx = 0;
			}
			if (sync) {
				sync_parent_widgets (store_key, idx);
				sync_store_selection (store_key, idx, handle, true, [idx]);
			}
			else {
				selected_rows_store ['rows'] = [idx];
			}
		};
		var nav = function (delta) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'delta': var delta = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (!(rows)) {
				return ;
			}
			var table_handle = get_table_handle ();
			var next_row_idx = null;
			if (table_handle !== null) {
				var next_row_idx = table_handle.current.get_adjacent_row_idx (current_idx, delta);
			}
			if (next_row_idx === null) {
				if (current_idx === null) {
					var next_row_idx = (delta >= 0 ? 0 : len (rows) - 1);
				}
				else {
					var next_row_idx = __mod__ (current_idx + delta, len (rows));
				}
			}
			if (next_row_idx === null) {
				return ;
			}
			set_row_idx (next_row_idx, __kwargtrans__ ({sync: true}));
		};
		use_imperative_handle (handle, (function __lambda__ () {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
					}
				}
			}
			else {
			}
			return dict ([['get_row_idx', (function __lambda__ () {
				if (arguments.length) {
					var __ilastarg0__ = arguments.length - 1;
					if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
						var __allkwargs0__ = arguments [__ilastarg0__--];
						for (var __attrib0__ in __allkwargs0__) {
						}
					}
				}
				else {
				}
				return current_idx;
			})], ['set_row_idx', (function __lambda__ (idx) {
				if (arguments.length) {
					var __ilastarg0__ = arguments.length - 1;
					if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
						var __allkwargs0__ = arguments [__ilastarg0__--];
						for (var __attrib0__ in __allkwargs0__) {
							switch (__attrib0__) {
								case 'idx': var idx = __allkwargs0__ [__attrib0__]; break;
							}
						}
					}
				}
				else {
				}
				return set_row_idx (idx);
			})]]);
		}));
		var handle_field_change = use_event_callback (function (key, value) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'key': var key = __allkwargs0__ [__attrib0__]; break;
							case 'value': var value = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (current_idx === null) {
				return ;
			}
			if (!(selected_row_indices)) {
				view_store [current_idx] [key] = value;
				return ;
			}
			var __withid0__ = transact (view_store);
			try {
				__withid0__.__enter__ ();
				for (var idx of selected_row_indices) {
					view_store [idx] [key] = value;
				}
				__withid0__.__exit__ ();
			}
			catch (__except0__) {
				if (! (__withid0__.__exit__ (__except0__.name, __except0__, __except0__.stack))) {
					throw __except0__;
				}
			}
			finally {
				__withid0__.__exit__ ();
			}
		});
		var get_field_state = function (field_key) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'field_key': var field_key = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (len (selected_rows_data) == 0) {
				var current_value = (current_row !== null ? current_row.py_get (field_key) : null);
				return tuple ([current_value, false]);
			}
			var first_value = selected_rows_data [0].py_get (field_key);
			var is_mixed = any ((function () {
				var __accu0__ = [];
				for (var row of selected_rows_data.__getslice__ (1, null, 1)) {
					__accu0__.append (row.py_get (field_key) != first_value);
				}
				return py_iter (__accu0__);
			}) ());
			if (!(is_mixed)) {
				return tuple ([first_value, false]);
			}
			var current_value = (current_row !== null ? current_row.py_get (field_key) : first_value);
			return tuple ([current_value, true]);
		};
		var render_form_field = function (field) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'field': var field = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			var __left0__ = get_field_state (field ['key']);
			var field_value = __left0__ [0];
			var field_is_mixed = __left0__ [1];
			return render_field (current_row, field, handle_field_change, min_input_width, __kwargtrans__ ({value: field_value, is_mixed: field_is_mixed, use_explicit_value: true}));
		};
		if (!(current_row)) {
			return div ('No data available', __kwargtrans__ ({style: style}));
		}
		var navigation_controls = null;
		if (add_navigation_buttons) {
			var navigation_controls = Stack (Button ('← Previous', __kwargtrans__ ({on_click: (function __lambda__ (e) {
				if (arguments.length) {
					var __ilastarg0__ = arguments.length - 1;
					if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
						var __allkwargs0__ = arguments [__ilastarg0__--];
						for (var __attrib0__ in __allkwargs0__) {
							switch (__attrib0__) {
								case 'e': var e = __allkwargs0__ [__attrib0__]; break;
							}
						}
					}
				}
				else {
				}
				return nav (-(1));
			}), size: 'sm', variant: 'soft', sx: dict ([['flex', 1]])})), Button ('Next →', __kwargtrans__ ({on_click: (function __lambda__ (e) {
				if (arguments.length) {
					var __ilastarg0__ = arguments.length - 1;
					if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
						var __allkwargs0__ = arguments [__ilastarg0__--];
						for (var __attrib0__ in __allkwargs0__) {
							switch (__attrib0__) {
								case 'e': var e = __allkwargs0__ [__attrib0__]; break;
							}
						}
					}
				}
				else {
				}
				return nav (1);
			}), size: 'sm', variant: 'soft', sx: dict ([['flex', 1]])})), __kwargtrans__ ({direction: 'row', spacing: 1, use_flex_gap: true, sx: dict ([['alignItems', 'center'], ['gridArea', 'nav']])}));
		}
		return Stack (navigation_controls, ...((function () {
			var __accu0__ = [];
			for (var f of fields) {
				__accu0__.append (render_form_field (f));
			}
			return __accu0__;
		}) ()), __kwargtrans__ ({direction: 'column', spacing: 1, use_flex_gap: true, style: style}));
	};
	return FormWidget;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_sync_parent_widgets_153 = function (get_first_selected_row_idx, data_store, deep_get_store, primary_keys, selected_rows_by_store, sync_store_selection) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'get_first_selected_row_idx': var get_first_selected_row_idx = __allkwargs0__ [__attrib0__]; break;
					case 'data_store': var data_store = __allkwargs0__ [__attrib0__]; break;
					case 'deep_get_store': var deep_get_store = __allkwargs0__ [__attrib0__]; break;
					case 'primary_keys': var primary_keys = __allkwargs0__ [__attrib0__]; break;
					case 'selected_rows_by_store': var selected_rows_by_store = __allkwargs0__ [__attrib0__]; break;
					case 'sync_store_selection': var sync_store_selection = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var sync_parent_widgets = function (store_key, row_idx) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'store_key': var store_key = __allkwargs0__ [__attrib0__]; break;
						case 'row_idx': var row_idx = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (row_idx === null) {
			return ;
		}
		var path_parts = str (store_key).py_split ('.');
		var parent_selected_idx = dict ({});
		for (var i = 1; i < len (path_parts); i++) {
			var parent_path = '.'.join (path_parts.__getslice__ (0, i, 1));
			var parent_store = selected_rows_by_store.py_get (parent_path);
			parent_selected_idx [parent_path] = (parent_store !== null ? get_first_selected_row_idx (parent_store ['rows']) : null);
		}
		var data = deep_get_store (data_store, path_parts, parent_selected_idx);
		if (data === null || len (data) == 0 || row_idx < 0 || row_idx >= len (data)) {
			return ;
		}
		var row = data [row_idx];
		for (var [parent_store_key, parent_key] of primary_keys.py_items ()) {
			if (parent_store_key == store_key) {
				continue;
			}
			var parent_id = row.py_get (parent_key);
			if (parent_id === null) {
				continue;
			}
			var parent_parts = str (parent_store_key).py_split ('.');
			var parent_selected_idx = dict ({});
			for (var i = 1; i < len (parent_parts); i++) {
				var parent_path = '.'.join (parent_parts.__getslice__ (0, i, 1));
				var parent_store = selected_rows_by_store.py_get (parent_path);
				parent_selected_idx [parent_path] = (parent_store !== null ? get_first_selected_row_idx (parent_store ['rows']) : null);
			}
			var parent_data = deep_get_store (data_store, parent_parts, parent_selected_idx);
			if (parent_data === null || len (parent_data) == 0) {
				continue;
			}
			var parent_pk = primary_keys [parent_store_key];
			var parent_idx = null;
			for (var [i, item] of enumerate (parent_data)) {
				if (str (item.py_get (parent_pk)) == str (parent_id)) {
					var parent_idx = i;
					break;
				}
			}
			if (parent_idx === null) {
				continue;
			}
			sync_store_selection (parent_store_key, parent_idx, null, false);
		}
	};
	return sync_parent_widgets;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_sync_store_selection_154 = function (get_first_selected_row_idx, normalize_selected_rows, data_store, deep_get_store, filter_related_tables, handles, primary_keys, selected_rows_by_store) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'get_first_selected_row_idx': var get_first_selected_row_idx = __allkwargs0__ [__attrib0__]; break;
					case 'normalize_selected_rows': var normalize_selected_rows = __allkwargs0__ [__attrib0__]; break;
					case 'data_store': var data_store = __allkwargs0__ [__attrib0__]; break;
					case 'deep_get_store': var deep_get_store = __allkwargs0__ [__attrib0__]; break;
					case 'filter_related_tables': var filter_related_tables = __allkwargs0__ [__attrib0__]; break;
					case 'handles': var handles = __allkwargs0__ [__attrib0__]; break;
					case 'primary_keys': var primary_keys = __allkwargs0__ [__attrib0__]; break;
					case 'selected_rows_by_store': var selected_rows_by_store = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var sync_store_selection = function (store_key, row_idx, source_handle, sync_related_tables, selected_rows) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'store_key': var store_key = __allkwargs0__ [__attrib0__]; break;
						case 'row_idx': var row_idx = __allkwargs0__ [__attrib0__]; break;
						case 'source_handle': var source_handle = __allkwargs0__ [__attrib0__]; break;
						case 'sync_related_tables': var sync_related_tables = __allkwargs0__ [__attrib0__]; break;
						case 'selected_rows': var selected_rows = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof selected_rows == 'undefined' || (selected_rows != null && selected_rows.hasOwnProperty ("__kwargtrans__"))) {;
			var selected_rows = null;
		};
		if (row_idx === null) {
			return ;
		}
		var path_parts = str (store_key).py_split ('.');
		var parent_selected_idx = dict ({});
		for (var i = 1; i < len (path_parts); i++) {
			var parent_path = '.'.join (path_parts.__getslice__ (0, i, 1));
			var parent_store = selected_rows_by_store.py_get (parent_path);
			parent_selected_idx [parent_path] = (parent_store !== null ? get_first_selected_row_idx (parent_store ['rows']) : null);
		}
		var data = deep_get_store (data_store, path_parts, parent_selected_idx);
		if (data === null || len (data) == 0 || row_idx < 0 || row_idx >= len (data)) {
			return ;
		}
		var selected_rows_store = selected_rows_by_store.py_get (store_key);
		var previous_lead_idx = (selected_rows_store !== null ? get_first_selected_row_idx (selected_rows_store ['rows']) : null);
		var normalized_selected_rows = normalize_selected_rows (selected_rows, row_idx, len (data));
		if (selected_rows_store !== null) {
			selected_rows_store ['rows'] = normalized_selected_rows;
		}
		var next_lead_idx = get_first_selected_row_idx (normalized_selected_rows);
		if (previous_lead_idx != next_lead_idx) {
			var descendant_prefix = '{}.'.format (store_key);
			for (var [candidate_store_key, candidate_rows_store] of selected_rows_by_store.py_items ()) {
				if (str (candidate_store_key).startswith (descendant_prefix)) {
					candidate_rows_store ['rows'] = [];
				}
			}
		}
		var row = data [row_idx];
		var primary_key = primary_keys [store_key];
		var row_id = row [primary_key];
		for (var other of handles.py_get (store_key, [])) {
			var other_handle = other [0];
			var other_kind = other [1];
			if (other_handle.current === null) {
				continue;
			}
			if (other_handle == source_handle) {
				continue;
			}
			if (other_kind == 'spans') {
				other_handle.current.scroll_to_span (row_id);
			}
			else if (other_kind == 'table') {
				other_handle.current.scroll_to_row_id (row_id);
			}
		}
		if (sync_related_tables) {
			filter_related_tables (primary_key, row_id, store_key, source_handle);
		}
	};
	return sync_store_selection;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_filter_related_tables_155 = function (handles) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'handles': var handles = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var filter_related_tables = function (filter_key, filter_value, source_store_key, source_handle) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'filter_key': var filter_key = __allkwargs0__ [__attrib0__]; break;
						case 'filter_value': var filter_value = __allkwargs0__ [__attrib0__]; break;
						case 'source_store_key': var source_store_key = __allkwargs0__ [__attrib0__]; break;
						case 'source_handle': var source_handle = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		for (var [other_store_key, handle_list] of handles.py_items ()) {
			if (other_store_key == source_store_key) {
				continue;
			}
			for (var handle_item of handle_list) {
				var other_handle = handle_item [0];
				var other_kind = handle_item [1];
				var accept_related_filter_keys = (len (handle_item) > 2 ? handle_item [2] : true);
				if (other_kind != 'table' || other_handle.current === null) {
					continue;
				}
				if (other_handle == source_handle) {
					continue;
				}
				if (accept_related_filter_keys === false) {
					continue;
				}
				if (accept_related_filter_keys !== true && accept_related_filter_keys !== null && !__in__ (filter_key, accept_related_filter_keys)) {
					continue;
				}
				other_handle.current.set_filter (filter_key, str (filter_value));
			}
		}
	};
	return filter_related_tables;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_158 = function (children, props, py_to_react) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'children': var children = __allkwargs0__ [__attrib0__]; break;
					case 'props': var props = __allkwargs0__ [__attrib0__]; break;
					case 'py_to_react': var py_to_react = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var render = function () {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
				}
			}
		}
		else {
		}
		return py_to_react (...(children), __kwargtrans__ (props));
	};
	return render;
};var pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_161 = function (children, props, py_to_react) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'children': var children = __allkwargs0__ [__attrib0__]; break;
					case 'props': var props = __allkwargs0__ [__attrib0__]; break;
					case 'py_to_react': var py_to_react = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var render = function () {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
				}
			}
		}
		else {
		}
		return py_to_react (...(children), __kwargtrans__ (props));
	};
	return render;
};

//# sourceMappingURL=__main__.map
function pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_4(react_to_py) {
return function py_to_react() {
	if (
        arguments.length > 0
        && arguments[arguments.length - 1]
        && arguments[arguments.length - 1].hasOwnProperty("__kwargtrans__")
	) {
        var children = Array.prototype.slice.call(arguments, 0, -1);
        var props = arguments[arguments.length - 1];
    } else {
        var children = Array.prototype.slice.call(arguments, 0, -1);
        var props = {};
    }
    delete props.__kwargtrans__;
    return window.React.createElement(
        react_to_py,
        props,
        ...(Array.isArray(children) ? children : [children])
    );
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_4};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_react_to_py_5(fn) {
return function react_to_py(props) {
    var children = props.children || {};
    var rest = Object.fromEntries(
        Object.entries(props).filter(([key, _]) => key !== "children")
    );
    return fn(...Object.values(props.children || {}), __kwargtrans__(rest));
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_react_to_py_5};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_7(name, props_mapping, snapshot) {
return function py_to_react() {
    var children;
    var props;
	if (
        arguments.length > 0
        && arguments[arguments.length - 1]
        && arguments[arguments.length - 1].hasOwnProperty("__kwargtrans__")
    ) {
        children = Array.prototype.slice.call(arguments, 0, -1);
        props = arguments[arguments.length - 1];
        delete props.__kwargtrans__;
        var props = Object.fromEntries(Object.entries(props).map(([k, v]) => [
            props_mapping[k] || k,
            snapshot(v)
        ]));
    } else {
        children = Array.from(arguments);
        props = {};
    }
    return window.React.createElement(
        name,
        props,
        ...(Array.isArray(children) ? children : [children])
    );
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_7};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_8() {
  return pret_modules.js.Metanno.AnnotatedText;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_8};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_snapshot_9() {
return window.storeLib.snapshot;;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_snapshot_9};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_17(name, props_mapping, snapshot) {
return function py_to_react() {
    var children;
    var props;
	if (
        arguments.length > 0
        && arguments[arguments.length - 1]
        && arguments[arguments.length - 1].hasOwnProperty("__kwargtrans__")
    ) {
        children = Array.prototype.slice.call(arguments, 0, -1);
        props = arguments[arguments.length - 1];
        delete props.__kwargtrans__;
        var props = Object.fromEntries(Object.entries(props).map(([k, v]) => [
            props_mapping[k] || k,
            snapshot(v)
        ]));
    } else {
        children = Array.from(arguments);
        props = {};
    }
    return window.React.createElement(
        name,
        props,
        ...(Array.isArray(children) ? children : [children])
    );
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_17};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_transact_21() {
return (function(store, origin) {
    const _enter = () => {
        const txRes = window.storeLib.beginTransaction(store, origin);
        res.__exit__ = txRes[1];
        return txRes[0];
    };
    const res = {
        "__enter__": _enter,
        "__exit__": () => {},
    };
    return res;
});
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_transact_21};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92__use_event_callback_impl_24() {
return function use_event_callback(callback, dependencies) {
    const callbackRef = window.React.useRef(callback);
    callbackRef.current = callback;

    return window.React.useCallback(
        (function () {return callbackRef.current(...arguments)}),
        dependencies,
    );
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92__use_event_callback_impl_24};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_use_imperative_handle_25() {
return window.React.useImperativeHandle;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_use_imperative_handle_25};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_use_ref_26() {
return window.React.useRef;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_use_ref_26};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_use_state_27() {
return window.React.useState;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_use_state_27};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_use_store_snapshot_28() {
return window.storeLib.useSnapshot;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_use_store_snapshot_28};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92__rebuild_obj_30() {
return (function rebuild_obj(obj, path) {
           for (var part of path) {
               obj = obj.get(part);
           }
           var proxy = window.storeLib.makeStore(obj);
           return proxy;
       });;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92__rebuild_obj_30};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92__rebuild_doc_31(get_manager) {
return (function rebuild_doc(update, roots, sync_id) {
    var ydoc = new window.Y.Doc();
    ydoc.getMap("_");  // Ensure the root map exists
    ydoc.apply_update(update);
    if (sync_id) {
        var manager = get_manager();
        // Will subscribe to updates on ydoc and let the manager dispatch them
        // and apply updates to the ydoc when the manager receives them
        manager.register_state(sync_id, ydoc);
    }
    return ydoc;
});;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92__rebuild_doc_31};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_make_uuid_36() {
return () => {
   const cryptoObj = (globalThis.crypto || globalThis.msCrypto);
   if (!cryptoObj?.getRandomValues) {
       throw new Error("Secure RNG unavailable: crypto.getRandomValues not supported.");
   }

   const bytes = new Uint8Array(16);
   cryptoObj.getRandomValues(bytes);

   // RFC 4122 version & variant bits
   bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
   bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10

   let hex = "";
   for (let i = 0; i < 16; i++) hex += bytes[i].toString(16).padStart(2, "0");
   return hex;
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_make_uuid_36};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_b64_encode_41() {
return (function b64_encode(data) {
    var u8 = new Uint8Array(data);
    var binary = '';
    for (var i = 0; i < u8.length; i += 32768) {
        binary += String.fromCharCode.apply(
          null,
          u8.subarray(i, i + 32768)
        );
    }
    return btoa(binary);
});;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_b64_encode_41};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_is_awaitable_44() {
return function is_awaitable(value) {
   return true;
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_is_awaitable_44};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_start_async_task_45() {
return function start_async_task(task) {
    return task;
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_start_async_task_45};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_b64_decode_55() {
return (function b64_decode(data) {
    return Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
});;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_b64_decode_55};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_function_identifier_64() {
return function function_identifier(func) {
    throw new Error("function_identifier is not implemented in JavaScript");
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_function_identifier_64};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_ensure_store_undo_manager_67() {
return function ensure_store_undo_manager(state) {
    if (window.storeLib && typeof window.storeLib.ensureUndoManagerForDoc === "function") {
        return window.storeLib.ensureUndoManagerForDoc(state);
    }
    return null;
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_ensure_store_undo_manager_67};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_install_store_sync_guard_68() {
return function install_store_sync_guard(state, guard) {
    if (window.storeLib && typeof window.storeLib.installSyncGuardForDoc === "function") {
        window.storeLib.installSyncGuardForDoc(state, guard);
    }
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_install_store_sync_guard_68};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_rollback_store_state_73() {
return function rollback_store_state(state, count) {
    if (window.storeLib && typeof window.storeLib.undoDocChanges === "function") {
        return window.storeLib.undoDocChanges(state, count);
    }
    if (window.storeLib && typeof window.storeLib.undoDoc === "function") {
        var rolledBack = 0;
        var rollbackCount = count || 1;
        for (var i = 0; i < rollbackCount; i++) {
            if (!window.storeLib.undoDoc(state)) break;
            rolledBack += 1;
        }
        return rolledBack;
    }
    return 0;
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_rollback_store_state_73};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_Future_75() {
var { Exception } = pret_modules['org.transcrypt.__runtime__'];

var CancelledError = _class_ ('CancelledError', [Exception], {
    __module__: __name__,
    get __init__() {return __get__(this, function(self, message) {
        Error.call(self, message || 'Future was cancelled');
        self.name = 'CancelledError';
        self.message = message || 'Future was cancelled';
    });}
});

var Future = _class_ ('Future', [object], {
    __module__: __name__,
    // States
    PENDING: 0,
    FINISHED: 1,
    CANCELLED: 2,

    get __init__() {return __get__(this, function(self) {
        self._state = self.PENDING;
        self._result = undefined;
        self._exception = undefined;
        self._promise = new Promise(function(resolve, reject) {
            self._resolve = resolve;
            self._reject = reject;
        });
    });},

    // helpers for awaiting
    get then() {return __get__(this, function(self, onFulfilled, onRejected) {
        return self._promise.then(onFulfilled, onRejected);
    });},
    get catch() {return __get__(this, function(self, onRejected) {
        return self._promise.catch(onRejected);
    });},
    get finally() {return __get__(this, function(self, onFinally) {
        return self._promise.finally(onFinally);
    });},

    // properties
    get done() {return __get__(this, function(self) {
        return self._state !== self.PENDING;
    });},
    get cancelled() {return __get__(this, function(self) {
        return self._state === self.CANCELLED;
    });},
    get result() {return __get__(this, function(self) {
        if (!self.done()) throw new Error('Future not done yet');
        if (self.cancelled()) throw new Error('Future was cancelled');
        if (self._exception !== undefined) throw self._exception;
        return self._result;
    });},
    get exception() {return __get__(this, function(self) {
        return self.done() ? self._exception : undefined;
    });},

    // mutators
    get set_result() {return __get__(this, function(self, value) {
        if (self.done()) return false;
        self._state = self.FINISHED;
        self._result = value;
        self._resolve(value);
        return true;
    });},
    get set_exception() {return __get__(this, function(self, err) {
        if (self.done()) return false;
        self._state = self.FINISHED;
        self._exception = err instanceof Error ? err : new Error(String(err));
        self._reject(self._exception);
        return true;
    });},
    get cancel() {return __get__(this, function(self, msg) {
        if (self.done()) return false;
        self._state = self.CANCELLED;
        self._exception = CancelledError(msg || 'Future was cancelled');
        self._reject(self._exception);
        return true;
    });}
});

Future.CancelledError = CancelledError;

return Future;;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_Future_75};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_schedule_timeout_82() {
return function schedule_timeout(callback, timeout) {
    return setTimeout(callback, timeout);
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_schedule_timeout_82};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_make_websocket_86() {
return function make_websocket(resource) {
    return new WebSocket(resource);
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_make_websocket_86};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_fetch_89() {
return (resource, options) => {
    return fetch(resource, options);
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_fetch_89};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92__rebuild_doc_91(get_manager) {
return (function rebuild_doc(update, roots, sync_id) {
    var ydoc = new window.Y.Doc();
    ydoc.getMap("_");  // Ensure the root map exists
    ydoc.apply_update(update);
    if (sync_id) {
        var manager = get_manager();
        // Will subscribe to updates on ydoc and let the manager dispatch them
        // and apply updates to the ydoc when the manager receives them
        manager.register_state(sync_id, ydoc);
    }
    return ydoc;
});;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92__rebuild_doc_91};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92__rebuild_doc_95(get_manager) {
return (function rebuild_doc(update, roots, sync_id) {
    var ydoc = new window.Y.Doc();
    ydoc.getMap("_");  // Ensure the root map exists
    ydoc.apply_update(update);
    if (sync_id) {
        var manager = get_manager();
        // Will subscribe to updates on ydoc and let the manager dispatch them
        // and apply updates to the ydoc when the manager receives them
        manager.register_state(sync_id, ydoc);
    }
    return ydoc;
});;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92__rebuild_doc_95};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92__rebuild_doc_96(get_manager) {
return (function rebuild_doc(update, roots, sync_id) {
    var ydoc = new window.Y.Doc();
    ydoc.getMap("_");  // Ensure the root map exists
    ydoc.apply_update(update);
    if (sync_id) {
        var manager = get_manager();
        // Will subscribe to updates on ydoc and let the manager dispatch them
        // and apply updates to the ydoc when the manager receives them
        manager.register_state(sync_id, ydoc);
    }
    return ydoc;
});;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92__rebuild_doc_96};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92__rebuild_doc_100(get_manager) {
return (function rebuild_doc(update, roots, sync_id) {
    var ydoc = new window.Y.Doc();
    ydoc.getMap("_");  // Ensure the root map exists
    ydoc.apply_update(update);
    if (sync_id) {
        var manager = get_manager();
        // Will subscribe to updates on ydoc and let the manager dispatch them
        // and apply updates to the ydoc when the manager receives them
        manager.register_state(sync_id, ydoc);
    }
    return ydoc;
});;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92__rebuild_doc_100};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_102(react_to_py) {
return function py_to_react() {
	if (
        arguments.length > 0
        && arguments[arguments.length - 1]
        && arguments[arguments.length - 1].hasOwnProperty("__kwargtrans__")
	) {
        var children = Array.prototype.slice.call(arguments, 0, -1);
        var props = arguments[arguments.length - 1];
    } else {
        var children = Array.prototype.slice.call(arguments, 0, -1);
        var props = {};
    }
    delete props.__kwargtrans__;
    return window.React.createElement(
        react_to_py,
        props,
        ...(Array.isArray(children) ? children : [children])
    );
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_102};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_react_to_py_103(fn) {
return function react_to_py(props) {
    var children = props.children || {};
    var rest = Object.fromEntries(
        Object.entries(props).filter(([key, _]) => key !== "children")
    );
    return fn(...Object.values(props.children || {}), __kwargtrans__(rest));
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_react_to_py_103};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_105(react_to_py) {
return function py_to_react() {
	if (
        arguments.length > 0
        && arguments[arguments.length - 1]
        && arguments[arguments.length - 1].hasOwnProperty("__kwargtrans__")
	) {
        var children = Array.prototype.slice.call(arguments, 0, -1);
        var props = arguments[arguments.length - 1];
    } else {
        var children = Array.prototype.slice.call(arguments, 0, -1);
        var props = {};
    }
    delete props.__kwargtrans__;
    return window.React.createElement(
        react_to_py,
        props,
        ...(Array.isArray(children) ? children : [children])
    );
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_105};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_react_to_py_106(fn) {
return function react_to_py(props) {
    var children = props.children || {};
    var rest = Object.fromEntries(
        Object.entries(props).filter(([key, _]) => key !== "children")
    );
    return fn(...Object.values(props.children || {}), __kwargtrans__(rest));
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_react_to_py_106};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_108(name, props_mapping, snapshot) {
return function py_to_react() {
    var children;
    var props;
	if (
        arguments.length > 0
        && arguments[arguments.length - 1]
        && arguments[arguments.length - 1].hasOwnProperty("__kwargtrans__")
    ) {
        children = Array.prototype.slice.call(arguments, 0, -1);
        props = arguments[arguments.length - 1];
        delete props.__kwargtrans__;
        var props = Object.fromEntries(Object.entries(props).map(([k, v]) => [
            props_mapping[k] || k,
            snapshot(v)
        ]));
    } else {
        children = Array.from(arguments);
        props = {};
    }
    return window.React.createElement(
        name,
        props,
        ...(Array.isArray(children) ? children : [children])
    );
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_108};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_109() {
  return pret_modules.js.JoyUI.Button;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_109};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_110(name, props_mapping, snapshot) {
return function py_to_react() {
    var children;
    var props;
	if (
        arguments.length > 0
        && arguments[arguments.length - 1]
        && arguments[arguments.length - 1].hasOwnProperty("__kwargtrans__")
    ) {
        children = Array.prototype.slice.call(arguments, 0, -1);
        props = arguments[arguments.length - 1];
        delete props.__kwargtrans__;
        var props = Object.fromEntries(Object.entries(props).map(([k, v]) => [
            props_mapping[k] || k,
            snapshot(v)
        ]));
    } else {
        children = Array.from(arguments);
        props = {};
    }
    return window.React.createElement(
        name,
        props,
        ...(Array.isArray(children) ? children : [children])
    );
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_110};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_111() {
  return pret_modules.js.JoyUI.ButtonGroup;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_111};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_112(name, props_mapping, snapshot) {
return function py_to_react() {
    var children;
    var props;
	if (
        arguments.length > 0
        && arguments[arguments.length - 1]
        && arguments[arguments.length - 1].hasOwnProperty("__kwargtrans__")
    ) {
        children = Array.prototype.slice.call(arguments, 0, -1);
        props = arguments[arguments.length - 1];
        delete props.__kwargtrans__;
        var props = Object.fromEntries(Object.entries(props).map(([k, v]) => [
            props_mapping[k] || k,
            snapshot(v)
        ]));
    } else {
        children = Array.from(arguments);
        props = {};
    }
    return window.React.createElement(
        name,
        props,
        ...(Array.isArray(children) ? children : [children])
    );
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_112};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_113() {
  return pret_modules.js.JoyUI.FormControl;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_113};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_114(name, props_mapping, snapshot) {
return function py_to_react() {
    var children;
    var props;
	if (
        arguments.length > 0
        && arguments[arguments.length - 1]
        && arguments[arguments.length - 1].hasOwnProperty("__kwargtrans__")
    ) {
        children = Array.prototype.slice.call(arguments, 0, -1);
        props = arguments[arguments.length - 1];
        delete props.__kwargtrans__;
        var props = Object.fromEntries(Object.entries(props).map(([k, v]) => [
            props_mapping[k] || k,
            snapshot(v)
        ]));
    } else {
        children = Array.from(arguments);
        props = {};
    }
    return window.React.createElement(
        name,
        props,
        ...(Array.isArray(children) ? children : [children])
    );
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_114};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_115() {
  return pret_modules.js.JoyUI.FormLabel;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_115};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_116(name, props_mapping, snapshot) {
return function py_to_react() {
    var children;
    var props;
	if (
        arguments.length > 0
        && arguments[arguments.length - 1]
        && arguments[arguments.length - 1].hasOwnProperty("__kwargtrans__")
    ) {
        children = Array.prototype.slice.call(arguments, 0, -1);
        props = arguments[arguments.length - 1];
        delete props.__kwargtrans__;
        var props = Object.fromEntries(Object.entries(props).map(([k, v]) => [
            props_mapping[k] || k,
            snapshot(v)
        ]));
    } else {
        children = Array.from(arguments);
        props = {};
    }
    return window.React.createElement(
        name,
        props,
        ...(Array.isArray(children) ? children : [children])
    );
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_116};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_117() {
  return pret_modules.js.JoyUI.Stack;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_117};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_120(name, props_mapping, snapshot) {
return function py_to_react() {
    var children;
    var props;
	if (
        arguments.length > 0
        && arguments[arguments.length - 1]
        && arguments[arguments.length - 1].hasOwnProperty("__kwargtrans__")
    ) {
        children = Array.prototype.slice.call(arguments, 0, -1);
        props = arguments[arguments.length - 1];
        delete props.__kwargtrans__;
        var props = Object.fromEntries(Object.entries(props).map(([k, v]) => [
            props_mapping[k] || k,
            snapshot(v)
        ]));
    } else {
        children = Array.from(arguments);
        props = {};
    }
    return window.React.createElement(
        name,
        props,
        ...(Array.isArray(children) ? children : [children])
    );
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_120};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_121() {
  return pret_modules.js.JoyUI.Checkbox;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_121};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_124(name, props_mapping, snapshot) {
return function py_to_react() {
    var children;
    var props;
	if (
        arguments.length > 0
        && arguments[arguments.length - 1]
        && arguments[arguments.length - 1].hasOwnProperty("__kwargtrans__")
    ) {
        children = Array.prototype.slice.call(arguments, 0, -1);
        props = arguments[arguments.length - 1];
        delete props.__kwargtrans__;
        var props = Object.fromEntries(Object.entries(props).map(([k, v]) => [
            props_mapping[k] || k,
            snapshot(v)
        ]));
    } else {
        children = Array.from(arguments);
        props = {};
    }
    return window.React.createElement(
        name,
        props,
        ...(Array.isArray(children) ? children : [children])
    );
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_124};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_125() {
  return pret_modules.js.JoyUI.Autocomplete;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_125};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_126(name, props_mapping, snapshot) {
return function py_to_react() {
    var children;
    var props;
	if (
        arguments.length > 0
        && arguments[arguments.length - 1]
        && arguments[arguments.length - 1].hasOwnProperty("__kwargtrans__")
    ) {
        children = Array.prototype.slice.call(arguments, 0, -1);
        props = arguments[arguments.length - 1];
        delete props.__kwargtrans__;
        var props = Object.fromEntries(Object.entries(props).map(([k, v]) => [
            props_mapping[k] || k,
            snapshot(v)
        ]));
    } else {
        children = Array.from(arguments);
        props = {};
    }
    return window.React.createElement(
        name,
        props,
        ...(Array.isArray(children) ? children : [children])
    );
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_126};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_127() {
  return pret_modules.js.JoyUI.Option;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_127};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_128(name, props_mapping, snapshot) {
return function py_to_react() {
    var children;
    var props;
	if (
        arguments.length > 0
        && arguments[arguments.length - 1]
        && arguments[arguments.length - 1].hasOwnProperty("__kwargtrans__")
    ) {
        children = Array.prototype.slice.call(arguments, 0, -1);
        props = arguments[arguments.length - 1];
        delete props.__kwargtrans__;
        var props = Object.fromEntries(Object.entries(props).map(([k, v]) => [
            props_mapping[k] || k,
            snapshot(v)
        ]));
    } else {
        children = Array.from(arguments);
        props = {};
    }
    return window.React.createElement(
        name,
        props,
        ...(Array.isArray(children) ? children : [children])
    );
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_128};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_129() {
  return pret_modules.js.JoyUI.Radio;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_129};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_130(name, props_mapping, snapshot) {
return function py_to_react() {
    var children;
    var props;
	if (
        arguments.length > 0
        && arguments[arguments.length - 1]
        && arguments[arguments.length - 1].hasOwnProperty("__kwargtrans__")
    ) {
        children = Array.prototype.slice.call(arguments, 0, -1);
        props = arguments[arguments.length - 1];
        delete props.__kwargtrans__;
        var props = Object.fromEntries(Object.entries(props).map(([k, v]) => [
            props_mapping[k] || k,
            snapshot(v)
        ]));
    } else {
        children = Array.from(arguments);
        props = {};
    }
    return window.React.createElement(
        name,
        props,
        ...(Array.isArray(children) ? children : [children])
    );
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_130};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_131() {
  return pret_modules.js.JoyUI.RadioGroup;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_131};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_132(name, props_mapping, snapshot) {
return function py_to_react() {
    var children;
    var props;
	if (
        arguments.length > 0
        && arguments[arguments.length - 1]
        && arguments[arguments.length - 1].hasOwnProperty("__kwargtrans__")
    ) {
        children = Array.prototype.slice.call(arguments, 0, -1);
        props = arguments[arguments.length - 1];
        delete props.__kwargtrans__;
        var props = Object.fromEntries(Object.entries(props).map(([k, v]) => [
            props_mapping[k] || k,
            snapshot(v)
        ]));
    } else {
        children = Array.from(arguments);
        props = {};
    }
    return window.React.createElement(
        name,
        props,
        ...(Array.isArray(children) ? children : [children])
    );
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_132};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_133() {
  return pret_modules.js.JoyUI.Select;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_133};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_135(name, props_mapping, snapshot) {
return function py_to_react() {
    var children;
    var props;
	if (
        arguments.length > 0
        && arguments[arguments.length - 1]
        && arguments[arguments.length - 1].hasOwnProperty("__kwargtrans__")
    ) {
        children = Array.prototype.slice.call(arguments, 0, -1);
        props = arguments[arguments.length - 1];
        delete props.__kwargtrans__;
        var props = Object.fromEntries(Object.entries(props).map(([k, v]) => [
            props_mapping[k] || k,
            snapshot(v)
        ]));
    } else {
        children = Array.from(arguments);
        props = {};
    }
    return window.React.createElement(
        name,
        props,
        ...(Array.isArray(children) ? children : [children])
    );
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_135};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_136() {
  return pret_modules.js.JoyUI.Input;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_136};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_139(react_to_py) {
return function py_to_react() {
	if (
        arguments.length > 0
        && arguments[arguments.length - 1]
        && arguments[arguments.length - 1].hasOwnProperty("__kwargtrans__")
	) {
        var children = Array.prototype.slice.call(arguments, 0, -1);
        var props = arguments[arguments.length - 1];
    } else {
        var children = Array.prototype.slice.call(arguments, 0, -1);
        var props = {};
    }
    delete props.__kwargtrans__;
    return window.React.createElement(
        react_to_py,
        props,
        ...(Array.isArray(children) ? children : [children])
    );
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_139};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_react_to_py_140(fn) {
return function react_to_py(props) {
    var children = props.children || {};
    var rest = Object.fromEntries(
        Object.entries(props).filter(([key, _]) => key !== "children")
    );
    return fn(...Object.values(props.children || {}), __kwargtrans__(rest));
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_react_to_py_140};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92__rebuild_doc_142(get_manager) {
return (function rebuild_doc(update, roots, sync_id) {
    var ydoc = new window.Y.Doc();
    ydoc.getMap("_");  // Ensure the root map exists
    ydoc.apply_update(update);
    if (sync_id) {
        var manager = get_manager();
        // Will subscribe to updates on ydoc and let the manager dispatch them
        // and apply updates to the ydoc when the manager receives them
        manager.register_state(sync_id, ydoc);
    }
    return ydoc;
});;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92__rebuild_doc_142};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_143(name, props_mapping, snapshot) {
return function py_to_react() {
    var children;
    var props;
	if (
        arguments.length > 0
        && arguments[arguments.length - 1]
        && arguments[arguments.length - 1].hasOwnProperty("__kwargtrans__")
    ) {
        children = Array.prototype.slice.call(arguments, 0, -1);
        props = arguments[arguments.length - 1];
        delete props.__kwargtrans__;
        var props = Object.fromEntries(Object.entries(props).map(([k, v]) => [
            props_mapping[k] || k,
            snapshot(v)
        ]));
    } else {
        children = Array.from(arguments);
        props = {};
    }
    return window.React.createElement(
        name,
        props,
        ...(Array.isArray(children) ? children : [children])
    );
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_143};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_144() {
  return pret_modules.js.SimpleDock.Panel;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_144};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_149(react_to_py) {
return function py_to_react() {
	if (
        arguments.length > 0
        && arguments[arguments.length - 1]
        && arguments[arguments.length - 1].hasOwnProperty("__kwargtrans__")
	) {
        var children = Array.prototype.slice.call(arguments, 0, -1);
        var props = arguments[arguments.length - 1];
    } else {
        var children = Array.prototype.slice.call(arguments, 0, -1);
        var props = {};
    }
    delete props.__kwargtrans__;
    return window.React.createElement(
        react_to_py,
        props,
        ...(Array.isArray(children) ? children : [children])
    );
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_149};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_react_to_py_150(fn) {
return function react_to_py(props) {
    var children = props.children || {};
    var rest = Object.fromEntries(
        Object.entries(props).filter(([key, _]) => key !== "children")
    );
    return fn(...Object.values(props.children || {}), __kwargtrans__(rest));
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_react_to_py_150};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92__rebuild_doc_152(get_manager) {
return (function rebuild_doc(update, roots, sync_id) {
    var ydoc = new window.Y.Doc();
    ydoc.getMap("_");  // Ensure the root map exists
    ydoc.apply_update(update);
    if (sync_id) {
        var manager = get_manager();
        // Will subscribe to updates on ydoc and let the manager dispatch them
        // and apply updates to the ydoc when the manager receives them
        manager.register_state(sync_id, ydoc);
    }
    return ydoc;
});;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92__rebuild_doc_152};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_156(name, props_mapping, snapshot) {
return function py_to_react() {
    var children;
    var props;
	if (
        arguments.length > 0
        && arguments[arguments.length - 1]
        && arguments[arguments.length - 1].hasOwnProperty("__kwargtrans__")
    ) {
        children = Array.prototype.slice.call(arguments, 0, -1);
        props = arguments[arguments.length - 1];
        delete props.__kwargtrans__;
        var props = Object.fromEntries(Object.entries(props).map(([k, v]) => [
            props_mapping[k] || k,
            snapshot(v)
        ]));
    } else {
        children = Array.from(arguments);
        props = {};
    }
    return window.React.createElement(
        name,
        props,
        ...(Array.isArray(children) ? children : [children])
    );
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_156};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_157() {
  return pret_modules.js.JoyUI.Box;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_157};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_159(name, props_mapping, snapshot) {
return function py_to_react() {
    var children;
    var props;
	if (
        arguments.length > 0
        && arguments[arguments.length - 1]
        && arguments[arguments.length - 1].hasOwnProperty("__kwargtrans__")
    ) {
        children = Array.prototype.slice.call(arguments, 0, -1);
        props = arguments[arguments.length - 1];
        delete props.__kwargtrans__;
        var props = Object.fromEntries(Object.entries(props).map(([k, v]) => [
            props_mapping[k] || k,
            snapshot(v)
        ]));
    } else {
        children = Array.from(arguments);
        props = {};
    }
    return window.React.createElement(
        name,
        props,
        ...(Array.isArray(children) ? children : [children])
    );
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_159};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_160() {
  return pret_modules.js.JoyUI.Divider;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_160};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_162(name, props_mapping, snapshot) {
return function py_to_react() {
    var children;
    var props;
	if (
        arguments.length > 0
        && arguments[arguments.length - 1]
        && arguments[arguments.length - 1].hasOwnProperty("__kwargtrans__")
    ) {
        children = Array.prototype.slice.call(arguments, 0, -1);
        props = arguments[arguments.length - 1];
        delete props.__kwargtrans__;
        var props = Object.fromEntries(Object.entries(props).map(([k, v]) => [
            props_mapping[k] || k,
            snapshot(v)
        ]));
    } else {
        children = Array.from(arguments);
        props = {};
    }
    return window.React.createElement(
        name,
        props,
        ...(Array.isArray(children) ? children : [children])
    );
};
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_162};

function pret_factory_1bbfa923d60c409b8973a4cc8153be92_163() {
  return pret_modules.js.SimpleDock.Layout;
}{pret_factory_1bbfa923d60c409b8973a4cc8153be92_163};

return {pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_0, pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_1, pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_2, pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_x_3, pret_factory_1bbfa923d60c409b8973a4cc8153be92_TextWidget_6, pret_factory_1bbfa923d60c409b8973a4cc8153be92_Any_10, pret_factory_1bbfa923d60c409b8973a4cc8153be92_Dict_11, pret_factory_1bbfa923d60c409b8973a4cc8153be92_List_12, pret_factory_1bbfa923d60c409b8973a4cc8153be92_Optional_13, pret_factory_1bbfa923d60c409b8973a4cc8153be92_object_14, pret_factory_1bbfa923d60c409b8973a4cc8153be92___init___15, pret_factory_1bbfa923d60c409b8973a4cc8153be92_Sequence_16, pret_factory_1bbfa923d60c409b8973a4cc8153be92_get_first_selected_row_idx_18, pret_factory_1bbfa923d60c409b8973a4cc8153be92_extract_selected_rows_19, pret_factory_1bbfa923d60c409b8973a4cc8153be92_normalize_selected_rows_20, pret_factory_1bbfa923d60c409b8973a4cc8153be92_use_effect_22, pret_factory_1bbfa923d60c409b8973a4cc8153be92_use_event_callback_23, pret_factory_1bbfa923d60c409b8973a4cc8153be92_default_container_renderer_29, pret_factory_1bbfa923d60c409b8973a4cc8153be92_get_standalone_client_manager_32, pret_factory_1bbfa923d60c409b8973a4cc8153be92___init___33, pret_factory_1bbfa923d60c409b8973a4cc8153be92_WeakKeyDictionary_34, pret_factory_1bbfa923d60c409b8973a4cc8153be92_WeakValueDictionary_35, pret_factory_1bbfa923d60c409b8973a4cc8153be92_apply_state_update_37, pret_factory_1bbfa923d60c409b8973a4cc8153be92_assert_state_write_allowed_38, pret_factory_1bbfa923d60c409b8973a4cc8153be92_block_state_sync_39, pret_factory_1bbfa923d60c409b8973a4cc8153be92_build_state_sync_request_40, pret_factory_1bbfa923d60c409b8973a4cc8153be92_call_ref_method_42, pret_factory_1bbfa923d60c409b8973a4cc8153be92_drain_outgoing_messages_43, pret_factory_1bbfa923d60c409b8973a4cc8153be92_ensure_state_change_processor_46, pret_factory_1bbfa923d60c409b8973a4cc8153be92_ensure_state_sync_47, pret_factory_1bbfa923d60c409b8973a4cc8153be92_get_connection_status_48, pret_factory_1bbfa923d60c409b8973a4cc8153be92_get_state_sync_status_49, pret_factory_1bbfa923d60c409b8973a4cc8153be92_handle_call_failure_msg_50, pret_factory_1bbfa923d60c409b8973a4cc8153be92_handle_call_msg_51, pret_factory_1bbfa923d60c409b8973a4cc8153be92_handle_call_success_msg_52, pret_factory_1bbfa923d60c409b8973a4cc8153be92_handle_message_53, pret_factory_1bbfa923d60c409b8973a4cc8153be92_handle_state_change_msg_54, pret_factory_1bbfa923d60c409b8973a4cc8153be92_handle_state_change_result_msg_56, pret_factory_1bbfa923d60c409b8973a4cc8153be92_handle_state_sync_response_msg_57, pret_factory_1bbfa923d60c409b8973a4cc8153be92_message_targets_this_manager_58, pret_factory_1bbfa923d60c409b8973a4cc8153be92_notify_connection_status_listeners_59, pret_factory_1bbfa923d60c409b8973a4cc8153be92_notify_state_write_rejected_60, pret_factory_1bbfa923d60c409b8973a4cc8153be92_process_state_changes_61, pret_factory_1bbfa923d60c409b8973a4cc8153be92_register_call_future_62, pret_factory_1bbfa923d60c409b8973a4cc8153be92_register_function_63, pret_factory_1bbfa923d60c409b8973a4cc8153be92_register_ref_65, pret_factory_1bbfa923d60c409b8973a4cc8153be92_register_state_66, pret_factory_1bbfa923d60c409b8973a4cc8153be92_remote_call_ref_method_69, pret_factory_1bbfa923d60c409b8973a4cc8153be92_request_state_sync_70, pret_factory_1bbfa923d60c409b8973a4cc8153be92_resume_state_sync_processors_71, pret_factory_1bbfa923d60c409b8973a4cc8153be92_rollback_state_changes_72, pret_factory_1bbfa923d60c409b8973a4cc8153be92_send_call_74, pret_factory_1bbfa923d60c409b8973a4cc8153be92_send_message_76, pret_factory_1bbfa923d60c409b8973a4cc8153be92_send_outgoing_message_77, pret_factory_1bbfa923d60c409b8973a4cc8153be92_send_state_change_78, pret_factory_1bbfa923d60c409b8973a4cc8153be92_set_connection_status_79, pret_factory_1bbfa923d60c409b8973a4cc8153be92_set_state_sync_status_80, pret_factory_1bbfa923d60c409b8973a4cc8153be92_set_timeout_81, pret_factory_1bbfa923d60c409b8973a4cc8153be92_subscribe_connection_status_83, pret_factory_1bbfa923d60c409b8973a4cc8153be92___init___84, pret_factory_1bbfa923d60c409b8973a4cc8153be92_loads_85, pret_factory_1bbfa923d60c409b8973a4cc8153be92_send_message_87, pret_factory_1bbfa923d60c409b8973a4cc8153be92_dumps_88, pret_factory_1bbfa923d60c409b8973a4cc8153be92__deep_get_store_90, pret_factory_1bbfa923d60c409b8973a4cc8153be92_get_adjacent_doc_idx_92, pret_factory_1bbfa923d60c409b8973a4cc8153be92_make_client_ref_93, pret_factory_1bbfa923d60c409b8973a4cc8153be92_get_selected_span_indices_94, pret_factory_1bbfa923d60c409b8973a4cc8153be92_sync_parent_widgets_97, pret_factory_1bbfa923d60c409b8973a4cc8153be92_sync_store_selection_98, pret_factory_1bbfa923d60c409b8973a4cc8153be92_filter_related_tables_99, pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_x_101, pret_factory_1bbfa923d60c409b8973a4cc8153be92_ToolbarWidget_104, pret_factory_1bbfa923d60c409b8973a4cc8153be92_Toolbar_107, pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_field_118, pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_boolean_field_119, pret_factory_1bbfa923d60c409b8973a4cc8153be92_make_field_label_122, pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_select_field_123, pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_text_field_134, pret_factory_1bbfa923d60c409b8973a4cc8153be92_build_field_state_by_key_137, pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_x_138, pret_factory_1bbfa923d60c409b8973a4cc8153be92_SelectedFieldView_141, pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_145, pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_146, pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_147, pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_x_148, pret_factory_1bbfa923d60c409b8973a4cc8153be92_FormWidget_151, pret_factory_1bbfa923d60c409b8973a4cc8153be92_sync_parent_widgets_153, pret_factory_1bbfa923d60c409b8973a4cc8153be92_sync_store_selection_154, pret_factory_1bbfa923d60c409b8973a4cc8153be92_filter_related_tables_155, pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_158, pret_factory_1bbfa923d60c409b8973a4cc8153be92_render_161, pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_4, pret_factory_1bbfa923d60c409b8973a4cc8153be92_react_to_py_5, pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_7, pret_factory_1bbfa923d60c409b8973a4cc8153be92_8, pret_factory_1bbfa923d60c409b8973a4cc8153be92_snapshot_9, pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_17, pret_factory_1bbfa923d60c409b8973a4cc8153be92_transact_21, pret_factory_1bbfa923d60c409b8973a4cc8153be92__use_event_callback_impl_24, pret_factory_1bbfa923d60c409b8973a4cc8153be92_use_imperative_handle_25, pret_factory_1bbfa923d60c409b8973a4cc8153be92_use_ref_26, pret_factory_1bbfa923d60c409b8973a4cc8153be92_use_state_27, pret_factory_1bbfa923d60c409b8973a4cc8153be92_use_store_snapshot_28, pret_factory_1bbfa923d60c409b8973a4cc8153be92__rebuild_obj_30, pret_factory_1bbfa923d60c409b8973a4cc8153be92__rebuild_doc_31, pret_factory_1bbfa923d60c409b8973a4cc8153be92_make_uuid_36, pret_factory_1bbfa923d60c409b8973a4cc8153be92_b64_encode_41, pret_factory_1bbfa923d60c409b8973a4cc8153be92_is_awaitable_44, pret_factory_1bbfa923d60c409b8973a4cc8153be92_start_async_task_45, pret_factory_1bbfa923d60c409b8973a4cc8153be92_b64_decode_55, pret_factory_1bbfa923d60c409b8973a4cc8153be92_function_identifier_64, pret_factory_1bbfa923d60c409b8973a4cc8153be92_ensure_store_undo_manager_67, pret_factory_1bbfa923d60c409b8973a4cc8153be92_install_store_sync_guard_68, pret_factory_1bbfa923d60c409b8973a4cc8153be92_rollback_store_state_73, pret_factory_1bbfa923d60c409b8973a4cc8153be92_Future_75, pret_factory_1bbfa923d60c409b8973a4cc8153be92_schedule_timeout_82, pret_factory_1bbfa923d60c409b8973a4cc8153be92_make_websocket_86, pret_factory_1bbfa923d60c409b8973a4cc8153be92_fetch_89, pret_factory_1bbfa923d60c409b8973a4cc8153be92__rebuild_doc_91, pret_factory_1bbfa923d60c409b8973a4cc8153be92__rebuild_doc_95, pret_factory_1bbfa923d60c409b8973a4cc8153be92__rebuild_doc_96, pret_factory_1bbfa923d60c409b8973a4cc8153be92__rebuild_doc_100, pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_102, pret_factory_1bbfa923d60c409b8973a4cc8153be92_react_to_py_103, pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_105, pret_factory_1bbfa923d60c409b8973a4cc8153be92_react_to_py_106, pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_108, pret_factory_1bbfa923d60c409b8973a4cc8153be92_109, pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_110, pret_factory_1bbfa923d60c409b8973a4cc8153be92_111, pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_112, pret_factory_1bbfa923d60c409b8973a4cc8153be92_113, pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_114, pret_factory_1bbfa923d60c409b8973a4cc8153be92_115, pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_116, pret_factory_1bbfa923d60c409b8973a4cc8153be92_117, pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_120, pret_factory_1bbfa923d60c409b8973a4cc8153be92_121, pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_124, pret_factory_1bbfa923d60c409b8973a4cc8153be92_125, pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_126, pret_factory_1bbfa923d60c409b8973a4cc8153be92_127, pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_128, pret_factory_1bbfa923d60c409b8973a4cc8153be92_129, pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_130, pret_factory_1bbfa923d60c409b8973a4cc8153be92_131, pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_132, pret_factory_1bbfa923d60c409b8973a4cc8153be92_133, pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_135, pret_factory_1bbfa923d60c409b8973a4cc8153be92_136, pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_139, pret_factory_1bbfa923d60c409b8973a4cc8153be92_react_to_py_140, pret_factory_1bbfa923d60c409b8973a4cc8153be92__rebuild_doc_142, pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_143, pret_factory_1bbfa923d60c409b8973a4cc8153be92_144, pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_149, pret_factory_1bbfa923d60c409b8973a4cc8153be92_react_to_py_150, pret_factory_1bbfa923d60c409b8973a4cc8153be92__rebuild_doc_152, pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_156, pret_factory_1bbfa923d60c409b8973a4cc8153be92_157, pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_159, pret_factory_1bbfa923d60c409b8973a4cc8153be92_160, pret_factory_1bbfa923d60c409b8973a4cc8153be92_py_to_react_162, pret_factory_1bbfa923d60c409b8973a4cc8153be92_163};
//# sourceURL=dynamic_factory.js