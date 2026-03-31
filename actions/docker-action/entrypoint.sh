#!/bin/sh -l

MESSAGE=${1:-"Hello from Docker action!"}
echo "::notice::${MESSAGE}"
echo "result=${MESSAGE}" >> "$GITHUB_OUTPUT"
