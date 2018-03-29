modool.config({
  moduleSource: {
    jQuery: 'https://cdn.bootcss.com/jquery/3.3.1/jquery.js',
    bootstrap: 'https://cdn.bootcss.com/bootstrap/4.0.0/js/bootstrap.js'
  }
});

modool.define('module', ['jQuery'], function(require, deps) {
  console.log(deps);

  return 'ok';
});

modool.define('module2', ['jQuery', 'bootstrap', 'd'], function(require, deps) {
  console.log(deps);

  return function() {
    console.log(a);
  };
});
