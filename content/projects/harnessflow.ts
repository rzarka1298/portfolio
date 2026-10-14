import type { ProjectPage } from './types';

// PLACEHOLDER content — replaced by the real HarnessFlow write-up.
const harnessflow: ProjectPage = {
  slug: 'harnessflow',
  title: 'HarnessFlow',
  tagline: 'Deterministic, production-reliable AI agent pipelines defined in YAML.',
  status: 'Open source',
  summary: [
    'HarnessFlow compiles YAML agent pipelines into Temporal-orchestrated workflows.',
  ],
  problem: [
    'Agent behaviour in production is hard to predict, replay and evaluate.',
  ],
  highlights: [
    { title: 'YAML in, workflows out', body: 'Pipelines are declared once and compiled into durable runs.' },
    { title: 'Eval-gated CI', body: 'LLM-as-judge, similarity and cost/latency scorers gate merges.' },
  ],
  techStack: [
    { name: 'Go', role: 'Control plane' },
    { name: 'Python', role: 'Agent runtime' },
    { name: 'Temporal', role: 'Durable orchestration' },
  ],
  architecture: {
    groups: [{ id: 'core', label: 'Control plane' }],
    nodes: [
      { id: 'cli', label: 'CLI', kind: 'client', x: 0, y: 0, summary: 'Submits a pipeline.', details: 'Placeholder details for the CLI.', tech: ['Go'] },
      { id: 'api', label: 'API server', kind: 'service', x: 280, y: 0, group: 'core', summary: 'Compiles YAML into a workflow.', details: 'Placeholder details for the API server.', tech: ['Go', 'Connect-Go'], codePath: 'README.md' },
      { id: 'temporal', label: 'Temporal', kind: 'queue', x: 280, y: 160, group: 'core', summary: 'Durable workflow engine.', details: 'Placeholder details for Temporal.', tech: ['Temporal'] },
      { id: 'worker', label: 'Python worker', kind: 'worker', x: 560, y: 160, summary: 'Runs agent steps.', details: 'Placeholder details for the worker.', tech: ['Python'] },
    ],
    edges: [
      { id: 'cli-api', source: 'cli', target: 'api', label: 'submit' },
      { id: 'api-temporal', source: 'api', target: 'temporal', label: 'start run' },
      { id: 'temporal-worker', source: 'temporal', target: 'worker', label: 'dispatch' },
    ],
    traces: [
      {
        id: 'run',
        name: 'Run a pipeline',
        description: 'From `harnessflow run` to the first agent step.',
        steps: [
          { nodeId: 'cli', title: 'Invoke', caption: 'The user runs the CLI with a YAML file.' },
          { edgeId: 'cli-api', title: 'Submit', caption: 'The CLI posts the pipeline to the API.' },
          { edgeId: 'api-temporal', title: 'Start run', caption: 'The API compiles it and starts a workflow.' },
          { edgeId: 'temporal-worker', title: 'Dispatch', caption: 'Temporal hands the first activity to a worker.' },
        ],
      },
    ],
  },
  links: { github: 'https://github.com/rzarka1298/harnessflow' },
};

export default harnessflow;
