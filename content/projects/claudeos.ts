import type { ProjectPage } from './types';

// PLACEHOLDER content — replaced by the real ClaudeOS write-up.
const claudeos: ProjectPage = {
  slug: 'claudeos',
  title: 'ClaudeOS',
  tagline: 'A command center for running and orchestrating Claude agents.',
  summary: ['ClaudeOS coordinates agent sessions, knowledge and automations from one place.'],
  problem: ['Running many agent sessions by hand loses context and scatters knowledge.'],
  highlights: [
    { title: 'One place for agents', body: 'Sessions, runs and notes are managed together.' },
  ],
  techStack: [{ name: 'TypeScript', role: 'Application' }],
  architecture: {
    nodes: [
      { id: 'ui', label: 'Dashboard', kind: 'ui', x: 0, y: 0, summary: 'Where the user starts work.', details: 'Placeholder details for the dashboard.', tech: ['React'] },
      { id: 'core', label: 'Orchestrator', kind: 'service', x: 280, y: 0, summary: 'Schedules agent runs.', details: 'Placeholder details for the orchestrator.', tech: ['TypeScript'] },
      { id: 'vault', label: 'Knowledge vault', kind: 'datastore', x: 280, y: 160, summary: 'Durable notes.', details: 'Placeholder details for the vault.', tech: ['Markdown'] },
      { id: 'claude', label: 'Claude', kind: 'external', x: 560, y: 0, summary: 'The model doing the work.', details: 'Placeholder details for Claude.', tech: ['Claude API'] },
    ],
    edges: [
      { id: 'ui-core', source: 'ui', target: 'core', label: 'start task' },
      { id: 'core-claude', source: 'core', target: 'claude', label: 'run agent' },
      { id: 'core-vault', source: 'core', target: 'vault', label: 'write note' },
    ],
    traces: [
      {
        id: 'task',
        name: 'Start a task',
        description: 'From a click in the dashboard to a saved note.',
        steps: [
          { edgeId: 'ui-core', title: 'Start', caption: 'The dashboard asks the orchestrator to start a task.' },
          { edgeId: 'core-claude', title: 'Run', caption: 'The orchestrator launches an agent session.' },
          { edgeId: 'core-claude', title: 'Result', caption: 'The agent reports back.', reverse: true },
          { edgeId: 'core-vault', title: 'Persist', caption: 'The result is written to the vault.' },
        ],
      },
    ],
  },
  links: { github: 'https://github.com/rzarka1298/ClaudeOS' },
};

export default claudeos;
