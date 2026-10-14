import type { Approval } from './types';

const clockFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
const clockSecFmt = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  timeZone: 'UTC',
});
const dayFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

/** The mock clock is UTC so the synthetic timestamps read the same everywhere. */
export function clock(t: number, seconds = false): string {
  return (seconds ? clockSecFmt : clockFmt).format(t);
}

export function dayAndClock(t: number): string {
  return `${dayFmt.format(t)}, ${clockFmt.format(t)}`;
}

export function duration(msSpan: number): string {
  const total = Math.max(0, Math.floor(msSpan / 1000));
  if (total < 60) return `${total} s`;
  const m = Math.floor(total / 60);
  if (m < 60) return `${m} m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ${m % 60} m`;
  return `${Math.floor(h / 24)} d ${h % 24} h`;
}

export function ago(t: number | null, now: number): string {
  if (t === null) return 'unavailable';
  const d = now - t;
  if (d < 5000) return 'just now';
  return `${duration(d)} ago`;
}

export function countdown(msLeft: number): string {
  const s = Math.max(0, Math.floor(msLeft / 1000));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h} h ${m % 60} m`;
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export function compactNumber(n: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

/** The bytes an approval's fingerprint covers: what will happen, to what. */
export function approvalPayload(a: Approval): string {
  return JSON.stringify({ operation: a.operation, runId: a.runId, project: a.project, blocks: a.blocks });
}

function fnv1a(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x811c9dc5) >>> 0;
  }
  return (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')).repeat(4);
}

/** SHA-256 of the payload (falls back to a stand-in hash if Web Crypto is unavailable). */
export async function fingerprint(payload: string): Promise<{ algo: string; hex: string }> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
      const hex = Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
      return { algo: 'sha256', hex };
    }
  } catch {
    /* fall through */
  }
  return { algo: 'fnv', hex: fnv1a(payload) };
}

export function shortHash(f: { algo: string; hex: string } | null): string {
  if (!f) return '…';
  return `${f.algo}:${f.hex.slice(0, 4)}…${f.hex.slice(-4)}`;
}
