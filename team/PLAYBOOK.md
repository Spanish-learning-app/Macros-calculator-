# Team Playbook

How the team works, how it records its work, and how it picks up again after a pause
(for example when Claude Code hits its usage limit and the limit later resets).

## 1. Operating rhythm

1. **Kickoff meeting** (everyone in the Meeting Room). Each lead brings a short memo: plan, needs,
   hiring requests, risks. The Manager writes minutes with decisions.
2. **Sprint work** (everyone in their own office). Each lead runs their own team. Hires work on
   tasks their lead assigned. Engineers never test their own work alone: a second engineer
   cross-tests it.
3. **Review meeting** at the end of each sprint. Engineering demos, Nutrition reports on data
   quality, the Customer Panel reports what it is like to use. The Manager decides priorities and
   whether to hire more people.
4. **Report to the Boss** when a milestone is reached, when a decision only the Boss can make
   comes up, or when the product is ready to use.

The Manager may call a meeting at any time. A lead may ask the Manager for one.

## 2. Where everything lives

| What | Where |
|------|-------|
| Brief from the Boss | `docs/BRIEF.md` |
| Who is on the team | `team/ROSTER.md` |
| Live state (phase, who is where, in-flight work) | `team/state.json` |
| Human-readable status: where we are, what's next, how to resume | `team/STATUS.md` |
| Mistakes and lessons (read before working) | `team/MISTAKES.md` |
| Meeting minutes | `team/meetings/NNN-title.md` |
| Reports to the Boss | `team/reports/NNN-title.md` |
| Each person's work log | `team/journals/<id>.md` |
| Job briefs for hires | `team/briefs/<id>.md` |
| The product | `app/` |
| The live office dashboard (source) | `dashboard/team-hq.html` |

The live dashboard is a claude.ai Artifact whose database mirrors `team/state.json`.
Its URL is stored in `team/state.json` under `dashboard.url`.

## 3. Rules for every team member

- Write progress to your journal (`team/journals/<id>.md`) as you go, not only at the end.
  If work stops suddenly, the next person must be able to continue from your journal.
- Only edit the files your lead assigned to you. Ask through your final report if you need
  something changed elsewhere.
- Do not commit or push. The Manager commits at each checkpoint.
- Finish with a short report: what you did, what is left, what you need, risks.

## 3a. Definition of done (learned 2026-10-16, MISTAKES M-01)

- A task that makes something for the user (a recipe, a method, a tip, a table, a plan) is **done only
  when the Boss can see it in the app**, or when a written decision in `team/DECISIONS.md` keeps it out.
- Every brief names the app field or screen each output lands in. If the data contract has no field
  for it, the brief adds one.
- Before every review meeting and every report to the Boss, the Manager runs the **orphan check**:
  what the Lab and docs produced vs. what the app shows. Open items are listed in `team/STATUS.md`.
- Anyone who makes or finds a mistake writes it in `team/MISTAKES.md` the same day.

## 4. Resume protocol (after a usage-limit pause or a new session)

Run this whenever a check-in fires or a new session starts on this repo:

1. `git pull` the working branch. Read `team/STATUS.md`, `team/MISTAKES.md`, `team/state.json` and the
   latest file in `team/meetings/`.
2. Read the Boss inbox on the dashboard (`ArtifactData list` on collection `inbox`). Anything new
   from the Boss comes first.
3. For every entry in `state.json → inFlight`: read that person's journal, check the files they
   own, and restart them with a fresh agent told to continue from their journal. Then start
   `state.json → queued` entries as desks free up (still at most three agents at once).
4. Set `status` back to `working` on the dashboard and write a feed entry ("Team back at work").
5. If `status` is `delivered` and the inbox has nothing new, do nothing else.
6. Commit and push after every completed task, meeting or report, so a pause loses at most one
   task's worth of work. Update `team/STATUS.md` at the same time.
7. **Budget rule (learned 2026-10-14).** Restart people with a *fresh* agent that reads their brief
   and journal. Never resume a long-running agent by replaying its whole transcript: six such
   resumes used up a full usage window in about ten minutes. Run at most three agents at once, and
   give each a tight, single deliverable.

8. **Model choice (Boss's rule, 2026-10-18): use the cheapest model that keeps the quality.**
   - **Opus:** only for work that needs judgement and touches many files: app features and fixes in app/core and app/ui (Lena), recipe and plan data with build checks (Yusuf), and nutrition rulings (Ayesha).
   - **Sonnet:** tests and QA (Kenji), tester reviews and re-checks (customer panel), data rebuilds and alias or record additions (Javier, Zainab), UI polish with a clear spec (Priya), and read-only audits.
   - **Haiku:** mechanical checks only, such as "does X appear in file Y" sweeps or counting.
   - Every brief stays tight: one deliverable and a "read only these files" list.
   - The Manager keeps dashboard writes to one batch per event, and never reads large files or transcripts into the main session.
   - Quality guard: whatever model did the work, a fix is accepted only after `npm run check`, the e2e suite, and the Manager's own tap-through (M-14).

9. **Working hours (Boss's rule, 2026-10-14).** The team works only **18:00–10:00 Europe/Madrid**.
   From 10:00 to 18:00 the Boss uses Claude for other work, so no agents run and no check-ins fire.
   The 09:09 check-in starts no new agents: it commits, pushes and marks the team off duty. If the
   Boss messages the session during the day and asks the team to work, that is fine: it is their call.

A recurring check-in routine fires into the session every hour from 18:09 to 09:09 Madrid time to run this protocol. It turns
itself off once the project is delivered and three check-ins in a row find nothing new.
