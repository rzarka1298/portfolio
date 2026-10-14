import type { ProjectPage } from './types';

// Title note: the repository is named "ClaudeOS", but the product name used in
// README.md, the Obsidian plugin manifest and every UI string is
// "Claude Command Center". The page uses the product name and keeps the repo
// name visible in the tagline/links so both are searchable.

const claudeos: ProjectPage = {
  slug: 'claudeos',
  title: 'Claude Command Center',
  tagline:
    'ClaudeOS: a local-first command center for Claude Code — an Obsidian plugin backed by a launchd-supervised macOS service over an authenticated Unix socket.',
  status: 'Active development · core shipped',
  summary: [
    'Claude Command Center is a personal command center that runs entirely on one Mac. An Obsidian plugin draws the dashboard. A Node 24 companion service, supervised by launchd, owns the operational SQLite store, the macOS Keychain secret, writes to the managed vault, and a push event stream. The two halves talk over a Unix domain socket that the service creates with 0600 permissions. Nothing listens on a TCP port.',
    'Claude Code sessions show up live, including ones started outside the dashboard. User-level hooks forward a minimized record of each lifecycle event. One pure reducer turns those records into an eight-state Run lifecycle, and the plugin receives the result through an event stream that replays missed events after a reconnect. Consequential actions, such as force-terminating a session, go through an approval inbox: each request is approved once, its content is fingerprinted, and it expires.',
    'The codebase is a 12-package pnpm + Turborepo TypeScript monorepo. Zod schemas in a shared domain package are the single source of truth for every package. It has 28 architecture decision records and roughly 600 test files, and CI gates on import boundaries, Obsidian plugin-policy lint, secret scanning and a personal-data privacy scan.',
    'Actively developed. Shipped: authenticated socket transport, Keychain secrets, launchd lifecycle, SQLite store with migrations, managed vault writes, Claude Code session telemetry, the approval inbox, project launchers, canonical tasks and a read-only Codex mirror. The Research, Skills and Knowledge tabs are still placeholders.',
  ],
  problem: [
    'Running several Claude Code sessions across projects leaves the state spread over terminal tabs. You can\'t see at a glance which session is waiting on you, which one quietly died, or what an agent wrote into your notes and why.',
    'The obvious fix, a localhost web dashboard, opens a browser-reachable port on a process that can launch programs and holds credentials. DNS rebinding and localhost CSRF then become things to defend against forever. Agents writing straight into a knowledge vault also risk half-written notes, races with the editor, and notes landing outside the scope they belong to.',
    'The goal was one place to see sessions, projects, tasks and pending agent requests, where the transport can\'t be reached from a browser by construction, secrets never touch disk in plaintext, and nothing the user wrote can be corrupted by an automated write.',
  ],
  highlights: [
    {
      title: 'Unreachable from the browser by construction',
      body: 'The plugin and service talk HTTP over a Unix domain socket, not TCP loopback, so fetch, XHR and EventSource cannot address it at all (ADR-0001). The service sets its umask before listen() so the socket file is created at 0600 atomically, with no chmod window. It also refuses to start if a live instance already holds the path, and unlinks a stale socket left by a crash.',
    },
    {
      title: 'Short-lived HMAC tokens on top of socket permissions',
      body: 'A 32-byte per-install secret lives only in the macOS Keychain, reached through a typed wrapper over /usr/bin/security with no native dependencies. POST /api/v1/handshake mints one-hour HMAC-SHA256 tokens that are checked with timingSafeEqual. Every other route returns the same 401 body for any failure, so the endpoint can\'t be used to probe which part of a token is wrong. The client re-handshakes when less than five minutes remain or on a 401.',
    },
    {
      title: 'Hand-rolled reconnect and replay',
      body: 'Using a Unix socket gives up EventSource. A bounded 500-event in-memory ring buffer plus Last-Event-ID resume replaces it. When the requested ID has aged out of the buffer, the service sends a stream.resync control event and the client fetches /api/v1/snapshot before applying any later deltas. Replay history is deliberately not persisted, so the store keeps no second durable record of session activity (ADR-0007).',
    },
    {
      title: 'Crash-safe, scope-checked vault writes',
      body: 'Each managed note write checks the target path against vault containment and its declared scope (global or one workspace ID) on the symlink-resolved real path. It then writes a same-directory temp file, fsyncs it and renames it over the target, and fully recomputes the folder\'s index.md. The index sort is explicit (created, id, filename) so a rerun with no changes produces byte-identical output. Notes the user may have open in the editor are written only through Obsidian\'s Vault.process with a conflict check, never from outside the editor.',
    },
    {
      title: 'Approvals that fail closed and run once',
      body: 'Every operation has exactly one row in a static classification table that lives in code, so there is no "always allow" setting to toggle. An approval is valid only if the payload hash the owner saw still matches the stored request. The engine claims a request before running it, records the outcome in an audit table and recovers from evidence after a crash, so an effect never runs twice and an outcome is never guessed. Unanswered requests expire as denials.',
    },
    {
      title: 'Telemetry that fails open and degrades honestly',
      body: 'Claude Code hooks run async, never write to stdout, always exit 0, and give up after 300 ms (hard exit at 340 ms), so a session is never blocked or slowed. Each record is capped at 4 KiB and carries identifiers only. If the socket is down, the record goes to a spool file that the service drains and truncates. If an event\'s shape changes upstream, the dashboard shows "unavailable — telemetry shape changed" instead of guessing.',
    },
  ],
  techStack: [
    { name: 'TypeScript (strict)', role: 'Every package, compiled in project-reference mode' },
    { name: 'pnpm + Turborepo', role: '12-package monorepo with cached builds and tests' },
    { name: 'Zod', role: 'Shared domain schemas and inferred types; validates every boundary' },
    { name: 'Obsidian plugin API', role: 'Host for the dashboard view and editor-safe vault writes' },
    { name: 'Preact + @preact/signals', role: 'Dashboard UI with per-card signal subscriptions' },
    { name: 'Node.js 24 LTS', role: 'Companion service runtime (node:http over a Unix socket)' },
    { name: 'better-sqlite3 + Drizzle ORM', role: 'Operational store with a versioned, audited migration chain' },
    { name: 'macOS Keychain (/usr/bin/security)', role: 'The only place secrets live' },
    { name: 'launchd LaunchAgent', role: 'Starts the service at login and restarts it after a crash' },
    { name: 'pino', role: 'Structured logging with credential redaction' },
    { name: 'Vitest, WebdriverIO, Playwright', role: 'Unit/integration tests, in-app e2e, visual baselines' },
    { name: 'Biome, ESLint, gitleaks', role: 'Formatting, import-boundary and Obsidian-policy lint, secret scanning in CI' },
  ],
  architecture: {
    groups: [
      { id: 'plugin', label: 'Obsidian plugin' },
      { id: 'service', label: 'Companion service' },
      { id: 'storage', label: 'Storage' },
      { id: 'macos', label: 'macOS' },
      { id: 'external', label: 'Agents (external)' },
    ],
    nodes: [
      {
        id: 'shell',
        label: 'Command-center shell',
        kind: 'ui',
        x: 0,
        y: 0,
        group: 'plugin',
        summary: 'The Obsidian view: a rail and canvas with eight destinations and a live connection status.',
        details:
          'Renders synchronously from signals and never awaits the service, so first paint is never blocked. It has eight destinations (Overview, Projects, Research, Tasks, Agent runs, Skills, Knowledge, Settings) with wrap-around keyboard navigation. The Agent runs destination holds the Active/Recent/Unclassified session tables and the Approvals section, where the owner picks Approve once or Deny. Every visual value comes from one --ccc-* token block chosen in ADR-0023, and reduced motion is respected.',
        tech: ['Preact', '@preact/signals', 'Obsidian ItemView'],
        codePath: 'packages/plugin/src/view/shell.tsx',
      },
      {
        id: 'widgets',
        label: 'Widget registry',
        kind: 'ui',
        x: 0,
        y: 320,
        group: 'plugin',
        summary: 'One typed registry of dashboard widgets. Each widget declares its data keys, refresh policy and every state it can be in.',
        details:
          'Nine widgets are registered: service health, Today, Active Claude sessions (the cream "hero" card), project shortcuts, Claude usage, Codex, tech intel, GitHub discoveries and quick actions. Each card reads only its own signal, so one slow source re-renders and delays no other card. Panels whose sources are not built yet show a constant permission-required or unavailable state, never fixture data. A card that looks real is real.',
        tech: ['Preact', 'TypeScript satisfies-typed registry'],
        codePath: 'packages/plugin/src/widgets/registry.ts',
      },
      {
        id: 'api-client',
        label: 'Service API client',
        kind: 'client',
        x: 280,
        y: 160,
        group: 'plugin',
        summary: 'A typed client over the socket: token handshake, request timeouts, and an event client with reconnect and replay.',
        details:
          'Wraps node:http with socketPath. It caches the bearer token in memory only, re-handshakes when less than five minutes remain or on a 401, and exposes invalidateToken() for plugin unload. The event client parses the SSE-style stream by hand, tracks lastEventId, reconnects with jittered exponential backoff, and on stream.resync adopts a full snapshot before applying any later deltas.',
        tech: ['node:http (socketPath)', 'custom SSE parser', 'Zod'],
        codePath: 'packages/service-api-client/src/event-client.ts',
      },
      {
        id: 'socket-server',
        label: 'Socket server + auth',
        kind: 'service',
        x: 560,
        y: 160,
        group: 'service',
        summary: 'An HTTP server bound only to a Unix socket path, created at 0600, with every route except the handshake behind requireToken.',
        details:
          'Startup order matters: run recovery and drain the hook spool first, then claim the socket path (refusing if a live service holds it, unlinking a stale one), set umask 0o177 before listen() and restore it afterwards. The handshake mints one-hour HMAC-SHA256 tokens over {issuedAt, expiresAt, nonce}. Any token failure returns the same 401 body and the specific reason goes only to the local redacting log. A path allowlist and a request-body size cap guard the routes.',
        tech: ['Node 24', 'node:http', 'HMAC-SHA256', 'timingSafeEqual'],
        codePath: 'packages/service/src/socket-server.ts',
      },
      {
        id: 'approval-engine',
        label: 'Approval engine',
        kind: 'service',
        x: 840,
        y: 0,
        group: 'service',
        summary: 'Classifies, persists, expires and executes Proposals. Every approval is one-time and checked against the payload\'s fingerprint.',
        details:
          'A static classification table in @ccc/domain gives every operation exactly one class: approval-required, no-approval or direct-gesture. An unknown operation classifies to nothing, which means refuse. Before deciding, the engine recomputes the canonical payload hash. It claims the request, starts the capability-typed executor without awaiting it, and records the outcome. After a crash, recovery reconciles from evidence instead of re-running. The real operation today is session.force-terminate (15-minute lifetime). diagnostic.test does nothing and exists to prove exactly-once delivery and expiry.',
        tech: ['TypeScript', 'canonical JSON hashing', 'capability-typed executors'],
        codePath: 'packages/service/src/approval/engine.ts',
      },
      {
        id: 'event-bus',
        label: 'Event bus + replay buffer',
        kind: 'queue',
        x: 560,
        y: 480,
        group: 'service',
        summary: 'In-process pub/sub that feeds GET /api/v1/events, backed by a bounded 500-event ring buffer.',
        details:
          'Event IDs increase monotonically within one process and reset on restart. A reconnect that sends Last-Event-ID inside the buffer gets an exact replay. Anything else (a missing header, an aged-out ID, a restart) gets a stream.resync control event, and the client fetches /api/v1/snapshot. Event types include session.upserted, approval.upserted, tasks.changed, projects.updated, usage.updated, codex.* and service.heartbeat.',
        tech: ['ring buffer', 'Server-Sent-Events framing', 'Zod event envelope'],
        codePath: 'packages/service/src/events/ring-buffer.ts',
      },
      {
        id: 'claude-pipeline',
        label: 'Session pipeline',
        kind: 'worker',
        x: 840,
        y: 320,
        group: 'service',
        summary: 'Turns hook evidence and process-liveness evidence into eight-state Runs: queued through stale.',
        details:
          'A single promise chain serializes all ingest, so one session\'s events are reduced in arrival order. Replays are dropped by hook-minted eventId (10,000 remembered). The pure reducer in @ccc/collectors produces the next Run. Writes that change only activity are coalesced to at most once every 5 seconds, while any state change is written and published immediately. A liveness sweeper marks a Run "stale" when its ending was never observed. Silence is reported as unknown, not as failure. Every Run gets a service-minted RunId, and Claude\'s session ID is only a correlation field.',
        tech: ['pure reducer', 'promise-chain serialization', 'write coalescing'],
        codePath: 'packages/service/src/claude/pipeline.ts',
      },
      {
        id: 'launchers',
        label: 'Project launchers',
        kind: 'worker',
        x: 840,
        y: 640,
        group: 'service',
        summary: 'Opens a registered project in Antigravity, Claude Code, Finder or GitHub, or starts Claude and Codex together in a "pair launch".',
        details:
          'Projects are registered from approved scan roots and their git state is read with read-only git commands. A launch is a direct user gesture, which counts as its own authorization, and runs through a generated, shell-quoted launch script instead of string-built commands (ADR-0011, ADR-0024). Supported terminals include presets for iTerm2, Ghostty and WezTerm, plus an Antigravity IDE terminal bridge.',
        tech: ['generated launch scripts', 'sh-quote', 'git (read-only)'],
        codePath: 'packages/service/src/projects/launch-service.ts',
      },
      {
        id: 'vault-repo',
        label: 'Managed vault repository',
        kind: 'datastore',
        x: 1120,
        y: 0,
        group: 'storage',
        summary: 'Provenance-tracked Markdown notes. Writes are scope-checked and atomic, and indexes are regenerated deterministically.',
        details:
          'writeNote() mints a 25-character NoteId, stamps provenance frontmatter in a fixed key order (id, scope, stage, created, updated, generatedBy, aiGenerated, claimType, sources, confidence, lastReviewed, contentHash), validates it with the same Zod schema used on reads, checks scope with assertScopedWrite, then writes temp file → fsync → rename and regenerates the folder\'s index.md in full. Lifecycle stages run capture → raw → synthesis → wiki → deliverable → output. repairVault rebuilds every index and flags ambiguity, such as duplicate IDs, instead of guessing.',
        tech: ['Markdown + YAML frontmatter', 'fsync + rename', 'Zod'],
        codePath: 'packages/vault-repo/src/write-note.ts',
      },
      {
        id: 'sqlite',
        label: 'Operational store',
        kind: 'datastore',
        x: 1120,
        y: 320,
        group: 'storage',
        summary: 'SQLite, the service\'s durable state: projects, runs, proposals and approval audit, usage rollups, and the vault-note cache.',
        details:
          'Opened with better-sqlite3 and queried through Drizzle. A versioned migration runner applies an append-only chain, and audit tests fail if an applied migration is edited. Tables include projects, scan_roots, launcher_config, runs, job_runs, vault_notes, proposals, approval_audit, usage_quarter_hourly and transcript_cursors. It lives under the runtime directory outside the repo, which is created and repaired to 0700.',
        tech: ['better-sqlite3', 'Drizzle ORM', 'drizzle-kit migrations'],
        codePath: 'packages/operational-store/src/schema.ts',
      },
      {
        id: 'keychain',
        label: 'macOS Keychain',
        kind: 'external',
        x: 560,
        y: 800,
        group: 'macos',
        summary: 'The only place a secret exists. Accessed through a typed wrapper over /usr/bin/security.',
        details:
          'It holds the per-install secret (crypto.randomBytes(32), generated on first use) that keys the HMAC tokens. No native module is involved: the wrapper runs `security` via execa and passes values on stdin, never in argv. The logger is structurally unable to emit values shaped like credentials (ADR-0017).',
        tech: ['/usr/bin/security', 'execa'],
        codePath: 'packages/keychain/src/security-cli.ts',
      },
      {
        id: 'launchd',
        label: 'launchd LaunchAgent',
        kind: 'external',
        x: 280,
        y: 800,
        group: 'macos',
        summary: 'Per-user LaunchAgent with RunAtLoad and KeepAlive: the service runs at login whether or not Obsidian is open.',
        details:
          'install.sh resolves absolute paths for node and the entrypoint at install time, because launchd does not inherit the shell PATH. It registers with `launchctl bootstrap`, never the deprecated load/unload, which exit 0 on a malformed plist. dev:service deregisters the agent first so a foreground run never silently double-binds the socket (ADR-0015).',
        tech: ['launchctl bootstrap/bootout', 'plist template'],
        codePath: 'scripts/launchagent/install.sh',
      },
      {
        id: 'claude-code',
        label: 'Claude Code sessions + hooks',
        kind: 'external',
        x: 1120,
        y: 640,
        group: 'external',
        summary: 'Interactive Claude Code sessions, observed through 15 user-level async command hooks.',
        details:
          'Each hook is a short-lived, dependency-free Node process. It keeps an allowlisted set of identifiers from stdin (max 256 KiB parsed), sends one record of at most 4 KiB over the socket within a 300 ms budget, and on failure appends to a spool file. SessionEnd is written to the spool first, ahead of the socket attempt, and ingest is idempotent by eventId. The hook never writes stdout and always exits 0, so nothing it does enters Claude\'s context. The owner installs the hooks explicitly; the dashboard never edits settings.',
        tech: ['Claude Code hooks', 'Node', 'spool file'],
        codePath: 'packages/collectors/src/hook/entry.ts',
      },
      {
        id: 'codex',
        label: 'Codex CLI (read-only mirror)',
        kind: 'external',
        x: 1120,
        y: 960,
        group: 'external',
        summary: 'Codex threads, usage and weekly headroom are mirrored read-only. A "Reserve" line marks 80% of the weekly allowance.',
        details:
          'The service reads Codex rollout files and rate-limit data with version gating (ADR-0028), takes Codex hook events over the same socket, and runs a file-queue bridge for agent requests. A Codex session is a mirror, not a Run, and the dashboard never ranks agents against each other. If Codex\'s on-disk shape is unrecognized, its sources read as unavailable.',
        tech: ['rollout tailing', 'version gating', 'file-queue bridge'],
        codePath: 'packages/service/src/codex/services.ts',
      },
    ],
    edges: [
      { id: 'e-shell-widgets', source: 'shell', target: 'widgets', label: 'renders Overview grid' },
      { id: 'e-shell-client', source: 'shell', target: 'api-client', label: 'decide / launch / request' },
      { id: 'e-client-socket', source: 'api-client', target: 'socket-server', label: 'HTTP over UDS + Bearer' },
      { id: 'e-bus-client', source: 'event-bus', target: 'api-client', label: 'GET /api/v1/events (replay)' },
      { id: 'e-client-widgets', source: 'api-client', target: 'widgets', label: 'events → signals' },
      { id: 'e-socket-keychain', source: 'socket-server', target: 'keychain', label: 'install secret' },
      { id: 'e-launchd-socket', source: 'launchd', target: 'socket-server', label: 'starts at login, KeepAlive' },
      { id: 'e-socket-approval', source: 'socket-server', target: 'approval-engine', label: '/api/v1/approvals/*' },
      { id: 'e-socket-pipeline', source: 'socket-server', target: 'claude-pipeline', label: 'ingest hook record' },
      { id: 'e-socket-launchers', source: 'socket-server', target: 'launchers', label: '/api/v1/projects/launch' },
      { id: 'e-hooks-socket', source: 'claude-code', target: 'socket-server', label: 'POST /api/v1/claude/hook-events' },
      { id: 'e-hooks-spool', source: 'claude-code', target: 'claude-pipeline', label: 'spool fallback, drained ≤2s' },
      { id: 'e-pipeline-sqlite', source: 'claude-pipeline', target: 'sqlite', label: 'upsert Run' },
      { id: 'e-pipeline-bus', source: 'claude-pipeline', target: 'event-bus', label: 'session.upserted' },
      { id: 'e-approval-sqlite', source: 'approval-engine', target: 'sqlite', label: 'proposals + audit' },
      { id: 'e-approval-bus', source: 'approval-engine', target: 'event-bus', label: 'approval.upserted' },
      { id: 'e-approval-vault', source: 'approval-engine', target: 'vault-repo', label: 'mirror note in system/' },
      { id: 'e-approval-claude', source: 'approval-engine', target: 'claude-code', label: 'executor: SIGTERM → SIGKILL' },
      { id: 'e-vault-sqlite', source: 'vault-repo', target: 'sqlite', label: 'vault_notes cache' },
      { id: 'e-launchers-claude', source: 'launchers', target: 'claude-code', label: 'opens terminal + claude' },
      { id: 'e-codex-socket', source: 'codex', target: 'socket-server', label: 'codex hook events' },
    ],
    traces: [
      {
        id: 'handshake',
        name: 'Plugin connects and authenticates',
        description:
          'How the Obsidian plugin reaches a service that has no network port, and gets a short-lived HMAC bearer token.',
        steps: [
          {
            nodeId: 'launchd',
            title: 'Service is already running',
            caption:
              'launchd started the service at login. It drained the hook spool and ran restart recovery before opening the socket.',
          },
          {
            nodeId: 'socket-server',
            title: 'Socket created at 0600',
            caption:
              'The service claims the socket path (unlinking a stale one) and sets umask 0o177 before listen(), so the file is owner-only from the moment it exists.',
          },
          {
            nodeId: 'shell',
            title: 'Shell paints first',
            caption:
              'Once the Obsidian layout is ready, the plugin mounts the shell synchronously showing "Connecting…". The connection probe runs only after first paint.',
          },
          {
            edgeId: 'e-client-socket',
            title: 'POST /api/v1/handshake',
            caption:
              'The only route without a token. Being able to open a 0600 socket at all is the authorization, the same model the SSH-agent and Docker sockets use.',
          },
          {
            edgeId: 'e-socket-keychain',
            title: 'Per-install secret from Keychain',
            caption:
              'A 32-byte secret, generated once and stored only in the macOS Keychain, keys HMAC-SHA256 over {issuedAt, expiresAt, nonce}. The token lasts one hour.',
          },
          {
            edgeId: 'e-client-socket',
            title: 'Bearer on every request',
            caption:
              'The client caches the token in memory only and attaches it to /health, /snapshot and the event stream. requireToken checks it with timingSafeEqual.',
          },
          {
            nodeId: 'socket-server',
            title: 'Uniform 401, no oracle',
            caption:
              'Missing, malformed, mis-signed and expired tokens all get the same body: {"error":"authentication required"}. The specific reason is written only to the local redacting log.',
          },
          {
            nodeId: 'api-client',
            title: 'Refresh and revoke',
            caption:
              'The client re-handshakes when less than 5 minutes remain or on any 401. On plugin unload, invalidateToken() drops the token.',
          },
        ],
      },
      {
        id: 'session-stream',
        name: 'A Claude Code session appears on the dashboard',
        description:
          'From a SessionStart hook in a terminal anywhere on the machine to the hero card, including what happens after a reconnect.',
        steps: [
          {
            nodeId: 'claude-code',
            title: 'Hook fires',
            caption:
              'A session starts, possibly outside the dashboard. An async user-level command hook gets the payload on stdin and keeps only allowlisted identifiers, never file contents.',
          },
          {
            edgeId: 'e-hooks-socket',
            title: 'Deliver within 300 ms',
            caption:
              'The hook handshakes and POSTs a record of at most 4 KiB. It always exits 0 and never writes stdout, so the session is never blocked.',
          },
          {
            edgeId: 'e-hooks-spool',
            title: 'Fallback: spool',
            caption:
              'If the service is down, the record goes to a spool file, which the service renames, reads and truncates at startup and at least every 2 seconds after. The spool is a queue, not a log.',
          },
          {
            edgeId: 'e-socket-pipeline',
            title: 'Ingest, deduplicated',
            caption:
              'Records go through one serialized promise chain. A record whose eventId was already applied is dropped, so a record that was both delivered and spooled is applied once.',
          },
          {
            nodeId: 'claude-pipeline',
            title: 'Reduce to a Run state',
            caption:
              'The pure reducer maps hook evidence plus process liveness to one of eight states. A Run whose ending was never observed becomes "stale", not "failed".',
          },
          {
            edgeId: 'e-pipeline-sqlite',
            title: 'Persist with a service-minted RunId',
            caption:
              'State changes are written immediately. Activity-only updates are coalesced to at most one write every 5 seconds.',
          },
          {
            edgeId: 'e-pipeline-bus',
            title: 'Publish session.upserted',
            caption: 'The event gets the next monotonic ID and is appended to the 500-event ring buffer.',
          },
          {
            edgeId: 'e-bus-client',
            title: 'Stream, or replay after reconnect',
            caption:
              'A reconnecting client sends its lastEventId. If that ID is still buffered, missed events are replayed exactly. If not, the service sends stream.resync and the client loads /api/v1/snapshot before applying anything newer.',
          },
          {
            edgeId: 'e-client-widgets',
            title: 'Hero card updates',
            caption:
              'The event router writes the session signal. Only the Active Claude sessions card re-renders, and the grid and sibling cards do not.',
          },
        ],
      },
      {
        id: 'terminate-approval',
        name: 'Force-terminate through the approval inbox',
        description:
          'A destructive action becomes a Proposal, is approved once against its content fingerprint, runs exactly once, and leaves a scope-checked atomic mirror note in the vault.',
        steps: [
          {
            edgeId: 'e-shell-client',
            title: 'Owner asks to terminate',
            caption:
              'In Agent runs, the owner selects a live session and requests force-terminate. The route can only propose; it has no path to the executor.',
          },
          {
            edgeId: 'e-socket-approval',
            title: 'Classify and propose',
            caption:
              'session.force-terminate is approval-required and enabled, with a 15-minute lifetime. An operation missing from the static table classifies to nothing, which means refuse.',
          },
          {
            edgeId: 'e-approval-sqlite',
            title: 'Persist with a payload hash',
            caption:
              'The Proposal stores its exact target, a canonical payload hash and an expiry. A requester can shorten the lifetime but never lengthen it.',
          },
          {
            edgeId: 'e-approval-bus',
            title: 'approval.upserted → inbox',
            caption:
              'The Agent runs tab shows a pending-count badge, and the request shows as "Needs your decision" with blocks for who and where, what will happen, target, what will change, and risks.',
          },
          {
            nodeId: 'approval-engine',
            title: 'Approve once',
            caption:
              'The decision carries the hash the owner saw. The engine recomputes it from the stored row and refuses on mismatch. The approver can never edit the payload.',
          },
          {
            edgeId: 'e-approval-claude',
            title: 'Claim, then execute',
            caption:
              'The request is claimed and marked executing, then the capability-typed executor sends SIGTERM, escalating to SIGKILL after a grace period. If a crash interrupts it, recovery reconciles from evidence instead of re-running.',
          },
          {
            edgeId: 'e-approval-vault',
            title: 'Mirror note: scope check',
            caption:
              'A small, engine-templated note goes to system/. assertScopedWrite resolves symlinks and confirms the global scope never reaches into workspaces/. Requester text never enters the vault, so it can\'t become prompt-injection material.',
          },
          {
            nodeId: 'vault-repo',
            title: 'Atomic write + index regen',
            caption:
              'The note is written to a temp file, fsynced and renamed into place. Then system/index.md is recomputed in full and sorted by created, id, filename, so it is never patched in place.',
          },
        ],
      },
    ],
  },
  install: {
    intro:
      'macOS only. Requires Node.js 24 LTS (>=24.20.0), pnpm 11.24.0 via Corepack, and Xcode Command Line Tools (better-sqlite3 compiles from source). The repo runs against an empty example vault and contains no personal data.',
    steps: [
      { label: 'Enable pnpm', code: 'corepack enable\ncorepack prepare pnpm@11.24.0 --activate' },
      { label: 'Preflight, install and build all 12 packages', code: 'pnpm run setup' },
      { label: 'Run the service in the foreground (dev)', code: 'pnpm run dev:service' },
      { label: 'Or install it as a LaunchAgent', code: 'pnpm run build\npnpm run service:install' },
      { label: 'Run the gates', code: 'pnpm run test\npnpm run typecheck\npnpm run ci:privacy' },
    ],
  },
  links: {
    github: 'https://github.com/rzarka1298/ClaudeOS',
    docs: 'https://github.com/rzarka1298/ClaudeOS/tree/main/docs/adr',
  },
  demoId: 'claudeos-dashboard',
};

export default claudeos;
