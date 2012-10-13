var shift = function(d) {
  for (var k in d) {
    return [k, d[k]];
  }
};

var Op = function(x, m, as) {
  this.x = x;
  this.m = m;
  this.as = as;
};

Op.parse = function(args) {
  if (args[0].constructor === Object) {
    var item = shift(args[0]);
    return new Op(item[0], item[1], args.slice(1));
  }
  return new Op(null, args[0], args.slice(1));
};

// "Do-notation"
module.exports = function() {
  /*jshint evil:true*/
  var zs = [[].slice.call(arguments)];
  return function do_() {
    if (arguments.length === 0) {
      return (function(zs) {
        // Defeat optimizations which rewrite zs.
        eval("var _zs = arguments[0];");
        var q = "";
        for (var i = 0; i < zs.length; i++) {
          var body = zs[i].as.length > 0 ?
            "_zs[" + i + "].m(" + zs[i].as + ")" :
            "_zs[" + i + "].m";
          if (q) {
            q = zs[i].x ?
              body + ".then(function(" + zs[i].x + "){ return " + q + " })" :
              body + ".then(function(){ return " + q + " })";
          } else {
            q = body;
          }
        }
        return eval("(" + q + ")");
      })(zs.map(Op.parse));
    }
    zs.unshift([].slice.call(arguments));
    return do_;
  };
};

