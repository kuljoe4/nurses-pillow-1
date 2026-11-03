#!/bin/bash
set -e

echo "Applying patch..."
# We will do this manually by executing the same replacments directly instead of using the tool
# because we encountered merge conflicts while trying to use git restore after git reset
