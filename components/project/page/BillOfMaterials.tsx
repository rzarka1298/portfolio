import { useGsapContext } from '../../blueprint';
import type { ProjectPage } from '../../../content/projects/types';
import { pad2 } from './sheets';

/** The tech stack as a drawing's bill of materials: item, part, function. */
export default function BillOfMaterials({ items, part }: { items: ProjectPage['techStack']; part: string }) {
  const ref = useGsapContext<HTMLDivElement>(
    ({ gsap }) => {
      gsap.from('.bom-row', {
        opacity: 0,
        x: -12,
        duration: 0.5,
        ease: 'power3.out',
        stagger: 0.04,
        scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true },
      });
    },
    [items],
  );

  return (
    <div ref={ref} className="border border-bp-line/50 bg-bp-panel/90">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">Bill of materials: the technologies used and what each one does</caption>
        <thead className="hidden sm:table-header-group">
          <tr className="border-b border-bp-line/50">
            <th scope="col" className="bp-label w-20 px-4 py-3 font-normal text-bp-line">Item</th>
            <th scope="col" className="bp-label w-[34%] px-4 py-3 font-normal text-bp-line">Part</th>
            <th scope="col" className="bp-label px-4 py-3 font-normal text-bp-line">Function</th>
          </tr>
        </thead>
        <tbody>
          {items.map((t, i) => (
            <tr
              key={t.name}
              className="bom-row grid grid-cols-[2.75rem_minmax(0,1fr)] border-b border-bp-line-soft/30 transition-colors last:border-b-0 hover:bg-bp-panel-2/60 sm:table-row"
            >
              <td className="row-span-2 px-4 py-3 align-top font-mono sm:align-baseline text-xs tabular-nums text-bp-ink-dim max-sm:pr-0 sm:py-3.5">
                {pad2(i + 1)}
              </td>
              <th scope="row" className="px-4 pb-0 pt-3 align-top font-medium sm:align-baseline text-bp-ink sm:py-3.5">
                {t.name}
              </th>
              <td className="px-4 pb-3 pt-1 align-top text-sm sm:align-baseline leading-relaxed text-bp-ink-dim sm:py-3.5">{t.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-bp-line/50 px-4 py-2.5">
        <span className="bp-label">{part} / BOM</span>
        <span className="bp-label tabular-nums">{pad2(items.length)} items</span>
      </div>
    </div>
  );
}
