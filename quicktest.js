if (!process.env.NODE_PATH) {
  console.log("Usage: NODE_PATH=lib node quicktest");
  return;
};

var monad = require("monad");
var Monad = monad.Monad;
Monad.do = require("do");
var Category = monad.Category;

// Id tests
var Id = monad.Id;

var t0 = Id(1).then(function(x) {
  return Id(2).then(function(y) {
  return Id(3).then(function(z) {
  return Id([x, y, z]);
  }); }); });

console.log(t0);

var t0_ = Monad.do
  ({ x: Id(1) })
  ({ y: Id(2) })
  ({ z: Id(3) })
  (Id, "[x, y, z]")();

console.log(t0_);

// Cont tests
var Cont = monad.Cont;
var pause = monad.pause;
var print = monad.print;

var t1 = Monad.do
  (Cont.unit(1))();

t1.run(console.log);

var t1_ = Monad.do
  ({ k: Cont.callCC(function(k) {
    return Monad.do
      (k("hi there"))
      (k("yayayaya"))
      (Cont.unit(1))();
  }) })();

t1_.run(console.log);

var t1__ = Monad.do
  (pause)
  (print("delayed Hello world"))();

t1__.run(console.log);

// Maybe tests
var Just = monad.Just;
var Nothing = monad.Nothing;

var t2 = Just(1);

console.log(t2.fmap(function(x) { return x + 1; }));

var t2_ = Nothing();

console.log(t2_.fmap(function(x) { return x + 1; }));

// MaybeT tests
var trans = require("./lib/trans");
var MaybeT = trans.MaybeT;
var print = monad.print;
var getLine = monad.getLine;

var MaybeId = MaybeT(Id);

var t3 = MaybeId.unit(1).then(function(x) {
  return MaybeId.lift(Id.unit(3)).then(function(y) {
  return MaybeId.unit(x + y)
  }); });

console.log(t3);

var t3_ = Monad.do
  ({ x: MaybeId.unit(1) })
  ({ y: MaybeId.lift(Id.unit(3)) })
  (MaybeId.unit, "x + y")();

console.log(t3_);

var MaybeCont = MaybeT(Cont);

var isValid = function(pwd) {
  return pwd.length > 8;
};

var getPassword = Monad.do
  (print("Enter a password:"))
  (getLine)();

var getValidPassword = Monad.do
  ({ s: MaybeCont.lift(getPassword) })
  (Category.dot(MaybeCont.guard, isValid), "s")
  (MaybeCont.unit, "s")();

MaybeCont.msum([getValidPassword, getValidPassword]).a.run(console.log);
