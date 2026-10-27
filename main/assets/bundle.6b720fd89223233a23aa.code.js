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

pret_modules['typing']=(function(){// Transcrypt'ed from Python, 2026-10-27 12:43:05
var { AssertionError, AttributeError, BaseException, DeprecationWarning, Exception, IndexError, IterableError, KeyError, NotImplementedError, RuntimeWarning, StopIteration, UserWarning, ValueError, Warning, __JsIterator__, __PyIterator__, __Terminal__, __add__, __and__, __call__, __compare__, __envir__, __eq__, __floordiv__, __ge__, __get__, __getcm__, __getitem__, __getslice__, __getsm__, __gt__, __i__, __iadd__, __iand__, __idiv__, __ijsmod__, __ilshift__, __imatmul__, __imod__, __imul__, __in__, __init__, __ior__, __ipow__, __irshift__, __isub__, __ixor__, __jsUsePyNext__, __jsmod__, __k__, __kwargtrans__, __le__, __lshift__, __lt__, __matmul__, __mergefields__, __mergekwargtrans__, __mod__, __mul__, __ne__, __neg__, __nest__, __or__, __pow__, __pragma__, __proxy__, __pyUseJsNext__, __rshift__, __setitem__, __setproperty__, __setslice__, __sort__, __specialattrib__, __sub__, __super__, __t__, __terminal__, __truediv__, __withblock__, __xor__, _class_, abs, all, any, assert, bool, bytearray, bytes, callable, chr, copy, deepcopy, delattr, dict, dir, divmod, enumerate, filter, float, getattr, hasattr, input, int, isinstance, issubclass, len, list, map, max, min, object, ord, pow, print, property, py_TypeError, py_iter, py_metatype, py_next, py_reversed, py_typeof, range, repr, round, set, setattr, sorted, str, sum, tuple, zip } = pret_modules['org.transcrypt.__runtime__'];
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

// Transcrypt'ed from Python, 2026-10-27 12:43:05
var { AssertionError, AttributeError, BaseException, DeprecationWarning, Exception, IndexError, IterableError, KeyError, NotImplementedError, RuntimeWarning, StopIteration, UserWarning, ValueError, Warning, __JsIterator__, __PyIterator__, __Terminal__, __add__, __and__, __call__, __compare__, __envir__, __eq__, __floordiv__, __ge__, __get__, __getcm__, __getitem__, __getslice__, __getsm__, __gt__, __i__, __iadd__, __iand__, __idiv__, __ijsmod__, __ilshift__, __imatmul__, __imod__, __imul__, __in__, __init__, __ior__, __ipow__, __irshift__, __isub__, __ixor__, __jsUsePyNext__, __jsmod__, __k__, __kwargtrans__, __le__, __lshift__, __lt__, __matmul__, __mergefields__, __mergekwargtrans__, __mod__, __mul__, __ne__, __neg__, __nest__, __or__, __pow__, __pragma__, __proxy__, __pyUseJsNext__, __rshift__, __setitem__, __setproperty__, __setslice__, __sort__, __specialattrib__, __sub__, __super__, __t__, __terminal__, __truediv__, __withblock__, __xor__, _class_, abs, all, any, assert, bool, bytearray, bytes, callable, chr, copy, deepcopy, delattr, dict, dir, divmod, enumerate, filter, float, getattr, hasattr, input, int, isinstance, issubclass, len, list, map, max, min, ord, pow, print, property, py_TypeError, py_iter, py_metatype, py_next, py_reversed, py_typeof, range, repr, round, set, setattr, sorted, str, sum, tuple, zip } = pret_modules['org.transcrypt.__runtime__'];
var { Sequence } = pret_modules['typing'];
var { Optional } = pret_modules['typing'];
var { List } = pret_modules['typing'];
var { Dict } = pret_modules['typing'];
var { Any } = pret_modules['typing'];
var { dumps } = pret_modules['json'];
var { loads } = pret_modules['json'];
var { WeakValueDictionary } = pret_modules['weakref'];
var { object } = pret_modules['org.transcrypt.__runtime__'];
var __name__ = '__main__';var pret_factory_df353f18520944908a84e05590ee89d3_render_0 = function (children, props, py_to_react) {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_render_x_4 = function (children, create_fn, props) {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_TableWidget_7 = function (Button, Checkbox, ErrorBanner, LoadingStatus, Stack, StoreWidget, Table, div, edit_rows, extract_row_indices, get_parent_selection, parse_table_filters, use_effect, use_event_callback, use_imperative_handle, use_ref, use_rows, use_state, use_store_snapshot, columns, data_store, deep_get_store, empty_store, follow_parent_selection, handle, handles, include_unconfigured_columns, is_dataframe, on_click_cell_content, on_mount, on_mouse_hover_row, on_selection_change, parent_relation, parent_selection_label, parent_selection_store, path_parts, primary_key, primary_keys, query_from, read_only, relations, select_rows, select_store_row_id, selected_rows_by_store, selected_rows_store, source_requery, store_key, style) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'Button': var Button = __allkwargs0__ [__attrib0__]; break;
					case 'Checkbox': var Checkbox = __allkwargs0__ [__attrib0__]; break;
					case 'ErrorBanner': var ErrorBanner = __allkwargs0__ [__attrib0__]; break;
					case 'LoadingStatus': var LoadingStatus = __allkwargs0__ [__attrib0__]; break;
					case 'Stack': var Stack = __allkwargs0__ [__attrib0__]; break;
					case 'StoreWidget': var StoreWidget = __allkwargs0__ [__attrib0__]; break;
					case 'Table': var Table = __allkwargs0__ [__attrib0__]; break;
					case 'div': var div = __allkwargs0__ [__attrib0__]; break;
					case 'edit_rows': var edit_rows = __allkwargs0__ [__attrib0__]; break;
					case 'extract_row_indices': var extract_row_indices = __allkwargs0__ [__attrib0__]; break;
					case 'get_parent_selection': var get_parent_selection = __allkwargs0__ [__attrib0__]; break;
					case 'parse_table_filters': var parse_table_filters = __allkwargs0__ [__attrib0__]; break;
					case 'use_effect': var use_effect = __allkwargs0__ [__attrib0__]; break;
					case 'use_event_callback': var use_event_callback = __allkwargs0__ [__attrib0__]; break;
					case 'use_imperative_handle': var use_imperative_handle = __allkwargs0__ [__attrib0__]; break;
					case 'use_ref': var use_ref = __allkwargs0__ [__attrib0__]; break;
					case 'use_rows': var use_rows = __allkwargs0__ [__attrib0__]; break;
					case 'use_state': var use_state = __allkwargs0__ [__attrib0__]; break;
					case 'use_store_snapshot': var use_store_snapshot = __allkwargs0__ [__attrib0__]; break;
					case 'columns': var columns = __allkwargs0__ [__attrib0__]; break;
					case 'data_store': var data_store = __allkwargs0__ [__attrib0__]; break;
					case 'deep_get_store': var deep_get_store = __allkwargs0__ [__attrib0__]; break;
					case 'empty_store': var empty_store = __allkwargs0__ [__attrib0__]; break;
					case 'follow_parent_selection': var follow_parent_selection = __allkwargs0__ [__attrib0__]; break;
					case 'handle': var handle = __allkwargs0__ [__attrib0__]; break;
					case 'handles': var handles = __allkwargs0__ [__attrib0__]; break;
					case 'include_unconfigured_columns': var include_unconfigured_columns = __allkwargs0__ [__attrib0__]; break;
					case 'is_dataframe': var is_dataframe = __allkwargs0__ [__attrib0__]; break;
					case 'on_click_cell_content': var on_click_cell_content = __allkwargs0__ [__attrib0__]; break;
					case 'on_mount': var on_mount = __allkwargs0__ [__attrib0__]; break;
					case 'on_mouse_hover_row': var on_mouse_hover_row = __allkwargs0__ [__attrib0__]; break;
					case 'on_selection_change': var on_selection_change = __allkwargs0__ [__attrib0__]; break;
					case 'parent_relation': var parent_relation = __allkwargs0__ [__attrib0__]; break;
					case 'parent_selection_label': var parent_selection_label = __allkwargs0__ [__attrib0__]; break;
					case 'parent_selection_store': var parent_selection_store = __allkwargs0__ [__attrib0__]; break;
					case 'path_parts': var path_parts = __allkwargs0__ [__attrib0__]; break;
					case 'primary_key': var primary_key = __allkwargs0__ [__attrib0__]; break;
					case 'primary_keys': var primary_keys = __allkwargs0__ [__attrib0__]; break;
					case 'query_from': var query_from = __allkwargs0__ [__attrib0__]; break;
					case 'read_only': var read_only = __allkwargs0__ [__attrib0__]; break;
					case 'relations': var relations = __allkwargs0__ [__attrib0__]; break;
					case 'select_rows': var select_rows = __allkwargs0__ [__attrib0__]; break;
					case 'select_store_row_id': var select_store_row_id = __allkwargs0__ [__attrib0__]; break;
					case 'selected_rows_by_store': var selected_rows_by_store = __allkwargs0__ [__attrib0__]; break;
					case 'selected_rows_store': var selected_rows_store = __allkwargs0__ [__attrib0__]; break;
					case 'source_requery': var source_requery = __allkwargs0__ [__attrib0__]; break;
					case 'store_key': var store_key = __allkwargs0__ [__attrib0__]; break;
					case 'style': var style = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var TableWidget = function () {
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
		var __left0__ = use_state (dict ([['row_idx', null], ['col', null], ['mode', 'SELECT'], ['ranges', []]]));
		var position = __left0__ [0];
		var set_position = __left0__ [1];
		var selected_rows_snapshot = use_store_snapshot (selected_rows_store);
		var parent_ids = get_parent_selection (path_parts, selected_rows_by_store, use_store_snapshot);
		var data = deep_get_store (data_store, path_parts, parent_ids, primary_keys) || empty_store;
		var __left0__ = use_state (dict ({}));
		var filters = __left0__ [0];
		var set_filters = __left0__ [1];
		var __left0__ = use_state (dict ({}));
		var related_filters = __left0__ [0];
		var set_related_filters = __left0__ [1];
		var __left0__ = use_state ([]);
		var highlighted = __left0__ [0];
		var set_highlighted = __left0__ [1];
		var __left0__ = use_state ([]);
		var suggestions = __left0__ [0];
		var set_suggestions = __left0__ [1];
		var __left0__ = use_state ([]);
		var py_sort = __left0__ [0];
		var set_sort = __left0__ [1];
		var table_ref = use_ref ();
		if (on_mount !== null) {
			use_effect (on_mount, []);
		}
		var __left0__ = use_state (follow_parent_selection);
		var follow_parent = __left0__ [0];
		var set_follow_parent = __left0__ [1];
		var parent_selection = (parent_selection_store ? use_store_snapshot (parent_selection_store) : null);
		var parent_value = null;
		if (parent_selection !== null && parent_selection ['row']) {
			var parent_value = parent_selection ['row'] [parent_relation ['parent_column']];
		}
		else if (parent_selection !== null && len (parent_selection ['identities']) && primary_keys.py_get (parent_relation ['parent']) == parent_relation ['parent_column']) {
			var parent_value = parent_selection ['identities'] [0];
		}
		var parent_filter = (follow_parent && parent_value !== null ? dict ([['kind', 'predicate'], ['column', parent_relation ['child_column']], ['operator', 'eq'], ['value', parent_value]]) : null);
		var view = use_rows (data, primary_key, dict ([...(filters).py_items(), ...(related_filters).py_items()]), parent_filter, py_sort);
		var description = view.description;
		var source = view.rowSource;
		var selection_request = use_ref (null);
		var select_first_row = function () {
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
			if (!(is_dataframe) && len (selected_rows_store ['identities']) == 0 && source && source.rowCount) {
				select_row_id (source.getCachedRow (0) [primary_key]);
			}
		};
		use_effect (select_first_row, [source]);
		var set_filter = function (column, value) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'column': var column = __allkwargs0__ [__attrib0__]; break;
							case 'value': var value = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			var updated = dict (related_filters);
			if (value === null) {
				updated.py_pop (column, null);
			}
			else {
				updated [column] = '= {}'.format (value);
			}
			set_related_filters (updated);
		};
		var cancel_selection = function () {
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
			if (selection_request.current !== null) {
				selection_request.current.abort ();
			}
		};
		use_effect ((function __lambda__ () {
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
			return cancel_selection;
		}), [source]);
		var select_row_id = async function (row_id, cause) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'row_id': var row_id = __allkwargs0__ [__attrib0__]; break;
							case 'cause': var cause = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (typeof cause == 'undefined' || (cause != null && cause.hasOwnProperty ("__kwargtrans__"))) {;
				var cause = 'select';
			};
			if (source === null) {
				return ;
			}
			cancel_selection ();
			var controller = new AbortController ();
			selection_request.current = controller;
			var rows = await source.getRowsByKeys ([row_id], controller.signal);
			if (len (rows) && !(controller.signal.aborted)) {
				var idx = await source.findRowIndex (row_id, controller.signal);
				if (controller.signal.aborted) {
					return ;
				}
				set_position (dict ([['row_idx', (idx >= 0 ? idx : null)], ['col', null], ['mode', 'SELECT'], ['ranges', (idx >= 0 ? [idx] : [])]]));
				handle_position_change (row_id, (idx >= 0 ? idx : null), null, 'SELECT', cause, (idx >= 0 ? [dict ([['row_idx', idx]])] : []), rows [0], rows);
				if (idx >= 0) {
					table_ref.current.scroll_to_row_idx (idx);
				}
			}
		};
		var adjacent_row_idx = async function (idx, delta) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'idx': var idx = __allkwargs0__ [__attrib0__]; break;
							case 'delta': var delta = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (source === null || !(source.rowCount)) {
				return null;
			}
			var scope = (is_dataframe ? data.scope : null);
			var first = (scope && scope.rows && source.getCachedRow (0) === null ? scope.offset || 0 : 0);
			var count = (scope && scope.rows ? min (source.rowCount - first, len (scope.rows)) : source.rowCount);
			return first + __mod__ (((idx !== null ? idx : first) - first) + delta, count);
		};
		var row_id_at = async function (idx) {
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
			if (source === null || idx === null) {
				return null;
			}
			var controller = new AbortController ();
			var rows = await source.getRows (idx, idx + 1, controller.signal);
			return (len (rows) ? rows [0] [primary_key] : null);
		};
		var adjacent_row_id = async function (row_id, delta) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'row_id': var row_id = __allkwargs0__ [__attrib0__]; break;
							case 'delta': var delta = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (source === null) {
				return null;
			}
			var idx = await source.findRowIndex (row_id, new AbortController ().signal);
			return await row_id_at (await adjacent_row_idx (idx, delta));
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
			return dict ([['scroll_to_row_id', (function __lambda__ (value) {
				if (arguments.length) {
					var __ilastarg0__ = arguments.length - 1;
					if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
						var __allkwargs0__ = arguments [__ilastarg0__--];
						for (var __attrib0__ in __allkwargs0__) {
							switch (__attrib0__) {
								case 'value': var value = __allkwargs0__ [__attrib0__]; break;
							}
						}
					}
				}
				else {
				}
				return table_ref.current.scroll_to_row_id (value);
			})], ['scroll_to_row_idx', (function __lambda__ (value) {
				if (arguments.length) {
					var __ilastarg0__ = arguments.length - 1;
					if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
						var __allkwargs0__ = arguments [__ilastarg0__--];
						for (var __attrib0__ in __allkwargs0__) {
							switch (__attrib0__) {
								case 'value': var value = __allkwargs0__ [__attrib0__]; break;
							}
						}
					}
				}
				else {
				}
				return table_ref.current.scroll_to_row_idx (value);
			})], ['select_row_id', select_row_id], ['set_filter', set_filter], ['get_filters', (function __lambda__ () {
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
				return filters;
			})], ['clear_filters', (function __lambda__ () {
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
				return set_filters (dict ({}));
			})], ['set_highlighted', set_highlighted], ['get_adjacent_row_idx', adjacent_row_idx], ['get_adjacent_row_id', adjacent_row_id], ['get_row_id', row_id_at], ['focus', (function __lambda__ () {
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
				return table_ref.current.focus ();
			})]]);
		}), [source, filters, related_filters]);
		var handle_selection = async function (row_id, row_idx, col, mode, cause, ranges, row) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'row_id': var row_id = __allkwargs0__ [__attrib0__]; break;
							case 'row_idx': var row_idx = __allkwargs0__ [__attrib0__]; break;
							case 'col': var col = __allkwargs0__ [__attrib0__]; break;
							case 'mode': var mode = __allkwargs0__ [__attrib0__]; break;
							case 'cause': var cause = __allkwargs0__ [__attrib0__]; break;
							case 'ranges': var ranges = __allkwargs0__ [__attrib0__]; break;
							case 'row': var row = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (typeof ranges == 'undefined' || (ranges != null && ranges.hasOwnProperty ("__kwargtrans__"))) {;
				var ranges = null;
			};
			if (typeof row == 'undefined' || (row != null && row.hasOwnProperty ("__kwargtrans__"))) {;
				var row = null;
			};
			var indices = extract_row_indices (ranges);
			if (row_idx !== null && row_idx >= 0 && !__in__ (row_idx, indices)) {
				var indices = [row_idx, ...(indices)];
			}
			if (cause == 'snapshot') {
				set_position ((function __lambda__ (current) {
					if (arguments.length) {
						var __ilastarg0__ = arguments.length - 1;
						if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
							var __allkwargs0__ = arguments [__ilastarg0__--];
							for (var __attrib0__ in __allkwargs0__) {
								switch (__attrib0__) {
									case 'current': var current = __allkwargs0__ [__attrib0__]; break;
								}
							}
						}
					}
					else {
					}
					return dict ([...(current).py_items(), ['ranges', indices], ['row_idx', (current ['row_idx'] === null ? null : row_idx)]]);
				}));
			}
			else if (len (indices)) {
				set_position (dict ([['row_idx', row_idx], ['col', col], ['mode', mode], ['ranges', indices]]));
			}
			else {
				set_position ((function __lambda__ (current) {
					if (arguments.length) {
						var __ilastarg0__ = arguments.length - 1;
						if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
							var __allkwargs0__ = arguments [__ilastarg0__--];
							for (var __attrib0__ in __allkwargs0__) {
								switch (__attrib0__) {
									case 'current': var current = __allkwargs0__ [__attrib0__]; break;
								}
							}
						}
					}
					else {
					}
					return dict ([...(current).py_items(), ['row_idx', row_idx], ['col', col], ['mode', mode]]);
				}));
			}
			if (source === null) {
				return ;
			}
			cancel_selection ();
			var controller = new AbortController ();
			selection_request.current = controller;
			try {
				var rows = await source.getRowsAtIndices (indices, controller.signal);
				if (!(controller.signal.aborted)) {
					handle_position_change (row_id, row_idx, col, mode, cause, ranges, row, rows);
				}
			}
			catch (__except0__) {
				if (Error.isError(__except0__)) { __except0__ = Exception((__except0__).toString(), __kwargtrans__({error: __except0__})); }
				if (isinstance (__except0__, BaseException)) {
					var error = __except0__;
					if (is_dataframe && !(controller.signal.aborted)) {
						data.setStatus (null, str (error));
					}
				}
				else {
					throw __except0__;
				}
			}
		};
		var handle_cell_change = async function (row_id, row_idx, column, value) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'row_id': var row_id = __allkwargs0__ [__attrib0__]; break;
							case 'row_idx': var row_idx = __allkwargs0__ [__attrib0__]; break;
							case 'column': var column = __allkwargs0__ [__attrib0__]; break;
							case 'value': var value = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			await edit_rows (data, primary_key, [source.getCachedRow (row_idx)], dict ([[column, value]]), __kwargtrans__ ({read_only: read_only}));
		};
		var handle_input_change = use_event_callback (function (row_id, row_idx, col, value, cause) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'row_id': var row_id = __allkwargs0__ [__attrib0__]; break;
							case 'row_idx': var row_idx = __allkwargs0__ [__attrib0__]; break;
							case 'col': var col = __allkwargs0__ [__attrib0__]; break;
							case 'value': var value = __allkwargs0__ [__attrib0__]; break;
							case 'cause': var cause = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			var options = py_next ((function () {
				var __accu0__ = [];
				for (var c of columns) {
					if (c ['key'] == col) {
						__accu0__.append (c);
					}
				}
				return py_iter (__accu0__);
			}) (), dict ({})).py_get ('options');
			if (cause == 'unmount' || options === null) {
				set_suggestions (null);
			}
			else if (cause == 'mount') {
				set_suggestions (options);
			}
			else if (cause == 'type') {
				set_suggestions ((function () {
					var __accu0__ = [];
					for (var c of options) {
						if (__in__ ((value || '').lower (), c.lower ())) {
							__accu0__.append (c);
						}
					}
					return __accu0__;
				}) ());
			}
		});
		var query_source = async function (event) {
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
			set_related_filters (dict ({}));
			await query_from (store_key, source_ast);
		};
		var handle_position_change = use_event_callback (function (row_id, row_idx, col, mode, cause, ranges, row, selected_data) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'row_id': var row_id = __allkwargs0__ [__attrib0__]; break;
							case 'row_idx': var row_idx = __allkwargs0__ [__attrib0__]; break;
							case 'col': var col = __allkwargs0__ [__attrib0__]; break;
							case 'mode': var mode = __allkwargs0__ [__attrib0__]; break;
							case 'cause': var cause = __allkwargs0__ [__attrib0__]; break;
							case 'ranges': var ranges = __allkwargs0__ [__attrib0__]; break;
							case 'row': var row = __allkwargs0__ [__attrib0__]; break;
							case 'selected_data': var selected_data = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (typeof ranges == 'undefined' || (ranges != null && ranges.hasOwnProperty ("__kwargtrans__"))) {;
				var ranges = null;
			};
			if (typeof row == 'undefined' || (row != null && row.hasOwnProperty ("__kwargtrans__"))) {;
				var row = null;
			};
			if (typeof selected_data == 'undefined' || (selected_data != null && selected_data.hasOwnProperty ("__kwargtrans__"))) {;
				var selected_data = null;
			};
			if (cause != 'blur' && len (selected_data || [])) {
				select_rows (store_key, selected_data, handle, cause);
			}
			if (on_selection_change !== null) {
				on_selection_change (row_id, row_idx, col, mode, cause, ranges);
			}
		});
		var sync_selected_values = function () {
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
			var previous = selected_rows_snapshot.py_get ('row');
			var current_source = source || view.previousRowSource;
			var indices = position ['ranges'];
			if (previous === null || current_source === null || len (indices) == 0 || description === null) {
				return ;
			}
			var row = current_source.getCachedRow (indices [0]);
			var identity = description.internal_id_col;
			if (!(row) || row [identity] != previous [identity]) {
				return ;
			}
			if (!(any ((function () {
				var __accu0__ = [];
				for (var column of description.columns) {
					__accu0__.append (row [column.py_name] != previous [column.py_name]);
				}
				return py_iter (__accu0__);
			}) ()))) {
				return ;
			}
			selected_rows_store ['row'] = row;
			var identities = list (selected_rows_store ['identities']);
			for (var [idx, row_position] of enumerate (indices)) {
				var cached = current_source.getCachedRow (row_position);
				if (cached) {
					identities [idx] = cached [primary_key];
				}
			}
			selected_rows_store ['identities'] = identities;
			for (var relation of relations) {
				var column = relation ['child_column'];
				if (relation ['child'] == store_key && row [column] != previous [column]) {
					select_store_row_id (relation ['parent'], row [column]);
				}
			}
		};
		use_effect (sync_selected_values, [view.contentVersion]);
		var handle_mouse_hover_row = use_event_callback (function (row_id, row_idx, modkeys, row) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'row_id': var row_id = __allkwargs0__ [__attrib0__]; break;
							case 'row_idx': var row_idx = __allkwargs0__ [__attrib0__]; break;
							case 'modkeys': var modkeys = __allkwargs0__ [__attrib0__]; break;
							case 'row': var row = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (typeof row == 'undefined' || (row != null && row.hasOwnProperty ("__kwargtrans__"))) {;
				var row = null;
			};
			var highlighted_ids = (row === null || primary_key === null ? [] : [row [primary_key]]);
			for (var handle_item of handles.py_get (store_key, [])) {
				if (handle_item [1] == 'spans' && handle_item [0].current !== null) {
					handle_item [0].current.set_highlighted_spans (highlighted_ids);
				}
			}
			if (on_mouse_hover_row !== null) {
				on_mouse_hover_row (row_id, row_idx, modkeys);
			}
		});
		var inferred = (description ? (function () {
			var __accu0__ = [];
			for (var c of description.columns) {
				__accu0__.append (dict ([['key', c ['name']], ['name', c ['name']], ['kind', (__in__ ('bool', c.type.lower ()) ? 'boolean' : 'text')], ['editable', description.capabilities.edit], ['filterable', !(c.normalized) && c.source_filter !== false]]));
			}
			return __accu0__;
		}) () : []);
		var configured = (function () {
			var __accu0__ = [];
			for (var c of columns) {
				__accu0__.append ([c ['key'], c]);
			}
			return dict (__accu0__);
		}) ();
		var inferred_by_key = (function () {
			var __accu0__ = [];
			for (var c of inferred) {
				__accu0__.append ([c ['key'], c]);
			}
			return dict (__accu0__);
		}) ();
		var displayed_columns = (len (columns) ? (function () {
			var __accu0__ = [];
			for (var c of columns) {
				__accu0__.append (dict ([...(inferred_by_key.py_get (c ['key'], dict ({}))).py_items(), ...(c).py_items()]));
			}
			return __accu0__;
		}) () : inferred);
		if (len (columns) && include_unconfigured_columns) {
			displayed_columns.extend ((function () {
				var __accu0__ = [];
				for (var c of inferred) {
					if (!__in__ (c ['key'], configured)) {
						__accu0__.append (dict ([...(c).py_items(), ['editable', false]]));
					}
				}
				return __accu0__;
			}) ());
		}
		for (var column of displayed_columns) {
			column ['editable'] = bool (!(read_only) && column.py_get ('editable') && description && description.capabilities.edit);
		}
		var source_ast = null;
		if (is_dataframe && description !== null && source_requery) {
			try {
				var source_ast = parse_table_filters (dict ([...(description).py_items(), ['columns', (function () {
					var __accu0__ = [];
					for (var c of description.columns) {
						if (c.source_filter !== false) {
							__accu0__.append (c);
						}
					}
					return __accu0__;
				}) ()]]), filters);
			}
			catch (__except0__) {
				if (Error.isError(__except0__)) { __except0__ = Exception((__except0__).toString(), __kwargtrans__({error: __except0__})); }
				if (isinstance (__except0__, BaseException)) {
					var source_ast = null;
				}
				else {
					throw __except0__;
				}
			}
		}
		var query_changed = is_dataframe && str (source_ast) != str (data.sourceFilter);
		var displayed_source = source || view.previousRowSource;
		var error = view.filterError || view.error;
		var toolbar = (function () {
			var __accu0__ = [];
			for (var item of [(source && description.py_get ('row_limit') !== null ? div ('{} rows shown'.format (source.rowCount) + (source.rowCount == description.py_get ('row_limit') ? ', limit reached' : '')) : null), (parent_selection_label ? Checkbox (__kwargtrans__ ({label: parent_selection_label, checked: follow_parent, on_change: (function __lambda__ (event) {
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
				return set_follow_parent (event.target.checked);
			}), size: 'sm', sx: dict ([['fontSize', 'inherit']])})) : null), (source_requery && description && description.capabilities.source_filters ? Button ((query_changed ? 'Apply source filters' : 'Query source'), __kwargtrans__ ({on_click: query_source, disabled: bool (view.loading || view.filterError), color: 'neutral', variant: (query_changed ? 'outlined' : 'soft'), size: 'sm', sx: dict ([['textTransform', 'none']])})) : null), (view.loading ? LoadingStatus (__kwargtrans__ ({label: view.loading})) : null), (error ? ErrorBanner (__kwargtrans__ ({error: error})) : null)]) {
				if (item !== null) {
					__accu0__.append (item);
				}
			}
			return __accu0__;
		}) ();
		return StoreWidget (__kwargtrans__ ({store: data_store, read_only: read_only, content: Stack ((len (toolbar) ? Stack (...(toolbar), __kwargtrans__ ({direction: 'row', spacing: 1, use_flex_gap: true, sx: dict ([['p', 1], ['alignItems', 'center'], ['flexWrap', 'wrap']])})) : null), (displayed_source ? Table (__kwargtrans__ ({rows: [], row_source: displayed_source, primary_key: primary_key, preserve_selection: description.capabilities.stable_identity !== false, columns: displayed_columns, filters: filters, py_sort: py_sort, on_sort_change: set_sort, highlighted_rows: highlighted, suggestions: suggestions, selection: dict ([...(position).py_items(), ['ranges', (len (selected_rows_snapshot ['identities']) ? (function () {
			var __accu0__ = [];
			for (var idx of position ['ranges']) {
				__accu0__.append (dict ([['row_idx', idx]]));
			}
			return __accu0__;
		}) () : [])]]), multi_selection_mode: 'rows', on_selection_change: handle_selection, on_cell_change: handle_cell_change, on_input_change: handle_input_change, on_filters_change: (function __lambda__ (value, column) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'value': var value = __allkwargs0__ [__attrib0__]; break;
							case 'column': var column = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			return set_filters (value);
		}), on_mouse_hover_row: handle_mouse_hover_row, on_click_cell_content: on_click_cell_content, auto_filter: false, handle: table_ref, style: dict ([['flex', '1 1 auto'], ['height', 'auto'], ['minHeight', 0]])})) : null), __kwargtrans__ ({style: dict ([['height', '100%'], ['minHeight', 0]])})), style: dict ([['width', '100%'], ['height', '100%'], ['minHeight', 0], ...(style || dict ({})).py_items()])}));
	};
	return TableWidget;
};var pret_factory_df353f18520944908a84e05590ee89d3_ErrorBanner_8 = function (button, div, span, use_state) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'button': var button = __allkwargs0__ [__attrib0__]; break;
					case 'div': var div = __allkwargs0__ [__attrib0__]; break;
					case 'span': var span = __allkwargs0__ [__attrib0__]; break;
					case 'use_state': var use_state = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var ErrorBanner = function (error) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'error': var error = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		var __left0__ = use_state (null);
		var dismissed = __left0__ [0];
		var set_dismissed = __left0__ [1];
		if (!(error) || error == dismissed) {
			return null;
		}
		return div (span (error), button ('×', __kwargtrans__ ({class_name: 'metanno-error-dismiss', title: 'Dismiss', aria_label: 'Dismiss error', on_click: (function __lambda__ (event) {
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
			return set_dismissed (error);
		})})), __kwargtrans__ ({role: 'alert', class_name: 'metanno-error'}));
	};
	return ErrorBanner;
};var pret_factory_df353f18520944908a84e05590ee89d3_LoadingStatus_10 = function (CircularProgress, Stack) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'CircularProgress': var CircularProgress = __allkwargs0__ [__attrib0__]; break;
					case 'Stack': var Stack = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var LoadingStatus = function (label) {
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
		return Stack (CircularProgress (__kwargtrans__ ({size: 'sm', color: 'neutral', sx: dict ([['--CircularProgress-size', '16px']])})), label, __kwargtrans__ ({direction: 'row', spacing: 1, role: 'status', use_flex_gap: true, sx: dict ([['alignItems', 'center']])}));
	};
	return LoadingStatus;
};var pret_factory_df353f18520944908a84e05590ee89d3_StoreWidget_11 = function (div, use_effect, use_event_callback, use_ref, use_store_history) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'div': var div = __allkwargs0__ [__attrib0__]; break;
					case 'use_effect': var use_effect = __allkwargs0__ [__attrib0__]; break;
					case 'use_event_callback': var use_event_callback = __allkwargs0__ [__attrib0__]; break;
					case 'use_ref': var use_ref = __allkwargs0__ [__attrib0__]; break;
					case 'use_store_history': var use_store_history = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var StoreWidget = function (store, content, style, read_only) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'store': var store = __allkwargs0__ [__attrib0__]; break;
						case 'content': var content = __allkwargs0__ [__attrib0__]; break;
						case 'style': var style = __allkwargs0__ [__attrib0__]; break;
						case 'read_only': var read_only = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof style == 'undefined' || (style != null && style.hasOwnProperty ("__kwargtrans__"))) {;
			var style = null;
		};
		if (typeof read_only == 'undefined' || (read_only != null && read_only.hasOwnProperty ("__kwargtrans__"))) {;
			var read_only = false;
		};
		var history = use_store_history (store);
		var container = use_ref (null);
		var handle_key = use_event_callback (async function (event) {
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
			if (read_only || !(event.ctrlKey || event.metaKey) || event.key.lower () != 'z') {
				return ;
			}
			if (container.current === null || !(container.current.contains (event.target))) {
				return ;
			}
			if (event.target.closest ('input, textarea, [contenteditable=true]')) {
				return ;
			}
			event.preventDefault ();
			event.stopPropagation ();
			if (history.pending || !((event.shiftKey ? history.canRedo : history.canUndo))) {
				return ;
			}
			try {
				await (event.shiftKey ? history.redo () : history.undo ());
			}
			catch (__except0__) {
				if (Error.isError(__except0__)) { __except0__ = Exception((__except0__).toString(), __kwargtrans__({error: __except0__})); }
				if (isinstance (__except0__, BaseException)) {
					// pass;
				}
				else {
					throw __except0__;
				}
			}
		});
		var listen = function () {
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
			window.addEventListener ('keydown', handle_key, true);
			return (function __lambda__ () {
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
				return window.removeEventListener ('keydown', handle_key, true);
			});
		};
		use_effect (listen, []);
		return div (content, __kwargtrans__ ({ref: container, tab_index: 0, style: style}));
	};
	return StoreWidget;
};var pret_factory_df353f18520944908a84e05590ee89d3_use_effect_12 = function () {
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
		var register = function (func) {
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
			var run = function () {
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
				var cleanup = func ();
				if (callable (cleanup)) {
					return cleanup;
				}
			};
			return window.React.useEffect (run, dependencies);
		};
		return (effect === null ? register : register (effect));
	};
	return use_effect;
};var pret_factory_df353f18520944908a84e05590ee89d3_use_event_callback_13 = function (_use_event_callback_impl) {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_edit_rows_17 = function (transact) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'transact': var transact = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var edit_rows = async function (data, primary_key, rows, py_values, remove, insert, read_only) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'data': var data = __allkwargs0__ [__attrib0__]; break;
						case 'primary_key': var primary_key = __allkwargs0__ [__attrib0__]; break;
						case 'rows': var rows = __allkwargs0__ [__attrib0__]; break;
						case 'py_values': var py_values = __allkwargs0__ [__attrib0__]; break;
						case 'remove': var remove = __allkwargs0__ [__attrib0__]; break;
						case 'insert': var insert = __allkwargs0__ [__attrib0__]; break;
						case 'read_only': var read_only = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof rows == 'undefined' || (rows != null && rows.hasOwnProperty ("__kwargtrans__"))) {;
			var rows = tuple ([]);
		};
		if (typeof py_values == 'undefined' || (py_values != null && py_values.hasOwnProperty ("__kwargtrans__"))) {;
			var py_values = null;
		};
		if (typeof remove == 'undefined' || (remove != null && remove.hasOwnProperty ("__kwargtrans__"))) {;
			var remove = false;
		};
		if (typeof insert == 'undefined' || (insert != null && insert.hasOwnProperty ("__kwargtrans__"))) {;
			var insert = null;
		};
		if (typeof read_only == 'undefined' || (read_only != null && read_only.hasOwnProperty ("__kwargtrans__"))) {;
			var read_only = false;
		};
		if (read_only) {
			var __except0__ = ValueError ('This view is read only');
			__except0__.__cause__ = null;
			throw __except0__;
		}
		if (!(len (rows)) && insert === null) {
			return null;
		}
		if (getattr (data, '__pret_dataframe__', false)) {
			var identity = data.description.internal_id_col;
			var edits = (function () {
				var __accu0__ = [];
				for (var row of rows) {
					__accu0__.append ((remove ? dict ([['kind', 'delete'], ['row_identity', row [identity]]]) : dict ([['kind', 'update'], ['row_identity', row [identity]], ['values', py_values]])));
				}
				return __accu0__;
			}) ();
			var result = (insert !== null ? await data.insert (insert) : await data.applyMutation (dict ([['kind', 'batch'], ['edits', edits]])));
			if (result !== null && result.status != 'applied') {
				var __except0__ = ValueError (result.error || result.message || 'Edit was rejected');
				__except0__.__cause__ = null;
				throw __except0__;
			}
			return result;
		}
		var py_keys = (function () {
			var __accu0__ = [];
			for (var row of rows) {
				__accu0__.append (row [primary_key]);
			}
			return __accu0__;
		}) ();
		var indices = (function () {
			var __accu0__ = [];
			for (var idx = 0; idx < len (data); idx++) {
				if (__in__ (data [idx] [primary_key], py_keys)) {
					__accu0__.append (idx);
				}
			}
			return __accu0__;
		}) ();
		var __withid0__ = transact (data);
		try {
			__withid0__.__enter__ ();
			if (insert !== null) {
				for (var row of insert) {
					data.append (row);
				}
			}
			else if (remove) {
				for (var idx of sorted (indices, __kwargtrans__ ({reverse: true}))) {
					delete data [idx];
				}
			}
			else {
				for (var idx of indices) {
					for (var [key, value] of py_values.py_items ()) {
						data [idx] [key] = value;
					}
				}
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
	};
	return edit_rows;
};var pret_factory_df353f18520944908a84e05590ee89d3_extract_row_indices_19 = function () {
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
	var extract_row_indices = function (selected_rows) {
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
	return extract_row_indices;
};var pret_factory_df353f18520944908a84e05590ee89d3_get_parent_selection_20 = function () {
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
	var get_parent_selection = function (path_parts, selected_rows_by_store, read) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'path_parts': var path_parts = __allkwargs0__ [__attrib0__]; break;
						case 'selected_rows_by_store': var selected_rows_by_store = __allkwargs0__ [__attrib0__]; break;
						case 'read': var read = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof read == 'undefined' || (read != null && read.hasOwnProperty ("__kwargtrans__"))) {;
			var read = (function __lambda__ (store) {
				if (arguments.length) {
					var __ilastarg0__ = arguments.length - 1;
					if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
						var __allkwargs0__ = arguments [__ilastarg0__--];
						for (var __attrib0__ in __allkwargs0__) {
							switch (__attrib0__) {
								case 'store': var store = __allkwargs0__ [__attrib0__]; break;
							}
						}
					}
				}
				else {
				}
				return store;
			});
		};
		var selection = dict ({});
		for (var idx = 1; idx < len (path_parts); idx++) {
			var parent_path = '.'.join (path_parts.__getslice__ (0, idx, 1));
			var parent_store = selected_rows_by_store.py_get (parent_path);
			var identities = (parent_store !== null ? read (parent_store) ['identities'] : []);
			selection [parent_path] = (len (identities) ? identities [0] : null);
		}
		return selection;
	};
	return get_parent_selection;
};var pret_factory_df353f18520944908a84e05590ee89d3_use_rows_23 = function (use_dataframe_view, use_list_rows, use_row_filter, use_store_snapshot, with_filter_error) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'use_dataframe_view': var use_dataframe_view = __allkwargs0__ [__attrib0__]; break;
					case 'use_list_rows': var use_list_rows = __allkwargs0__ [__attrib0__]; break;
					case 'use_row_filter': var use_row_filter = __allkwargs0__ [__attrib0__]; break;
					case 'use_store_snapshot': var use_store_snapshot = __allkwargs0__ [__attrib0__]; break;
					case 'with_filter_error': var with_filter_error = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var use_rows = function (data, primary_key, filters, filter, py_sort) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'data': var data = __allkwargs0__ [__attrib0__]; break;
						case 'primary_key': var primary_key = __allkwargs0__ [__attrib0__]; break;
						case 'filters': var filters = __allkwargs0__ [__attrib0__]; break;
						case 'filter': var filter = __allkwargs0__ [__attrib0__]; break;
						case 'py_sort': var py_sort = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof filters == 'undefined' || (filters != null && filters.hasOwnProperty ("__kwargtrans__"))) {;
			var filters = null;
		};
		if (typeof filter == 'undefined' || (filter != null && filter.hasOwnProperty ("__kwargtrans__"))) {;
			var filter = null;
		};
		if (typeof py_sort == 'undefined' || (py_sort != null && py_sort.hasOwnProperty ("__kwargtrans__"))) {;
			var py_sort = null;
		};
		if (getattr (data, '__pret_dataframe__', false)) {
			var __left0__ = use_row_filter (data.description, filters, filter);
			var tree = __left0__ [0];
			var filter_error = __left0__ [1];
			return with_filter_error (use_dataframe_view (data, tree, primary_key, py_sort || [], false), filter_error);
		}
		return use_list_rows (data, use_store_snapshot (data), primary_key, filters, filter, py_sort || []);
	};
	return use_rows;
};var pret_factory_df353f18520944908a84e05590ee89d3_make_note_kind_options_29 = function () {
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
	var make_note_kind_options = function (note) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'note': var note = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (__in__ ('EMEA', note ['note_id'])) {
			return ['interesting', 'very interesting'];
		}
		else {
			return [];
		}
	};
	return make_note_kind_options;
};var pret_factory_df353f18520944908a84e05590ee89d3_get_standalone_client_manager_32 = function (StandaloneClientManager) {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_object_33 = function () {
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
};var pret_factory_df353f18520944908a84e05590ee89d3___init___34 = function (WeakValueDictionary, browser_session_id) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'WeakValueDictionary': var WeakValueDictionary = __allkwargs0__ [__attrib0__]; break;
					case 'browser_session_id': var browser_session_id = __allkwargs0__ [__attrib0__]; break;
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
		self.call_futures = dict ({});
		self.outgoing_messages = [];
		self.is_draining_outgoing_messages = false;
		self.connection_state = dict ([['kind', 'unknown'], ['transport', null], ['connected', null], ['reason', null], ['kernel_connection_status', null], ['last_error', null], ['state_write_rejection_count', 0], ['last_state_write_rejection', null]]);
		self.connection_state_listeners = set ();
		self.uid = browser_session_id ();
		self.register_function (self.call_ref_method, '<ref_method>');
		self.last_messages = [];
	};
	return __init__;
};var pret_factory_df353f18520944908a84e05590ee89d3_WeakValueDictionary_35 = function () {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_call_ref_method_38 = function () {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_drain_outgoing_messages_39 = function (is_awaitable, start_async_task) {
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
					if (Error.isError(__except0__)) { __except0__ = Exception((__except0__).toString(), __kwargtrans__({error: __except0__})); }
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
};var pret_factory_df353f18520944908a84e05590ee89d3_get_connection_status_42 = function () {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_handle_call_failure_msg_43 = function () {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_handle_call_msg_44 = function (is_awaitable) {
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
			if (Error.isError(__except0__)) { __except0__ = Exception((__except0__).toString(), __kwargtrans__({error: __except0__})); }
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
};var pret_factory_df353f18520944908a84e05590ee89d3_handle_call_success_msg_45 = function () {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_handle_message_46 = function () {
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
		else if (method == 'call_success') {
			return self.handle_call_success_msg (data);
		}
		else if (method == 'call_failure') {
			return self.handle_call_failure_msg (data);
		}
		else {
			var __except0__ = Exception ('Unknown method: {}'.format (method));
			__except0__.__cause__ = null;
			throw __except0__;
		}
	};
	return handle_message;
};var pret_factory_df353f18520944908a84e05590ee89d3_handle_state_change_msg_47 = function (store_controller) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'store_controller': var store_controller = __allkwargs0__ [__attrib0__]; break;
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
		var state = self.states.py_get (data ['sync_id']);
		if (state) {
			store_controller (state).notifyRemoteChange ();
		}
	};
	return handle_state_change_msg;
};var pret_factory_df353f18520944908a84e05590ee89d3_message_targets_this_manager_49 = function () {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_notify_connection_status_listeners_50 = function () {
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
				if (Error.isError(__except0__)) { __except0__ = Exception((__except0__).toString(), __kwargtrans__({error: __except0__})); }
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
};var pret_factory_df353f18520944908a84e05590ee89d3_notify_state_write_rejected_51 = function () {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_register_call_future_52 = function () {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_register_function_53 = function (function_identifier) {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_register_ref_55 = function () {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_register_state_56 = function () {
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
	};
	return register_state;
};var pret_factory_df353f18520944908a84e05590ee89d3_remote_call_ref_method_57 = function () {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_send_call_58 = function (Future, make_uuid) {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_send_message_60 = function () {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_send_outgoing_message_61 = function (Future, is_awaitable, start_async_task) {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_set_connection_status_62 = function (UNSET) {
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
		}
		return self.connection_state;
	});})(UNSET, UNSET, UNSET, UNSET, UNSET);
	return set_connection_status;
};var pret_factory_df353f18520944908a84e05590ee89d3_subscribe_connection_status_63 = function () {
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
};var pret_factory_df353f18520944908a84e05590ee89d3___init___64 = function (is_awaitable, loads, make_websocket, start_async_task) {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_loads_65 = function () {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_send_message_67 = function (dumps, fetch, is_awaitable, loads) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'dumps': var dumps = __allkwargs0__ [__attrib0__]; break;
					case 'fetch': var fetch = __allkwargs0__ [__attrib0__]; break;
					case 'is_awaitable': var is_awaitable = __allkwargs0__ [__attrib0__]; break;
					case 'loads': var loads = __allkwargs0__ [__attrib0__]; break;
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
			if (response.headers.has ('X-Pret-Binary')) {
				var body = await response.arrayBuffer ();
				var length = new DataView (body).getUint32 (0);
				var result = loads (new TextDecoder ().decode (new Uint8Array (body, 4, length)));
				var value = result ['data'] ['value'];
				var buffer = new Uint8Array (body, 4 + length);
				if (__in__ ('__pret_bytes__', value)) {
					result ['data'] ['value'] = buffer;
				}
				else {
					value ['bytes'] = buffer;
				}
			}
			else {
				var result = await response.json ();
			}
			if (__in__ ('method', result) && __in__ ('data', result)) {
				var future = self.handle_message (result ['method'], result ['data']);
				if (is_awaitable (future)) {
					await future;
				}
			}
			self.set_connection_status (__kwargtrans__ ({connected: true, transport: 'standalone-http', reason: 'send_ok', last_error: null}));
		}
		catch (__except0__) {
			if (Error.isError(__except0__)) { __except0__ = Exception((__except0__).toString(), __kwargtrans__({error: __except0__})); }
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
};var pret_factory_df353f18520944908a84e05590ee89d3_dumps_68 = function () {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_deep_get_store_71 = function () {
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
	var deep_get_store = function (data_store, path_parts, parent_ids, primary_keys) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'data_store': var data_store = __allkwargs0__ [__attrib0__]; break;
						case 'path_parts': var path_parts = __allkwargs0__ [__attrib0__]; break;
						case 'parent_ids': var parent_ids = __allkwargs0__ [__attrib0__]; break;
						case 'primary_keys': var primary_keys = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		var store = data_store [path_parts [0]];
		for (var idx = 1; idx < len (path_parts); idx++) {
			var parent_path = '.'.join (path_parts.__getslice__ (0, idx, 1));
			var identity = parent_ids.py_get (parent_path);
			var key = primary_keys.py_get (parent_path);
			var row = (identity !== null ? py_next ((function () {
				var __accu0__ = [];
				for (var row of store) {
					if (row [key] == identity) {
						__accu0__.append (row);
					}
				}
				return py_iter (__accu0__);
			}) (), null) : null);
			if (row === null || row.py_get (path_parts [idx]) === null) {
				return null;
			}
			var store = row [path_parts [idx]];
		}
		return store;
	};
	return deep_get_store;
};var pret_factory_df353f18520944908a84e05590ee89d3_make_client_ref_72 = function (get_manager) {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_mount_73 = function (query_from, root_for, state, subscribe_table, tables) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'query_from': var query_from = __allkwargs0__ [__attrib0__]; break;
					case 'root_for': var root_for = __allkwargs0__ [__attrib0__]; break;
					case 'state': var state = __allkwargs0__ [__attrib0__]; break;
					case 'subscribe_table': var subscribe_table = __allkwargs0__ [__attrib0__]; break;
					case 'tables': var tables = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var mount = function () {
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
		state ['references'] = state ['references'] + 1;
		if (state ['references'] == 1) {
			for (var key of tables.py_keys ()) {
				state ['subscriptions'].append (subscribe_table (key));
			}
			for (var root of set ((function () {
				var __accu0__ = [];
				for (var key of tables.py_keys ()) {
					__accu0__.append (root_for (key));
				}
				return py_iter (__accu0__);
			}) ())) {
				if (any ((function () {
					var __accu0__ = [];
					for (var key of tables.py_keys ()) {
						if (root_for (key) == root) {
							__accu0__.append (tables [key].scope === null);
						}
					}
					return py_iter (__accu0__);
				}) ())) {
					query_from (root, null);
				}
			}
		}
		var cleanup = function () {
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
			state ['references'] = state ['references'] - 1;
			if (state ['references'] == 0) {
				for (var root of state ['generations'].py_keys ()) {
					state ['generations'] [root] = state ['generations'] [root] + 1;
				}
				for (var unsubscribe of state ['subscriptions']) {
					unsubscribe ();
				}
				state ['subscriptions'].py_clear ();
				for (var key of tables.py_keys ()) {
					tables [key].loadPage = null;
					tables [key].setStatus (null, tables [key].error);
				}
			}
		};
		return cleanup;
	};
	return mount;
};var pret_factory_df353f18520944908a84e05590ee89d3_query_from_74 = function (parents, related_filter, relations, root_for, state, tables) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'parents': var parents = __allkwargs0__ [__attrib0__]; break;
					case 'related_filter': var related_filter = __allkwargs0__ [__attrib0__]; break;
					case 'relations': var relations = __allkwargs0__ [__attrib0__]; break;
					case 'root_for': var root_for = __allkwargs0__ [__attrib0__]; break;
					case 'state': var state = __allkwargs0__ [__attrib0__]; break;
					case 'tables': var tables = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var query_from = async function (key, filters, offset) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'key': var key = __allkwargs0__ [__attrib0__]; break;
						case 'filters': var filters = __allkwargs0__ [__attrib0__]; break;
						case 'offset': var offset = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof offset == 'undefined' || (offset != null && offset.hasOwnProperty ("__kwargtrans__"))) {;
			var offset = 0;
		};
		var root = root_for (key);
		var generation = state ['generations'].py_get (root, 0) + 1;
		state ['generations'] [root] = generation;
		var group = (function () {
			var __accu0__ = [];
			for (var py_name of tables.py_keys ()) {
				if (root_for (py_name) == root) {
					__accu0__.append (py_name);
				}
			}
			return __accu0__;
		}) ();
		for (var py_name of group) {
			tables [py_name].setStatus ((py_name == key ? 'Querying source' : 'Loading related data'));
		}
		try {
			var scopes = dict ([[key, await tables [key].fetchScope (filters, [], offset)]]);
			if (generation != state ['generations'] [root]) {
				return false;
			}
			var current = key;
			while (current != root) {
				var relation = parents [current];
				var __left0__ = tuple ([relation ['parent'], relation ['child']]);
				var parent = __left0__ [0];
				var child = __left0__ [1];
				scopes [parent] = await tables [parent].fetchScope (related_filter (relation ['parent_column'], child, relation ['child_column'], scopes [child]));
				if (generation != state ['generations'] [root]) {
					return false;
				}
				var current = parent;
			}
			var pending = [root];
			while (len (pending) > 0) {
				var parent = pending.py_pop (0);
				for (var relation of relations) {
					var child = relation ['child'];
					var __left0__ = tuple ([relation ['parent_column'], relation ['child_column']]);
					var parent_col = __left0__ [0];
					var child_col = __left0__ [1];
					if (relation ['parent'] != parent || !__in__ (child, group)) {
						continue;
					}
					var parent_filter = related_filter (child_col, parent, parent_col, scopes [parent]);
					if (!__in__ (child, scopes)) {
						scopes [child] = await tables [child].fetchScope (parent_filter);
					}
					else if (scopes [parent].rows !== null && scopes [child].rows !== null) {
						var ids = set ((function () {
							var __accu0__ = [];
							for (var row of scopes [parent].rows) {
								__accu0__.append (str (row [parent_col]));
							}
							return py_iter (__accu0__);
						}) ());
						if (any ((function () {
							var __accu0__ = [];
							for (var row of scopes [child].rows) {
								__accu0__.append (!__in__ (str (row [child_col]), ids));
							}
							return py_iter (__accu0__);
						}) ())) {
							scopes [child] = await tables [child].fetchScope (dict ([['kind', 'and'], ['children', (scopes [child].filter ? [scopes [child].filter, parent_filter] : [parent_filter])]]));
						}
					}
					if (generation != state ['generations'] [root]) {
						return false;
					}
					pending.append (child);
				}
			}
			if (generation != state ['generations'] [root]) {
				return false;
			}
			for (var py_name of group) {
				tables [py_name].setScope (scopes [py_name], false, (py_name == key ? filters : null));
			}
			for (var py_name of group) {
				tables [py_name].notifySubscribers ();
			}
			return true;
		}
		catch (__except0__) {
			if (Error.isError(__except0__)) { __except0__ = Exception((__except0__).toString(), __kwargtrans__({error: __except0__})); }
			if (isinstance (__except0__, Exception)) {
				var error = __except0__;
				if (generation == state ['generations'] [root]) {
					for (var py_name of group) {
						tables [py_name].setStatus (null, str (error));
					}
				}
				return false;
			}
			else {
				throw __except0__;
			}
		}
	};
	return query_from;
};var pret_factory_df353f18520944908a84e05590ee89d3_related_filter_75 = function (tables) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'tables': var tables = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var related_filter = function (column, key, parent_column, scope) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'column': var column = __allkwargs0__ [__attrib0__]; break;
						case 'key': var key = __allkwargs0__ [__attrib0__]; break;
						case 'parent_column': var parent_column = __allkwargs0__ [__attrib0__]; break;
						case 'scope': var scope = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (scope.rows !== null) {
			return dict ([['kind', 'predicate'], ['column', column], ['operator', 'in'], ['source_relation', dict ([['resource_id', tables [key].resource_id], ['parent_column', parent_column], ['filter', scope.filter], ['offset', scope.offset], ['paging', tables [key].description.row_limit === null]])], ['value', list (set ((function () {
				var __accu0__ = [];
				for (var row of scope.rows) {
					if (row [parent_column] !== null) {
						__accu0__.append (row [parent_column]);
					}
				}
				return py_iter (__accu0__);
			}) ()))]]);
		}
		return dict ([['kind', 'relation'], ['column', column], ['resource_id', tables [key].resource_id], ['parent_column', parent_column], ['filter', scope.filter]]);
	};
	return related_filter;
};var pret_factory_df353f18520944908a84e05590ee89d3_root_for_76 = function (parents) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'parents': var parents = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var root_for = function (key) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'key': var key = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		while (__in__ (key, parents)) {
			var key = parents [key] ['parent'];
		}
		return key;
	};
	return root_for;
};var pret_factory_df353f18520944908a84e05590ee89d3_subscribe_table_77 = function (query_from, root_for, tables) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'query_from': var query_from = __allkwargs0__ [__attrib0__]; break;
					case 'root_for': var root_for = __allkwargs0__ [__attrib0__]; break;
					case 'tables': var tables = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var subscribe_table = function (key) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'key': var key = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		var frame = tables [key];
		var revision = dict ([['value', frame.revision]]);
		var changed = function () {
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
			if (frame.revision == revision ['value']) {
				return ;
			}
			revision ['value'] = frame.revision;
			if (key == root_for (key) && frame.scope !== null && frame.scope.revision != frame.revision) {
				query_from (key, frame.scope.filter, frame.scope.offset || 0);
			}
		};
		var load_page = function (offset) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'offset': var offset = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			return query_from (key, frame.scope.filter, offset);
		};
		frame.loadPage = load_page;
		return frame.subscribe (changed);
	};
	return subscribe_table;
};var pret_factory_df353f18520944908a84e05590ee89d3_select_rows_78 = function (filter_related_tables, handles, primary_keys, relations, select_row_id, selected_rows_by_store) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'filter_related_tables': var filter_related_tables = __allkwargs0__ [__attrib0__]; break;
					case 'handles': var handles = __allkwargs0__ [__attrib0__]; break;
					case 'primary_keys': var primary_keys = __allkwargs0__ [__attrib0__]; break;
					case 'relations': var relations = __allkwargs0__ [__attrib0__]; break;
					case 'select_row_id': var select_row_id = __allkwargs0__ [__attrib0__]; break;
					case 'selected_rows_by_store': var selected_rows_by_store = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var select_rows = function (store_key, rows, source_handle, cause) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'store_key': var store_key = __allkwargs0__ [__attrib0__]; break;
						case 'rows': var rows = __allkwargs0__ [__attrib0__]; break;
						case 'source_handle': var source_handle = __allkwargs0__ [__attrib0__]; break;
						case 'cause': var cause = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		var selection = selected_rows_by_store [store_key];
		var primary_key = primary_keys.py_get (store_key);
		var rows = (function () {
			var __accu0__ = [];
			for (var row of rows) {
				if (row) {
					__accu0__.append (row);
				}
			}
			return __accu0__;
		}) ();
		var identities = (primary_key !== null ? (function () {
			var __accu0__ = [];
			for (var row of rows) {
				__accu0__.append (row [primary_key]);
			}
			return __accu0__;
		}) () : []);
		var changed = str (selection ['identities']) != str (identities);
		selection ['identities'] = identities;
		selection ['row'] = (len (rows) ? rows [0] : null);
		var lead = (len (rows) ? rows [0] : null);
		var in_relation = any ((function () {
			var __accu0__ = [];
			for (var relation of relations) {
				__accu0__.append (__in__ (store_key, tuple ([relation ['parent'], relation ['child']])));
			}
			return py_iter (__accu0__);
		}) ());
		if (lead !== null) {
			for (var relation of relations) {
				if (relation ['child'] == store_key) {
					select_row_id (relation ['parent'], lead [relation ['child_column']]);
				}
			}
			if (!(in_relation)) {
				for (var other_key of primary_keys.py_keys ()) {
					var other_pk = primary_keys [other_key];
					if (other_key != store_key && other_pk != primary_key && lead.py_get (other_pk) !== null) {
						select_row_id (other_key, lead [other_pk]);
					}
				}
			}
		}
		if (changed && cause != 'relation') {
			for (var key of selected_rows_by_store.py_keys ()) {
				var is_child = key.startswith ('{}.'.format (store_key)) || any ((function () {
					var __accu0__ = [];
					for (var relation of relations) {
						__accu0__.append (relation ['parent'] == store_key && relation ['child'] == key);
					}
					return py_iter (__accu0__);
				}) ());
				if (is_child && len (selected_rows_by_store [key] ['identities'])) {
					selected_rows_by_store [key] ['identities'] = [];
					selected_rows_by_store [key] ['row'] = null;
				}
			}
		}
		if (lead !== null && primary_key !== null && !__in__ (cause, new set (['relation', 'snapshot']))) {
			for (var other of handles.py_get (store_key, [])) {
				if (other [0] == source_handle || other [0].current === null) {
					continue;
				}
				if (other [1] == 'spans') {
					other [0].current.scroll_to_span (lead [primary_key]);
				}
				else if (other [1] == 'table') {
					other [0].current.scroll_to_row_id (lead [primary_key]);
				}
			}
			if (!(in_relation)) {
				filter_related_tables (primary_key, lead [primary_key], store_key, source_handle);
			}
		}
	};
	return select_rows;
};var pret_factory_df353f18520944908a84e05590ee89d3_filter_related_tables_79 = function (handles) {
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
			for (var [other_handle, _, accepted_keys] of (function () {
				var __accu0__ = [];
				for (var item of handle_list) {
					if (item [1] == 'table') {
						__accu0__.append (item);
					}
				}
				return __accu0__;
			}) ()) {
				if (other_handle.current === null || other_handle == source_handle || accepted_keys === false) {
					continue;
				}
				if (accepted_keys === true || accepted_keys === null || __in__ (filter_key, accepted_keys)) {
					other_handle.current.set_filter (filter_key, str (filter_value));
				}
			}
		}
	};
	return filter_related_tables;
};var pret_factory_df353f18520944908a84e05590ee89d3_select_row_id_80 = function (handles, selected_rows_by_store) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'handles': var handles = __allkwargs0__ [__attrib0__]; break;
					case 'selected_rows_by_store': var selected_rows_by_store = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var select_row_id = function (store_key, identity, source_handle) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'store_key': var store_key = __allkwargs0__ [__attrib0__]; break;
						case 'identity': var identity = __allkwargs0__ [__attrib0__]; break;
						case 'source_handle': var source_handle = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof source_handle == 'undefined' || (source_handle != null && source_handle.hasOwnProperty ("__kwargtrans__"))) {;
			var source_handle = null;
		};
		var tables = (function () {
			var __accu0__ = [];
			for (var item of handles.py_get (store_key, [])) {
				if (item [1] == 'table' && item [0].current !== null && item [0] != source_handle) {
					__accu0__.append (item [0]);
				}
			}
			return __accu0__;
		}) ();
		for (var table of tables) {
			table.current.select_row_id (identity, 'relation');
		}
		var selection = selected_rows_by_store.py_get (store_key);
		if (!(len (tables)) && selection !== null && str (selection ['identities']) != str ([identity])) {
			selection ['identities'] = [identity];
			selection ['row'] = null;
		}
	};
	return select_row_id;
};var pret_factory_df353f18520944908a84e05590ee89d3_TextWidget_81 = function (AnnotatedText, Any, Dict, List, LoadingStatus, Optional, Ref, Sequence, div, edit_rows, get_first_selected_row_idx, get_parent_selection, normalize_row_indices, use_effect, use_event_callback, use_imperative_handle, use_memo, use_ref, use_selected_rows, use_state, use_store_snapshot, begin_key, button_key, container_renderer, data_store, deep_get_store, default_style, docs_mode, empty_store, end_key, filter_spans, handle, handles, is_dataframe, label_formatter, label_key, labels, local_spans_store, on_add_span, on_change_text_id, on_click_span, on_hover_spans, on_mount, on_select_text, parent_relation, parent_selection_store, primary_keys, read_only, select_rows, selected_doc_rows_store, selected_rows_by_store, selected_span_rows_store, span_field_by_key, spans_foreign_key, spans_path_parts, spans_primary_key, store_spans_key, store_text_key, style, style_key, text_key, text_path_parts, text_primary_key, toolbar_actions, toolbar_state, toolbar_view) {
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
					case 'LoadingStatus': var LoadingStatus = __allkwargs0__ [__attrib0__]; break;
					case 'Optional': var Optional = __allkwargs0__ [__attrib0__]; break;
					case 'Ref': var Ref = __allkwargs0__ [__attrib0__]; break;
					case 'Sequence': var Sequence = __allkwargs0__ [__attrib0__]; break;
					case 'div': var div = __allkwargs0__ [__attrib0__]; break;
					case 'edit_rows': var edit_rows = __allkwargs0__ [__attrib0__]; break;
					case 'get_first_selected_row_idx': var get_first_selected_row_idx = __allkwargs0__ [__attrib0__]; break;
					case 'get_parent_selection': var get_parent_selection = __allkwargs0__ [__attrib0__]; break;
					case 'normalize_row_indices': var normalize_row_indices = __allkwargs0__ [__attrib0__]; break;
					case 'use_effect': var use_effect = __allkwargs0__ [__attrib0__]; break;
					case 'use_event_callback': var use_event_callback = __allkwargs0__ [__attrib0__]; break;
					case 'use_imperative_handle': var use_imperative_handle = __allkwargs0__ [__attrib0__]; break;
					case 'use_memo': var use_memo = __allkwargs0__ [__attrib0__]; break;
					case 'use_ref': var use_ref = __allkwargs0__ [__attrib0__]; break;
					case 'use_selected_rows': var use_selected_rows = __allkwargs0__ [__attrib0__]; break;
					case 'use_state': var use_state = __allkwargs0__ [__attrib0__]; break;
					case 'use_store_snapshot': var use_store_snapshot = __allkwargs0__ [__attrib0__]; break;
					case 'begin_key': var begin_key = __allkwargs0__ [__attrib0__]; break;
					case 'button_key': var button_key = __allkwargs0__ [__attrib0__]; break;
					case 'container_renderer': var container_renderer = __allkwargs0__ [__attrib0__]; break;
					case 'data_store': var data_store = __allkwargs0__ [__attrib0__]; break;
					case 'deep_get_store': var deep_get_store = __allkwargs0__ [__attrib0__]; break;
					case 'default_style': var default_style = __allkwargs0__ [__attrib0__]; break;
					case 'docs_mode': var docs_mode = __allkwargs0__ [__attrib0__]; break;
					case 'empty_store': var empty_store = __allkwargs0__ [__attrib0__]; break;
					case 'end_key': var end_key = __allkwargs0__ [__attrib0__]; break;
					case 'filter_spans': var filter_spans = __allkwargs0__ [__attrib0__]; break;
					case 'handle': var handle = __allkwargs0__ [__attrib0__]; break;
					case 'handles': var handles = __allkwargs0__ [__attrib0__]; break;
					case 'is_dataframe': var is_dataframe = __allkwargs0__ [__attrib0__]; break;
					case 'label_formatter': var label_formatter = __allkwargs0__ [__attrib0__]; break;
					case 'label_key': var label_key = __allkwargs0__ [__attrib0__]; break;
					case 'labels': var labels = __allkwargs0__ [__attrib0__]; break;
					case 'local_spans_store': var local_spans_store = __allkwargs0__ [__attrib0__]; break;
					case 'on_add_span': var on_add_span = __allkwargs0__ [__attrib0__]; break;
					case 'on_change_text_id': var on_change_text_id = __allkwargs0__ [__attrib0__]; break;
					case 'on_click_span': var on_click_span = __allkwargs0__ [__attrib0__]; break;
					case 'on_hover_spans': var on_hover_spans = __allkwargs0__ [__attrib0__]; break;
					case 'on_mount': var on_mount = __allkwargs0__ [__attrib0__]; break;
					case 'on_select_text': var on_select_text = __allkwargs0__ [__attrib0__]; break;
					case 'parent_relation': var parent_relation = __allkwargs0__ [__attrib0__]; break;
					case 'parent_selection_store': var parent_selection_store = __allkwargs0__ [__attrib0__]; break;
					case 'primary_keys': var primary_keys = __allkwargs0__ [__attrib0__]; break;
					case 'read_only': var read_only = __allkwargs0__ [__attrib0__]; break;
					case 'select_rows': var select_rows = __allkwargs0__ [__attrib0__]; break;
					case 'selected_doc_rows_store': var selected_doc_rows_store = __allkwargs0__ [__attrib0__]; break;
					case 'selected_rows_by_store': var selected_rows_by_store = __allkwargs0__ [__attrib0__]; break;
					case 'selected_span_rows_store': var selected_span_rows_store = __allkwargs0__ [__attrib0__]; break;
					case 'span_field_by_key': var span_field_by_key = __allkwargs0__ [__attrib0__]; break;
					case 'spans_foreign_key': var spans_foreign_key = __allkwargs0__ [__attrib0__]; break;
					case 'spans_path_parts': var spans_path_parts = __allkwargs0__ [__attrib0__]; break;
					case 'spans_primary_key': var spans_primary_key = __allkwargs0__ [__attrib0__]; break;
					case 'store_spans_key': var store_spans_key = __allkwargs0__ [__attrib0__]; break;
					case 'store_text_key': var store_text_key = __allkwargs0__ [__attrib0__]; break;
					case 'style': var style = __allkwargs0__ [__attrib0__]; break;
					case 'style_key': var style_key = __allkwargs0__ [__attrib0__]; break;
					case 'text_key': var text_key = __allkwargs0__ [__attrib0__]; break;
					case 'text_path_parts': var text_path_parts = __allkwargs0__ [__attrib0__]; break;
					case 'text_primary_key': var text_primary_key = __allkwargs0__ [__attrib0__]; break;
					case 'toolbar_actions': var toolbar_actions = __allkwargs0__ [__attrib0__]; break;
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
		var parent_ids = get_parent_selection (text_path_parts, selected_rows_by_store, use_store_snapshot);
		if (spans_path_parts !== null) {
			var spans_selection = get_parent_selection (spans_path_parts, selected_rows_by_store, use_store_snapshot);
			for (var idx = 1; idx < len (spans_path_parts); idx++) {
				var parent_path = '.'.join (spans_path_parts.__getslice__ (0, idx, 1));
				if (!__in__ (parent_path, parent_ids)) {
					parent_ids [parent_path] = spans_selection [parent_path];
				}
			}
		}
		var text_context_key = '|'.join ((function () {
			var __accu0__ = [];
			for (var i = 1; i < len (text_path_parts); i++) {
				__accu0__.append ('{}:{}'.format ('.'.join (text_path_parts.__getslice__ (0, i, 1)), parent_ids.py_get ('.'.join (text_path_parts.__getslice__ (0, i, 1)))));
			}
			return py_iter (__accu0__);
		}) ()) || 'root';
		var text_store = deep_get_store (data_store, text_path_parts, parent_ids, primary_keys) || empty_store;
		var spans_store = (spans_path_parts !== null ? deep_get_store (data_store, spans_path_parts, parent_ids, primary_keys) || empty_store : local_spans_store);
		if (on_mount !== null) {
			use_effect (on_mount, []);
		}
		var selected_doc_rows_snapshot = use_store_snapshot (selected_doc_rows_store);
		var selected_span_rows_snapshot = use_store_snapshot (selected_span_rows_store);
		var selected_doc_ids = selected_doc_rows_snapshot ['identities'];
		var parent_selection = use_store_snapshot (parent_selection_store);
		var docs_filter = null;
		if (parent_relation !== null && docs_mode == 'all') {
			var parent_row = parent_selection ['row'];
			var parent_ids = parent_selection ['identities'];
			var parent_column = parent_relation ['parent_column'];
			var parent_value = null;
			if (parent_row) {
				var parent_value = parent_row [parent_column];
			}
			else if (len (parent_ids) && primary_keys.py_get (parent_relation ['parent']) == parent_column) {
				var parent_value = parent_ids [0];
			}
			var docs_filter = dict ([['kind', 'predicate'], ['column', parent_relation ['child_column']], ['operator', 'eq'], ['value', parent_value]]);
		}
		var __left0__ = use_selected_rows (text_store, text_primary_key, (docs_mode == 'all' ? null : (docs_mode == 'lead' ? selected_doc_ids.__getslice__ (0, 1, 1) : selected_doc_ids)), docs_filter);
		var text_data = __left0__ [0];
		var text_view = __left0__ [1];
		var __left0__ = use_selected_rows (spans_store, spans_primary_key, null, (filter_spans ? dict ([['kind', 'predicate'], ['column', spans_foreign_key], ['operator', 'in'], ['value', (function () {
			var __accu0__ = [];
			for (var row of text_data) {
				__accu0__.append (row [text_primary_key]);
			}
			return __accu0__;
		}) ()]]) : null));
		var span_data = __left0__ [0];
		var span_view = __left0__ [1];
		var selected_doc_rows_snapshot = dict ([['rows', (function () {
			var __accu0__ = [];
			for (var [idx, row] of enumerate (text_data)) {
				if (__in__ (row [text_primary_key], selected_doc_ids)) {
					__accu0__.append (idx);
				}
			}
			return __accu0__;
		}) ()]]);
		var selected_span_rows_snapshot = dict ([['rows', (function () {
			var __accu0__ = [];
			for (var [idx, row] of enumerate (span_data)) {
				if (__in__ (row [spans_primary_key], selected_span_rows_snapshot ['identities'])) {
					__accu0__.append (idx);
				}
			}
			return __accu0__;
		}) ()]]);
		var toolbar_snapshot = use_store_snapshot (toolbar_state);
		var __left0__ = use_state (dict ({}));
		var selected_ranges_by_doc = __left0__ [0];
		var set_selected_ranges_by_doc = __left0__ [1];
		var __left0__ = use_state ([]);
		var highlighted = __left0__ [0];
		var set_highlighted = __left0__ [1];
		var __left0__ = use_state (null);
		var active_doc_id = __left0__ [0];
		var set_active_doc_id = __left0__ [1];
		var text_ref = use_ref ();
		var text_refs_by_doc = use_ref (dict ({}));
		var pending_span_ids_ref = use_ref (null);
		var pending_scroll_top_doc_id_ref = use_ref (null);
		var pending_scroll_span_id_ref = use_ref (null);
		var suppress_next_empty_select_clear_ref = use_ref (false);
		var is_mounting_ref = use_ref (true);
		var last_non_empty_selected_ranges_by_doc_ref = use_ref (dict ({}));
		var selected_doc_indices = normalize_row_indices (selected_doc_rows_snapshot.py_get ('rows'), null, len (text_data));
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
			var span_doc_id = span_data [selected_span_idx].py_get (spans_foreign_key);
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
			else if (active_doc_id !== null) {
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
			if (on_select_text !== null) {
				var doc_idx = doc_idx_by_id.py_get (key);
				var doc_text = (doc_idx !== null ? text_data [doc_idx].py_get (text_key) || '' : '');
				var first = (ranges && len (ranges) > 0 ? ranges [0] : null);
				on_select_text (doc_id, list (ranges || []), (first ? doc_text.__getslice__ (first ['begin'], first ['end'], 1) : ''));
			}
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
			var rows = (function () {
				var __accu0__ = [];
				for (var idx of normalize_row_indices (selected_rows, null, len (span_data))) {
					__accu0__.append (span_data [idx]);
				}
				return __accu0__;
			}) ();
			selected_span_rows_store ['identities'] = (function () {
				var __accu0__ = [];
				for (var row of rows) {
					__accu0__.append (row [spans_primary_key]);
				}
				return __accu0__;
			}) ();
			selected_span_rows_store ['row'] = (len (rows) ? rows [0] : null);
		};
		var select_span_in_tables = function (span_id) {
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
			for (var other of handles.py_get (store_spans_key, [])) {
				if (other [1] == 'table' && other [0].current !== null) {
					other [0].current.select_row_id (span_id, 'relation');
				}
			}
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
			return normalize_row_indices (selected_span_rows_snapshot.py_get ('rows'), null, len (span_data));
		};
		var select_doc = async function (doc_row) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'doc_row': var doc_row = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			var doc_id = doc_row [text_primary_key];
			var table = py_next ((function () {
				var __accu0__ = [];
				for (var item of handles.py_get (store_text_key, [])) {
					if (item [1] == 'table' && item [0].current) {
						__accu0__.append (item [0]);
					}
				}
				return py_iter (__accu0__);
			}) (), null);
			if (table !== null) {
				await table.current.select_row_id (doc_id);
			}
			else {
				select_rows (store_text_key, [doc_row], handle, 'key');
			}
			set_active_doc_id (str (doc_id));
			if (on_change_text_id) {
				on_change_text_id (doc_id);
			}
		};
		var select_doc_at = async function (idx) {
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
			var source = text_view.rowSource;
			if (source === null || !(source.rowCount)) {
				return ;
			}
			var position = __mod__ (idx, source.rowCount);
			var rows = await source.getRows (position, position + 1, new AbortController ().signal);
			if (len (rows)) {
				await select_doc (rows [0]);
			}
		};
		var move_lead_doc = async function (delta) {
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
			var current_id = get_doc_id_by_idx (lead_doc_idx);
			var table = py_next ((function () {
				var __accu0__ = [];
				for (var item of handles.py_get (store_text_key, [])) {
					if (item [1] == 'table' && item [0].current) {
						__accu0__.append (item [0]);
					}
				}
				return py_iter (__accu0__);
			}) (), null);
			if (table !== null) {
				var row_id = await table.current.get_adjacent_row_id (current_id, delta);
				if (row_id !== null) {
					await table.current.select_row_id (row_id);
					set_active_doc_id (str (row_id));
					if (on_change_text_id) {
						on_change_text_id (row_id);
					}
				}
				return ;
			}
			var source = text_view.rowSource;
			var signal = new AbortController ().signal;
			var idx = (current_id !== null ? await source.findRowIndex (current_id, signal) : -(1));
			await select_doc_at (idx + delta);
		};
		var get_doc_idx = async function () {
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
			var doc_id = (docs_mode == 'lead' ? get_doc_id_by_idx (lead_doc_idx) : get_active_doc_id ());
			if (doc_id === null || text_view.rowSource === null) {
				return null;
			}
			return await text_view.rowSource.findRowIndex (doc_id, new AbortController ().signal);
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
		use_effect (scroll_to_top, [get_doc_id_by_idx (lead_doc_idx), docs_mode]);
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
			var span = py_next ((function () {
				var __accu0__ = [];
				for (var span of span_data) {
					if (str (span [spans_primary_key]) == str (pending_span_id)) {
						__accu0__.append (span);
					}
				}
				return py_iter (__accu0__);
			}) (), null);
			if (span === null) {
				return ;
			}
			var pending_doc_id = span.py_get (spans_foreign_key);
			if (pending_doc_id !== null && !__in__ (str (pending_doc_id), visible_doc_ids)) {
				return ;
			}
			var target_ref = resolve_text_ref_for_doc_id (pending_doc_id);
			if (target_ref === null || target_ref.current === null) {
				return ;
			}
			target_ref.current.scroll_to_span (pending_span_id);
			pending_scroll_span_id_ref.current = null;
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
			pending_scroll_span_id_ref.current = span_id;
			set_highlighted ([span_id]);
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
			var span_doc_id = span_data [idx].py_get (spans_foreign_key);
			if (span_doc_id !== null) {
				set_active_doc_id (str (span_doc_id));
			}
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
		var add_spans_for_doc = async function (target_doc_id, selected_ranges, span_values) {
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
			var inserted_rows = [];
			for (var selected_range of normalized_ranges) {
				var begin = selected_range ['begin'];
				var end = selected_range ['end'];
				var text_content = doc_text.__getslice__ (begin, end, 1);
				var span_id = (provided_span_id !== null ? ensure_unique_span_id (provided_span_id, existing_span_ids) : ''.join (crypto.randomUUID ().py_split ('-')));
				inserted_rows.append (dict ([['text', text_content], [label_key, text_content], [style_key, span_template.py_get (button_key) || default_style], [spans_primary_key, span_id], [begin_key, begin], [end_key, end], [button_key, span_template.py_get (button_key)], [spans_foreign_key, target_doc_id], ...(span_template).py_items()]));
				added_span_ids.append (span_id);
			}
			if (is_dataframe) {
				var columns = (function () {
					var __accu0__ = [];
					for (var column of spans_store.description.columns) {
						__accu0__.append (column ['name']);
					}
					return __accu0__;
				}) ();
				var inserted_rows = (function () {
					var __accu0__ = [];
					for (var row of inserted_rows) {
						__accu0__.append ((function () {
							var __accu1__ = [];
							for (var [key, value] of row.py_items ()) {
								if (__in__ (key, columns)) {
									__accu1__.append ([key, value]);
								}
							}
							return dict (__accu1__);
						}) ());
					}
					return __accu0__;
				}) ();
			}
			await edit_rows (spans_store, spans_primary_key, __kwargtrans__ ({insert: inserted_rows, read_only: read_only}));
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
		var add_spans_from_current_selection = async function (span_values) {
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
			return await add_spans_for_doc (target_doc_id, selected_ranges, span_values);
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
			return dict ([['scroll_to_span', scroll_to_span], ['set_doc_idx', select_doc_at], ['get_doc_idx', get_doc_idx], ['set_highlighted_spans', set_highlighted], ['set_selected_span', set_selected_span], ['get_active_doc_id', get_active_doc_id], ['get_selected_ranges', get_current_selected_ranges], ['get_selected_text', get_current_selected_text], ['add_span_from_selection', add_spans_from_current_selection]]);
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
		var update_selected_span = async function (key, value) {
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
			var selected_spans = (function () {
				var __accu0__ = [];
				for (var idx of selected_indices) {
					__accu0__.append (span_data [idx]);
				}
				return __accu0__;
			}) ();
			await edit_rows (spans_store, spans_primary_key, selected_spans, dict ([[key, value]]), __kwargtrans__ ({read_only: read_only}));
			if (selected_span_idx === null || selected_span_idx < 0) {
				set_selected_span_rows (selected_indices);
			}
		};
		var selected_ids = (function () {
			var __accu0__ = [];
			for (var idx of get_current_selected_span_indices ()) {
				if ((0 <= idx && idx < len (span_data))) {
					__accu0__.append (span_data [idx].py_get (spans_primary_key));
				}
			}
			return __accu0__;
		}) ();
		var hidden_ids = use_memo ((function __lambda__ () {
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
			return (function () {
				var __accu0__ = [];
				for (var span of span_data) {
					if (span.py_get ('hidden')) {
						__accu0__.append ([span [spans_primary_key], true]);
					}
				}
				return dict (__accu0__);
			}) ();
		}), [span_data]);
		var shown_hidden_ids = (function () {
			var __accu0__ = [];
			for (var span_id of highlighted) {
				if (__in__ (span_id, hidden_ids)) {
					__accu0__.append (span_id);
				}
			}
			return __accu0__;
		}) ();
		var compute_spans_by_doc = function () {
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
			var shown = (function () {
				var __accu0__ = [];
				for (var span_id of [...(selected_ids), ...(shown_hidden_ids)]) {
					__accu0__.append ([span_id, true]);
				}
				return dict (__accu0__);
			}) ();
			var selected = (function () {
				var __accu0__ = [];
				for (var span_id of selected_ids) {
					__accu0__.append ([span_id, true]);
				}
				return dict (__accu0__);
			}) ();
			var spans_by_doc = (function () {
				var __accu0__ = [];
				for (var doc_id of visible_doc_ids) {
					__accu0__.append ([doc_id, []]);
				}
				return dict (__accu0__);
			}) ();
			for (var span of span_data) {
				var span_id = span [spans_primary_key];
				if (span.py_get ('hidden') && !__in__ (span_id, shown)) {
					continue;
				}
				var doc_ids = (__in__ (spans_foreign_key, span) ? [str (span [spans_foreign_key])] : list (spans_by_doc.py_keys ()));
				for (var doc_id of doc_ids) {
					if (__in__ (doc_id, spans_by_doc)) {
						spans_by_doc [doc_id].append (dict ([['selected', __in__ (span_id, selected)], ...(span).py_items(), [style_key, span.py_get (style_key) || (__in__ (span.py_get (button_key), labels) ? span.py_get (button_key) : default_style)]]));
					}
				}
			}
			return spans_by_doc;
		};
		var spans_by_doc = use_memo (compute_spans_by_doc, [span_data, str (visible_doc_ids), str (selected_ids), str (shown_hidden_ids)]);
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
			var last_span_idx = py_next ((function () {
				var __accu0__ = [];
				for (var [i, span] of enumerate (span_data)) {
					if (span [spans_primary_key] == span_ids [len (span_ids) - 1]) {
						__accu0__.append (i);
					}
				}
				return py_iter (__accu0__);
			}) ());
			set_selected_span_rows ([last_span_idx]);
			select_span_in_tables (span_ids [len (span_ids) - 1]);
			if (on_add_span) {
				on_add_span (span_ids);
			}
		};
		use_effect (flush_pending_span_scroll);
		var can_edit_spans = !(read_only) && span_view.description && span_view.description.capabilities.edit;
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
			if (!(can_edit_spans)) {
				return ;
			}
			await add_spans_from_current_selection (dict ([[button_key, label]]));
		});
		var on_delete = use_event_callback (async function () {
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
			if (!(can_edit_spans)) {
				return ;
			}
			var selected_indices = get_current_selected_span_indices ();
			if (selected_indices) {
				var selected_spans = (function () {
					var __accu0__ = [];
					for (var idx of selected_indices) {
						__accu0__.append (span_data [idx]);
					}
					return __accu0__;
				}) ();
				await edit_rows (spans_store, spans_primary_key, selected_spans, __kwargtrans__ ({remove: true, read_only: read_only}));
				set_selected_span_rows ([]);
				return ;
			}
			var target_doc_id = get_active_doc_id ();
			var selected_ranges = get_doc_selected_ranges (target_doc_id);
			var to_remove = [];
			for (var [idx, span] of enumerate (span_data)) {
				if (__in__ (spans_foreign_key, span) && str (span.py_get (spans_foreign_key)) != str (target_doc_id)) {
					continue;
				}
				for (var r of selected_ranges) {
					if (!(span [end_key] <= r ['begin'] || r ['end'] <= span [begin_key])) {
						to_remove.append (idx);
						break;
					}
				}
			}
			var removed = (function () {
				var __accu0__ = [];
				for (var idx of to_remove) {
					__accu0__.append (span_data [idx]);
				}
				return __accu0__;
			}) ();
			await edit_rows (spans_store, spans_primary_key, removed, __kwargtrans__ ({remove: true, read_only: read_only}));
			if (to_remove) {
				set_doc_selected_ranges (target_doc_id, []);
			}
		});
		var on_key_press = use_event_callback (async function (k, modkeys, selection) {
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
			if (docs_mode == 'lead' && __in__ (k, new set (['ArrowRight', 'ArrowLeft']))) {
				await move_lead_doc ((k == 'ArrowRight' ? 1 : -(1)));
				return ;
			}
			if (__in__ (k, new set (['ArrowRight', 'ArrowLeft']))) {
				if (len (visible_doc_ids) > 0) {
					var current_doc_id = get_active_doc_id ();
					if (!__in__ (current_doc_id, set (visible_doc_ids))) {
						set_active_doc_id (visible_doc_ids [0]);
					}
					else {
						var current_pos = visible_doc_ids.index (current_doc_id) + (k == 'ArrowRight' ? 1 : -(1));
						set_active_doc_id (visible_doc_ids [__mod__ (current_pos, len (visible_doc_ids))]);
					}
				}
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
		var connect_toolbar = function () {
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
			toolbar_actions.current = dict ([['add', handle_add_span], ['delete', on_delete], ['update', update_selected_span], ['move', toggle_move_mode]]);
			var disconnect = function () {
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
				toolbar_actions.current = null;
			};
			return disconnect;
		};
		use_effect (connect_toolbar);
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
				for (var [i, span] of enumerate (span_data)) {
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
			var next_selected_rows = (shift_pressed ? normalize_row_indices ([...(current_selected_rows), clicked_idx], clicked_idx, len (span_data)) : [clicked_idx]);
			suppress_next_empty_select_clear_ref.current = true;
			set_selected_span_rows (next_selected_rows);
			if (!(shift_pressed)) {
				select_span_in_tables (span_id);
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
		var handle_mouse_select = async function (ranges, modkeys, doc) {
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
			var selected_span_doc_id = (selected_span_idx !== null && (0 <= selected_span_idx && selected_span_idx < len (span_data)) ? span_data [selected_span_idx].py_get (spans_foreign_key) || doc_id : doc_id);
			if (move_mode && selected_span_idx !== null && (0 <= selected_span_idx && selected_span_idx < len (span_data)) && selected_span_doc_id == doc_id && len (ranges) > 0) {
				var r = ranges [0];
				var py_values = dict ([[begin_key, r ['begin']], [end_key, r ['end']], ['text', doc [text_key].__getslice__ (r ['begin'], r ['end'], 1)]]);
				if (is_dataframe && !__in__ ('text', (function () {
					var __accu0__ = [];
					for (var column of spans_store.description.columns) {
						__accu0__.append (column ['name']);
					}
					return __accu0__;
				}) ())) {
					py_values.py_pop ('text');
				}
				var selected_spans = [span_data [selected_span_idx]];
				await edit_rows (spans_store, spans_primary_key, selected_spans, py_values, __kwargtrans__ ({read_only: read_only}));
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
		if (len (text_data) == 0 && (text_view.error || span_view.error || text_view.loading || span_view.loading)) {
			var error = text_view.error || span_view.error;
			return div (error || LoadingStatus (__kwargtrans__ ({label: text_view.loading || span_view.loading})), __kwargtrans__ ({role: (error ? 'alert' : 'status'), class_name: (error ? 'metanno-error' : null), style: dict ([['margin', '8px']])}));
		}
		if (len (visible_doc_indices) == 0) {
			return [div ('No document selected', __kwargtrans__ ({key: 'no-document-selected', style: dict ([['padding', '8px']])}))];
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
			var annotated_text = AnnotatedText (__kwargtrans__ ({text: doc [text_key], spans: spans_by_doc.py_get (doc_id_str, []), highlighted: highlighted, annotation_styles: labels, mouse_selection: get_doc_selected_ranges ((doc_id !== null ? str (doc_id) : null)), primary_key: spans_primary_key, begin_key: begin_key, end_key: end_key, style_key: style_key, label_key: label_key, label_formatter: label_formatter, on_key_press: (function(_default_doc) { return ((function __lambda__ (k, modkeys, selection, d) {
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
			}));})(doc), handle: doc_text_ref, style: (docs_mode == 'lead' ? dict ([['flex', 1], ['minHeight', 0], ['overflow', 'scroll'], ...(style || dict ({})).py_items()]) : dict ([['minHeight', '180px'], ['overflow', 'visible'], ...(style || dict ({})).py_items()]))}));
			var wrapper_key = (docs_mode == 'lead' ? 'doc-lead' : '{}:doc:{}:{}'.format (text_context_key, doc_idx, doc_id_str));
			var wrapped_component = container_renderer (doc, annotated_text, toolbar_view, __kwargtrans__ ({key: wrapper_key, note_idx: note_idx, note_count: visible_doc_count}));
			rendered_docs.append (wrapped_component);
		}
		return rendered_docs;
	};
	return TextWidget;
};var pret_factory_df353f18520944908a84e05590ee89d3_Any_82 = function () {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_Dict_83 = function () {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_List_84 = function () {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_Optional_85 = function () {
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
};var pret_factory_df353f18520944908a84e05590ee89d3___init___86 = function () {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_Sequence_87 = function () {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_get_first_selected_row_idx_88 = function (extract_row_indices) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'extract_row_indices': var extract_row_indices = __allkwargs0__ [__attrib0__]; break;
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
		var extracted = extract_row_indices (selected_rows);
		if (len (extracted) > 0) {
			return extracted [0];
		}
		return null;
	};
	return get_first_selected_row_idx;
};var pret_factory_df353f18520944908a84e05590ee89d3_normalize_row_indices_89 = function (extract_row_indices) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'extract_row_indices': var extract_row_indices = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var normalize_row_indices = function (selected_rows, row_idx, row_count) {
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
		var source = list (selected_rows || []);
		if (row_idx !== null) {
			var source = [row_idx, ...(source)];
		}
		return sorted ((function () {
			var __accu0__ = [];
			for (var idx of extract_row_indices (source)) {
				if (idx < row_count) {
					__accu0__.append (idx);
				}
			}
			return __accu0__;
		}) ());
	};
	return normalize_row_indices;
};var pret_factory_df353f18520944908a84e05590ee89d3_use_selected_rows_91 = function (use_rows, use_view_selected_rows) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'use_rows': var use_rows = __allkwargs0__ [__attrib0__]; break;
					case 'use_view_selected_rows': var use_view_selected_rows = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var use_selected_rows = function (data, primary_key, identities, filter) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'data': var data = __allkwargs0__ [__attrib0__]; break;
						case 'primary_key': var primary_key = __allkwargs0__ [__attrib0__]; break;
						case 'identities': var identities = __allkwargs0__ [__attrib0__]; break;
						case 'filter': var filter = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof identities == 'undefined' || (identities != null && identities.hasOwnProperty ("__kwargtrans__"))) {;
			var identities = null;
		};
		if (typeof filter == 'undefined' || (filter != null && filter.hasOwnProperty ("__kwargtrans__"))) {;
			var filter = null;
		};
		return use_view_selected_rows (data, use_rows (data, primary_key, null, filter), primary_key, identities, filter);
	};
	return use_selected_rows;
};var pret_factory_df353f18520944908a84e05590ee89d3_default_container_renderer_93 = function (div) {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_ToolbarWidget_94 = function (SpanToolbar, field_state, get_parent_selection, use_effect, use_selected_rows, use_store_snapshot, button_field_name, button_key, data_store, deep_get_store, empty_store, labels, local_spans_store, on_mount, primary_keys, read_only, selected_rows_by_store, selected_span_rows_store, span_fields, spans_path_parts, spans_primary_key, toolbar_actions, toolbar_state) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'SpanToolbar': var SpanToolbar = __allkwargs0__ [__attrib0__]; break;
					case 'field_state': var field_state = __allkwargs0__ [__attrib0__]; break;
					case 'get_parent_selection': var get_parent_selection = __allkwargs0__ [__attrib0__]; break;
					case 'use_effect': var use_effect = __allkwargs0__ [__attrib0__]; break;
					case 'use_selected_rows': var use_selected_rows = __allkwargs0__ [__attrib0__]; break;
					case 'use_store_snapshot': var use_store_snapshot = __allkwargs0__ [__attrib0__]; break;
					case 'button_field_name': var button_field_name = __allkwargs0__ [__attrib0__]; break;
					case 'button_key': var button_key = __allkwargs0__ [__attrib0__]; break;
					case 'data_store': var data_store = __allkwargs0__ [__attrib0__]; break;
					case 'deep_get_store': var deep_get_store = __allkwargs0__ [__attrib0__]; break;
					case 'empty_store': var empty_store = __allkwargs0__ [__attrib0__]; break;
					case 'labels': var labels = __allkwargs0__ [__attrib0__]; break;
					case 'local_spans_store': var local_spans_store = __allkwargs0__ [__attrib0__]; break;
					case 'on_mount': var on_mount = __allkwargs0__ [__attrib0__]; break;
					case 'primary_keys': var primary_keys = __allkwargs0__ [__attrib0__]; break;
					case 'read_only': var read_only = __allkwargs0__ [__attrib0__]; break;
					case 'selected_rows_by_store': var selected_rows_by_store = __allkwargs0__ [__attrib0__]; break;
					case 'selected_span_rows_store': var selected_span_rows_store = __allkwargs0__ [__attrib0__]; break;
					case 'span_fields': var span_fields = __allkwargs0__ [__attrib0__]; break;
					case 'spans_path_parts': var spans_path_parts = __allkwargs0__ [__attrib0__]; break;
					case 'spans_primary_key': var spans_primary_key = __allkwargs0__ [__attrib0__]; break;
					case 'toolbar_actions': var toolbar_actions = __allkwargs0__ [__attrib0__]; break;
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
		var parent_ids = (spans_path_parts !== null ? get_parent_selection (spans_path_parts, selected_rows_by_store, use_store_snapshot) : dict ({}));
		var toolbar_spans_store = (spans_path_parts !== null ? deep_get_store (data_store, spans_path_parts, parent_ids, primary_keys) || empty_store : local_spans_store);
		if (on_mount !== null) {
			use_effect (on_mount, []);
		}
		var __left0__ = use_selected_rows (toolbar_spans_store, spans_primary_key, selected_span_rows_snapshot ['identities']);
		var selected_spans = __left0__ [0];
		var toolbar_view = __left0__ [1];
		var selected_span = (len (selected_spans) > 0 ? selected_spans [0] : null);
		var field_state_by_key = (function () {
			var __accu0__ = [];
			for (var col of span_fields) {
				__accu0__.append ([col ['key'], field_state (selected_spans, col ['key'])]);
			}
			return dict (__accu0__);
		}) ();
		if (read_only || !(toolbar_view.description) || !(toolbar_view.description.capabilities.edit)) {
			return null;
		}
		return SpanToolbar (__kwargtrans__ ({labels: labels, button_key: button_key, button_field_name: button_field_name, on_add_span_click: (function __lambda__ (label) {
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
			return toolbar_actions.current ['add'] (label);
		}), on_delete: (function __lambda__ (event) {
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
			return toolbar_actions.current ['delete'] ();
		}), selected_span: selected_span, selected_count: len (selected_spans), on_update_span: (function __lambda__ (key, value) {
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
			return toolbar_actions.current ['update'] (key, value);
		}), span_fields: span_fields, field_state_by_key: field_state_by_key, move_mode: toolbar_snapshot.py_get ('move_mode', false), on_toggle_move: (function __lambda__ (event) {
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
			return toolbar_actions.current ['move'] ();
		}), key: str ((function () {
			var __accu0__ = [];
			for (var span of selected_spans) {
				__accu0__.append (span [spans_primary_key]);
			}
			return __accu0__;
		}) ())}));
	};
	return ToolbarWidget;
};var pret_factory_df353f18520944908a84e05590ee89d3_SpanToolbar_95 = function (Button, ButtonGroup, FormControl, FormLabel, Stack, render_field) {
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
				}
			}
		}
	}
	else {
	}
	var SpanToolbar = function (labels, button_key, button_field_name, on_add_span_click, on_delete, selected_span, selected_count, on_update_span, span_fields, field_state_by_key, move_mode, on_toggle_move) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'labels': var labels = __allkwargs0__ [__attrib0__]; break;
						case 'button_key': var button_key = __allkwargs0__ [__attrib0__]; break;
						case 'button_field_name': var button_field_name = __allkwargs0__ [__attrib0__]; break;
						case 'on_add_span_click': var on_add_span_click = __allkwargs0__ [__attrib0__]; break;
						case 'on_delete': var on_delete = __allkwargs0__ [__attrib0__]; break;
						case 'selected_span': var selected_span = __allkwargs0__ [__attrib0__]; break;
						case 'selected_count': var selected_count = __allkwargs0__ [__attrib0__]; break;
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
		if (typeof selected_count == 'undefined' || (selected_count != null && selected_count.hasOwnProperty ("__kwargtrans__"))) {;
			var selected_count = 0;
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
			var sx = dict ([['textTransform', 'none']]);
			if (!(selected_span) || !(button_is_mixed) && selected_span.py_get (button_key) == label) {
				var sx = dict ([...(sx).py_items(), ['backgroundColor', cfg ['color']], ['color', 'black'], ['whiteSpace', 'nowrap']]);
			}
			var handle_button_click = (function(label) { return (function (event, lab) {
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
			btns.append (ButtonGroup (Button (label, __kwargtrans__ ({on_click: handle_button_click, size: 'sm', variant: 'soft', sx: sx})), (cfg.py_get ('shortcut') ? Button (cfg ['shortcut'], __kwargtrans__ ({size: 'sm', variant: 'soft', sx: dict ([...(sx).py_items(), ['px', '6px'], ['minWidth', 0], ['fontSize', 'xs'], ['opacity', 0.8]])})) : null), __kwargtrans__ ({sx: dict ([['display', 'inline-flex'], ['alignItems', 'flex-end']])})));
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
		return Stack (FormControl (FormLabel (button_field_name), Stack (...(btns), Button ((selected_count ? 'Delete {} selected ⌫'.format (selected_count) : 'Delete ⌫'), __kwargtrans__ ({color: 'danger', size: 'sm', on_click: on_delete, sx: dict ([['p', '0 8px'], ['textTransform', 'none']])})), (selected_span ? Button ('Move', __kwargtrans__ ({size: 'sm', variant: (move_mode ? 'solid' : 'soft'), color: (move_mode ? 'primary' : 'neutral'), on_click: on_toggle_move, sx: dict ([['p', '0 8px'], ['textTransform', 'none']])})) : null), __kwargtrans__ ({direction: 'row', spacing: 1, use_flex_gap: true, sx: dict ([['alignItems', 'flex-end'], ['flexWrap', 'wrap']])}))), (span_inputs ? Stack (...(span_inputs), __kwargtrans__ ({direction: 'row', spacing: 1, use_flex_gap: true, sx: dict ([['alignItems', 'flex-end'], ['flex', 1]])})) : null), __kwargtrans__ ({direction: 'row', spacing: 1, use_flex_gap: true, sx: dict ([['alignItems', 'flex-end'], ['flexWrap', 'wrap']])}));
	};
	return SpanToolbar;
};var pret_factory_df353f18520944908a84e05590ee89d3_render_field_96 = function (render_boolean_field, render_select_field, render_text_field) {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_render_boolean_field_97 = function (Checkbox, FormControl, FormLabel, make_field_label) {
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
		var handle_change = function (event, checked) {
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
		return FormControl (FormLabel (make_field_label (label, is_mixed), __kwargtrans__ ({sx: dict ([['fontSize', 'inherit'], ['fontWeight', 400], ['mb', 0.5]])})), Checkbox (__kwargtrans__ ({checked: (is_mixed ? false : bool (value)), indeterminate: is_mixed, on_change: handle_change, disabled: !(editable), size: 'md', sx: dict ([['alignItems', 'center'], ['fontSize', 'inherit']])})), __kwargtrans__ ({sx: dict ([['minWidth', min_input_width], ['alignSelf', align_self || 'flex-start'], ['gridArea', key]])}));
	};
	return render_boolean_field;
};var pret_factory_df353f18520944908a84e05590ee89d3_make_field_label_98 = function (MIXED_VALUES_LABEL, div) {
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
};var pret_factory_df353f18520944908a84e05590ee89d3_render_select_field_99 = function (Autocomplete, FormControl, FormLabel, MIXED_VALUES_LABEL, Option, Radio, RadioGroup, Select, make_field_label) {
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
		var select_options = list (options);
		if (len (select_options) == 0) {
			return ;
		}
		if (kind == 'autocomplete') {
			if (all_label !== null) {
				var select_options = [all_label, ...(select_options)];
				var value = (__in__ (value, tuple ([null, ''])) ? all_label : value);
			}
			var handle_change = function (event, val) {
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
			return FormControl (FormLabel (field_label), Autocomplete (__kwargtrans__ ({options: select_options, value: (is_mixed ? null : value), on_change: handle_change, disabled: !(editable), placeholder: (is_mixed ? MIXED_VALUES_LABEL : null), size: 'sm', sx: dict ([['flex', 1]])})), __kwargtrans__ ({sx: dict ([['minWidth', min_input_width || 0], ['width', 'fit-content'], ['alignSelf', align_self], ['gridArea', key], ['flex', 1]])}));
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
};var pret_factory_df353f18520944908a84e05590ee89d3_render_text_field_100 = function (TextField) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'TextField': var TextField = __allkwargs0__ [__attrib0__]; break;
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
		return TextField (__kwargtrans__ ({key_name: key, label: label, value: value, editable: editable, on_change: on_field_change, is_mixed: is_mixed, style: dict ([['minWidth', min_input_width], ['alignSelf', align_self], ['gridArea', key]])}));
	};
	return render_text_field;
};var pret_factory_df353f18520944908a84e05590ee89d3_TextField_101 = function (FormControl, FormLabel, MIXED_VALUES_LABEL, Textarea, div, make_field_label, use_ref, use_state) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'FormControl': var FormControl = __allkwargs0__ [__attrib0__]; break;
					case 'FormLabel': var FormLabel = __allkwargs0__ [__attrib0__]; break;
					case 'MIXED_VALUES_LABEL': var MIXED_VALUES_LABEL = __allkwargs0__ [__attrib0__]; break;
					case 'Textarea': var Textarea = __allkwargs0__ [__attrib0__]; break;
					case 'div': var div = __allkwargs0__ [__attrib0__]; break;
					case 'make_field_label': var make_field_label = __allkwargs0__ [__attrib0__]; break;
					case 'use_ref': var use_ref = __allkwargs0__ [__attrib0__]; break;
					case 'use_state': var use_state = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var TextField = function (key_name, label, value, editable, on_change, is_mixed, style) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'key_name': var key_name = __allkwargs0__ [__attrib0__]; break;
						case 'label': var label = __allkwargs0__ [__attrib0__]; break;
						case 'value': var value = __allkwargs0__ [__attrib0__]; break;
						case 'editable': var editable = __allkwargs0__ [__attrib0__]; break;
						case 'on_change': var on_change = __allkwargs0__ [__attrib0__]; break;
						case 'is_mixed': var is_mixed = __allkwargs0__ [__attrib0__]; break;
						case 'style': var style = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		var __left0__ = use_state (null);
		var draft = __left0__ [0];
		var set_draft = __left0__ [1];
		var __left0__ = use_state (null);
		var error = __left0__ [0];
		var set_error = __left0__ [1];
		var pending = use_ref (false);
		var commit = async function (event) {
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
			if (draft === null || pending.current) {
				return ;
			}
			pending.current = true;
			try {
				await on_change (key_name, draft);
				set_draft (null);
				set_error (null);
			}
			catch (__except0__) {
				if (Error.isError(__except0__)) { __except0__ = Exception((__except0__).toString(), __kwargtrans__({error: __except0__})); }
				if (isinstance (__except0__, BaseException)) {
					var reason = __except0__;
					set_error (str (reason));
				}
				else {
					throw __except0__;
				}
			}
			finally {
				pending.current = false;
			}
		};
		var handle_key = function (event) {
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
			if (event.key == 'Escape') {
				event.preventDefault ();
				set_draft (null);
				set_error (null);
			}
			else if (event.key == 'Enter' && !(event.shiftKey)) {
				event.preventDefault ();
				commit ();
			}
		};
		return FormControl (FormLabel (make_field_label (label, is_mixed), __kwargtrans__ ({sx: dict ([['fontSize', 'inherit'], ['fontWeight', 400], ['mb', 0.5]])})), Textarea (__kwargtrans__ ({value: (draft !== null ? draft : (is_mixed || value === null ? '' : (isinstance (value, str) ? value : JSON.stringify (value)))), on_change: (function __lambda__ (event) {
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
			return set_draft (event.target.value);
		}), on_blur: commit, on_key_down: handle_key, tab_index: 0, read_only: !(editable), placeholder: (is_mixed ? MIXED_VALUES_LABEL : null), min_rows: 1, max_rows: 12, size: 'sm', sx: dict ([['fontSize', 'inherit'], ...((editable ? dict ({}) : dict ([['background', 'var(--joy-palette-background-level1)'], ['boxShadow', 'none'], ['--Textarea-focusedThickness', '0px']]))).py_items()])})), (error ? div (error, __kwargtrans__ ({role: 'alert', class_name: 'metanno-error'})) : null), __kwargtrans__ ({sx: dict ([...(style || dict ({})).py_items(), ['gap', 0], ['flex', '0 0 auto'], ['& > .MuiInput-formControl', dict ([['mt', 0]])]])}));
	};
	return TextField;
};var pret_factory_df353f18520944908a84e05590ee89d3_field_state_102 = function () {
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
	var field_state = function (rows, key) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'rows': var rows = __allkwargs0__ [__attrib0__]; break;
						case 'key': var key = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (!(len (rows))) {
			return dict ([['value', null], ['is_mixed', false]]);
		}
		var value = rows [0].py_get (key);
		return dict ([['value', value], ['is_mixed', any ((function () {
			var __accu0__ = [];
			for (var row of rows.__getslice__ (1, null, 1)) {
				__accu0__.append (row.py_get (key) != value);
			}
			return py_iter (__accu0__);
		}) ())]]);
	};
	return field_state;
};var pret_factory_df353f18520944908a84e05590ee89d3_SelectedFieldView_103 = function (get_parent_selection, use_effect, use_selected_rows, use_store_snapshot, data_store, deep_get_store, empty_store, fallback, on_mount, path_parts, primary_key, primary_keys, selected_rows_by_store, selected_rows_store, shown_key) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'get_parent_selection': var get_parent_selection = __allkwargs0__ [__attrib0__]; break;
					case 'use_effect': var use_effect = __allkwargs0__ [__attrib0__]; break;
					case 'use_selected_rows': var use_selected_rows = __allkwargs0__ [__attrib0__]; break;
					case 'use_store_snapshot': var use_store_snapshot = __allkwargs0__ [__attrib0__]; break;
					case 'data_store': var data_store = __allkwargs0__ [__attrib0__]; break;
					case 'deep_get_store': var deep_get_store = __allkwargs0__ [__attrib0__]; break;
					case 'empty_store': var empty_store = __allkwargs0__ [__attrib0__]; break;
					case 'fallback': var fallback = __allkwargs0__ [__attrib0__]; break;
					case 'on_mount': var on_mount = __allkwargs0__ [__attrib0__]; break;
					case 'path_parts': var path_parts = __allkwargs0__ [__attrib0__]; break;
					case 'primary_key': var primary_key = __allkwargs0__ [__attrib0__]; break;
					case 'primary_keys': var primary_keys = __allkwargs0__ [__attrib0__]; break;
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
		if (on_mount !== null) {
			use_effect (on_mount, []);
		}
		var parent_ids = get_parent_selection (path_parts, selected_rows_by_store, use_store_snapshot);
		var data = deep_get_store (data_store, path_parts, parent_ids, primary_keys) || empty_store;
		var selected = use_store_snapshot (selected_rows_store);
		var __left0__ = use_selected_rows (data, primary_key, selected ['identities'].__getslice__ (0, 1, 1));
		var rows = __left0__ [0];
		var view = __left0__ [1];
		return view.error || view.loading || (len (rows) ? rows [0].py_get (shown_key, fallback) : fallback);
	};
	return SelectedFieldView;
};var pret_factory_df353f18520944908a84e05590ee89d3_FormWidget_104 = function (Any, Button, Dict, ErrorBanner, LoadingStatus, Stack, StoreWidget, div, edit_rows, field_state, get_parent_selection, render_field, use_effect, use_event_callback, use_imperative_handle, use_selected_rows, use_store_snapshot, add_navigation_buttons, allow_delete, data_store, deep_get_store, empty_store, fields, handle, handles, min_input_width, on_mount, path_parts, primary_key, primary_keys, read_only, select_rows, selected_rows_by_store, selected_rows_store, store_key, style) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'Any': var Any = __allkwargs0__ [__attrib0__]; break;
					case 'Button': var Button = __allkwargs0__ [__attrib0__]; break;
					case 'Dict': var Dict = __allkwargs0__ [__attrib0__]; break;
					case 'ErrorBanner': var ErrorBanner = __allkwargs0__ [__attrib0__]; break;
					case 'LoadingStatus': var LoadingStatus = __allkwargs0__ [__attrib0__]; break;
					case 'Stack': var Stack = __allkwargs0__ [__attrib0__]; break;
					case 'StoreWidget': var StoreWidget = __allkwargs0__ [__attrib0__]; break;
					case 'div': var div = __allkwargs0__ [__attrib0__]; break;
					case 'edit_rows': var edit_rows = __allkwargs0__ [__attrib0__]; break;
					case 'field_state': var field_state = __allkwargs0__ [__attrib0__]; break;
					case 'get_parent_selection': var get_parent_selection = __allkwargs0__ [__attrib0__]; break;
					case 'render_field': var render_field = __allkwargs0__ [__attrib0__]; break;
					case 'use_effect': var use_effect = __allkwargs0__ [__attrib0__]; break;
					case 'use_event_callback': var use_event_callback = __allkwargs0__ [__attrib0__]; break;
					case 'use_imperative_handle': var use_imperative_handle = __allkwargs0__ [__attrib0__]; break;
					case 'use_selected_rows': var use_selected_rows = __allkwargs0__ [__attrib0__]; break;
					case 'use_store_snapshot': var use_store_snapshot = __allkwargs0__ [__attrib0__]; break;
					case 'add_navigation_buttons': var add_navigation_buttons = __allkwargs0__ [__attrib0__]; break;
					case 'allow_delete': var allow_delete = __allkwargs0__ [__attrib0__]; break;
					case 'data_store': var data_store = __allkwargs0__ [__attrib0__]; break;
					case 'deep_get_store': var deep_get_store = __allkwargs0__ [__attrib0__]; break;
					case 'empty_store': var empty_store = __allkwargs0__ [__attrib0__]; break;
					case 'fields': var fields = __allkwargs0__ [__attrib0__]; break;
					case 'handle': var handle = __allkwargs0__ [__attrib0__]; break;
					case 'handles': var handles = __allkwargs0__ [__attrib0__]; break;
					case 'min_input_width': var min_input_width = __allkwargs0__ [__attrib0__]; break;
					case 'on_mount': var on_mount = __allkwargs0__ [__attrib0__]; break;
					case 'path_parts': var path_parts = __allkwargs0__ [__attrib0__]; break;
					case 'primary_key': var primary_key = __allkwargs0__ [__attrib0__]; break;
					case 'primary_keys': var primary_keys = __allkwargs0__ [__attrib0__]; break;
					case 'read_only': var read_only = __allkwargs0__ [__attrib0__]; break;
					case 'select_rows': var select_rows = __allkwargs0__ [__attrib0__]; break;
					case 'selected_rows_by_store': var selected_rows_by_store = __allkwargs0__ [__attrib0__]; break;
					case 'selected_rows_store': var selected_rows_store = __allkwargs0__ [__attrib0__]; break;
					case 'store_key': var store_key = __allkwargs0__ [__attrib0__]; break;
					case 'style': var style = __allkwargs0__ [__attrib0__]; break;
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
		var parent_ids = get_parent_selection (path_parts, selected_rows_by_store, use_store_snapshot);
		var data = deep_get_store (data_store, path_parts, parent_ids, primary_keys) || empty_store;
		if (on_mount !== null) {
			use_effect (on_mount, []);
		}
		var selected_rows_snapshot = use_store_snapshot (selected_rows_store);
		var __left0__ = use_selected_rows (data, primary_key, selected_rows_snapshot ['identities']);
		var rows = __left0__ [0];
		var view = __left0__ [1];
		var current_row = (len (rows) ? rows [0] : null);
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
		var select_row_at = async function (idx) {
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
			var source = view.rowSource;
			if (source === null || !(source.rowCount)) {
				return ;
			}
			var position = __mod__ (idx, source.rowCount);
			var rows = await source.getRows (position, position + 1, new AbortController ().signal);
			var row = rows [0];
			var table_handle = get_table_handle ();
			if (table_handle !== null) {
				await table_handle.current.select_row_id (row [primary_key]);
			}
			else {
				select_rows (store_key, [row], handle, 'key');
			}
		};
		var nav = async function (delta) {
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
			if (current_row === null) {
				return ;
			}
			var table_handle = get_table_handle ();
			if (table_handle !== null) {
				var row_id = await table_handle.current.get_adjacent_row_id (current_row [primary_key], delta);
				if (row_id !== null) {
					await table_handle.current.select_row_id (row_id);
				}
				return ;
			}
			var idx = await view.rowSource.findRowIndex (current_row [primary_key], new AbortController ().signal);
			await select_row_at (idx + delta);
		};
		var get_row_idx = async function () {
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
			if (current_row === null || view.rowSource === null) {
				return null;
			}
			return await view.rowSource.findRowIndex (current_row [primary_key], new AbortController ().signal);
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
			return dict ([['get_row_idx', get_row_idx], ['set_row_idx', select_row_at]]);
		}));
		var handle_field_change = use_event_callback (async function (key, value) {
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
			await edit_rows (data, primary_key, rows, dict ([[key, value]]), __kwargtrans__ ({read_only: read_only}));
		});
		var delete_selected = use_event_callback (async function (event) {
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
			await edit_rows (data, primary_key, rows, __kwargtrans__ ({remove: true, read_only: read_only}));
			select_rows (store_key, [], handle, 'key');
		});
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
			var state = field_state (rows, field ['key']);
			return render_field (current_row, dict ([...(field).py_items(), ['editable', bool (!(read_only) && field.py_get ('editable') && view.description && view.description.capabilities.edit)]]), handle_field_change, min_input_width, __kwargtrans__ ({value: state ['value'], is_mixed: state ['is_mixed'], use_explicit_value: true}));
		};
		if (!(current_row)) {
			return div ((view.error || view.loading ? view.error || LoadingStatus (__kwargtrans__ ({label: view.loading})) : 'No data selected'), __kwargtrans__ ({style: style}));
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
		return StoreWidget (__kwargtrans__ ({store: data_store, read_only: read_only, content: Stack (navigation_controls, (view.error ? ErrorBanner (__kwargtrans__ ({error: view.error})) : null), ...((function () {
			var __accu0__ = [];
			for (var f of (len (fields) ? fields : (function () {
				var __accu1__ = [];
				for (var c of view.description.columns) {
					__accu1__.append (dict ([['key', c ['name']], ['name', c ['name']], ['kind', (__in__ ('bool', c.type.lower ()) ? 'boolean' : 'text')], ['editable', true]]));
				}
				return __accu1__;
			}) ())) {
				__accu0__.append (render_form_field (f));
			}
			return __accu0__;
		}) ()), (allow_delete && !(read_only) && view.description.capabilities.edit ? Button ('Delete {} selected'.format (len (rows)), __kwargtrans__ ({on_click: delete_selected, color: 'danger', disabled: !(rows)})) : null), __kwargtrans__ ({direction: 'column', spacing: 1, use_flex_gap: true, style: style, key: str ((function () {
			var __accu0__ = [];
			for (var row of rows) {
				__accu0__.append (row [primary_key]);
			}
			return __accu0__;
		}) ())}))}));
	};
	return FormWidget;
};var pret_factory_df353f18520944908a84e05590ee89d3_StatusBar_105 = function (Box, ErrorBanner, Typography, use_connection_status, use_store_history) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'Box': var Box = __allkwargs0__ [__attrib0__]; break;
					case 'ErrorBanner': var ErrorBanner = __allkwargs0__ [__attrib0__]; break;
					case 'Typography': var Typography = __allkwargs0__ [__attrib0__]; break;
					case 'use_connection_status': var use_connection_status = __allkwargs0__ [__attrib0__]; break;
					case 'use_store_history': var use_store_history = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var StatusBar = function (store, synced, show_connection) {
		if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__--];
				for (var __attrib0__ in __allkwargs0__) {
					switch (__attrib0__) {
						case 'store': var store = __allkwargs0__ [__attrib0__]; break;
						case 'synced': var synced = __allkwargs0__ [__attrib0__]; break;
						case 'show_connection': var show_connection = __allkwargs0__ [__attrib0__]; break;
					}
				}
			}
		}
		else {
		}
		if (typeof show_connection == 'undefined' || (show_connection != null && show_connection.hasOwnProperty ("__kwargtrans__"))) {;
			var show_connection = true;
		};
		var error = use_store_history (store).error;
		var status = use_connection_status ();
		if (!(show_connection)) {
			return ErrorBanner (__kwargtrans__ ({error: error}));
		}
		if (status ['connected']) {
			var __left0__ = tuple (['Connected', 'success']);
			var connected = __left0__ [0];
			var color = __left0__ [1];
		}
		else if (synced) {
			var __left0__ = tuple (['Disconnected', 'danger']);
			var connected = __left0__ [0];
			var color = __left0__ [1];
		}
		else {
			var __left0__ = tuple (["Offline (changes won't be saved)", 'neutral']);
			var connected = __left0__ [0];
			var color = __left0__ [1];
		}
		var sx = dict ([['width', '100%'], ['px', 1.5], ['py', 0.25], ['borderTop', '1px solid var(--joy-palette-divider, #d6d6d6)'], ['background', 'var(--joy-palette-background-surface, #fff)']]);
		var rejections = status ['state_write_rejection_count'] || 0;
		if (synced && status ['connected'] === false && rejections) {
			var animation_name = 'pret-disconnected-status-pulse-{}'.format (rejections);
			sx.py_update (dict ([['animation', '{} 500ms ease-out'.format (animation_name)], ['@keyframes {}'.format (animation_name), dict ([['0%', dict ([['borderTopColor', 'var(--joy-palette-danger-500, #c41c1c)'], ['background', 'var(--joy-palette-danger-100, #ffe9e8)']])], ['55%', dict ([['borderTopColor', 'var(--joy-palette-danger-400, #e4746b)'], ['background', 'var(--joy-palette-danger-50, #fff4f3)']])], ['100%', dict ([['borderTopColor', 'var(--joy-palette-divider, #d6d6d6)'], ['background', 'var(--joy-palette-background-surface, #fff)']])]])]]));
		}
		return Box (ErrorBanner (__kwargtrans__ ({error: error})), Typography ('Connection status: {}'.format (connected), __kwargtrans__ ({level: 'body-sm', color: color})), __kwargtrans__ ({class_name: 'metanno-status-bar', sx: sx}));
	};
	return StatusBar;
};

