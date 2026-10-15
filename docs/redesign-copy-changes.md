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

## Phase 2: About, Experience, Skills, Contact, footer

Sheet numbers: About is sheet 02, Experience 03, Projects 04, Skills 05,
Contact 06 (matching the hero's "Sheet 01 / 06"). `Section` adds the
"0N / LABEL", "SHEET 0N" and "W ###" annotations to each heading.

### About (`components/About.tsx`)

| Where | Before | After |
|---|---|---|
| Heading | About Me | Between infrastructure and AI |
| Subtitle | Passionate about creating digital experiences that make a difference | *(removed: no facts)* |
| Bio ¶1 | Hi there! I'm a Computer Science student at the University of Maryland who works at the seam between infrastructure and AI. At IBM I architected a recursive DNS platform and scaled it 10× to over 1M QPS; I'm now on the Domain Name Services team at AWS, working on DNS at global scale. | I'm a Computer Science student at the University of Maryland, working at the seam between infrastructure and AI. At IBM I architected a recursive DNS platform and scaled it 10× to over 1M QPS. Now I'm on the Domain Name Services team at AWS, working on DNS at global scale. |
| Bio ¶2 | On the AI side, I've built RAG pipelines serving Southern African education ministries, fine-tuned diffusion models for semiconductor metrology at NIST, and founded RAGent LLC, which I grew to $20K+ ARR and a 20+ person team. I also do wearable robotics research at UMIACS on Calico, published at ACM IMWUT. | On the AI side, I've built RAG pipelines for Southern African education ministries, fine-tuned diffusion models for semiconductor metrology at NIST, and founded RAGent LLC, which grew to $20K+ ARR and a 20+ person team. I also do wearable robotics research at UMIACS on Calico, published at ACM IMWUT. |
| Bio ¶3 | …hold up in production — measured, observable, and reliable. … | …hold up in production: measured, observable and reliable. … (rest unchanged) |
| Fun fact heading | 🤖 Fun Fact | Note 1 / Now building |
| Fun fact | I'm currently developing interactive touchscreen technology for Calico, a miniature relocatable wearable system that can move around on your body! It's like having a tiny robot companion that can sense your actions and provide real-time feedback. | Interactive touchscreen technology for Calico, a miniature wearable robot that relocates around your body, senses your actions and gives real-time feedback. |
| Photo alt | Rugved Zarkar Profile Photo | Portrait of Rugved Zarkar |
| New annotations | *(none)* | Fig. 02 Rugved Zarkar (caption); W 1851 / H 1778 (the photo's pixel dimensions); callouts "UMD CS, Dec 2027" and "SWE @ AWS" (≥640px only) |
| Highlight titles | Infrastructure Engineer, AI/ML Engineer, Research Assistant, Founder | Sentence case, numbered D-01 to D-04; descriptions unchanged except "diffusion models, and agent" → "diffusion models and agent" |
| New labels | *(none)* | Spec sheet, DWG 02-B, Education, Relevant coursework (was "Relevant coursework" inside the card), Graduation, GPA |
| Stat labels | Years Experience, Professional Roles, Technologies Used, GPA at UMD | Years of experience, Professional roles, Technologies used, GPA at UMD |

Education facts, coursework list and the portfolio-views counter are unchanged.

### Experience (`components/Experience.tsx`, data in `components/sections/experienceData.ts`)

| Where | Before | After |
|---|---|---|
| Heading | Professional Experience | Where I've worked |
| Subtitle | My journey through different roles, companies, and the impact I've made along the way | Eight roles over six-plus years, newest first: DNS at AWS and IBM, applied ML at NIST, a startup I founded, and wearable robotics research. |
| Periods | "Aug 2026 - Present" etc. | En dash: "Aug 2026 – Present" |
| Section labels | Key Achievements, Technologies Used | *(removed; achievements are a list, stack is a mono line with sr-only "Stack:")* |
| New labels | *(none)* | Part numbers R-01 to R-08; readout (large screens, aria-hidden): start year, "R-0N / 08", Powered/Standby, short company name (AWS, IBM, NIST, RAGent, UMIACS, JHU APL, Neuron-G, BlueWave), title, period; "Fig. 03 / Readout"; "End of trace / 2020" |
| AWS description | Building on the Domain Name Services team, working on… | On the Domain Name Services team, working on… |
| AWS achievements | Joined the Domain Name Services team in Arlington, VA / Working on DNS infrastructure operating at global scale / Extending the authoritative and recursive DNS experience built at IBM | Extending the authoritative and recursive DNS experience built at IBM (the first two repeated the description and location) |
| IBM description | Architected and optimized a recursive DNS platform… | Architected and tuned a recursive DNS platform… |
| IBM achievements | …on DNSDist, Unbound, and SDNLB… 2 DNSDist nodes, and 3 Unbound nodes / Increased DNSDist throughput 19%… systemd, and network tuning / …customized Grafana/Osprey… / Developed Ansible automation… | Oxford commas dropped / "Raised DNSDist throughput 19%…" / "customised" / "Wrote Ansible automation…"; numbers unchanged |
| NIST description | Engineered AI-driven metrology pipelines… | Built AI-driven metrology pipelines… |
| NIST achievements | …TensorFlow, and Scikit-Learn… / …enhancing semiconductor measurement precision | …TensorFlow and scikit-learn… / …improving semiconductor measurement precision |
| RAGent description | …Retrieval-Augmented Generation (RAG) systems for enterprise and education, leading a 20+ person organization. | …retrieval-augmented generation (RAG) systems for enterprise and education, and led its 20+ person organization. |
| RAGent achievements | Founded an AI startup generating $20K+ ARR across a 20+ employee organization / …FastAPI, OpenAI API, and Weaviate… / …infrastructure — Terraform IaC… | Grew the startup to $20K+ ARR across a 20+ employee organization / …FastAPI, the OpenAI API and Weaviate… / …infrastructure: Terraform IaC… |
| UMIACS description | …interaction, actuation, and sensing. | …interaction, actuation and sensing. |
| JHU APL description | Utilized Matlab, Python, and Github to develop a production-level application to track inventory. Led 10 intern developers throughout app development lifecycle. | Built a production-level inventory tracking application with MATLAB, Python and GitHub, leading 10 intern developers through the app development lifecycle. |
| JHU APL achievements | Led team of 10 intern developers with meetings and deadlines / Developed production-level inventory tracking application / … / Surveyed employees for user preferences on SAILS app | Led a team of 10 intern developers, running meetings and deadlines / *(removed: repeated the description)* / … / Surveyed employees for user preferences on the SAILS app |
| Neuron-G description | Conducted research study to determine the extent of bias in Supreme Court cases using machine learning techniques and statistical analysis. | Studied the extent of bias in Supreme Court cases using machine learning and statistical analysis. |
| Neuron-G achievements | Used SKLearn's Random Forest… / …race, gender, and age | Used scikit-learn's Random Forest… / …race, gender and age |
| BlueWave description | Led implementation of automated remote monitoring systems for semiconductor manufacturing equipment, which… | Led automated remote monitoring for semiconductor manufacturing equipment, which… |
| BlueWave achievements | …for CVD System / Automated Substrate heaters and Thermal Evaporator Deposition Systems | …for the CVD system / Automated substrate heaters and thermal evaporator deposition systems |
| Stat labels | Years Experience, Professional Roles, Technologies, Startup Founded | Years of experience, Professional roles, Technologies, Startup founded |

### Skills (`components/Skills.tsx`)

| Where | Before | After |
|---|---|---|
| Heading | Skills & Technologies | Skills and technologies |
| Subtitle | A comprehensive overview of my technical expertise and experience | The parts I build with, grouped like a bill of materials. Pick a group to filter the library. |
| Category cards | First 4 skills, "+N more", "N technologies" | Every skill shown, each with a designator (LNG-01, ML-04, INF-07, WEB-, TL-, CRT-); group header "N parts" |
| New filter | *(none)* | "BOM / Filter" table: Ref / Group / Qty; rows "All parts 44" plus each group with its count; accessible name "Filter skills by group" |
| Technology Stack cloud | Heading "Technology Stack" + 4 skills per category | *(replaced)* by a ticker of every non-certification skill, labelled "Full stack" (pause/play control from `Marquee`) |

Skill names and group names are unchanged.

### Contact (`components/Contact.tsx`)

| Where | Before | After |
|---|---|---|
| Heading | Let's Work Together | Let's work together |
| Subtitle | Have a project in mind? I'd love to hear from you. Send me a message and let's start building something amazing. | Have a project in mind? Send me a message, or email me directly. |
| New CTA | *(none)* | Large "Email me" link showing rugvedzarkar@gmail.com |
| Form title | Send me a message | Form 06-A / Message |
| Field labels | Name *, Email *, Subject *, Message * | Same, numbered 01 to 04 (the * is now hidden from screen readers; fields remain `required`) |
| Submit | Send Message / Sending... | Send message / Sending... |
| Contact card | "Get in touch" / "Feel free to reach out through any of these channels" + Email, Phone, Location | "Notes / Contact" block: Email, Phone, Location, GitHub (rzarka1298), LinkedIn (rugved-zarkar), Instagram (rugvedzarkar), Résumé (Download PDF); social links were icon-only, now show their handles |
| Social card | Find me online | *(merged into the contact block)* |
| Résumé card | Interested in my experience? / Download my resume to learn more about my background and projects / Download Resume | Résumé row: "Download PDF" (same tracking and toast) |
| Fun fact | 🤖 Fun fact: I'm currently working on wearable robotics! Feel free to ask me about my latest research projects. | Ask me about my wearable robotics research. |
| Response promise | Quick Response Guaranteed / I typically respond to all inquiries within 24 hours. Looking forward to hearing from you! | I usually reply within 24 hours. |

Toasts, placeholders and the form's request are unchanged.
`Contact-updated.tsx` (unused duplicate) was deleted.

### Footer (`components/sections/Footer.tsx`, new)

| Where | Before | After |
|---|---|---|
| Footer | *(none)* | Title block: Title "Rugved Zarkar, portfolio" / "Software engineer. Systems that hold up in production."; Drawn by R. Zarkar; Sheet 06 / 06; Rev B (sr-only ", Blueprint redesign"); Date 2026-10-15; Built with React / TypeScript / Vite / Tailwind; Copyright © (current year); Return: Back to top |

### Home page (`components/HomePage.tsx`)

The floating "Let's connect" button now also hides while the Contact section is on screen.
