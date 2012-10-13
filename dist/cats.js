(function(root) {

var files = {}, cache = {};
var require = (function() {
  return function(id) {
    if (!(id in cache)) {
      var mod = { exports: { } };
      files["lib/" + id + ".js"].apply(mod.exports, [mod.exports, require, mod]);
      cache[id] = mod.exports;
    }
    return cache[id];
  };
})();

files["lib/monad.js"] = (function(exports, require, module) {
  // require("util").inherits
  var inherits = function (ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
  
  var noimpl = function() { throw new Error("Not implemented."); };
  
  // Category
  function Category() { };
  Category.dot = function(f, g) {
    return function(x) {
      return f(g(x));
    };
  };
  Category.prototype.dot = function(g) {
    return Category.dot(this, g);
  };
  
  // Functor
  var Functor = function() { };
  Functor.prototype.fmap = noimpl;
  
  // Applicative
  var Applicative = function() { };
  inherits(Applicative, Functor);
  Applicative.prototype.pure = noimpl;
  Applicative.prototype.ap = noimpl;
  //Applicative.prototype.lap = liftA2(const(id));
  //Applicative.prototype.rap = liftA2(const);
  
  // Monad
  var Monad = function() { };
  inherits(Monad, Applicative);
  Monad.prototype.then_ = function(k) {
    return this.then(function() { return k; });
  };
  Monad.prototype.then = noimpl;
  Monad.liftM = function(f, m) {
    return m.then(function(x1) {
      return m.constructor.unit(f(x1));
    });
  };
  
  // Identity monad
  var Id = function(x) {
    if (!(this instanceof Id)) return new Id(x);
    Monad.call(this);
    this._ = x;
  };
  inherits(Id, Monad);
  Id.then = function(f, g) {
    return g(f._);
  };
  Id.unit = Id;
  Id.prototype.then = function(g) {
    return Id.then(this, g);
  };
  Id.prototype.inspect = function() {
    return "(Id " + (this._.inspect ? this._.inspect() : this._) + ")";
  };
  
  // Cont monad
  var Cont = function(k) {
    if (!(this instanceof Cont)) return new Cont(k);
    this.k = k;
  };
  inherits(Cont, Monad);
  Cont.unit = function(a) {
    return Cont(function(k) {
      k(a);
    });
  };
  Cont.then = function(f, g) {
    return Cont(function(next) {
      f.k(function(r) {
        g(r).run(next);
      });
    });
  };
  Cont.callCC = function(f) {
    return Cont(function(k) {
      f(function(a) {
        return Cont(function() { k(a); });
      }).run(k);
    });
  };
  Cont.prototype.then = function(g) {
    return Cont.then(this, g);
  };
  Cont.prototype.run = function(next) {
    this.k(next || function() {});
  };
  
  var pause = Cont(function(k) {
    setTimeout(k, 1000);
  });
  
  var print = function(s) {
    return Cont(function(k) {
      console.log(s);
      k();
    });
  };
  
  // Only works in node.
  var getLine = Cont(function(k) {
    process.stdin.resume();
    process.stdin.once("data", function(x) {
      process.stdin.pause();
      k(x.toString().slice(0, -1));
    });
  });
  
  // Maybe monad
  var Maybe = function() { };
  inherits(Maybe, Monad);
  
  var Just = function(a) {
    if (!(this instanceof Just)) return new Just(a);
    this._ = a;
  };
  inherits(Just, Maybe);
  Just.prototype.fmap = function(f) {
    this._ = f(this._);
    return this;
  };
  Just.prototype.inspect = function() {
    return "(Just " + (this._.inspect ? this._.inspect() : this._) + ")";
  };
  
  var Nothing = function() {
    if (!(this instanceof Nothing)) return new Nothing();
  };
  inherits(Nothing, Maybe);
  Nothing.prototype.fmap = function() {
    return this;
  };
  Nothing.prototype.inspect = function() {
    return "(Nothing)";
  };
  
  // Arrow
  var Arrow = function() { };
  inherits(Arrow, Category);
  
  // Coroutines and generators
  var repeat = function(a) {
    return function as() {
      return [a, as];
    };
  };
  
  var intsFrom = function(n) {
    return function() {
      return [n, intsFrom(n + 1)];
    };
  };
  
  var scan = function(f, i) {
    return (function(a) {
      return function(b) {
        var a_ = f(a, b);
        return [a_, scan(f, a_)];
      };
    })(i);
  };
  
  var accumSum = scan(function(x, y) { return x + y; }, 0);
  
  // Adapted from
  // https://github.com/leonidas/codeblog/blob/master/2012/2012-01-08-streams-coroutines.md
  var Coroutine = function(s) {
    if (!(this instanceof Coroutine)) return new Coroutine(s);
    this.s = s;
  };
  inherits(Coroutine, Arrow);
  Coroutine.arr = function(f) {
    return Coroutine(function next(i) {
      return [f(i), next];
    });
  };
  Coroutine.first = function(s) {
    return function(xy) {
      var xs = s(xy[0]);
      return [[xs[0], xy[1]], Coroutine.first(xs[1])];
    };
  };
  Coroutine._fmap = function(s, f) {
    return function(x) {
      var item = s(x);
      return [f(item[0]), Coroutine._fmap(item[1], f)];
    };
  };
  Coroutine._dot = function(f, g) {
    return function(i) {
      var xs = g(i), ys = f(xs[0]);
      return [ys[0], Coroutine._dot(ys[1], xs[1])];
    };
  };
  Coroutine.prototype.fmap = function(f) {
    return Coroutine(Coroutine._fmap(this.s, f));
  };
  Coroutine.prototype.dot = function(g) {
    return Coroutine(Coroutine._dot(this.s, g.s));
  };
  Coroutine.prototype.first = function() {
    return Coroutine(Coroutine.first(this.s));
  };
  Coroutine.prototype.evalList = function(xs) {
    var res = [], item;
    for (var i = 0; i < xs.length; i++) {
      item = this.s(xs[i]);
      this.s = item[1];
      res.push(item[0]);
    }
    return res;
  };
  
  exports.inherits = inherits;
  // Categories
  exports.Category = Category;
  exports.Functor = Functor;
  exports.Applicative = Applicative;
  exports.Monad = Monad;
  exports.Arrow = Arrow;
  // Monads
  exports.Id = Id;
  exports.Cont = Cont;
  exports.Maybe = Maybe;
  exports.Just = Just;
  exports.Nothing = Nothing;
  // Arrows
  exports.Coroutine = Coroutine;
  // Utilities
  exports.getLine = getLine;
  exports.pause = pause;
  exports.print = print;
});

files["lib/do.js"] = (function(exports, require, module) {
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
  
});

files["lib/trans.js"] = (function(exports, require, module) {
  var monad = require("monad");
  
  // `foldr` sourced from
  // http://blog.thatscaptaintoyou.com/haskells-foldr-in-javascript/
  function foldr(fn, ult, xs) {
    if (xs.length === 0) return ult;
    if (xs.length == 1) return fn(xs[0], ult);
    else return fn(xs.splice(0, 1)[0], foldr(fn, ult, xs));
  }
  
  // Maybe transformer
  var Nothing = monad.Nothing;
  var Just = monad.Just;
  var MaybeT = function(m) {
    var maybeT = function(a) {
      if (!(this instanceof maybeT)) return new maybeT(a);
      this.a = a;
    };
    monad.inherits(maybeT, monad.Monad);
    maybeT.prototype.then = function(f) {
      var self = this;
      this.a = this.a.then(function(v) {
        if (v instanceof Nothing) return m.unit(v);
        if (v instanceof Just) return f(v._).a;
      });
      return this;
    };
    maybeT.prototype.inspect = function() {
      return "(MaybeT " + (this.a.inspect ? this.a.inspect() : this.a) + ")";
    };
    maybeT.unit = function(a) {
      return maybeT(m.unit(Just(a)));
    };
    maybeT.lift = function(m1) {
      return maybeT(monad.Monad.liftM(Just, m1));
    };
    maybeT.guard = function(b) {
      return b ? maybeT.unit() : maybeT.mzero();
    };
    maybeT.mzero = function() {
      return maybeT(m.unit(Nothing()));
    };
    maybeT.mplus = function(x, y) {
      return maybeT(x.a.then(function(v) {
        if (v instanceof Nothing) return y.a;
        if (v instanceof Just) return m.unit(v);
      }));
    };
    maybeT.msum = foldr.bind(null, maybeT.mplus, maybeT.mzero());
    return maybeT;
  };
  
  exports.MaybeT = MaybeT;
});

files["lib/cats.js"] = (function(exports, require, module) {
  exports.monad = require("monad");
  exports.monad.Monad["do"] = require("do");
  exports.trans = require("trans");
});

root.cats = require("cats");

})(this);
