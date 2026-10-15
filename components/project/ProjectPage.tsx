import { Component, Suspense, useEffect, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { BlueprintFrame } from '../blueprint';
import NotFound from '../NotFound';
import ArchitectureDiagram from './ArchitectureDiagram';
import { getDemo } from './demos';
import { getProjectPage } from '../../content/projects';
import type { ProjectPage as ProjectPageData } from '../../content/projects/types';
import BillOfMaterials from './page/BillOfMaterials';
import InstallTerminal from './page/InstallTerminal';
import PageWipe from './page/PageWipe';
import ProjectPager from './page/ProjectPager';
import SheetIndex from './page/SheetIndex';
import SheetSection from './page/SheetSection';
import SpecCallouts from './page/SpecCallouts';
import TitleBlock from './page/TitleBlock';
import { neighbours, pad2, partNumber, sheetsFor, type Sheet } from './page/sheets';

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
      return <p className="p-6 text-sm text-bp-ink-dim">This demo couldn't be loaded.</p>;
    }
    return this.props.children;
  }
}

function Paragraphs({ items }: { items: string[] }) {
  return (
    <div className="space-y-4 text-[0.9375rem] leading-relaxed text-bp-ink-dim md:text-base">
      {items.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

function DemoFallback() {
  return (
    <div className="flex h-72 items-center justify-center">
      <span className="bp-label animate-pulse text-bp-line">Loading demo</span>
    </div>
  );
}

export function ProjectPage({ project }: { project: ProjectPageData }) {
  const Demo = getDemo(project.demoId);
  const sheets = sheetsFor(project, Boolean(Demo));
  const part = partNumber(project.slug);
  const pager = neighbours(project.slug);

  const sheet = (id: string): [number, Sheet] => {
    const i = sheets.findIndex((s) => s.id === id);
    return [i + 1, sheets[i]];
  };
  const section = (id: string, children: ReactNode, intro?: ReactNode) => {
    const [index, s] = sheet(id);
    if (!s) return null;
    return (
      <SheetSection id={id} index={index} total={sheets.length} label={s.label} title={s.title} intro={intro}>
        {children}
      </SheetSection>
    );
  };
  const fig = (id: string) => `Fig. ${pad2(sheet(id)[0])}`;

  useEffect(() => {
    const previous = document.title;
    document.title = `${project.title} · Rugved Zarkar`;
    return () => {
      document.title = previous;
    };
  }, [project.title]);

  return (
    <main id="main" className="overflow-x-clip pb-24 pt-14">
      <PageWipe label={`${part} / ${project.title}`} />

      <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-10 lg:pr-14">
        <TitleBlock project={project} part={part} sheetCount={sheets.length} />

        <div className="lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[13rem_minmax(0,1fr)]">
          <SheetIndex sheets={sheets} part={part} />

          <div className="min-w-0">
            {section(
              'overview',
              <div className="grid gap-10 md:grid-cols-2 md:gap-0">
                <div className="md:pr-10">
                  <h3 className="bp-label mb-4 text-bp-line">What it is</h3>
                  <Paragraphs items={project.summary} />
                </div>
                <div className="md:border-l md:border-bp-line-soft/40 md:pl-10">
                  <h3 className="bp-label mb-4 text-bp-line">The problem</h3>
                  <Paragraphs items={project.problem} />
                </div>
              </div>,
            )}

            {section(
              'architecture',
              <figure className="m-0">
                <BlueprintFrame label={`${fig('architecture')} / System`} meta={part} className="pt-5">
                  <ArchitectureDiagram architecture={project.architecture} githubUrl={project.links.github} />
                </BlueprintFrame>
                <figcaption className="mt-4 flex gap-3 text-sm text-bp-ink-dim">
                  <span className="bp-label shrink-0 pt-[0.2rem] text-bp-line">{fig('architecture')}</span>
                  <span>
                    Click a component to see what it does. Pick a trace and press Play to follow a request through the
                    system.
                  </span>
                </figcaption>
              </figure>,
            )}

            {Demo &&
              section(
                'demo',
                <BlueprintFrame label={`${fig('demo')} / Live demo`} meta={part} bordered className="bg-bp-bg">
                  {/* Demos have their own scrollers and gestures; keep Lenis out. */}
                  <div data-lenis-prevent className="p-3 pt-5 sm:p-5 sm:pt-6">
                    <DemoBoundary>
                      <Suspense fallback={<DemoFallback />}>
                        <Demo project={project} />
                      </Suspense>
                    </DemoBoundary>
                  </div>
                </BlueprintFrame>,
              )}

            {section('highlights', <SpecCallouts items={project.highlights} />)}

            {section('stack', <BillOfMaterials items={project.techStack} part={part} />)}

            {project.install &&
              section('install', <InstallTerminal install={project.install} slug={project.slug} />, project.install.intro)}

            {pager && <ProjectPager prev={pager.prev} next={pager.next} />}
          </div>
        </div>
      </div>
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