//# sourceMappingURL=__main__.map
function pret_factory_df353f18520944908a84e05590ee89d3_py_to_react_1(name, props_mapping, snapshot) {
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
}{pret_factory_df353f18520944908a84e05590ee89d3_py_to_react_1};

function pret_factory_df353f18520944908a84e05590ee89d3_resolve_stub_component_2() {
return function resolve_stub_component(package_name, global_name, component_name) {
    var componentModule = window.pret_modules.components?.get(package_name);
    if (!componentModule && window[global_name]) {
        componentModule = window[global_name];
        window.pret_modules.components.set(package_name, componentModule);
    }
    if (!componentModule) {
        var registered = Array.from(
            window.pret_modules.components?.keys?.() || []
        ).join(', ');
        throw new Error(
            'PRET component package ' + package_name
            + ' is not registered, available packages: ' + registered
        );
    }
    var component = componentModule;
    for (var part of component_name.split('.')) {
        component = component?.[part];
    }
    if (component === undefined) {
        throw new Error(
            'PRET component ' + package_name + '.' + component_name
            + ' is not registered'
        );
    }
    return component;
};;
}{pret_factory_df353f18520944908a84e05590ee89d3_resolve_stub_component_2};

function pret_factory_df353f18520944908a84e05590ee89d3_snapshot_3() {
return window.storeLib.snapshot;;
}{pret_factory_df353f18520944908a84e05590ee89d3_snapshot_3};

