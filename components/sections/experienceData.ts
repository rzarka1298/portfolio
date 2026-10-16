/**
 * Experience entries, in résumé order (RugvedZarkar_Resume.pdf, Oct 2026).
 * Titles, locations, dates and bullets follow the résumé; copy edits are
 * logged in docs/redesign-copy-changes.md.
 */
export interface Role {
  /** Part number shown on the trace, e.g. "R-01". */
  ref: string;
  title: string;
  company: string;
  /** Short name for the sticky readout. */
  short: string;
  location: string;
  period: string;
  /** Start year, shown large in the readout. */
  year: string;
  type: 'Current' | 'Internship' | 'Founder' | 'Research';
  achievements: string[];
  technologies: string[];
}

export const roles: Role[] = [
  {
    ref: 'R-01',
    title: 'Software Engineer Intern',
    company: 'Amazon Web Services',
    short: 'AWS',
    location: 'Arlington, VA',
    period: 'Sep 2026 – Present',
    year: '2026',
    type: 'Current',
    achievements: [
      'Developing a Go domain-classification API for AI tool calls, integrating Route 53 DNS Firewall and Bedrock AgentCore Policy with per-feature confidence scores, cache TTLs and TypeScript/CDK infrastructure',
      'Consolidated API and PrivateLink designs across 4 teams; identified authentication conflicts and retry paths that could exceed a 50 ms policy timeout before implementation',
      'Built Route 53 DNS Firewall and Profiles analytics in TypeScript, Python and Java across 36 AWS commercial regions, replacing 2–3 days of manual review with daily usage, growth, churn, cohort and payer-level metrics',
      'Built ECS Fargate ingestion from 72 cross-account snapshots with IAM/STS and DynamoDB; added AWS CDK pipelines, integration tests and CloudWatch alarms with data isolation across commercial, GovCloud and China partitions',
    ],
    technologies: ['Go', 'TypeScript', 'Python', 'Java', 'Route 53', 'AWS CDK', 'ECS Fargate', 'DynamoDB', 'CloudWatch'],
  },
  {
    ref: 'R-02',
    title: 'Software Engineer Intern',
    company: 'IBM',
    short: 'IBM',
    location: 'Austin, TX',
    period: 'May 2026 – Aug 2026',
    year: '2026',
    type: 'Internship',
    achievements: [
      "Architected DNSDist/Unbound/SDNLB infrastructure for IBM's Classic-to-VPC migration, scaling throughput 10× from 100K to 1M+ QPS with sub-1% packet loss across 30 clients, 2 DNSDist nodes and 3 Unbound nodes",
      'Raised DNSDist throughput 19% through CPU pinning, SO_REUSEPORT, kernel scheduling and network queue tuning',
      'Built Python exporters and Grafana/Osprey dashboards for per-node DNS latency, health, packet loss, timeouts and throughput',
      'Cut DNS node setup from days to under 3 minutes with Ansible/systemd provisioning, exporters and health checks',
    ],
    technologies: ['DNSDist', 'Unbound', 'SDNLB', 'Python', 'Grafana', 'Ansible', 'systemd', 'Linux'],
  },
  {
    ref: 'R-03',
    title: 'Software Research Assistant',
    company: 'University of Maryland Institute for Advanced Computer Studies',
    short: 'UMIACS',
    location: 'College Park, MD',
    period: 'Aug 2024 – Present',
    year: '2024',
    type: 'Research',
    achievements: [
      'Developing C++/Python firmware for Calico, an ESP32-S3 wearable robot, connecting touchscreen controls, a 20+ Hz IMU, Wi-Fi and real-time visualization while keeping touch-to-device command latency below 100 ms',
      'Extended ACM IMWUT-published Calico for classrooms and CHI/UbiComp demos; featured in IEEE Spectrum and The Verge',
    ],
    technologies: ['C++', 'Python', 'ESP32-S3', 'IMU', 'Wi-Fi'],
  },
  {
    ref: 'R-04',
    title: 'Founder & Lead Software Developer',
    company: 'RAGent LLC',
    short: 'RAGent',
    location: 'Ellicott City, MD',
    period: 'Jan 2025 – Apr 2026',
    year: '2025',
    type: 'Founder',
    achievements: [
      'Built an AWS RAG platform for 350 registered users using Terraform, Aurora v2, Bedrock Titan and Claude 3.5 Haiku; processed 7,000+ restricted documents, cutting review time 75%, with government pilots in Ghana and Kenya',
      'Built agentic RAG over a 150-node education framework and 1,000+ research sources to prioritize system improvements',
      'Led an 11-person team; platform assets acquired by sustainED; technology presented at the UN in Sept 2026',
    ],
    technologies: ['AWS', 'Terraform', 'Aurora v2', 'Bedrock Titan', 'Claude 3.5 Haiku', 'RAG'],
  },
  {
    ref: 'R-05',
    title: 'Software Engineer Intern',
    company: 'National Institute of Standards and Technology',
    short: 'NIST',
    location: 'Gaithersburg, MD',
    period: 'May 2025 – Mar 2026',
    year: '2025',
    type: 'Internship',
    achievements: [
      'Built PyTorch metrology pipelines for 1,000+ SEM images, cutting scan points 40% and measurement uncertainty 50%',
      'Fine-tuned diffusion models for SEM restoration and evaluated reconstruction quality against baseline using PSNR and SSIM',
    ],
    technologies: ['PyTorch', 'Diffusion models', 'PSNR', 'SSIM'],
  },
];

/** Every value is countable from the résumé. */
export const experienceStats = [
  { value: '5', label: 'Roles' },
  { value: '3', label: 'SWE internships' },
  { value: '1', label: 'Company founded' },
  { value: '2', label: 'AWS certifications' },
];

/** Earliest start year on the trace. */
export const firstYear = roles.reduce((min, r) => (r.year < min ? r.year : min), roles[0].year);
