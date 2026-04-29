# Flow Task Manager

This repository uses `CLAUDE.md` as the canonical project instruction file.

## Required Reading

- Read `CLAUDE.md` before making code changes, reviews, or test updates.
- Read `flow-task-manager-design.md` for backend/domain behavior changes.
- Read `flow-task-manager-frontend.md` for frontend/screen behavior changes.

## Agent Entry Point

- For broad UI/UX or frontend presentation tasks, start from `.agents/design-orchestrator.md`.
- For role-specific work, use `.agents/agent-index.md` to choose the relevant agent file.
- Read `.agents/shared-rules.md` before applying any role-specific agent.

## Subagent Usage

- Use subagents proactively when a task benefits from parallel investigation, review, verification, or clearly separated implementation work.
- Use explorer subagents for codebase research, dependency tracing, existing pattern discovery, and risk checks.
- Use worker subagents only for bounded implementation tasks with clear file ownership.
- Do not use subagents for trivial single-file changes or when delegation would block the main critical path.
- The main agent remains responsible for integration, final verification, and user-facing summary.

## Working Rule

- If `AGENTS.md` and `CLAUDE.md` ever differ, follow `CLAUDE.md` and update this file only to preserve that pointer.
