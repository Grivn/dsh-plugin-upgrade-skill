#!/bin/bash
# Oracle solution: write the reference report to the agent output directory
# (does not touch the fixture, honoring read-only discipline).
set -e
DIR="$(dirname "$0")"
mkdir -p /app/agent-output/H6-remote-result-trap
cp "$DIR/report.md" /app/agent-output/H6-remote-result-trap/report.md
