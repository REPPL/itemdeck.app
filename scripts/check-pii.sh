#!/bin/bash
# Check for hardcoded home paths and PII patterns in staged files
# Part of pre-commit hooks for Claude Code projects

set -e

# Patterns to detect
HOME_PATH_PATTERN="/Users/[^/]+/|/home/[^/]+"
EMAIL_PATTERN="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"

# Exceptions (patterns that are OK)
ALLOWED_EMAILS="noreply@anthropic.com|noreply@github.com|users.noreply.github.com"

found_issues=0

# Get staged files
staged_files=$(git diff --cached --name-only --diff-filter=d 2>/dev/null || echo "")

if [ -z "$staged_files" ]; then
    exit 0
fi

for file in $staged_files; do
    # Skip binary files and specific directories
    if [[ "$file" == *.png ]] || [[ "$file" == *.jpg ]] || [[ "$file" == *.gif ]] || \
       [[ "$file" == *.ico ]] || [[ "$file" == *.pdf ]] || [[ "$file" == *.zip ]] || \
       [[ "$file" == .git/* ]] || [[ "$file" == node_modules/* ]] || \
       [[ "$file" == __pycache__/* ]] || [[ "$file" == .venv/* ]]; then
        continue
    fi

    # Check if file exists
    if [ ! -f "$file" ]; then
        continue
    fi

    # Skip the checker scripts themselves: they legitimately contain the
    # detection patterns (e.g. /Users/... regex) that this hook hunts for.
    if [[ "$file" == scripts/check-pii.sh ]] || [[ "$file" == scripts/check-british.sh ]]; then
        continue
    fi

    # Check for hardcoded home paths
    if grep -qE "$HOME_PATH_PATTERN" "$file" 2>/dev/null; then
        echo "ERROR: Hardcoded home path found in $file"
        grep -nE "$HOME_PATH_PATTERN" "$file" 2>/dev/null | head -5
        found_issues=1
    fi

    # Check for email addresses (excluding allowed ones)
    if grep -qE "$EMAIL_PATTERN" "$file" 2>/dev/null; then
        # Filter out allowed emails
        problematic=$(grep -oE "$EMAIL_PATTERN" "$file" 2>/dev/null | grep -vE "$ALLOWED_EMAILS" || true)
        if [ -n "$problematic" ]; then
            echo "ERROR: Potential email address found in $file"
            echo "$problematic" | head -5
            found_issues=1
        fi
    fi
done

if [ $found_issues -eq 1 ]; then
    echo ""
    echo "PII check failed. Please remove personal information before committing."
    echo "Use ~/Development/ or \$HOME instead of absolute home paths."
    echo "Use user@users.noreply.github.com for email placeholders."
    exit 1
fi

exit 0
