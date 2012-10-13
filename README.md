cats.js
-------

*(This is an alpha product.)*

Categories for Javascript adapted from Haskell's `Control.Monad`.

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


BSD licensed.
