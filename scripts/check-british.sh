#!/bin/bash
# Check for American English spellings in markdown files
# Part of pre-commit hooks for Claude Code projects

set -e

source "$(dirname "$0")/lib/staged-files.sh"

# American English spellings to flag (word boundaries)
# Note: no entry for "license" (valid British verb form; the noun is
# "licence") or "fulfilling" (spelled the same in both dialects).
AMERICAN_SPELLINGS=(
    "organize"
    "organizing"
    "organized"
    "organization"
    "color"
    "colors"
    "colored"
    "behavior"
    "behaviors"
    "behavioral"
    "optimize"
    "optimizing"
    "optimized"
    "optimization"
    "specialize"
    "specializing"
    "specialized"
    "specialization"
    "customize"
    "customizing"
    "customized"
    "customization"
    "analyze"
    "analyzing"
    "analyzed"
    "favor"
    "favoring"
    "favored"
    "favorite"
    "center"
    "centers"
    "centered"
    "labor"
    "labeling"
    "labeled"
    "honor"
    "honored"
    "catalog"
    "dialog"
    "traveled"
    "traveling"
    "canceled"
    "canceling"
    "modeled"
    "modeling"
    "signaled"
    "signaling"
    "fulfill"
    "enrollment"
)

# Build grep pattern from American spellings
AMERICAN_WORDS=$(IFS='|'; echo "${AMERICAN_SPELLINGS[*]}")

found_issues=0

# Get staged markdown files
staged_files=$(list_staged_files '\.md$')

if [ -z "$staged_files" ]; then
    exit 0
fi

while IFS= read -r file; do
    # Check the STAGED content (index blob), not the worktree copy: what
    # gets committed is the index, which may differ from the file on disk.
    # Strip fenced code block content (toggling on ``` delimiter lines),
    # then check for American English (case insensitive, word boundaries)
    matches=$(git show ":$file" 2>/dev/null \
        | awk '/^[[:space:]]*```/ { in_fence = !in_fence; next } !in_fence { printf "%d:%s\n", NR, $0 }' \
        | grep -iE "\b($AMERICAN_WORDS)\b" || true)

    if [ -n "$matches" ]; then
        # Filter out exceptions (inline code, URLs, library names)
        filtered=$(echo "$matches" | grep -vE '```|https?://|colorama|behavior-tree|node_modules' || true)

        if [ -n "$filtered" ]; then
            echo "ERROR: American English found in $file"
            echo "$filtered" | head -10
            found_issues=1
        fi
    fi
done <<< "$staged_files"

if [ $found_issues -eq 1 ]; then
    echo ""
    echo "British English check failed. Please use British spellings:"
    echo "  organize → organise"
    echo "  color → colour"
    echo "  behavior → behaviour"
    echo "  optimize → optimise"
    echo "  center → centre"
    echo ""
    echo "Exceptions: library names, URLs, code blocks, external API references"
    exit 1
fi

exit 0
