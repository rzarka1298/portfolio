import { featuredProjects, isFeaturedProjectId } from '../../content/featured';
import { getProjectPage, type ProjectPage } from '../../content/projects';

/**
 * Showcase copy for the home page's Projects section, one entry per tab.
 *
 * The long-form source of truth is each project's content file
 * (content/projects/<slug>.ts). The lines here are short summaries of that
 * content; every number in `stats` is stated in the content file. Order is
 * featured-first (the hero's P-01..P-05), then the rest.
 */
export interface ShowcaseStat {
  value: string;
  label: string;
}

export interface ShowcaseEntry {
  /** Tab id and route slug; equals the hero's FeaturedProjectId where there is one. */
  slug: string;
  partNo: string;
  /** Rail and stage title. */
  name: string;
  /** One-line outcome for the rail row. */
  result: string;
  /** Two or three sentences. */
  overview: string;
  /** The problem it solves, one sentence. */
  problem: string;
  stats: ShowcaseStat[];
  chips: string[];
  /**
   * Numeric id the pre-redesign card grid used for view analytics
   * (`/project/<id>`); kept so existing counts stay keyed the same.
   */
  legacyId: number;
  /** Shown instead of the diagram when there is no content file. */
  image?: string;
  /** Fallback links when there is no content file. */
  links?: ProjectPage['links'];
}

export interface ShowcaseProject extends ShowcaseEntry {
  page?: ProjectPage;
  links: ProjectPage['links'];
  status?: string;
}

const featuredById = new Map(featuredProjects.map((p) => [p.id, p]));
const featuredResult = (slug: string, fallback: string) =>
  (isFeaturedProjectId(slug) ? featuredById.get(slug)?.result : undefined) ?? fallback;

