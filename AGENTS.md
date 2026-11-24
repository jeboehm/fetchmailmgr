# fetchmailmgr — Agent Guide

fetchmailmgr bridges `fetchmail` and [docker-mailserver](https://github.com/jeboehm/docker-mailserver). It reads the external mail accounts that [mailserver-admin](https://github.com/jeboehm/mailserver-admin) stores in Redis (key `fetchmail_accounts`, a JSON array), writes one `.fetchmailrc` per account, runs `fetchmail` for each account every interval, delivers the mail to the mailserver (SMTP or LMTP) and exposes a health endpoint (default port 3000). Stack: Node.js (ESM, `"type": "module"`), Fastify, `redis`, `commander`; tests with Jest, style with `standard`.

User documentation of all three projects lives in `jeboehm/docker-mailserver/docs` (see "Documentation PRs").

## Development workflow

**Skills.** Install [mattpocock/skills](https://github.com/mattpocock/skills): `claude plugin install mattpocock-skills@claude-plugins-official` (Claude Code) or `npx skills@latest add mattpocock/skills` (other agents). The "Agent skills" section below and `docs/agents/*` configure them for this repository (issue tracker, triage labels, domain docs).

**Full cycle — features and anything with a design decision:**

1. `/grill-me` — interview the requester until goal, scope and edge cases are clear.
2. `/to-spec` — write the spec as a GitHub issue in this repository.
3. `/to-tickets` — split it into tracer-bullet sub-issues with blocking links.
4. `/implement-spec` — implement on a branch in a dedicated Git worktree (never on `main`, never in a checkout another agent uses); conventional commits; `npm test` and `npm run lint` must pass.
5. `/code-review` — review the branch against `main` (standards and spec), fix the findings.
6. `/pr` — write the body and open the PR against `main`.

**Shortcut — bug fixes, chores and minor improvements:** skip steps 1–3 and start at `/implement-spec`; `/code-review` and `/pr` still apply. Because there is no spec issue, the PR description carries the context: what was wrong or missing, why this change, how it was verified. If the shortcut uncovers a design question, stop and go back to step 1. A "minor improvement" changes no public interface, configuration or data format; anything that does takes the full cycle.

**Definition of done.** An open PR that implements the feature or fixes the bug, with CI green (or failures explained in the PR). Then shut down and clean up: `docker compose down -v` if the stack was started; `git worktree remove <path>`; delete the local branch (the remote branch stays for the PR).

**Documentation PRs.** When a change affects users in a real way, open a docs PR in `jeboehm/docker-mailserver` (`docs/`), cross-linked with the code PR. Affects users: new/changed/removed environment variable or default, new feature, changed behaviour, new command-line option, breaking change or upgrade step, new port, changed Redis contract (key `fetchmail_accounts`, `fetchmail_accounts_runtime_<id>`, `fetchmail_accounts_running_<id>`). Does not: refactoring, tests, CI, internal dependency bumps, code style. Keep the "Environment Variables" and "Command Line Options" lists in `README.md` in sync as well.

## Ground rules

- Conventional commits (`feat:`, `fix:`, `docs:`, `chore:` …; `!`/`BREAKING CHANGE` for breaking changes). `create-release.yml` derives the next release from them once a day (or on manual dispatch), so choose the type deliberately (a `docs:` or `chore:` commit alone does not trigger a release).
- Never push to `main`; open a PR. Merge, tag and release only after the owner approved.
- Account passwords exist only in Redis and in the per-account `.fetchmailrc` (mode `0600`) in `TEMP_DIR`; do not log or persist them elsewhere.
- ESM only: relative imports need the `.js` extension; `standard` style (no semicolons, 2 spaces).
- Renovate manages dependency updates (`renovate.json`); do not bump versions by hand unless required.

## Build and test

```bash
npm install
npm test               # Jest (node --experimental-vm-modules)
npm run test:coverage  # with coverage report
npm run lint           # standard on src/ and tests/ (CI runs this)
npm run csfix          # auto-fix style
npm start              # node src/index.js
docker compose up --build -d --wait   # app + Redis; health check: curl http://localhost:3000/healthz
```

- Tests live in `tests/<module>.test.js`, one file per `src/<module>.js`.
- `FETCHMAIL_SMTP_ADDRESS` is required at import time of `src/env.js`; tests either set `process.env` before a dynamic import (`tests/env.test.js`) or mock `src/env.js` (`tests/config.test.js`).
- Prefill Redis for manual testing: see "Development" in `README.md`.

## Architecture

- `src/index.js` — entry point: CLI options (`commander`: `--debug`, `--interval`, `--server`, `--port`), signal handlers, connects Redis, starts the health server, schedules `loop`.
- `src/app.js` — shared `state` (`ready`, `healthy`, `processesRunning`), `loop` (read accounts, sync config, start process), graceful `exit`.
- `src/accounts.js` — reads and parses the `fetchmail_accounts` key; returns `false` if absent.
- `src/config.js` — renders and writes `<TEMP_DIR>/<account id>/.fetchmailrc`, only rewriting when the content changed.
- `src/runtime.js` — runs `fetchmail` per account and writes results to Redis: `fetchmail_accounts_runtime_<id>` (JSON `lastRun`, `lastLog`, `isSuccess`) and `fetchmail_accounts_running_<id>` (set while running, with expiry). Exit code > 1 counts as failure.
- `src/healthz.js` — Fastify server: `/healthz` (process healthy) and `/readyz` (first loop done); 200 `ok` or 503 `error`.
- `src/redisconnection.js` — Redis client; uses `REDIS_HOST` + `REDIS_PORT` (with optional `REDIS_PASSWORD`, `REDIS_DB`) if both set, otherwise `REDIS_URL`.
- `src/env.js` — the only place environment variables are read.
- The account object schema (`id`, `host`, `protocol`, `port`, `username`, `password`, `ssl`, `verifySsl`, `user`) is a contract with mailserver-admin; changing it requires a coordinated change there (see `README.md`).

### Environment variables

Defined in `src/env.js`; the container defaults are set in `Dockerfile`.

- `REDIS_URL` — default `redis://localhost:6379`; `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB` take precedence when host and port are set.
- `FETCHMAIL_SMTP_ADDRESS` — required; `host:port` is converted to fetchmail's `host/port` form.
- `FETCHMAIL_USE_LMTP` — `true` enables LMTP, default off.
- `FETCHMAIL_PATH` — fetchmail binary, default `/usr/bin/fetchmail`.
- `TEMP_DIR` — per-account config directory; default `/tmp` in code, `/run/fetchmailmgr` in the image.
- `DEBUG` — any value enables debug output (same as `--debug`).

## CI and release

- `.github/workflows/test.yml` (PRs): lint and tests on Node 22, plus a Compose stack health check.
- `.github/workflows/build-multiarch.yml` (push to `main`/`next`, `v*` tags): multi-arch image to `ghcr.io/jeboehm/fetchmailmgr`, signed with cosign.
- `.github/workflows/create-release.yml` (daily `schedule` at 01:37 UTC, `workflow_dispatch`): conventional-changelog determines the version from the commits since the last tag and creates the GitHub release; a day without releasable commits is skipped, a manual dispatch forces a release. The tag is pushed with `GH_RELEASE_PAT` so that it triggers `build-multiarch.yml`.
- `.github/workflows/renovate.yml`: validates `renovate.json` on PRs.

## Agent skills

### Issue tracker

Issues live in GitHub Issues on `jeboehm/fetchmailmgr`, accessed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default labels, each named after its role: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repository root, created when first needed. See `docs/agents/domain.md`.