function pret_factory_df353f18520944908a84e05590ee89d3_py_to_react_5(react_to_py) {
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
}{pret_factory_df353f18520944908a84e05590ee89d3_py_to_react_5};

function pret_factory_df353f18520944908a84e05590ee89d3_react_to_py_6(fn) {
return function react_to_py(props) {
    var children = props.children || {};
    var rest = Object.fromEntries(
        Object.entries(props).filter(([key, _]) => key !== "children")
    );
    return fn(...Object.values(props.children || {}), __kwargtrans__(rest));
};
}{pret_factory_df353f18520944908a84e05590ee89d3_react_to_py_6};

function pret_factory_df353f18520944908a84e05590ee89d3_use_state_9() {
return window.React.useState;
}{pret_factory_df353f18520944908a84e05590ee89d3_use_state_9};

function pret_factory_df353f18520944908a84e05590ee89d3__use_event_callback_impl_14() {
return function use_event_callback(callback, dependencies) {
    const callbackRef = window.React.useRef(callback);
    callbackRef.current = callback;

    return window.React.useCallback(
        (function () {return callbackRef.current(...arguments)}),
        dependencies,
    );
};
}{pret_factory_df353f18520944908a84e05590ee89d3__use_event_callback_impl_14};

function pret_factory_df353f18520944908a84e05590ee89d3_use_ref_15() {
return window.React.useRef;
}{pret_factory_df353f18520944908a84e05590ee89d3_use_ref_15};

