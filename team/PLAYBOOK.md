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

## 4. Resume protocol (after a usage-limit pause or a new session)

Run this whenever a check-in fires or a new session starts on this repo:

1. `git pull` the working branch. Read `team/state.json` and the latest file in `team/meetings/`.
2. Read the Boss inbox on the dashboard (`ArtifactData list` on collection `inbox`). Anything new
   from the Boss comes first.
3. For every entry in `state.json → inFlight`: read that person's journal, check the files they
   own, and restart them with a fresh agent told to continue from their journal.
4. Set `status` back to `working` on the dashboard and write a feed entry ("Team back at work").
5. If `status` is `delivered` and the inbox has nothing new, do nothing else.
6. Commit and push after every completed task, meeting or report, so a pause loses at most one
   task's worth of work.

A recurring check-in routine fires into the session every hour to run this protocol. It turns
itself off once the project is delivered and three check-ins in a row find nothing new.
