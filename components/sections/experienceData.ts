/**
 * Experience entries, newest first. Every fact here comes from the
 * pre-redesign `Experience.tsx`; copy edits are logged in
 * docs/redesign-copy-changes.md.
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
  type: 'Current' | 'Internship' | 'Founder' | 'Research' | 'Contract';
  description: string;
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
    period: 'Aug 2026 – Present',
    year: '2026',
    type: 'Current',
    description:
      'On the Domain Name Services team, working on the DNS infrastructure that resolves traffic across AWS at global scale.',
    achievements: ['Extending the authoritative and recursive DNS experience built at IBM'],
    technologies: ['AWS', 'DNS', 'Distributed Systems', 'Cloud Infrastructure'],
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
    description:
      "Architected and tuned a recursive DNS platform serving 30 clients, then automated the provisioning pipeline behind IBM's Classic-to-VPC migration.",
    achievements: [
      'Architected a recursive DNS platform on DNSDist, Unbound and SDNLB, scaling throughput 10× from 100K to 1M+ QPS with sub-1% loss across 30 clients, 2 DNSDist nodes and 3 Unbound nodes',
      'Raised DNSDist throughput 19% through multi-instance CPU pinning and end-to-end DNSDist, Unbound, Linux kernel, systemd and network tuning',
      'Built Python metrics exporters and customised Grafana/Osprey dashboards for platform observability',
      "Wrote Ansible automation that cut node provisioning from days to under 3 minutes for IBM's Classic-to-VPC migration",
    ],
    technologies: ['DNSDist', 'Unbound', 'SDNLB', 'Ansible', 'Python', 'Grafana', 'Linux'],
  },
  {
    ref: 'R-03',
    title: 'Software Engineer Intern',
    company: 'National Institute of Standards and Technology',
    short: 'NIST',
    location: 'Gaithersburg, MD',
    period: 'May 2025 – Mar 2026',
    year: '2025',
    type: 'Internship',
    description:
      'Built AI-driven metrology pipelines for scanning electron microscope (SEM) image processing, advancing precision measurement for semiconductor research.',
    achievements: [
      'Built AI-driven metrology pipelines with PyTorch, TensorFlow and scikit-learn to process 1,000+ SEM images',
      'Reduced scan points by 40% while improving image fidelity by 20%',
      'Developed and fine-tuned a Denoising Diffusion Probabilistic Model (DDPM) for SEM image enhancement',
      'Lowered measurement uncertainty by 50%, improving semiconductor measurement precision',
    ],
    technologies: ['PyTorch', 'TensorFlow', 'Scikit-Learn', 'DDPM', 'Computer Vision'],
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
    description:
      'Founded an AI startup building retrieval-augmented generation (RAG) systems for enterprise and education, and led its 20+ person organization.',
    achievements: [
      'Grew the startup to $20K+ ARR across a 20+ employee organization',
      'Architected RAG pipelines with llama-index, FastAPI, the OpenAI API and Weaviate for hybrid vector + keyword search and parallel document retrieval',
      'Delivered an AI workflow for sustainED (McKinsey-backed) on AWS-native infrastructure: Terraform IaC, Aurora Serverless v2, and Bedrock Titan + Claude 3.5 Haiku',
      'Translated and simplified 7,000+ restricted research documents, cutting review time 35% and improving accessibility for Southern African education ministries',
    ],
    technologies: ['llama-index', 'FastAPI', 'Weaviate', 'Terraform', 'AWS Bedrock', 'Aurora Serverless'],
  },
  {
    ref: 'R-05',
    title: 'Software Research Assistant',
    company: 'University of Maryland Institute for Advanced Computer Studies',
    short: 'UMIACS',
    location: 'College Park, MD',
    period: 'Aug 2024 – Present',
    year: '2024',
    type: 'Research',
    description:
      'Building firmware and interactive systems for Calico, an ACM IMWUT-published miniature wearable robot for on-body interaction, actuation and sensing.',
    achievements: [
      'Engineered C++ and Python firmware for an ESP32-S3 wearable robot with a touchscreen UI',
      'Integrated an IMU sensor pipeline and WiFi communication stack with anatomical imagery display',
      'Extended the ACM IMWUT-published Calico platform to support educational programming environments',
      'Project featured in IEEE Spectrum and The Verge, demonstrated at CHI and UbiComp',
    ],
    technologies: ['C++', 'Python', 'ESP32-S3', 'Embedded Systems', 'IMU Sensors'],
  },
  {
    ref: 'R-06',
    title: 'Software Engineer Intern',
    company: 'Aspire JHU APL',
    short: 'JHU APL',
    location: 'Johns Hopkins Applied Physics Laboratory',
    period: 'May 2023 – May 2024',
    year: '2023',
    type: 'Internship',
    description:
      'Built a production-level inventory tracking application with MATLAB, Python and GitHub, leading 10 intern developers through the app development lifecycle.',
    achievements: [
      'Led a team of 10 intern developers, running meetings and deadlines',
      'Presented findings to APL Air Missile Defense Sector administration',
      'Surveyed employees for user preferences on the SAILS app',
    ],
    technologies: ['MATLAB', 'Python', 'Github', 'Team Leadership'],
  },
  {
    ref: 'R-07',
    title: 'Junior Developer',
    company: 'Neuron-G',
    short: 'Neuron-G',
    location: 'Remote',
    period: 'May 2022 – Sept 2022',
    year: '2022',
    type: 'Contract',
    description:
      'Studied the extent of bias in Supreme Court cases using machine learning and statistical analysis.',
    achievements: [
      "Used scikit-learn's Random Forest to capture feature importance",
      'Analyzed demographic variables including race, gender and age',
      'Contributed to bias detection research in judicial systems',
      'Developed data analysis pipelines for legal research',
    ],
    technologies: ['SKLearn', 'Random Forest', 'Python', 'Github', 'Data Analysis'],
  },
  {
    ref: 'R-08',
    title: 'Research and Development Intern',
    company: 'BlueWave Semiconductors',
    short: 'BlueWave',
    location: 'On-site',
    period: 'May 2020 – Aug 2022',
    year: '2020',
    type: 'Internship',
    description:
      'Led automated remote monitoring for semiconductor manufacturing equipment, which proved especially valuable during the pandemic.',
    achievements: [
      'Implemented automated remote monitoring for the CVD system',
      'Automated substrate heaters and thermal evaporator deposition systems',
      'Used PLC circuitry programming and sensors for automation',
      'Enabled remote depositions during pandemic restrictions',
    ],
    technologies: ['CVD', 'PLC Programming', 'Ladder Logic', 'Industrial Automation'],
  },
];

export const experienceStats = [
  { value: '6+', label: 'Years of experience' },
  { value: '8', label: 'Professional roles' },
  { value: '30+', label: 'Technologies' },
  { value: '1', label: 'Startup founded' },
];