function pret_factory_df353f18520944908a84e05590ee89d3_use_store_history_16() {
return window.storeLib.useStoreHistory;
}{pret_factory_df353f18520944908a84e05590ee89d3_use_store_history_16};

function pret_factory_df353f18520944908a84e05590ee89d3_transact_18() {
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
}{pret_factory_df353f18520944908a84e05590ee89d3_transact_18};

function pret_factory_df353f18520944908a84e05590ee89d3_parse_table_filters_21(filterAst) {
return filterAst;
}{pret_factory_df353f18520944908a84e05590ee89d3_parse_table_filters_21};

function pret_factory_df353f18520944908a84e05590ee89d3_use_imperative_handle_22() {
return window.React.useImperativeHandle;
}{pret_factory_df353f18520944908a84e05590ee89d3_use_imperative_handle_22};

function pret_factory_df353f18520944908a84e05590ee89d3_use_dataframe_view_24() {
return window.storeLib.useDataFrameView;
}{pret_factory_df353f18520944908a84e05590ee89d3_use_dataframe_view_24};

function pret_factory_df353f18520944908a84e05590ee89d3_use_list_rows_25(useListRows) {
return useListRows;
}{pret_factory_df353f18520944908a84e05590ee89d3_use_list_rows_25};

function pret_factory_df353f18520944908a84e05590ee89d3_use_row_filter_26(useRowFilter) {
return useRowFilter;
}{pret_factory_df353f18520944908a84e05590ee89d3_use_row_filter_26};

