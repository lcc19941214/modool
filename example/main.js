var define = modool.define;
var require = modool.require;

modool.config({
  moduleSource: {
    jQuery: 'https://cdn.bootcss.com/jquery/3.3.1/jquery.js',
    bootstrap: 'https://cdn.bootcss.com/bootstrap/4.0.0/js/bootstrap.js'
  }
});

define('getScript', ['jQuery'], function(require, deps) {
  function getScript() {
    var $ = deps[0].exports;
    return $('script').get();
  }

  return getScript;
});

define('getDeps', ['jQuery', 'bootstrap', 'undefined_module'], function(require, deps) {
  function getDeps() {
    return deps;
  }

  return getDeps;
});

define('getDepsWithRequire', ['jQuery', 'bootstrap'], function() {
  var $ = require('jQuery');
  console.log($);

  return $;
});

define('getDefinedModule', ['getScript'], function() {
  var getScript = require('getScript');

  return function() {
    return getScript.exports;
  };
});
