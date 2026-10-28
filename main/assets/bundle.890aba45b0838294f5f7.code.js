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

// Transcrypt'ed from Python, 2026-10-28 01:20:04
var { AssertionError, AttributeError, BaseException, DeprecationWarning, Exception, IndexError, IterableError, KeyError, NotImplementedError, RuntimeWarning, StopIteration, UserWarning, ValueError, Warning, __JsIterator__, __PyIterator__, __Terminal__, __add__, __and__, __call__, __compare__, __envir__, __eq__, __floordiv__, __ge__, __get__, __getcm__, __getitem__, __getslice__, __getsm__, __gt__, __i__, __iadd__, __iand__, __idiv__, __ijsmod__, __ilshift__, __imatmul__, __imod__, __imul__, __in__, __init__, __ior__, __ipow__, __irshift__, __isub__, __ixor__, __jsUsePyNext__, __jsmod__, __k__, __kwargtrans__, __le__, __lshift__, __lt__, __matmul__, __mergefields__, __mergekwargtrans__, __mod__, __mul__, __ne__, __neg__, __nest__, __or__, __pow__, __pragma__, __proxy__, __pyUseJsNext__, __rshift__, __setitem__, __setproperty__, __setslice__, __sort__, __specialattrib__, __sub__, __super__, __t__, __terminal__, __truediv__, __withblock__, __xor__, _class_, abs, all, any, assert, bool, bytearray, bytes, callable, chr, copy, deepcopy, delattr, dict, dir, divmod, enumerate, filter, float, getattr, hasattr, input, int, isinstance, issubclass, len, list, map, max, min, ord, pow, print, property, py_TypeError, py_iter, py_metatype, py_next, py_reversed, py_typeof, range, repr, round, set, setattr, sorted, str, sum, tuple, zip } = pret_modules['org.transcrypt.__runtime__'];
var { dumps } = pret_modules['json'];
var { loads } = pret_modules['json'];
var { WeakValueDictionary } = pret_modules['weakref'];
var { object } = pret_modules['org.transcrypt.__runtime__'];
var __name__ = '__main__';var pret_factory_68eabd143401467a9ca60857e2d76422_render_x_0 = function (children, create_fn, props) {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_App_3 = function (AnnotatedText, state, text, use_event_callback, use_store_snapshot) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'AnnotatedText': var AnnotatedText = __allkwargs0__ [__attrib0__]; break;
					case 'state': var state = __allkwargs0__ [__attrib0__]; break;
					case 'text': var text = __allkwargs0__ [__attrib0__]; break;
					case 'use_event_callback': var use_event_callback = __allkwargs0__ [__attrib0__]; break;
					case 'use_store_snapshot': var use_store_snapshot = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var App = function () {
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
		var view_state = use_store_snapshot (state);
		var on_select = use_event_callback (function (spans, mod_keys) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'spans': var spans = __allkwargs0__ [__attrib0__]; break;
							case 'mod_keys': var mod_keys = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			if (__in__ ('Shift', mod_keys)) {
				state.__setslice__ (0, null, null, (function () {
					var __accu0__ = [];
					for (var x of state) {
						if (any ((function () {
							var __accu1__ = [];
							for (var s of spans) {
								__accu1__.append (s ['begin'] >= x ['end'] || s ['end'] <= x ['begin']);
							}
							return py_iter (__accu1__);
						}) ())) {
							__accu0__.append (x);
						}
					}
					return __accu0__;
				}) ());
			}
			else {
				state.extend ((function () {
					var __accu0__ = [];
					for (var s of spans) {
						__accu0__.append (dict ([...(s).py_items(), ['id', 's-{}-{}'.format (s ['begin'], s ['end'])], ['text', text.__getslice__ (s ['begin'], s ['end'], 1)], ['label', 'ENT']]));
					}
					return __accu0__;
				}) ());
			}
		});
		return AnnotatedText (__kwargtrans__ ({text: text, spans: view_state, annotation_styles: dict ([['ENT', dict ([['color', 'lightblue']])]]), on_mouse_select: on_select}));
	};
	return App;
};var pret_factory_68eabd143401467a9ca60857e2d76422_get_standalone_client_manager_9 = function (StandaloneClientManager) {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_object_10 = function () {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422___init___11 = function (WeakValueDictionary, browser_session_id) {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_WeakValueDictionary_12 = function () {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_call_ref_method_15 = function () {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_drain_outgoing_messages_16 = function (is_awaitable, start_async_task) {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_get_connection_status_19 = function () {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_handle_call_failure_msg_20 = function () {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_handle_call_msg_21 = function (is_awaitable) {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_handle_call_success_msg_22 = function () {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_handle_message_23 = function () {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_handle_state_change_msg_24 = function (store_controller) {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_message_targets_this_manager_26 = function () {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_notify_connection_status_listeners_27 = function () {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_notify_state_write_rejected_28 = function () {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_register_call_future_29 = function () {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_register_function_30 = function (function_identifier) {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_register_ref_32 = function () {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_register_state_33 = function () {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_remote_call_ref_method_34 = function () {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_send_call_35 = function (Future, make_uuid) {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_send_message_37 = function () {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_send_outgoing_message_38 = function (Future, is_awaitable, start_async_task) {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_set_connection_status_39 = function (UNSET) {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_subscribe_connection_status_40 = function () {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422___init___41 = function (is_awaitable, loads, make_websocket, start_async_task) {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_loads_42 = function () {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_send_message_44 = function (dumps, fetch, is_awaitable, loads) {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_dumps_45 = function () {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_use_event_callback_47 = function (_use_event_callback_impl) {
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
};var pret_factory_68eabd143401467a9ca60857e2d76422_MyTable_50 = function (Table, columns, state, use_event_callback, use_store_snapshot) {
	if (arguments.length) {
		var __ilastarg0__ = arguments.length - 1;
		if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
			var __allkwargs0__ = arguments [__ilastarg0__--];
			for (var __attrib0__ in __allkwargs0__) {
				switch (__attrib0__) {
					case 'Table': var Table = __allkwargs0__ [__attrib0__]; break;
					case 'columns': var columns = __allkwargs0__ [__attrib0__]; break;
					case 'state': var state = __allkwargs0__ [__attrib0__]; break;
					case 'use_event_callback': var use_event_callback = __allkwargs0__ [__attrib0__]; break;
					case 'use_store_snapshot': var use_store_snapshot = __allkwargs0__ [__attrib0__]; break;
				}
			}
		}
	}
	else {
	}
	var MyTable = function () {
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
		var on_cell_change = use_event_callback (function (row_idx, col, new_value) {
			if (arguments.length) {
				var __ilastarg0__ = arguments.length - 1;
				if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
					var __allkwargs0__ = arguments [__ilastarg0__--];
					for (var __attrib0__ in __allkwargs0__) {
						switch (__attrib0__) {
							case 'row_idx': var row_idx = __allkwargs0__ [__attrib0__]; break;
							case 'col': var col = __allkwargs0__ [__attrib0__]; break;
							case 'new_value': var new_value = __allkwargs0__ [__attrib0__]; break;
						}
					}
				}
			}
			else {
			}
			view_state [row_idx] [col] = new_value;
		});
		for (var x of state) {
			x.py_setdefault ('label', 'ENT');
		}
		var view_state = use_store_snapshot (state);
		return Table (__kwargtrans__ ({rows: view_state, columns: columns, auto_filter: true, on_cell_change: on_cell_change}));
	};
	return MyTable;
};

//# sourceMappingURL=__main__.map
function pret_factory_68eabd143401467a9ca60857e2d76422_py_to_react_1(react_to_py) {
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
}{pret_factory_68eabd143401467a9ca60857e2d76422_py_to_react_1};

function pret_factory_68eabd143401467a9ca60857e2d76422_react_to_py_2(fn) {
return function react_to_py(props) {
    var children = props.children || {};
    var rest = Object.fromEntries(
        Object.entries(props).filter(([key, _]) => key !== "children")
    );
    return fn(...Object.values(props.children || {}), __kwargtrans__(rest));
};
}{pret_factory_68eabd143401467a9ca60857e2d76422_react_to_py_2};

function pret_factory_68eabd143401467a9ca60857e2d76422_py_to_react_4(name, props_mapping, snapshot) {
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
}{pret_factory_68eabd143401467a9ca60857e2d76422_py_to_react_4};

function pret_factory_68eabd143401467a9ca60857e2d76422_resolve_stub_component_5() {
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
}{pret_factory_68eabd143401467a9ca60857e2d76422_resolve_stub_component_5};

function pret_factory_68eabd143401467a9ca60857e2d76422_snapshot_6() {
return window.storeLib.snapshot;;
}{pret_factory_68eabd143401467a9ca60857e2d76422_snapshot_6};

function pret_factory_68eabd143401467a9ca60857e2d76422_rebuild_proxy_7() {
return (function rebuild_proxy(doc, path) {
    return doc.proxyAt(path);
});;
}{pret_factory_68eabd143401467a9ca60857e2d76422_rebuild_proxy_7};

function pret_factory_68eabd143401467a9ca60857e2d76422_rebuild_doc_8(get_manager) {
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
}{pret_factory_68eabd143401467a9ca60857e2d76422_rebuild_doc_8};

function pret_factory_68eabd143401467a9ca60857e2d76422_browser_session_id_13(make_uuid) {
return () => window.__pret_session_id__ || (window.__pret_session_id__ = make_uuid());
}{pret_factory_68eabd143401467a9ca60857e2d76422_browser_session_id_13};

function pret_factory_68eabd143401467a9ca60857e2d76422_make_uuid_14() {
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
}{pret_factory_68eabd143401467a9ca60857e2d76422_make_uuid_14};

function pret_factory_68eabd143401467a9ca60857e2d76422_is_awaitable_17() {
return function is_awaitable(value) {
   return true;
};
}{pret_factory_68eabd143401467a9ca60857e2d76422_is_awaitable_17};

function pret_factory_68eabd143401467a9ca60857e2d76422_start_async_task_18() {
return function start_async_task(task) {
    return task;
};
}{pret_factory_68eabd143401467a9ca60857e2d76422_start_async_task_18};

function pret_factory_68eabd143401467a9ca60857e2d76422_store_controller_25() {
return (state) => state.__pret_controller__ || null;
}{pret_factory_68eabd143401467a9ca60857e2d76422_store_controller_25};

function pret_factory_68eabd143401467a9ca60857e2d76422_function_identifier_31() {
return function function_identifier(func) {
    throw new Error("function_identifier is not implemented in JavaScript");
};
}{pret_factory_68eabd143401467a9ca60857e2d76422_function_identifier_31};

function pret_factory_68eabd143401467a9ca60857e2d76422_Future_36() {
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
}{pret_factory_68eabd143401467a9ca60857e2d76422_Future_36};

function pret_factory_68eabd143401467a9ca60857e2d76422_make_websocket_43() {
return function make_websocket(resource) {
    return new WebSocket(resource);
};
}{pret_factory_68eabd143401467a9ca60857e2d76422_make_websocket_43};

function pret_factory_68eabd143401467a9ca60857e2d76422_fetch_46() {
return (resource, options) => {
    return fetch(resource, options);
};
}{pret_factory_68eabd143401467a9ca60857e2d76422_fetch_46};

function pret_factory_68eabd143401467a9ca60857e2d76422__use_event_callback_impl_48() {
return function use_event_callback(callback, dependencies) {
    const callbackRef = window.React.useRef(callback);
    callbackRef.current = callback;

    return window.React.useCallback(
        (function () {return callbackRef.current(...arguments)}),
        dependencies,
    );
};
}{pret_factory_68eabd143401467a9ca60857e2d76422__use_event_callback_impl_48};

function pret_factory_68eabd143401467a9ca60857e2d76422_use_store_snapshot_49() {
return window.storeLib.useSnapshot;
}{pret_factory_68eabd143401467a9ca60857e2d76422_use_store_snapshot_49};

return {pret_factory_68eabd143401467a9ca60857e2d76422_render_x_0, pret_factory_68eabd143401467a9ca60857e2d76422_App_3, pret_factory_68eabd143401467a9ca60857e2d76422_get_standalone_client_manager_9, pret_factory_68eabd143401467a9ca60857e2d76422_object_10, pret_factory_68eabd143401467a9ca60857e2d76422___init___11, pret_factory_68eabd143401467a9ca60857e2d76422_WeakValueDictionary_12, pret_factory_68eabd143401467a9ca60857e2d76422_call_ref_method_15, pret_factory_68eabd143401467a9ca60857e2d76422_drain_outgoing_messages_16, pret_factory_68eabd143401467a9ca60857e2d76422_get_connection_status_19, pret_factory_68eabd143401467a9ca60857e2d76422_handle_call_failure_msg_20, pret_factory_68eabd143401467a9ca60857e2d76422_handle_call_msg_21, pret_factory_68eabd143401467a9ca60857e2d76422_handle_call_success_msg_22, pret_factory_68eabd143401467a9ca60857e2d76422_handle_message_23, pret_factory_68eabd143401467a9ca60857e2d76422_handle_state_change_msg_24, pret_factory_68eabd143401467a9ca60857e2d76422_message_targets_this_manager_26, pret_factory_68eabd143401467a9ca60857e2d76422_notify_connection_status_listeners_27, pret_factory_68eabd143401467a9ca60857e2d76422_notify_state_write_rejected_28, pret_factory_68eabd143401467a9ca60857e2d76422_register_call_future_29, pret_factory_68eabd143401467a9ca60857e2d76422_register_function_30, pret_factory_68eabd143401467a9ca60857e2d76422_register_ref_32, pret_factory_68eabd143401467a9ca60857e2d76422_register_state_33, pret_factory_68eabd143401467a9ca60857e2d76422_remote_call_ref_method_34, pret_factory_68eabd143401467a9ca60857e2d76422_send_call_35, pret_factory_68eabd143401467a9ca60857e2d76422_send_message_37, pret_factory_68eabd143401467a9ca60857e2d76422_send_outgoing_message_38, pret_factory_68eabd143401467a9ca60857e2d76422_set_connection_status_39, pret_factory_68eabd143401467a9ca60857e2d76422_subscribe_connection_status_40, pret_factory_68eabd143401467a9ca60857e2d76422___init___41, pret_factory_68eabd143401467a9ca60857e2d76422_loads_42, pret_factory_68eabd143401467a9ca60857e2d76422_send_message_44, pret_factory_68eabd143401467a9ca60857e2d76422_dumps_45, pret_factory_68eabd143401467a9ca60857e2d76422_use_event_callback_47, pret_factory_68eabd143401467a9ca60857e2d76422_MyTable_50, pret_factory_68eabd143401467a9ca60857e2d76422_py_to_react_1, pret_factory_68eabd143401467a9ca60857e2d76422_react_to_py_2, pret_factory_68eabd143401467a9ca60857e2d76422_py_to_react_4, pret_factory_68eabd143401467a9ca60857e2d76422_resolve_stub_component_5, pret_factory_68eabd143401467a9ca60857e2d76422_snapshot_6, pret_factory_68eabd143401467a9ca60857e2d76422_rebuild_proxy_7, pret_factory_68eabd143401467a9ca60857e2d76422_rebuild_doc_8, pret_factory_68eabd143401467a9ca60857e2d76422_browser_session_id_13, pret_factory_68eabd143401467a9ca60857e2d76422_make_uuid_14, pret_factory_68eabd143401467a9ca60857e2d76422_is_awaitable_17, pret_factory_68eabd143401467a9ca60857e2d76422_start_async_task_18, pret_factory_68eabd143401467a9ca60857e2d76422_store_controller_25, pret_factory_68eabd143401467a9ca60857e2d76422_function_identifier_31, pret_factory_68eabd143401467a9ca60857e2d76422_Future_36, pret_factory_68eabd143401467a9ca60857e2d76422_make_websocket_43, pret_factory_68eabd143401467a9ca60857e2d76422_fetch_46, pret_factory_68eabd143401467a9ca60857e2d76422__use_event_callback_impl_48, pret_factory_68eabd143401467a9ca60857e2d76422_use_store_snapshot_49};
//# sourceURL=dynamic_factory.js