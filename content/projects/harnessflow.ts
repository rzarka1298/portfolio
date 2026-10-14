import type { ProjectPage } from './types';

const harnessflow: ProjectPage = {
  slug: 'harnessflow',
  title: 'HarnessFlow',
  tagline:
    'A durable coding harness that turns a PRD and a Git repo into a verified branch, with frozen acceptance checks, a repair loop, and evidence bound to the exact commit.',
  status: 'Local single-user release · active development',
  summary: [
    'HarnessFlow takes a product requirements document (PRD) and a local Git repository and runs a bounded, resumable coding effort: plan the work, have an independent reviewer approve the plan, implement each task with the Codex CLI in an isolated worktree, run the frozen acceptance commands, and repair failures until the evidence is clean or a limit is hit.',
    'Orchestration is a Go service on Temporal; execution is a Python worker that owns the worktree, a host-level repository lock, and supervised Codex subprocesses. A Next.js dashboard (and a small CLI) show plan, tasks, per-check evidence, review and judge verdicts, and the final diff.',
    'A run only counts as complete when every planned task is done, every frozen check exits 0 on the delivered commit, the worktree is clean, and both a read-only review and a per-requirement judge pass. A model saying "done" is never treated as completion evidence.',
  ],
  problem: [
    'Coding agents are good at producing code and bad at proving they finished. A long agent session can drift, quietly weaken tests, or claim success with no record of what was checked or on which revision.',
    'Long runs also need to survive crashes, pauses, and budget limits without losing work or letting two writers touch the same repository at once.',
    'HarnessFlow handles agent output as untrusted. Acceptance criteria are fixed before any code is written, real exit codes come from a sandboxed command runner, and every step checkpoints to durable state so the run can stop and resume without losing work.',
  ],
  highlights: [
    {
      title: 'Acceptance criteria frozen before code is written',
      body: 'The planner must link every requirement to an implementation task and an executable argv check (no `echo`/`true` no-ops; validated by a Pydantic model). A separate read-only review has to accept the plan before the checks are frozen, and coding attempts are told they cannot redefine them.',
    },
    {
      title: 'Completion is one predicate, not a model opinion',
      body: '`completion_ready()` requires every task completed, and for every frozen check a recorded exit code of 0 with the same argv, requirement IDs and commit as HEAD, plus a passing review and a judge verdict for every requirement at that commit. Delivery re-checks this against `git rev-parse HEAD` and a clean `git status`.',
    },
    {
      title: 'Repair loop with built-in stop conditions',
      body: 'Failed checks, review findings or judge gaps send the run to a repair attempt that has to keep the frozen checks intact. If the same set of checks fails three times in a row, or three attempts make no change to the repository tree, the run is marked blocked and stops retrying.',
    },
    {
      title: 'Durable, recoverable ticks on Temporal',
      body: 'The Temporal workflow loops a single `project_tick` activity that advances one phase and returns a status. Postgres holds the snapshot and versioned pause/resume/cancel controls. Signals only wake the workflow. A reconciler re-starts or re-signals runs after crashes, and history rolls over with continue-as-new.',
    },
    {
      title: 'Isolation by default',
      body: 'Each run branches from committed HEAD into its own `harnessflow/<run-id>` worktree. Uncommitted files in the source checkout are never included, and an empty `git init` gets a synthetic base commit. A database partial unique index plus a host `flock` keep each repository to one writer, and a watchdog kills child process groups if the worker dies.',
    },
    {
      title: 'Tested end to end with real Codex runs',
      body: 'Recorded acceptance runs on 2026-10-10/11 covered an empty repo, an existing repo with a dirty checkout, and multi-module CLIs. Each delivered branch was then checked by a separate verifier script that did not rely on the harness’s own checks. The inventory fixture finished in about 4.5 minutes, with 4 coding attempts and one repair.',
    },
  ],
  techStack: [
    { name: 'Go 1.26 + Connect-Go', role: 'Loopback API: ProjectService RPCs, run limits, versioned controls, reconciler' },
    { name: 'Temporal (Go + Python SDKs)', role: 'Durable workflow `HarnessFlowProjectRun` in Go; `project_tick` activity in Python' },
    { name: 'PostgreSQL 16 (pgx / asyncpg)', role: 'projects and project_runs tables; JSONB run snapshot; partial unique index for one active run per repo' },
    { name: 'Python 3.12 + Pydantic v2', role: 'Phase engine, plan/review/judge contracts, completion predicate' },
    { name: 'Codex CLI', role: 'Planner, implementer, reviewer and fallback judge (`codex exec`), plus `codex sandbox` for deterministic checks' },
    { name: 'Anthropic API (optional)', role: 'Independent judge when ANTHROPIC_API_KEY is set; otherwise a separate read-only Codex attempt' },
    { name: 'Git worktrees', role: 'Per-run isolated branch, checkpoints, diff artifact' },
    { name: 'Next.js 16 + React 19 + TanStack Query', role: 'Dashboard: intake, live run page (2s polling), controls, evidence' },
    { name: 'Protobuf + Buf + Connect-ES', role: 'Single contract shared by Go server and TypeScript dashboard' },
    { name: 'Docker Compose', role: 'Local Postgres + Temporal; optional OTel/Jaeger/Prometheus/Grafana stack' },
    { name: 'Playwright, pytest, go test', role: 'Browser contract checks, worker integration tests with real Git, workflow tests' },
  ],
  architecture: {
    groups: [
      { id: 'interfaces', label: 'Dashboard & CLI' },
      { id: 'control', label: 'Control plane' },
      { id: 'execution', label: 'Execution (Python worker)' },
      { id: 'storage', label: 'State & artifacts' },
      { id: 'external', label: 'External tools' },
    ],
    nodes: [
      {
        id: 'dashboard',
        label: 'Project dashboard',
        kind: 'ui',
        x: 0,
        y: 0,
        group: 'interfaces',
        summary: 'Next.js run page: phases, plan, evidence, review, judge, artifacts, controls.',
        details:
          'Registers a project (absolute repo path + PRD), starts a run with attempt/time limits and an optional PR flag, then polls GetRun every 2 seconds until the run is terminal. Shows a nine-phase stepper (prepare → deliver), task checklist, requirement-to-check mapping, per-check exit code and commit, independent review findings, per-requirement judge verdicts and downloadable artifacts. Pause/resume/cancel controls only count as applied once a later checkpoint from the worker confirms them.',
        tech: ['Next.js 16', 'React 19', 'TanStack Query', 'Connect-ES'],
        codePath: 'apps/dashboard/src/app/projects/[id]/runs/[runId]/page.tsx',
      },
      {
        id: 'cli',
        label: 'harnessflow CLI',
        kind: 'client',
        x: 0,
        y: 320,
        group: 'interfaces',
        summary: '`harnessflow run ./PRD.md --repo <path>` → run ID + dashboard URL.',
        details:
          'A standard-library Python CLI that calls the same ProjectService over Connect JSON. Provides run, status (compact or --full snapshot), pause, resume and cancel. Checked-in Codex and Claude Code skills (`harnessflow-project`) go through this CLI instead of running their own coding loop.',
        tech: ['Python', 'argparse', 'Connect JSON'],
        codePath: 'apps/cli/src/harnessflow_cli.py',
      },
      {
        id: 'api',
        label: 'ProjectService API',
        kind: 'service',
        x: 280,
        y: 160,
        group: 'control',
        summary: 'Go Connect service bound to loopback; persists intake, then starts Temporal.',
        details:
          'Resolves the repository path to its canonical Git top-level, enforces limits (default 30 attempts / 4 active hours), and inserts the queued project_runs row before calling ExecuteWorkflow with the stable ID hf-project-<run-id>. That row acts as an outbox, so a Temporal outage never loses a request. ControlRun bumps control_version in SQL and then sends a best-effort signal. A 5-second reconciler loop restarts missing workflows, re-delivers pending controls and marks runs failed if their Temporal execution ended without a final checkpoint.',
        tech: ['Go', 'Connect-Go', 'pgx/v5', 'Temporal Go SDK'],
        codePath: 'apps/api/internal/server/projectservice.go',
      },
      {
        id: 'temporal',
        label: 'Temporal · HarnessFlowProjectRun',
        kind: 'queue',
        x: 560,
        y: 0,
        group: 'control',
        summary: 'Deterministic workflow that loops one `project_tick` activity per phase.',
        details:
          'Registered by a Go worker inside the API process. Activity calls have a one-hour start-to-close timeout, a 15-second heartbeat timeout and unlimited retries. The workflow drains stale signals, runs a tick, and then exits (completed/failed/canceled), waits for a signal (paused/blocked/exhausted), or loops (with a 1-second backoff while another process still holds the repo lock). After 100 ticks it continues-as-new to keep history bounded.',
        tech: ['Temporal', 'Go SDK', 'signals', 'continue-as-new'],
        codePath: 'apps/api/internal/workflow/project.go',
      },
      {
        id: 'postgres',
        label: 'Postgres · project_runs',
        kind: 'datastore',
        x: 560,
        y: 320,
        group: 'storage',
        summary: 'Authoritative run state: JSONB snapshot, status, versioned controls, limits.',
        details:
          'projects stores name, repository path and PRD. project_runs stores status, reason, the JSONB snapshot (plan, attempts, evidence, review, judge, events, artifacts), control + control_version, clarification, limits, model and the request_pr flag. A partial unique index on repository_path for non-terminal runs reserves a repository even while a run is paused or blocked. A pause or cancel request overrides a completed/blocked status inside the save query itself.',
        tech: ['PostgreSQL 16', 'JSONB', 'golang-migrate'],
        codePath: 'apps/api/migrations/0004_projects.up.sql',
      },
      {
        id: 'tick',
        label: 'project_tick phase engine',
        kind: 'worker',
        x: 840,
        y: 160,
        group: 'execution',
        summary: 'One recoverable unit of work per call: prepare, plan, plan_review, implement, verify, review, judge, repair, deliver.',
        details:
          'Takes a non-blocking host flock on a hash of the repository path, reloads the row, and only then applies controls. Every agent call goes through a poll() that heartbeats, checks for pause/cancel, keeps track of active time against the limit and saves the snapshot. Attempt and active-time limits raise an "exhausted" interrupt. Each phase records structured events, token counts reported by Codex, and attempt records. Cost is stored as null (unknown), never as $0.',
        tech: ['Python 3.12', 'Temporal Python SDK', 'asyncpg', 'fcntl.flock'],
        codePath: 'apps/worker/harnessflow_worker/projects/engine.py',
      },
      {
        id: 'workspace',
        label: 'Isolated worktree',
        kind: 'datastore',
        x: 840,
        y: 480,
        group: 'storage',
        summary: '`harnessflow/<run-id>` branch under $HARNESSFLOW_DATA_DIR/runs/<run-id>.',
        details:
          'Created with `git worktree add` from committed HEAD. An unborn repository gets a root commit built with `git mktree` and `commit-tree`, so its own HEAD and index stay untouched. The supervisor commits checkpoints (feat:/fix:/chore:) with hooks and gpg signing turned off, and computes a tree fingerprint to detect no-progress attempts and a base..HEAD diff for the artifact. Attempt schemas, results and Codex JSONL transcripts are kept next to the worktree and never cleaned up automatically.',
        tech: ['git worktree', 'git mktree / commit-tree'],
        codePath: 'apps/worker/harnessflow_worker/projects/workspace.py',
      },
      {
        id: 'codex',
        label: 'CodexAgent adapter',
        kind: 'worker',
        x: 1120,
        y: 0,
        group: 'execution',
        summary: 'Fresh ephemeral `codex exec` per attempt with a JSON output schema.',
        details:
          'Builds each prompt from the PRD, the latest clarification and the saved state (plan, completed tasks, evidence, review, judge), so no session memory carries over. Planner and reviewers run in a read-only sandbox. Coding and repair run workspace-write with network access off unless HARNESSFLOW_PROJECT_NETWORK=true, and with approval_policy="never". The final answer is parsed with Pydantic against the contract it was given (Plan, Review, AgentResult or JudgeVerdict), and token usage is read from turn.completed events.',
        tech: ['Codex CLI', 'Pydantic JSON schema', 'sandboxing'],
        codePath: 'apps/worker/harnessflow_worker/projects/agent.py',
      },
      {
        id: 'checks',
        label: 'Frozen acceptance checks',
        kind: 'worker',
        x: 1120,
        y: 320,
        group: 'execution',
        summary: 'Argv checks run directly in a native sandbox; the exit code is the verdict.',
        details:
          'In the verify phase the worker commits a checkpoint, then runs each frozen argv through `codex sandbox --permission-profile :workspace`, with no shell and no LLM reading the result. Each evidence record stores check_id, requirement_ids, argv, exit_code, passed, commit and the last 12 KB of output. If a check modifies tracked files the run is blocked. completion_ready() in models.py is the single gate that ties all of this evidence to HEAD.',
        tech: ['codex sandbox', 'Pydantic', 'subprocess'],
        codePath: 'apps/worker/harnessflow_worker/projects/models.py',
      },
      {
        id: 'judge',
        label: 'Independent judge',
        kind: 'worker',
        x: 1120,
        y: 640,
        group: 'execution',
        summary: 'One pass/fail verdict per frozen requirement, tied to the commit.',
        details:
          'Runs after the read-only review passes. If ANTHROPIC_API_KEY is set and the diff is at most 200,000 characters, it sends the PRD, frozen plan, commit, acceptance evidence, review findings and actual diff to Claude (default claude-sonnet-4-6, temperature 0). Otherwise it uses a separate read-only Codex attempt. judge_ready() rejects a verdict unless it covers exactly the plan’s requirement IDs, all of them pass, and it names the current commit. Any gap is fed back into repair as findings.',
        tech: ['Anthropic SDK', 'Codex CLI', 'Pydantic'],
        codePath: 'apps/worker/harnessflow_worker/projects/judge.py',
      },
      {
        id: 'supervisor',
        label: 'Process supervisor + watchdog',
        kind: 'worker',
        x: 1400,
        y: 160,
        group: 'execution',
        summary: 'Bounded process groups with deadlines, output limits and a filtered environment.',
        details:
          'Every git, codex and check subprocess runs through run_process under a standalone watchdog. The watchdog keeps the repository lock, starts the child in a new session, and SIGKILLs the whole process group if the worker parent disappears or the deadline passes. The child environment is an allowlist: model API keys are passed only to Codex invocations, never to repository commands, and git fsmonitor daemons are disabled.',
        tech: ['asyncio subprocess', 'POSIX process groups', 'signals'],
        codePath: 'apps/worker/harnessflow_worker/projects/process.py',
      },
      {
        id: 'codexcli',
        label: 'Codex CLI (OpenAI)',
        kind: 'external',
        x: 1680,
        y: 160,
        group: 'external',
        summary: 'Uses the developer’s authenticated `codex login`; or a loopback key-holding gateway in CI.',
        details:
          'Locally, Codex uses the developer’s existing login. In the manual real-model CI workflow, Codex gets an empty home directory and talks to a loopback-only gateway container that holds the API key and only allows /v1/responses for one chosen model, so the worker user never sees the key.',
        tech: ['OpenAI Responses API', 'codex exec', 'codex sandbox'],
      },
      {
        id: 'anthropic',
        label: 'Anthropic API',
        kind: 'external',
        x: 1400,
        y: 640,
        group: 'external',
        summary: 'Optional judge provider.',
        details:
          'Used only when ANTHROPIC_API_KEY is configured. The README warns that the PRD, plan, diff and evidence are sent to this provider. While the call is in flight the worker keeps heartbeating Temporal and checking for pause/cancel every 5 seconds.',
        tech: ['Claude', 'anthropic Python SDK'],
      },
      {
        id: 'github',
        label: 'GitHub (optional PR)',
        kind: 'external',
        x: 1400,
        y: 480,
        group: 'external',
        summary: 'Push the branch + `gh pr create`. Opt-in per run; nothing auto-merges.',
        details:
          'Only when request_pr is set. Publishing requires a GitHub.com origin whose fetch and push URLs point to the same repository, and the run’s base commit must equal the remote default-branch tip as reported by `git ls-remote --symref`. Anything else blocks the run for clarification instead of guessing a target. An existing PR is reused, and nothing is merged or deployed.',
        tech: ['git push', 'GitHub CLI'],
      },
    ],
    edges: [
      { id: 'e-dashboard-api', source: 'dashboard', target: 'api', label: 'CreateProject · StartRun · ControlRun · GetRun (2s poll)' },
      { id: 'e-cli-api', source: 'cli', target: 'api', label: 'Connect JSON over loopback' },
      { id: 'e-api-postgres', source: 'api', target: 'postgres', label: 'queued row (outbox) · versioned controls · reads' },
      { id: 'e-api-temporal', source: 'api', target: 'temporal', label: 'ExecuteWorkflow hf-project-<id> · project_control signal' },
      { id: 'e-temporal-tick', source: 'temporal', target: 'tick', label: 'project_tick activity (heartbeat)' },
      { id: 'e-tick-postgres', source: 'tick', target: 'postgres', label: 'load / save JSONB snapshot' },
      { id: 'e-tick-workspace', source: 'tick', target: 'workspace', label: 'prepare · checkpoint · fingerprint · diff' },
      { id: 'e-tick-codex', source: 'tick', target: 'codex', label: 'plan · review · implement · repair' },
      { id: 'e-tick-checks', source: 'tick', target: 'checks', label: 'verify: run every frozen argv' },
      { id: 'e-tick-judge', source: 'tick', target: 'judge', label: 'judge every requirement' },
      { id: 'e-codex-supervisor', source: 'codex', target: 'supervisor', label: 'run_process (lock fd, deadline)' },
      { id: 'e-checks-supervisor', source: 'checks', target: 'supervisor', label: 'codex sandbox -- argv' },
      { id: 'e-supervisor-codexcli', source: 'supervisor', target: 'codexcli', label: 'codex exec --sandbox read-only | workspace-write' },
      { id: 'e-supervisor-workspace', source: 'supervisor', target: 'workspace', label: 'edits confined to worktree' },
      { id: 'e-judge-anthropic', source: 'judge', target: 'anthropic', label: 'if ANTHROPIC_API_KEY' },
      { id: 'e-judge-codex', source: 'judge', target: 'codex', label: 'fallback: read-only Codex' },
      { id: 'e-tick-github', source: 'tick', target: 'github', label: 'deliver: optional push + PR' },
    ],
    traces: [
      {
        id: 'prd-to-branch',
        name: 'A PRD becomes a verified branch',
        description:
          'The real inventory-report run (fcd68133…): an empty `git init` repo and a ~25-line PRD, delivered in about 4.5 minutes as a branch with 4 frozen checks passing at HEAD.',
        steps: [
          {
            edgeId: 'e-cli-api',
            title: 'Submit the PRD',
            caption:
              '`harnessflow run inventory-prd.md --repo …` calls CreateProject and StartRun. The API resolves the canonical Git top-level and applies the default limits of 30 coding attempts and 4 active hours.',
          },
          {
            edgeId: 'e-api-postgres',
            title: 'Persist before scheduling',
            caption:
              'A queued project_runs row is inserted first and acts as an outbox. The partial unique index rejects a second unfinished run on the same repository.',
          },
          {
            edgeId: 'e-api-temporal',
            title: 'Start the durable workflow',
            caption:
              'ExecuteWorkflow uses the stable ID hf-project-<run-id>, so the reconciler can retry the start safely if Temporal was briefly unavailable.',
          },
          {
            edgeId: 'e-temporal-tick',
            title: 'One tick per phase',
            caption:
              'Temporal schedules project_tick on the Python worker. Each call takes the host repository lock, advances exactly one phase and returns a status that tells the workflow whether to loop, wait or stop.',
          },
          {
            edgeId: 'e-tick-workspace',
            title: 'Prepare an isolated worktree',
            caption:
              'The repo had no commits, so the worker created a synthetic empty base commit and a harnessflow/<run-id> worktree. The original checkout stayed with an unborn HEAD and no files.',
          },
          {
            edgeId: 'e-tick-codex',
            title: 'Plan, then independently review the plan',
            caption:
              'A read-only Codex planner produced 6 requirements, 3 dependent tasks and 4 argv checks (≈37 s). A separate read-only review approved it and the checks were frozen.',
          },
          {
            edgeId: 'e-supervisor-codexcli',
            title: 'Implement each task',
            caption:
              'Three workspace-write Codex sessions with network access off completed T1→T3 in dependency order. The supervisor committed a checkpoint after each one.',
          },
          {
            edgeId: 'e-tick-checks',
            title: 'Run the frozen checks',
            caption:
              'C1–C4 (unittest suite, Decimal 0.10 + 0.20 == 0.30, CLI subprocess, README/.gitignore) ran directly in the Codex sandbox. Each exit code was recorded together with the commit it ran against.',
          },
          {
            edgeId: 'e-tick-judge',
            title: 'Judge every requirement',
            caption:
              'After a review-triggered repair (see the next trace), the read-only Codex judge passed all 6 requirements at the delivered commit. No Anthropic key was configured for this run.',
          },
          {
            edgeId: 'e-tick-postgres',
            title: 'Deliver with evidence',
            caption:
              'completion_ready() re-checked tasks, evidence, review and judge against HEAD on a clean tree. It then saved verification.md, changes.diff and acceptance.json to the snapshot, which the dashboard displays.',
          },
        ],
      },
      {
        id: 'repair-loop',
        name: 'A rejection triggers repair',
        description:
          'Passing commands are necessary but not sufficient. In the real inventory run, the independent review rejected work whose checks had all passed, and the harness repaired it and verified it again before delivering.',
        steps: [
          {
            edgeId: 'e-tick-checks',
            title: 'All four checks pass',
            caption:
              'After T3, C1–C4 exited 0 on the checkpoint commit (9 unittest cases). The engine moved to the independent review phase.',
          },
          {
            edgeId: 'e-tick-codex',
            title: 'Read-only review finds a gap',
            caption:
              'A fresh read-only Codex reviewer could not reproduce the CLI test, because tempfile.TemporaryDirectory cannot create a directory in a read-only sandbox. It returned passed=false with that finding.',
          },
          {
            nodeId: 'tick',
            title: 'Route to repair, count the attempt',
            caption:
              'A review that fails or has findings sets phase=repair. The attempt counter went from 3 to 4 of 30. A repair attempt is refused once the attempt limit is reached.',
          },
          {
            edgeId: 'e-supervisor-codexcli',
            title: 'Targeted repair in workspace-write',
            caption:
              'The repair prompt includes the findings and says not to weaken checks. Codex added static CSV fixtures and a CLI regression test that needs no temporary directory, and documented the assumption in the README.',
          },
          {
            edgeId: 'e-tick-workspace',
            title: 'Checkpoint and measure progress',
            caption:
              'The supervisor committed "fix: address acceptance findings" and compared tree fingerprints. Three no-progress attempts in a row would block the run instead of looping forever.',
          },
          {
            edgeId: 'e-tick-checks',
            title: 'Re-verify on the new commit',
            caption:
              'Evidence is cleared and every frozen check runs again, now against the repair commit. C1 now ran 10 tests, and all four checks exited 0.',
          },
          {
            edgeId: 'e-tick-codex',
            title: 'Review passes',
            caption: 'A new read-only review session returned passed=true with no findings, so the run moved to the judge.',
          },
          {
            edgeId: 'e-tick-judge',
            title: 'Judge gaps would loop again',
            caption:
              'Any failed or missing requirement verdict turns into findings and sends the run back to repair. Here all 6 passed. Separately, if the same set of checks fails three verify passes in a row, the run is marked blocked.',
          },
          {
            nodeId: 'checks',
            title: 'Single completion predicate',
            caption:
              'Delivery happens only if every check’s argv, requirement IDs, exit code 0 and commit match the frozen plan and HEAD. A passing review or judge on an older commit does not count.',
          },
        ],
      },
      {
        id: 'pause-resume',
        name: 'Pause, crash, resume',
        description:
          'Controls are stored in Postgres and signals only wake the workflow, so a run can be paused, survive a worker crash, and resume from its last checkpoint without starting over.',
        steps: [
          {
            edgeId: 'e-dashboard-api',
            title: 'User requests pause',
            caption:
              'ControlRun writes control=pause and increments control_version in one conditional UPDATE. The dashboard shows "request saved" until a later checkpoint confirms it.',
          },
          {
            edgeId: 'e-api-temporal',
            title: 'Best-effort wake signal',
            caption:
              'The API then signals project_control. If the signal is lost, the 5-second reconciler re-sends it for any non-terminal run that still has a pending control.',
          },
          {
            edgeId: 'e-tick-postgres',
            title: 'Interrupt at the next poll',
            caption:
              'The running attempt’s poll() reloads the row, sees the pause, raises RunInterruptedError and saves status=paused. It clears the control only if control_version still matches.',
          },
          {
            edgeId: 'e-codex-supervisor',
            title: 'Child processes cannot outlive the worker',
            caption:
              'If the worker crashes instead, the watchdog sees its parent is gone and SIGKILLs the Codex process group, so no orphaned process keeps writing to the worktree.',
          },
          {
            nodeId: 'temporal',
            title: 'Workflow waits for free',
            caption:
              'For paused, blocked and exhausted statuses the workflow blocks on the signal channel. It spends no coding attempts or active time while waiting.',
          },
          {
            edgeId: 'e-dashboard-api',
            title: 'Resume with context or budget',
            caption:
              'Resume can add a clarification and extra attempts or minutes. It is accepted only from paused/blocked/exhausted with no other pending control.',
          },
          {
            edgeId: 'e-tick-workspace',
            title: 'Recover partial work safely',
            caption:
              'Attempts still marked running are committed as "chore: recover interrupted attempt" and marked interrupted. The task stays unfinished until it is verified, so partial edits are never counted as done.',
          },
        ],
      },
    ],
  },
  install: {
    intro:
      'Local, single-user, loopback-only. Needs Docker (Compose v2), Go, Python 3.12+ with uv, Node 22+ with pnpm 10, golang-migrate, and an authenticated Codex CLI.',
    steps: [
      { label: 'Clone and configure', code: 'git clone https://github.com/rzarka1298/harnessflow\ncd harnessflow\ncp .env.example .env' },
      { label: 'Start Postgres, Temporal, API, worker and dashboard', code: 'make dev\n# open http://127.0.0.1:3001/projects' },
      {
        label: 'Or drive it from the CLI',
        code: 'uv tool install --editable apps/cli\nharnessflow run ./PRD.md --repo /absolute/path/to/repository\nharnessflow status <run-id>',
      },
      { label: 'Run the quality gates', code: 'make check   # lint, tests, typecheck, build' },
    ],
  },
  links: {
    github: 'https://github.com/rzarka1298/harnessflow',
    docs: 'https://github.com/rzarka1298/harnessflow/blob/main/Project-Documentation/projects/overview.md',
  },
  demoId: 'harnessflow-run',
};

export default harnessflow;
