import { randomBytes } from 'node:crypto';
import { cors, requireOwner, readDoc, writeDoc } from './owner-auth.js';

const DOC = 'experiences.json';
// The Experience section is hidden from the public site (SHOW_EXPERIENCE in src/lib/features.ts).
// While this is false only the signed-in owner (the Studio editor) can read the entries. Nothing is
// deleted: set both flags to true to show the section again.
const PUBLISHED = false;
const CATEGORIES = ['training', 'media', 'marketing', 'hr'];
const DATE_RE = /^\d{4}(-(0[1-9]|1[0-2]))?$/;

const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const lines = (v) =>
  (Array.isArray(v) ? v : [])
    .map((item) => text(item, 500))
    .filter(Boolean)
    .slice(0, 40);

// Current positions first, then the most recent start date. Entries that tie keep the order they were added in.
const sorted = (rows) => [...rows].sort((a, b) => Number(b.current) - Number(a.current) || b.start.localeCompare(a.start));

// Returns { record } or { error } for a submitted experience.
function parse(body) {
  const record = {
    category: body.category,
    title_en: text(body.title_en, 160),
    title_ar: text(body.title_ar, 160),
    org_en: text(body.org_en, 160),
    org_ar: text(body.org_ar, 160),
    type_en: text(body.type_en, 60),
    type_ar: text(body.type_ar, 60),
    start: text(body.start, 7),
    end: text(body.end, 7),
    current: Boolean(body.current),
    resp_en: lines(body.resp_en),
    resp_ar: lines(body.resp_ar),
  };
  if (!CATEGORIES.includes(record.category)) return { error: 'Choose a category' };
  if (!record.title_en && !record.title_ar) return { error: 'A job title is required' };
  if (!record.org_en && !record.org_ar) return { error: 'An organization is required' };
  if (!DATE_RE.test(record.start)) return { error: 'Start date must be YYYY or YYYY-MM' };
  if (record.current) record.end = '';
  if (record.end && !DATE_RE.test(record.end)) return { error: 'End date must be YYYY or YYYY-MM' };
  if (record.end && record.end.slice(0, 4) < record.start.slice(0, 4)) return { error: 'End date is before the start date' };
  return { record };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET' && !PUBLISHED) {
      if (!req.headers.authorization) return res.status(200).json([]);
      const owner = await requireOwner(req, res);
      if (!owner) return;
    }

    const rows = (await readDoc(DOC)) ?? [];

    if (req.method === 'GET') {
      return res.status(200).json(sorted(rows));
    }

    const owner = await requireOwner(req, res);
    if (!owner) return;
    const body = req.body || {};

    if (req.method === 'POST') {
      if (rows.length >= 80) return res.status(400).json({ error: 'Too many entries' });
      const { record, error } = parse(body);
      if (error) return res.status(400).json({ error });
      const created = { id: randomBytes(6).toString('hex'), ...record };
      await writeDoc(DOC, [...rows, created]);
      return res.status(201).json(created);
    }

    const existing = rows.find((r) => r.id === body.id);
    if (!existing) return res.status(400).json({ error: 'Missing or invalid id' });

    if (req.method === 'PUT') {
      const { record, error } = parse(body);
      if (error) return res.status(400).json({ error });
      const updated = { id: existing.id, ...record };
      await writeDoc(DOC, rows.map((r) => (r.id === existing.id ? updated : r)));
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      await writeDoc(DOC, rows.filter((r) => r.id !== existing.id));
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
