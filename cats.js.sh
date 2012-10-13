#!/bin/sh

cat <<EOF
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
`cat lib/monad.js | sed s/^/\ \ /`
});

files["lib/do.js"] = (function(exports, require, module) {
`cat lib/do.js | sed s/^/\ \ /`
});

files["lib/trans.js"] = (function(exports, require, module) {
`cat lib/trans.js | sed s/^/\ \ /`
});

files["lib/cats.js"] = (function(exports, require, module) {
`cat lib/cats.js | sed s/^/\ \ /`
});

root.cats = require("cats");

})(this);
EOF