function pret_factory_df353f18520944908a84e05590ee89d3_use_store_snapshot_27() {
return window.storeLib.useSnapshot;
}{pret_factory_df353f18520944908a84e05590ee89d3_use_store_snapshot_27};

function pret_factory_df353f18520944908a84e05590ee89d3_with_filter_error_28(withFilterError) {
return withFilterError;
}{pret_factory_df353f18520944908a84e05590ee89d3_with_filter_error_28};

function pret_factory_df353f18520944908a84e05590ee89d3_rebuild_proxy_30() {
return (function rebuild_proxy(doc, path) {
    return doc.proxyAt(path);
});;
}{pret_factory_df353f18520944908a84e05590ee89d3_rebuild_proxy_30};

function pret_factory_df353f18520944908a84e05590ee89d3_rebuild_doc_31(get_manager) {
return (function rebuild_doc(state, revision, resources, sync_id, binding_id, commit, data, dataframe_sync) {
    const manager = get_manager();
    const docs = window.__pret_store_docs__ || (window.__pret_store_docs__ = new Map());
    const existing = docs.get(binding_id);
    const doc = existing || window.storeLib.createStoreDoc(state, revision);
    doc.__pret_resources__ = Object.assign(doc.__pret_resources__ || {}, resources);
    if (binding_id) docs.set(binding_id, doc);
    doc.__pret_binding_id__ = binding_id;
    const controller = window.storeLib.attachStore(
        doc, doc.__pret_resources__, commit, sync_id ? manager.uid : window.storeLib.randomUUID(),
        data, dataframe_sync
    );
    if (sync_id && !existing) {
        manager.register_state(sync_id, doc);
        // Edits refused while disconnected are counted for use_connection_status
        controller.onRejectedWrite = (reason) => manager.notify_state_write_rejected(sync_id, reason);
        const updateConnection = () => controller.setConnected(manager.get_connection_status().connected !== false);
        manager.subscribe_connection_status(updateConnection);
        updateConnection();
    }
    return doc;
});;
}{pret_factory_df353f18520944908a84e05590ee89d3_rebuild_doc_31};

