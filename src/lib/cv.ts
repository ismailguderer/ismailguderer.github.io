import { z } from 'astro/zod';
import { load } from 'js-yaml';
import raw from '../data/cv.yaml?raw';

const str = z.preprocess((v) => (typeof v === 'number' ? String(v) : v), z.string());
const date = z.coerce.string().regex(/^\d{4}(-(0[1-9]|1[0-2]))?$/, 'use "YYYY" or "YYYY-MM"');
const opt = <T extends z.ZodTypeAny>(s: T) => s.nullable().optional();
const url = opt(z.string());

const Schema = z.object({
  site: z.object({ title: str, description: str }),
  person: z.object({
    name: str,
    authorName: z.union([str, z.array(str)]).transform((v) => (Array.isArray(v) ? v : [v])),
    role: str,
    affiliation: str,
    affiliationUrl: url,
    location: str,
    statement: str,
    about: z.array(str),
    email: opt(str),
    photo: url,
    cvPdf: url,
    links: z.array(z.object({ label: str, url: z.string() })).default([]),
  }),
  institutions: z.record(z.string(), z.string()).default({}),
  news: z.array(z.object({ date, text: str, url })).default([]),
  interests: z.array(str).default([]),
  skills: z.array(z.object({ group: str, items: z.array(str) })).default([]),
  experience: z
    .array(
      z.object({
        role: str, org: str, url, location: opt(str),
        start: date, end: opt(date),
        points: z.array(str).default([]),
      }),
    )
    .default([]),
  education: z
    .array(
      z.object({
        degree: str, org: str, location: opt(str),
        start: date, end: opt(date),
        thesis: opt(str), project: opt(str), supervisors: opt(str), cosupervisor: opt(str), grade: opt(str),
      }),
    )
    .default([]),
  grants: z
    .array(z.object({ title: str, role: opt(str), funder: str, start: date, end: opt(date), text: opt(str), url }))
    .default([]),
  awards: z.array(z.object({ title: str, org: opt(str), orgUrl: url, year: opt(date), url })).default([]),
  publications: z
    .array(
      z.object({
        title: str, authors: z.array(str), venue: str, year: date,
        status: opt(str), url, doi: opt(str), tags: z.array(str).default([]),
      }),
    )
    .default([]),
  outreach: z
    .array(
      z.object({
        title: str,
        kind: z.enum(['talk', 'poster', 'teaching', 'communication', 'organizing']),
        date, end: opt(date), org: opt(str), authors: opt(z.array(str)), text: opt(str), url,
      }),
    )
    .default([]),
  courses: z.array(z.object({ title: str, provider: str, year: date, url })).default([]),
  other: z.array(z.object({ group: str, sorted: z.boolean().default(false), items: z.array(str) })).default([]),
});

export type CV = z.infer<typeof Schema>;

const parsed = Schema.safeParse(load(raw));
if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  cv.yaml > ${i.path.join('.')}: ${i.message}`);
  throw new Error(`Invalid src/data/cv.yaml\n${lines.join('\n')}`);
}
const byName = (a: string, b: string) => a.localeCompare(b, 'en', { sensitivity: 'base' });
const data = parsed.data;
// skills: group order as written, items alphabetical; other groups only when sorted: true
data.skills = data.skills.map((g) => ({ ...g, items: [...g.items].sort(byName) }));
data.other = data.other.map((g) => (g.sorted ? { ...g, items: [...g.items].sort(byName) } : g));
export const cv: CV = data;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fmt(d: string | null | undefined, present = 'present'): string {
  if (!d) return present;
  const [y, m] = d.split('-');
  return m ? `${MONTHS[Number(m) - 1]} ${y}` : y;
}

export function range(start: string, end?: string | null): string {
  return `${fmt(start)} to ${fmt(end)}`;
}

/**
 * Split a text into plain and linked parts, linking every institution
 * listed under `institutions` in cv.yaml (longest name wins).
 */
export function orgParts(text: string): { t: string; url?: string }[] {
  const names = Object.keys(cv.institutions).sort((a, b) => b.length - a.length);
  const parts: { t: string; url?: string }[] = [];
  let rest = text;
  while (rest) {
    let hit: { i: number; name: string } | null = null;
    for (const name of names) {
      const i = rest.indexOf(name);
      if (i >= 0 && (!hit || i < hit.i)) hit = { i, name };
    }
    if (!hit) { parts.push({ t: rest }); break; }
    if (hit.i > 0) parts.push({ t: rest.slice(0, hit.i) });
    parts.push({ t: hit.name, url: cv.institutions[hit.name] });
    rest = rest.slice(hit.i + hit.name.length);
  }
  return parts;
}

/** Decimal year, e.g. "2024-07" -> 2024.5. Missing end = now. */
export function toYear(d: string | null | undefined, isEnd = false): number {
  if (!d) {
    const now = new Date();
    return now.getFullYear() + now.getMonth() / 12;
  }
  const [y, m] = d.split('-').map(Number);
  if (m) return y + (m - 1) / 12 + (isEnd ? 1 / 12 : 0);
  return y + (isEnd ? 1 : 0);
}

const allSections = [
  { id: 'about', label: 'About' },
  { id: 'interests', label: 'Research Interests' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'grants', label: 'Grants' },
  { id: 'awards', label: 'Awards and Grants' },
  { id: 'publications', label: 'Publications' },
  { id: 'outreach', label: 'Outreach' },
  { id: 'courses', label: 'Courses' },
  { id: 'other', label: 'Other' },
] as const;

const counts: Record<string, number> = {
  about: cv.person.about.length,
  interests: cv.interests.length,
  skills: cv.skills.length,
  experience: cv.experience.length,
  education: cv.education.length,
  grants: cv.grants.length,
  awards: cv.awards.length,
  publications: cv.publications.length,
  outreach: cv.outreach.length,
  courses: cv.courses.length,
  other: cv.other.length,
};

/** Initials for the photo fallback, e.g. "İsmail Güderer" -> "İG". */
export const initials = cv.person.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('');

/** Sections that have content; empty ones are hidden from page and nav. */
export const sections = allSections.filter((s) => counts[s.id] > 0);
export const has = (id: string) => counts[id] > 0;
