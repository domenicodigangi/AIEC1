# Session 14 Homework

## Plan

- [x] Worktree + `.env` from `10_LLM_Servers/.env`
- [x] `uv sync` and execute `14_multimodal_rag/multimodal_rag.ipynb`
- [x] Fill Questions #1–4
- [x] Activity #1: custom queries + observations
- [x] Activity #2: gold eval + observations
- [x] Verify: no placeholders, cells executed, `.env` not staged

## Review

- Worktree: `.claude/worktrees/session-14-homework` on branch `session-14-homework`
- Forced CPU-only `torch` in `pyproject.toml` to fit disk (CUDA wheels would not install)
- Notebook: 25/25 code cells executed, 0 errors
- Generation read `$27M` from chart pixels; video answer cited `[00:26-00:37]`
- Activity 2 recall@3: A=1.00, B=0.30, C=1.00 (n=10)
- Remaining for user: Loom ≤5 min + optional assignment form
