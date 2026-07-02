#!/bin/bash
# Check for American English spellings in markdown files
# Part of pre-commit hooks for Claude Code projects

set -e

# American English patterns to flag (word boundaries)
# Format: american|british
PATTERNS=(
    "organize|organise"
    "organizing|organising"
    "organized|organised"
    "organization|organisation"
    "color|colour"
    "colors|colours"
    "colored|coloured"
    "behavior|behaviour"
    "behaviors|behaviours"
    "behavioral|behavioural"
    "optimize|optimise"
    "optimizing|optimising"
    "optimized|optimised"
    "optimization|optimisation"
    "specialize|specialise"
    "specializing|specialising"
    "specialized|specialised"
    "specialization|specialisation"
    "customize|customise"
    "customizing|customising"
    "customized|customised"
    "customization|customisation"
    "analyze|analyse"
    "analyzing|analysing"
    "analyzed|analysed"
    "favor|favour"
    "favoring|favouring"
    "favored|favoured"
    "favorite|favourite"
    "center|centre"
    "centers|centres"
    "centered|centred"
    "labor|labour"
    "labeling|labelling"
    "labeled|labelled"
    "honor|honour"
    "honored|honoured"
    "catalog|catalogue"
    "dialog|dialogue"
    "traveled|travelled"
    "traveling|travelling"
    "canceled|cancelled"
    "canceling|cancelling"
    "modeled|modelled"
    "modeling|modelling"
    "signaled|signalled"
    "signaling|signalling"
    "fulfill|fulfil"
    "fulfilling|fulfilling"
    "enrollment|enrolment"
    "license|licence"
)

# Build grep pattern from American spellings only
AMERICAN_WORDS=""
for pair in "${PATTERNS[@]}"; do
    american="${pair%%|*}"
    if [ -z "$AMERICAN_WORDS" ]; then
        AMERICAN_WORDS="$american"
    else
        AMERICAN_WORDS="$AMERICAN_WORDS|$american"
    fi
done

found_issues=0

# Get staged markdown files
staged_files=$(git diff --cached --name-only --diff-filter=d 2>/dev/null | grep -E '\.md$' || echo "")

if [ -z "$staged_files" ]; then
    exit 0
fi

for file in $staged_files; do
    # Skip if file doesn't exist
    if [ ! -f "$file" ]; then
        continue
    fi

    # Check for American English (case insensitive, word boundaries)
    matches=$(grep -niE "\b($AMERICAN_WORDS)\b" "$file" 2>/dev/null || true)

    if [ -n "$matches" ]; then
        # Filter out exceptions (code blocks, URLs, library names)
        filtered=$(echo "$matches" | grep -vE '```|https?://|colorama|behavior-tree|node_modules' || true)

        if [ -n "$filtered" ]; then
            echo "ERROR: American English found in $file"
            echo "$filtered" | head -10
            found_issues=1
        fi
    fi
done

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
