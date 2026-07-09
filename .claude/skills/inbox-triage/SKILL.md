---
name: inbox-triage
description: Clean up the Gmail inbox — label threads by action needed, flag deadlines, and queue reply drafts for approval. Use when JD says "triage my inbox", "clean up my email", or "draft replies to whatever needs one".
---

Triage JD's Gmail inbox. Delegate to the `executive-assistant` agent (or do it
directly if you already are that agent).

## Process

1. Search recent inbox threads (default: last 3 days, or the window JD names).
2. Ensure these labels exist, creating any that are missing:
   `EA/Action`, `EA/Waiting`, `EA/Deadline`, `EA/FYI`.
3. For each substantive thread, apply exactly one:
   - `EA/Action` — JD needs to reply or decide
   - `EA/Waiting` — JD is owed a response
   - `EA/Deadline` — carries a hard date (also note the date)
   - `EA/FYI` — informational
   Leave automated mail, receipts, and newsletters untouched.
4. For each `EA/Action` thread where the right reply is obvious, write a draft
   with `create_draft` in JD's voice: short, plain, direct. Never send —
   Gmail drafts are the hand-off point.

## Report

Finish with a summary table: thread subject, sender, label applied, deadline if
any, and whether a draft is waiting. Below it, list anything you deliberately
skipped and why, and any thread you couldn't classify — those need JD's eyes.
