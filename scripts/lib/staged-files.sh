#!/bin/bash
# Shared helper for pre-commit check scripts: harvest staged files
# Part of pre-commit hooks for Claude Code projects
#
# Source this file, then call list_staged_files with an optional
# extended-regex path filter. Prints staged (non-deleted) paths, each
# terminated by a NUL byte. Callers read the staged blob (git show :<path>),
# so paths are listed even when the worktree copy has since been removed.
#
# core.quotePath=false plus NUL termination is required for correctness: with
# the git default (quotePath=true) a path containing a non-ASCII, backslash,
# quote, or newline character is emitted C-quoted (e.g. "caf\303\251.md"), and
# `git show :<that>` then fails, silently skipping the file. NUL termination
# also means such paths are never split apart. Callers must read with
# `read -r -d ''`.

list_staged_files() {
    local filter="${1:-.}"
    git -c core.quotePath=false diff --cached --name-only --diff-filter=d -z 2>/dev/null \
        | grep -zE "$filter" 2>/dev/null
    return 0
}
