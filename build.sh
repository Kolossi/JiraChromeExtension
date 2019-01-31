#!/bin/bash
\rm -rf build
mkdir build
# npm i minify -g
cat Extension/jiradata.js | grep -v '#DEBUGONLY' | minify --js > build/jiradata.min.js
cat Extension/fireit.js | grep -v '#DEBUGONLY' | minify --js > build/fireit.min.js
cat Extension/options.js | grep -v '#DEBUGONLY' | minify --js > build/options.min.js
cat Extension/styles.css | grep -v '#DEBUGONLY' | minify --css > build/styles.min.css
cat Extension/options.html | grep -v '#DEBUGONLY' | sed 's/\.\(js\|css\|html\)/.min.\1/' | minify --html > build/options.min.html
cp Extension/*.png build
cp Extension/jquery-3.1.0.js build/jquery-3.1.0.min.js
cat Extension/manifest.json | grep -v '#DEBUGONLY' | sed 's/\.\(js\|css\|html\)/.min.\1/' > build/manifest.json
