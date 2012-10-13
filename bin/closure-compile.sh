#!/bin/sh
curl --silent \
     --data-urlencode js_code@- \
     --data "$@" \
     closure-compiler.appspot.com/compile
