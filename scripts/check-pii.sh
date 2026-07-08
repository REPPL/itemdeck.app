#!/bin/bash
# Check for hardcoded home paths and PII patterns in staged files
# Part of pre-commit hooks for Claude Code projects

set -e

source "$(dirname "$0")/lib/staged-files.sh"

# Patterns to detect
HOME_PATH_PATTERN="/Users/[^/[:space:]]+|/home/[^/[:space:]]+"
EMAIL_PATTERN="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"

# Exceptions (patterns that are OK)
ALLOWED_EMAILS="noreply@anthropic.com|noreply@github.com|users.noreply.github.com"

found_issues=0

# Get staged files
staged_files=$(list_staged_files)

if [ -z "$staged_files" ]; then
    exit 0
fi

while IFS= read -r file; do
    # Skip binary files and specific directories
    if [[ "$file" == *.png ]] || [[ "$file" == *.jpg ]] || [[ "$file" == *.gif ]] || \
       [[ "$file" == *.ico ]] || [[ "$file" == *.pdf ]] || [[ "$file" == *.zip ]] || \
       [[ "$file" == .git/* ]] || [[ "$file" == node_modules/* ]] || \
       [[ "$file" == __pycache__/* ]] || [[ "$file" == .venv/* ]]; then
        continue
    fi

    # Skip the checker scripts themselves (and their shared helper): they
    # legitimately contain the detection patterns (e.g. /Users/... regex)
    # that this hook hunts for.
    if [[ "$file" == scripts/check-pii.sh ]] || [[ "$file" == scripts/check-british.sh ]] || \
       [[ "$file" == scripts/lib/staged-files.sh ]]; then
        continue
    fi

    # Check the STAGED content (index blob), not the worktree copy: what
    # gets committed is the index, which may differ from the file on disk.
    staged_content=$(git show ":$file" 2>/dev/null) || continue

    # Check for hardcoded home paths
    if printf '%s\n' "$staged_content" | grep -qE "$HOME_PATH_PATTERN"; then
        echo "ERROR: Hardcoded home path found in $file"
        printf '%s\n' "$staged_content" | grep -nE "$HOME_PATH_PATTERN" | head -5
        found_issues=1
    fi

    # Check for email addresses (excluding allowed ones)
    if printf '%s\n' "$staged_content" | grep -qE "$EMAIL_PATTERN"; then
        # Filter out allowed emails
        problematic=$(printf '%s\n' "$staged_content" | grep -oE "$EMAIL_PATTERN" | grep -vE "$ALLOWED_EMAILS" || true)
        if [ -n "$problematic" ]; then
            echo "ERROR: Potential email address found in $file"
            echo "$problematic" | head -5
            found_issues=1
        fi
    fi
done <<< "$staged_files"

if [ $found_issues -eq 1 ]; then
    echo ""
    echo "PII check failed. Please remove personal information before committing."
    echo "Use ~/Development/ or \$HOME instead of absolute home paths."
    echo "Use user@users.noreply.github.com for email placeholders."
    exit 1
fi

exit 0