function pret_factory_df353f18520944908a84e05590ee89d3_browser_session_id_36(make_uuid) {
return () => window.__pret_session_id__ || (window.__pret_session_id__ = make_uuid());
}{pret_factory_df353f18520944908a84e05590ee89d3_browser_session_id_36};

function pret_factory_df353f18520944908a84e05590ee89d3_make_uuid_37() {
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
}{pret_factory_df353f18520944908a84e05590ee89d3_make_uuid_37};

function pret_factory_df353f18520944908a84e05590ee89d3_is_awaitable_40() {
return function is_awaitable(value) {
   return true;
};
}{pret_factory_df353f18520944908a84e05590ee89d3_is_awaitable_40};

function pret_factory_df353f18520944908a84e05590ee89d3_start_async_task_41() {
return function start_async_task(task) {
    return task;
};
}{pret_factory_df353f18520944908a84e05590ee89d3_start_async_task_41};

function pret_factory_df353f18520944908a84e05590ee89d3_store_controller_48() {
return (state) => state.__pret_controller__ || null;
}{pret_factory_df353f18520944908a84e05590ee89d3_store_controller_48};

function pret_factory_df353f18520944908a84e05590ee89d3_function_identifier_54() {
return function function_identifier(func) {
    throw new Error("function_identifier is not implemented in JavaScript");
};
}{pret_factory_df353f18520944908a84e05590ee89d3_function_identifier_54};

