cats.js
-------

*(This is an alpha product.)*

Categories for Javascript adapted from Haskell's `Control` modules.

```javascript
var main = Monad.do
  (print("3")) (pause)
  (print("2")) (pause)
  (print("1")) (pause)
  (print("Blast off!"))
  // The closing pair of parentheses is required.
  ();

main.run();
```

Try it out: http://jsfiddle.net/enQyg/3.

### More Examples

[Drag and drop](http://jsfiddle.net/jHX4k/).

```javascript
var dragdrop = function(x) {
  return click(x).then(drag);
}
```

BSD licensed.
