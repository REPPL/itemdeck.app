#!/bin/bash
# Shared helper for pre-commit check scripts: harvest staged files
# Part of pre-commit hooks for Claude Code projects
#
# Source this file, then call list_staged_files with an optional
# extended-regex path filter. Prints one staged (non-deleted) path per
# line. Callers read the staged blob (git show :<path>), so paths are
# listed even when the worktree copy has since been removed.

list_staged_files() {
    local filter="${1:-.}"
    git diff --cached --name-only --diff-filter=d 2>/dev/null \
        | grep -E "$filter" 2>/dev/null
    return 0
}
