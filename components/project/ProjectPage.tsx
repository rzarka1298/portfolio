import { Component, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Check, Copy, ExternalLink, Github } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import NotFound from '../NotFound';
import ArchitectureDiagram from './ArchitectureDiagram';
import { getDemo } from './demos';
import { getProjectPage } from '../../content/projects';
import type { ProjectPage as ProjectPageData } from '../../content/projects/types';

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <motion.section
      id={id}
      className="py-10 md:py-14"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl md:text-3xl mb-6">{title}</h2>
      {children}
    </motion.section>
  );
}

function Paragraphs({ items }: { items: string[] }) {
  return (
    <div className="space-y-4 text-muted-foreground leading-relaxed">
      {items.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable (insecure context) — no-op */
    }
  };

  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg border bg-muted/60 p-4 pr-12 text-sm">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        onClick={copy}
        className="absolute right-1.5 top-1.5"
        aria-label={copied ? 'Copied' : 'Copy to clipboard'}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

/** Keeps a broken demo from taking down the whole page. */
class DemoBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Project demo failed to render:', error);
  }

  render() {
    if (this.state.failed) {
      return <p className="text-sm text-muted-foreground">This demo couldn't be loaded.</p>;
    }
    return this.props.children;
  }
}

function ProjectLinks({ links }: { links: ProjectPageData['links'] }) {
  if (!links.github && !links.docs && !links.live) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {links.github && (
        <Button asChild>
          <a href={links.github} target="_blank" rel="noopener noreferrer">
            <Github className="w-4 h-4" />
            View code
          </a>
        </Button>
      )}
      {links.docs && (
        <Button variant="outline" asChild>
          <a href={links.docs} target="_blank" rel="noopener noreferrer">
            <BookOpen className="w-4 h-4" />
            Docs
          </a>
        </Button>
      )}
      {links.live && (
        <Button variant="outline" asChild>
          <a href={links.live} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4" />
            Live
          </a>
        </Button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function ProjectPage({ project }: { project: ProjectPageData }) {
  const Demo = getDemo(project.demoId);

  useEffect(() => {
    const previous = document.title;
    document.title = `${project.title} · Rugved Zarkar`;
    return () => {
      document.title = previous;
    };
  }, [project.title]);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-6">
        <Link to="/#projects">
          <ArrowLeft className="w-4 h-4" />
          All projects
        </Link>
      </Button>

      {/* Hero */}
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="pb-6"
      >
        {project.status && (
          <Badge variant="secondary" className="mb-4 max-w-full whitespace-normal text-left">{project.status}</Badge>
        )}
        <h1 className="text-4xl md:text-6xl mb-4">{project.title}</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mb-8">{project.tagline}</p>
        <ProjectLinks links={project.links} />
      </motion.header>

      {/* Summary + problem */}
      <Section id="overview" title="Overview">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">What it is</h3>
            <Paragraphs items={project.summary} />
          </div>
          <div>
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">The problem</h3>
            <Paragraphs items={project.problem} />
          </div>
        </div>
      </Section>

      {/* Highlights */}
      {project.highlights.length > 0 && (
        <Section id="highlights" title="Highlights">
          <div className="grid gap-4 sm:grid-cols-2">
            {project.highlights.map((h) => (
              <Card key={h.title} className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">{h.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground leading-relaxed">
                  {h.body}
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* Architecture */}
      {project.architecture.nodes.length > 0 && (
        <Section id="architecture" title="Architecture">
          <p className="text-muted-foreground mb-6">
            Click a component to see what it does. Pick a trace and press Play to follow a request through the system.
          </p>
          <ArchitectureDiagram architecture={project.architecture} githubUrl={project.links.github} />
        </Section>
      )}

      {/* Demo slot — renders nothing when no demo is registered */}
      {Demo && (
        <Section id="demo" title="Try it">
          <DemoBoundary>
            <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}>
              <Demo project={project} />
            </Suspense>
          </DemoBoundary>
        </Section>
      )}

      {/* Tech stack */}
      {project.techStack.length > 0 && (
        <Section id="tech" title="Tech stack">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {project.techStack.map((t) => (
              <div key={t.name} className="rounded-lg border bg-card p-4">
                <div className="font-medium">{t.name}</div>
                <div className="text-sm text-muted-foreground">{t.role}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Install */}
      {project.install && (
        <Section id="install" title="Get started">
          <p className="text-muted-foreground mb-6">{project.install.intro}</p>
          <ol className="space-y-5">
            {project.install.steps.map((s, i) => (
              <li key={i}>
                <div className="mb-2 text-sm font-medium">
                  <span className="text-muted-foreground mr-2">{i + 1}.</span>
                  {s.label}
                </div>
                <CodeBlock code={s.code} />
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Links */}
      {(project.links.github || project.links.docs || project.links.live) && (
        <Section id="links" title="Links">
          <ProjectLinks links={project.links} />
        </Section>
      )}
    </main>
  );
}

/** Route element for `/projects/:slug`. */
export default function ProjectPageRoute() {
  const { slug } = useParams<{ slug: string }>();
  const project = getProjectPage(slug);

  if (!project) {
    return (
      <NotFound
        title="Project not found"
        message="There's no in-depth page for that project yet. The rest of my work is on the home page."
      />
    );
  }

  return <ProjectPage key={project.slug} project={project} />;
}
