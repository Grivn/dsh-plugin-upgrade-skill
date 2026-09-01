#!/bin/bash
set -e
ROOT="$(dirname "$0")"
cp "$ROOT/plugin/src/register.js" /app/fixture/src/register.js
cp "$ROOT/plugin/test/register.test.js" /app/fixture/test/register.test.js
