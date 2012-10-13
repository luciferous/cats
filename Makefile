quicktest:
	NODE_PATH=lib node quicktest

dist: dist/cats.js dist/cats.min.js

dist/cats.js: lib cats.js.sh
	mkdir -p dist
	./cats.js.sh > dist/cats.js

dist/cats.min.js: dist/cats.js
	bin/closure-compile.sh output_info=compiled_code < dist/cats.js > dist/cats.min.js

warn:
	bin/closure-compile.sh output_info=warnings warning_level=VERBOSE < dist/cats.js

test: lib

.PHONY: test warn
