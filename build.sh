#!/bin/bash
\rm -rf build
mkdir build
uglifyjs Extension/fireit.js -o build/fireit.min.js
uglifyjs Extension/options.js -o build/options.min.js
cp Extension/*.png build
cp Extension/*.min.js build
cp Extension/*.json build
cp Extension/*.html build
