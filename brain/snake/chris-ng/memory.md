---
tags: [agent, memory, qa]
date: 2026-04-29
status: active
---

# Chris Ng — QA Agent Memory

## Skills
- TypeScript
- Testing
- Git
- Build Tools
- Authentication

## Short-Term Memory
- ✅ Done. Here's what was delivered:

---

## Summary

### Root Cause of Original Failure
The previous QA attempt used the shell built-in `test` command (e.g., `test -f app.py`) in acceptance criteria, 
- Done. Here's a summary of what was done:

## Summary

The failing machine criteria were looking for `.github/workflows/ci.yml` in the worktree directory, but the QA branch only had `app.py` and `requi

## Long-Term Knowledge
- Frequently works with: summary

## Rules
- Inherits global rules

## Completed Tasks
### 2026-04-29 — ## Upstream Context (1/1 message(s))

[AGENT_QUERY] Query from agent
Q: Review this ticket's implementation. Return ONLY valid JSON. Ticket: "Write tests for failing ticket e2c0c918" Requirement: The following ticket failed quality review: **Original ticket:** e2c0c918

---

## Your Task

Write tests for failing ticket e0085b66

The following ticket failed quality review:

**Original ticket:** e0085b66-1c58-45e6-9bb5-198275fb7e30
**Failure reason:** Your previous attempt failed these machine criteria:
- command_succeeds: Command not allowed: "test". Allowed: vitest, jest, npm, npx, tsc, grep, ls, cat, wc. No shell operators.
- command_succeeds: Command not allowed: "test". Allowed: vitest, jest, npm, npx, tsc, grep, ls, cat, wc. No shell operators.

Fix these issues and try again.

Write automated tests that:
1. Reproduce the failure described above
2. Verify the fix once applied
3. Cover the acceptance criteria of the original ticket

After writing tests, update the original ticket's acceptance_criteria to include a test_passes criterion.

⚠ CONFLICT AVOIDANCE: Other agents have open MRs touching these files: .github/workflows/ci.yml, brain/snake/chris-ng/memory.md, src/__tests__/github-actions-ci.test.ts. Avoid editing them unless necessary — prefer additive changes. If you must touch a shared file, leave a note in your commit message.
✅ Done. Here's what was delivered:

---

## Summary

### Root Cause of Original Failure
The previous QA attempt used the shell built-in `test` command (e.g., `test -f app.py`) in acceptance criteria, which is not in the allowed list (`vitest, jest, npm, npx, tsc, grep, ls, cat, wc`).

### What Was F

### 2026-04-29 — Write tests for failing ticket e2c0c918

The following ticket failed quality review:

**Original ticket:** e2c0c918-7dc8-4b51-8eb9-99ee1a00eea1
**Failure reason:** Your previous attempt failed these machine criteria:
- file_exists: File not found: .github/workflows/ci.yml
- grep_match: File not found: .github/workflows/ci.yml
- grep_match: File not found: .github/workflows/ci.yml

Fix these issues and try again.

Write automated tests that:
1. Reproduce the failure described above
2. Verify the fix once applied
3. Cover the acceptance criteria of the original ticket

After writing tests, update the original ticket's acceptance_criteria to include a test_passes criterion.
Done. Here's a summary of what was done:

## Summary

The failing machine criteria were looking for `.github/workflows/ci.yml` in the worktree directory, but the QA branch only had `app.py` and `requirements.txt` from an old Python-era commit.

### Files Created

**`.github/workflows/ci.yml`** — The

