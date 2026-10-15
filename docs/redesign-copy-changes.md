# Redesign copy changes

Every visible or assistive text change made in the Blueprint redesign, as
before → after, for review. Purely visual changes (uppercase via CSS, font,
colour) are not listed. Agents rebuilding later sections: append your own
section below.

## Phase 1: foundation, header, hero

### Page metadata (`index.html`)

| Where | Before | After |
|---|---|---|
| `<meta name="description">` | *(none)* | Rugved Zarkar, software engineer at AWS. Systems that hold up in production: DNS infrastructure, AI agent orchestration, wearable robotics. |

### Hero (`components/Hero.tsx`)

| Where | Before | After |
|---|---|---|
| Role badge | 👋 Software Engineer @ AWS · CS @ Maryland | Software Engineer @ AWS · CS @ Maryland as two separate mono labels; emoji and middle dot removed |
| Tagline | I build systems that hold up in production — from DNS infrastructure at 1M+ QPS, to AI agent orchestration, to wearable robotics | I build systems that hold up in production: DNS infrastructure at 1M+ QPS, AI agent orchestration and wearable robotics. |
| Primary button | View My Work (scrolled to About) | View my work (scrolls to Projects) |
| Secondary button | Get In Touch | *(removed: the hero now has an Email link, and the floating "Let's connect" button appears once you scroll past the hero)* |
| New button | *(none)* | Résumé (downloads the PDF; tracked as `/resume-download`, referrer `hero`) |
| Social links | icon-only (Mail, GitHub, LinkedIn) | Icon plus text: Email, GitHub, LinkedIn |
| Scroll cue | Scroll to explore | See sheet 02: About |
| New annotation | *(none)* | Fig. 01 / Hero |
| New annotation | *(none)* | Sheet 01 / 06 |
| Name node label | *(none)* | 00 / Origin |
| Figure caption | *(none)* | Fig. 01 Selected projects, wired to their builder. Select a node to open it below. |
| Legend (desktop) | *(none)* | Legend: Wire, Signal, Selected |
| Screen-reader heading | *(none)* | Selected projects |
| Project node accessible name | *(none)* | `<Title>: <result>. Open in Projects.` |

### Hero project nodes (`content/featured.ts`)

The `result` lines are the existing `results` strings from `components/Projects.tsx`, unchanged.

| Project | Before (Projects.tsx title) | After (hero node) | Stack line (new) |
|---|---|---|---|
| P-01 | HarnessFlow | HarnessFlow | Go / Temporal / Python |
| P-02 | Claude Command Center | Claude Command Center | TypeScript / Node.js / SQLite |
| P-03 | Lane-Optimize | Lane-Optimize | PyTorch / SUMO / FastAPI |
| P-04 | Calico Smartlabs | **Calico** | C++ / ESP32-S3 / IMU |
| P-05 | BiasGPT | BiasGPT | DistilBERT / spaCy / FastAPI |

Part numbers P-01 to P-05 are new.

### Header (`components/Header.tsx`)

| Where | Before | After |
|---|---|---|
| Logo | Portfolio | "RZ" mark plus R. Zarkar (accessible name: "Rugved Zarkar, home") |
| Nav items | Home, About, Experience, Projects, Skills, Contact | Same words, prefixed 00 to 05 |
| Theme toggle | icon only, no label | Paper / Blueprint (visible on large screens); accessible name "Switch to light (paper) theme" / "Switch to dark (blueprint) theme" |
| Mobile menu button | icon only, no label | Menu / Close |
| Skip link | *(none)* | Skip to content |

### Global

| Where | Before | After |
|---|---|---|
| Floating CTA | Let's Connect | Let's connect |
| Pause control on `Marquee` (primitive, not yet used) | *(none)* | Pause ticker / Play ticker |

`Section` adds a "SHEET 02" style label and a measured "W 412" style dimension
value to each section title it renders; neither is in use yet.

No text changed in `ArchitectureDiagram` or the project pages.
