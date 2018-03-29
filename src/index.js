(function(global, fn) {
  var modool = fn(global);
  global.modool = modool;
})(window, function(global) {
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

    var module = internalDefine(name);
    loadDeps(deps, function(deps_) {
      var exports = factory.call(factory, require, deps_);
      module.exports = exports;
    });
  }

  /**
   * Define a internal module.
   * @param {string} name
   * @param {*} module
   */
  function internalDefine(name, module) {
    MODULES[name] = {
      name: name,
      exports: module
    };
    return MODULES[name];
  }

  /**
   * Require a module.
   * @param {string} name
   */
  function requireSync(name) {
    if (MODULES[name]) return MODULES[name];
  }

  /**
   * Require MODULES in async.
   * Download script and append it to head.
   * @param {string} name
   * @param {string} src
   * @param {function} callback
   */
  function requireAsync(name, src, callback) {
    if (requireSync(name)) {
      callback(requireSync(name));
      return;
    }

    if (!src) {
      console.error('module [' + name + "] doesn't have a source");
      return;
    }

    var asyncList = ASYNC_REQUIRE_MAP[name];
    if (asyncList) {
      asyncList.push(callback);
    } else {
      asyncList = ASYNC_REQUIRE_MAP[name] = [callback];

      var s = document.createElement('script');
      s.addEventListener(
        'load',
        function(event) {
          asyncList.forEach(function(task) {
            task(internalDefine(name, global[name]));
          });
          ASYNC_REQUIRE_MAP[name] = null;
        },
        false
      );
      s.src = src;
      document.head.appendChild(s);
    }
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

    var loadedCount = 0;
    var list = [];
    deps.forEach(function(name) {
      var module = requireSync(name);
      if (module) {
        loadedCount++;
        depModules.push(module);
        if (loadedCount === len) loadDepsDone(deps, depModules, callback);
      } else if (_moduleSource && _moduleSource[name]) {
        list.push(function(cb) {
          requireAsync(name, _moduleSource[name], cb);
        });
      } else {
        loadedCount++;
        depModules.push(undefined);
        console.warn('module [' + name + '] is not defined');
      }
    });

    // load modules in async way by order
    var listTrigger = list.reduceRight(
      function(prevRequire, curRequire, arr, idx) {
        return function(module) {
          if (module) {
            loadedCount++;
            depModules.push(module);
          }
          curRequire(prevRequire);
        };
      },
      function(module) {
        loadedCount++;
        depModules.push(module);
        if (loadedCount === len) loadDepsDone(deps, depModules, callback);
      }
    );

    listTrigger();
  }

  /**
   * Sort dependent modules.
   * @param {[string]} deps
   * @param {[Object]} depModules
   * @param {function} callback
   */
  function loadDepsDone(deps, depModules, callback) {
    depModules.sort(function(a, b) {
      var aIndex = deps.indexOf(a.name);
      var bIndex = deps.indexOf(b.name);
      return aIndex - bIndex;
    });
    callback(depModules);
  }

  /**
   * Config for modool.
   * @param {*} options
   */
  function config(options) {
    _moduleSource = options.moduleSource || null;
  }

  /**
   * Require a module.
   * @param {string} name module name
   * @param {function} callback
   */
  function require(name, callback) {
    if (callback) {
      requireAsync(name, _moduleSource[name], callback);
    } else {
      return requireSync(name);
    }
  }

  return {
    define: define,
    require: require,
    config: config
  };
});