function pret_factory_df353f18520944908a84e05590ee89d3_Future_59() {
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
}{pret_factory_df353f18520944908a84e05590ee89d3_Future_59};

function pret_factory_df353f18520944908a84e05590ee89d3_make_websocket_66() {
return function make_websocket(resource) {
    return new WebSocket(resource);
};
}{pret_factory_df353f18520944908a84e05590ee89d3_make_websocket_66};

function pret_factory_df353f18520944908a84e05590ee89d3_fetch_69() {
return (resource, options) => {
    return fetch(resource, options);
};
}{pret_factory_df353f18520944908a84e05590ee89d3_fetch_69};

function pret_factory_df353f18520944908a84e05590ee89d3_rebuild_dataframe_70() {
return function rebuild_dataframe(resource_id, binding_id, content, owner_id, transactional) {
    if (content.bytes) return window.storeLib.createOfflineDataFrame(resource_id, binding_id, content.bytes);
    const dataframe = window.storeLib.createClientDataFrame(
        {__pret_dataframe__: true, resource_id, binding_id, localCopy: content.local === true, ...content});
    return owner_id ? window.storeLib.bindDataFrameResource(dataframe, owner_id, transactional) : dataframe;
};
}{pret_factory_df353f18520944908a84e05590ee89d3_rebuild_dataframe_70};

