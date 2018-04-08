(function(fn) {
  var modool = fn(window);
  window.modool = modool;
})(function(global) {
  /**
   * Store all modules
   */
  var MODULES = Object.create(null);

  /**
   * Map for async require callback list.
   */
  var ASYNC_REQUIRE_MAP = {};

  /**
   * Async module src map.
   */
  var _moduleSource = null;

  var hub = (function() {
    var state = {};

    var on = function(event, handler) {
      state[event] = state[event] || [];
      state[event].push(handler);
    };

    var once = function(event, handler) {
      function _once() {
        off(event, _once);
        var args = Array.prototype.slice.call(arguments);
        handler.apply(this, args);
      }

      on(event, _once);
    };

    var off = function(event, handler) {
      state[event] = state[event] || [];
      state[event] = state[event].filter(function(fn) {
        return fn !== handler;
      });
    };

    var emit = function(event) {
      var args = Array.prototype.slice.call(arguments);
      if (state[event]) {
        state[event].forEach(function(fn) {
          fn.apply(this, args.slice(1));
        });
      }
    };

    return {
      on: on,
      once: once,
      off: off,
      emit: emit
    };
  })();

  /**
   * Define a user module.
   * @param {string} name
   * @param {[string]} deps
   * @param {function} factory
   */
  function define(name, deps, factory) {
    // check if exist
    if (name in MODULES) {
      console.warn('module [' + name + '] has already been declared');
      return;
    }

    var module = registerModule(name);
    loadDeps(deps, function(deps_) {
      var exports = factory.call(factory, require, deps_);
      module.exports = exports;
      module.loaded = true;
      hub.emit(name, module);
    });
  }

  /**
   * Define a internal module.
   * @param {string} name
   * @param {*} module
   */
  function registerModule(name, module) {
    MODULES[name] = {
      name: name,
      exports: module,
      loaded: false
    };
    return MODULES[name];
  }

  /**
   * Get a module.
   * @param {string} name
   * @param {function} [callback]
   */
  function require(name, callback) {
    var module;
    if (callback) {
      module = MODULES[name];
      if (module) {
        if (module.loaded) {
          callback(module);
        } else {
          hub.once(name, callback);
        }
      } else {
        downloadModule(name, callback);
      }
    } else {
      module = MODULES[name];
      return module;
    }
  }

  /**
   * Download a module.
   * Most of time it should be a third part lib.
   * @param {string} name
   * @param {function} callback
   */
  function downloadModule(name, callback) {
    var src = _moduleSource[name];
    if (!src) {
      console.error('module [' + name + '] doesn\'t have a source');
      callback();
      return;
    }

    registerModule(name);

    function handleOnLoad() {
      var module = require(name);
      module.exports = global[name];
      module.loaded = true;

      hub.emit(name, module);
    }

    var s = document.createElement('script');
    s.addEventListener('load', handleOnLoad, false);
    s.src = src;
    document.head.appendChild(s);
  }

  /**
   * Load dependent modules.
   * @param {[string]} deps dependent modules name
   * @param {function} callback
   */
  function loadDeps(deps, callback) {
    var depModules = [];
    var len = deps.length;
    if (!len) {
      callback(depModules);
      return;
    }

    var taskList = [];
    deps.forEach(function(name) {
      taskList.push(require.bind(this, name));
    });

    var initTask = taskList.reduceRight(function(prev, cur) {
      return cur.bind(this, function(module) {
        depModules.push(module);
        prev(module);
      });
    }, callback.bind(this, depModules));

    initTask();
  }

  /**
   * Config for modool.
   * @param {*} options
   */
  function config(options) {
    _moduleSource = options.moduleSource || null;
  }

  return {
    define: define,
    require: require,
    config: config
  };
});
