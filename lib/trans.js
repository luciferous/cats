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