function pret_factory_df353f18520944908a84e05590ee89d3_use_memo_90() {
return window.React.useMemo;
}{pret_factory_df353f18520944908a84e05590ee89d3_use_memo_90};

function pret_factory_df353f18520944908a84e05590ee89d3_use_view_selected_rows_92(useSelectedRows) {
return useSelectedRows;
}{pret_factory_df353f18520944908a84e05590ee89d3_use_view_selected_rows_92};

function pret_factory_df353f18520944908a84e05590ee89d3_use_connection_status_106(get_manager) {
return function use_connection_status() {
    const subscribe = (on_store_change) => {
        const manager = get_manager();
        if (!manager || typeof manager.subscribe_connection_status !== "function") {
            return () => {};
        }
        return manager.subscribe_connection_status(on_store_change);
    };

    const get_snapshot = () => {
        const manager = get_manager();
        if (!manager || typeof manager.get_connection_status !== "function") {
            return {
                kind: "unknown",
                transport: null,
                connected: null,
                reason: "manager_unavailable",
                kernel_connection_status: null,
                last_error: null,
                state_write_rejection_count: 0,
                last_state_write_rejection: null,
            };
        }
        return manager.get_connection_status();
    };

    return window.React.useSyncExternalStore(subscribe, get_snapshot, get_snapshot);
};
}{pret_factory_df353f18520944908a84e05590ee89d3_use_connection_status_106};

return {pret_factory_df353f18520944908a84e05590ee89d3_render_0, pret_factory_df353f18520944908a84e05590ee89d3_render_x_4, pret_factory_df353f18520944908a84e05590ee89d3_TableWidget_7, pret_factory_df353f18520944908a84e05590ee89d3_ErrorBanner_8, pret_factory_df353f18520944908a84e05590ee89d3_LoadingStatus_10, pret_factory_df353f18520944908a84e05590ee89d3_StoreWidget_11, pret_factory_df353f18520944908a84e05590ee89d3_use_effect_12, pret_factory_df353f18520944908a84e05590ee89d3_use_event_callback_13, pret_factory_df353f18520944908a84e05590ee89d3_edit_rows_17, pret_factory_df353f18520944908a84e05590ee89d3_extract_row_indices_19, pret_factory_df353f18520944908a84e05590ee89d3_get_parent_selection_20, pret_factory_df353f18520944908a84e05590ee89d3_use_rows_23, pret_factory_df353f18520944908a84e05590ee89d3_make_note_kind_options_29, pret_factory_df353f18520944908a84e05590ee89d3_get_standalone_client_manager_32, pret_factory_df353f18520944908a84e05590ee89d3_object_33, pret_factory_df353f18520944908a84e05590ee89d3___init___34, pret_factory_df353f18520944908a84e05590ee89d3_WeakValueDictionary_35, pret_factory_df353f18520944908a84e05590ee89d3_call_ref_method_38, pret_factory_df353f18520944908a84e05590ee89d3_drain_outgoing_messages_39, pret_factory_df353f18520944908a84e05590ee89d3_get_connection_status_42, pret_factory_df353f18520944908a84e05590ee89d3_handle_call_failure_msg_43, pret_factory_df353f18520944908a84e05590ee89d3_handle_call_msg_44, pret_factory_df353f18520944908a84e05590ee89d3_handle_call_success_msg_45, pret_factory_df353f18520944908a84e05590ee89d3_handle_message_46, pret_factory_df353f18520944908a84e05590ee89d3_handle_state_change_msg_47, pret_factory_df353f18520944908a84e05590ee89d3_message_targets_this_manager_49, pret_factory_df353f18520944908a84e05590ee89d3_notify_connection_status_listeners_50, pret_factory_df353f18520944908a84e05590ee89d3_notify_state_write_rejected_51, pret_factory_df353f18520944908a84e05590ee89d3_register_call_future_52, pret_factory_df353f18520944908a84e05590ee89d3_register_function_53, pret_factory_df353f18520944908a84e05590ee89d3_register_ref_55, pret_factory_df353f18520944908a84e05590ee89d3_register_state_56, pret_factory_df353f18520944908a84e05590ee89d3_remote_call_ref_method_57, pret_factory_df353f18520944908a84e05590ee89d3_send_call_58, pret_factory_df353f18520944908a84e05590ee89d3_send_message_60, pret_factory_df353f18520944908a84e05590ee89d3_send_outgoing_message_61, pret_factory_df353f18520944908a84e05590ee89d3_set_connection_status_62, pret_factory_df353f18520944908a84e05590ee89d3_subscribe_connection_status_63, pret_factory_df353f18520944908a84e05590ee89d3___init___64, pret_factory_df353f18520944908a84e05590ee89d3_loads_65, pret_factory_df353f18520944908a84e05590ee89d3_send_message_67, pret_factory_df353f18520944908a84e05590ee89d3_dumps_68, pret_factory_df353f18520944908a84e05590ee89d3_deep_get_store_71, pret_factory_df353f18520944908a84e05590ee89d3_make_client_ref_72, pret_factory_df353f18520944908a84e05590ee89d3_mount_73, pret_factory_df353f18520944908a84e05590ee89d3_query_from_74, pret_factory_df353f18520944908a84e05590ee89d3_related_filter_75, pret_factory_df353f18520944908a84e05590ee89d3_root_for_76, pret_factory_df353f18520944908a84e05590ee89d3_subscribe_table_77, pret_factory_df353f18520944908a84e05590ee89d3_select_rows_78, pret_factory_df353f18520944908a84e05590ee89d3_filter_related_tables_79, pret_factory_df353f18520944908a84e05590ee89d3_select_row_id_80, pret_factory_df353f18520944908a84e05590ee89d3_TextWidget_81, pret_factory_df353f18520944908a84e05590ee89d3_Any_82, pret_factory_df353f18520944908a84e05590ee89d3_Dict_83, pret_factory_df353f18520944908a84e05590ee89d3_List_84, pret_factory_df353f18520944908a84e05590ee89d3_Optional_85, pret_factory_df353f18520944908a84e05590ee89d3___init___86, pret_factory_df353f18520944908a84e05590ee89d3_Sequence_87, pret_factory_df353f18520944908a84e05590ee89d3_get_first_selected_row_idx_88, pret_factory_df353f18520944908a84e05590ee89d3_normalize_row_indices_89, pret_factory_df353f18520944908a84e05590ee89d3_use_selected_rows_91, pret_factory_df353f18520944908a84e05590ee89d3_default_container_renderer_93, pret_factory_df353f18520944908a84e05590ee89d3_ToolbarWidget_94, pret_factory_df353f18520944908a84e05590ee89d3_SpanToolbar_95, pret_factory_df353f18520944908a84e05590ee89d3_render_field_96, pret_factory_df353f18520944908a84e05590ee89d3_render_boolean_field_97, pret_factory_df353f18520944908a84e05590ee89d3_make_field_label_98, pret_factory_df353f18520944908a84e05590ee89d3_render_select_field_99, pret_factory_df353f18520944908a84e05590ee89d3_render_text_field_100, pret_factory_df353f18520944908a84e05590ee89d3_TextField_101, pret_factory_df353f18520944908a84e05590ee89d3_field_state_102, pret_factory_df353f18520944908a84e05590ee89d3_SelectedFieldView_103, pret_factory_df353f18520944908a84e05590ee89d3_FormWidget_104, pret_factory_df353f18520944908a84e05590ee89d3_StatusBar_105, pret_factory_df353f18520944908a84e05590ee89d3_py_to_react_1, pret_factory_df353f18520944908a84e05590ee89d3_resolve_stub_component_2, pret_factory_df353f18520944908a84e05590ee89d3_snapshot_3, pret_factory_df353f18520944908a84e05590ee89d3_py_to_react_5, pret_factory_df353f18520944908a84e05590ee89d3_react_to_py_6, pret_factory_df353f18520944908a84e05590ee89d3_use_state_9, pret_factory_df353f18520944908a84e05590ee89d3__use_event_callback_impl_14, pret_factory_df353f18520944908a84e05590ee89d3_use_ref_15, pret_factory_df353f18520944908a84e05590ee89d3_use_store_history_16, pret_factory_df353f18520944908a84e05590ee89d3_transact_18, pret_factory_df353f18520944908a84e05590ee89d3_parse_table_filters_21, pret_factory_df353f18520944908a84e05590ee89d3_use_imperative_handle_22, pret_factory_df353f18520944908a84e05590ee89d3_use_dataframe_view_24, pret_factory_df353f18520944908a84e05590ee89d3_use_list_rows_25, pret_factory_df353f18520944908a84e05590ee89d3_use_row_filter_26, pret_factory_df353f18520944908a84e05590ee89d3_use_store_snapshot_27, pret_factory_df353f18520944908a84e05590ee89d3_with_filter_error_28, pret_factory_df353f18520944908a84e05590ee89d3_rebuild_proxy_30, pret_factory_df353f18520944908a84e05590ee89d3_rebuild_doc_31, pret_factory_df353f18520944908a84e05590ee89d3_browser_session_id_36, pret_factory_df353f18520944908a84e05590ee89d3_make_uuid_37, pret_factory_df353f18520944908a84e05590ee89d3_is_awaitable_40, pret_factory_df353f18520944908a84e05590ee89d3_start_async_task_41, pret_factory_df353f18520944908a84e05590ee89d3_store_controller_48, pret_factory_df353f18520944908a84e05590ee89d3_function_identifier_54, pret_factory_df353f18520944908a84e05590ee89d3_Future_59, pret_factory_df353f18520944908a84e05590ee89d3_make_websocket_66, pret_factory_df353f18520944908a84e05590ee89d3_fetch_69, pret_factory_df353f18520944908a84e05590ee89d3_rebuild_dataframe_70, pret_factory_df353f18520944908a84e05590ee89d3_use_memo_90, pret_factory_df353f18520944908a84e05590ee89d3_use_view_selected_rows_92, pret_factory_df353f18520944908a84e05590ee89d3_use_connection_status_106};
//# sourceURL=dynamic_factory.js