const ENTRIES: ShowcaseEntry[] = [
  {
    slug: 'harnessflow',
    partNo: 'P-01',
    name: 'HarnessFlow',
    result: featuredResult('harnessflow', 'Verified PRD-to-branch coding runs'),
    overview:
      'Turns a PRD and a local Git repo into a verified branch. It plans the work, freezes executable acceptance checks once an independent reviewer approves them, implements each task with Codex in an isolated worktree, and repairs failures within a budget. A Temporal workflow drives it one recoverable phase at a time, with run state in Postgres.',
    problem:
      'Coding agents are good at writing code and bad at proving they finished, so HarnessFlow treats their output as untrusted until the frozen checks pass on the exact commit.',
    stats: [
      { value: '9', label: 'recoverable phases per run' },
      { value: '3×', label: 'repeat failures, then the run blocks' },
      { value: '~4.5 min', label: 'recorded acceptance run' },
    ],
    chips: ['Go', 'Temporal', 'Python', 'Postgres', 'Next.js', 'Codex CLI'],
    legacyId: 1,
  },
  {
    slug: 'claudeos',
    partNo: 'P-02',
    name: 'Claude Command Center',
    result: featuredResult('claudeos', 'Local-first agent command center'),
    overview:
      'A command center for Claude Code that runs entirely on one Mac. An Obsidian plugin shows every session live, backed by a launchd-supervised Node service that owns the SQLite store, the Keychain secret and vault writes. Risky actions go through an approval inbox where each request is fingerprinted, approved once, and expires.',
    problem:
      'Several Claude Code sessions scatter their state across terminal tabs, and a localhost dashboard would expose a credential-holding process to the browser.',
    stats: [
      { value: '0', label: 'TCP ports; a Unix socket instead' },
      { value: '12', label: 'packages, one typed monorepo' },
      { value: '28', label: 'architecture decisions recorded' },
    ],
    chips: ['TypeScript', 'Node.js', 'SQLite', 'Obsidian', 'Zod', 'launchd'],
    legacyId: 8,
  },
  {
    slug: 'lane-optimize',
    partNo: 'P-03',
    name: 'Lane-Optimize',
    result: featuredResult('lane-optimize', 'RL vs. rule-based traffic benchmarks'),
    overview:
      'Reinforcement learning for highway lane changes in the SUMO traffic simulator. A from-scratch PyTorch DQN, MaskablePPO and a shared-policy multi-agent PPO are benchmarked against rule-based drivers, and a FastAPI service streams any policy live to a React dashboard.',
    problem:
      'Rule-based lane changing is easy to reason about, but it is hard to tell how much a learned policy really improves on it, or where it fails.',
    stats: [
      { value: '20', label: 'seeds per cell, final matrix' },
      { value: '0', label: 'collisions, safety-weighted PPO' },
      { value: '290 → 0.31', label: 'DQN loss after the Huber fix' },
    ],
    chips: ['PyTorch', 'Stable-Baselines3', 'SUMO', 'Gymnasium', 'FastAPI', 'React'],
    legacyId: 2,
  },
  {
    slug: 'calico',
    partNo: 'P-04',
    name: 'Calico',
    result: featuredResult('calico', 'ACM IMWUT published'),
    overview:
      'A miniature wearable robot from the UMD Small Artifacts Lab that relocates across the body on a track sewn into clothing. This version adds an ESP32-S3 with a round touchscreen and an IMU, programmed from a Blockly page in the browser over Wi-Fi. A team project.',
    problem:
      'Wearables usually stay in one place on the body, and earlier relocatable ones were bulky or moved slowly and unreliably.',
    stats: [
      { value: 'IMWUT', label: 'published in ACM IMWUT, 2022' },
      { value: '150 ms', label: 'IMU loop that keeps the screen image level' },
    ],
    chips: ['ESP32-S3', 'Arduino C++', 'IMU', 'Flask', 'Blockly'],
    legacyId: 3,
  },
  {
    slug: 'biasgpt',
    partNo: 'P-05',
    name: 'BiasGPT',
    result: featuredResult('biasgpt', 'Counterfactual identity-swap bias checks'),
    overview:
      'Swaps the names and pronouns in a text with a spaCy engine, then asks a fine-tuned transformer whether the change of identity changed the tone. A FastAPI backend serves the swap and the verdict to a small React page, and a scheduled pipeline generates new GPT-scored pairs and trains candidate models.',
    problem:
      'The same sentence about “John” and about “Maria” should be judged the same way, and checking that by hand does not scale.',
    stats: [
      { value: '1 call', label: 'returns the counterfactual and a verdict on it' },
      { value: 'F1 gate', label: 'a retrained candidate is kept only if F1 holds' },
    ],
    chips: ['PyTorch', 'DistilBERT', 'spaCy', 'FastAPI', 'React'],
    legacyId: 4,
  },
  {
    slug: 'agentic-rag-ip',
    partNo: 'P-06',
    name: 'Agentic RAG for IP',
    result: 'Patent Q&A agent over USPTO XML',
    overview:
      'A Llama Stack retrieval agent over USPTO patent XML. It parses full-text patents, embeds and indexes them, and answers questions with a tool-using agent that searches the index before it replies. A FastAPI server builds the index at startup and a React page sends the questions.',
    problem:
      'Patents are long, structured XML where keyword search misses claims worded differently, and IP research needs answers grounded in the documents themselves.',
    stats: [
      { value: '512', label: 'token chunks with MiniLM embeddings' },
      { value: '2', label: 'vector stores tried: FAISS and Weaviate' },
    ],
    chips: ['Python', 'Llama Stack', 'FAISS', 'FastAPI', 'React'],
    legacyId: 5,
  },
  {
    slug: 'neuromaker',
    partNo: 'P-07',
    name: 'Neuromaker',
    result: 'Speech-to-ASL prosthetic hand',
    overview:
      'An entry to the NeuroMaker International Bioengineering Competition: a servo-driven prosthetic hand meant to turn spoken words into American Sign Language. Python prototypes record speech, transcribe it with Google Cloud Speech-to-Text, and drive the servos through an Arduino running Firmata.',
    problem:
      'Most hearing people do not sign and interpreters are not always available; the hard part was reliable recognition and finger positions a few servos can reach.',
    stats: [
      { value: '3', label: 'stages, each built and tested on its own' },
      { value: '15 ms', label: 'per degree of servo sweep for smooth fingers' },
    ],
    chips: ['Python', 'Google Cloud Speech', 'Arduino', 'pyFirmata'],
    legacyId: 6,
  },
  {
    slug: 'portfolio',
    partNo: 'P-08',
    name: 'Portfolio Website',
    result: 'This site: typed content, live diagrams',
    overview:
      'This site. A React and TypeScript single-page app where every project page is typed data rendered by one page component, with a playable architecture diagram. One Supabase Edge Function handles the contact form and visit analytics.',
    problem: 'A project card can say what something is but not how it works, and a hand-built page per project does not scale.',
    stats: [
      { value: '8', label: 'project pages from one typed content format' },
      { value: '1', label: 'edge function for the whole backend' },
    ],
    chips: ['React', 'TypeScript', 'Tailwind', 'Framer Motion', 'Supabase'],
    legacyId: 7,
  },
];

export const showcaseProjects: ShowcaseProject[] = ENTRIES.map((entry) => {
  const page = getProjectPage(entry.slug);
  return {
    ...entry,
    page,
    status: page?.status,
    links: page?.links ?? entry.links ?? {},
  };
});

export function findShowcaseIndex(slug: string | null | undefined) {
  if (!slug) return -1;
  return showcaseProjects.findIndex((p) => p.slug === slug);
}
