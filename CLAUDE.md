# Project guide for Claude Code sessions

This repo is built by a virtual team (see `team/ROSTER.md`) run by the main Claude Code session,
which plays the Manager, Omar Farooq.

On any new session, scheduled check-in, or after a usage-limit pause, first read `team/STATUS.md`
(where we are, what's next, how to resume) and `team/MISTAKES.md` (mistakes not to repeat), then
follow the resume protocol in `team/PLAYBOOK.md` section 4 before doing anything else. Live state is in `team/state.json`; the
live dashboard URL is in `team/state.json → dashboard.url`.

- Product code: `app/` (static ES modules, no build step). Food data: `app/data/` (Nutrition Lab).
- Tests: `npm test` (unit, `node --test`) and `npm run test:e2e` (Playwright) once they exist.
- Commit after every completed task, meeting or report, and push to the working branch.
- Update `team/STATUS.md` after every event (agent start/finish, Boss message, meeting, report, pause).
- Add to `team/MISTAKES.md` the same day whenever anyone makes or finds a mistake.
- Done means visible in the app: research and docs written for the user must reach `app/` (MISTAKES M-01).
