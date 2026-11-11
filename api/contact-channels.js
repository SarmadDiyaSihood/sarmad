import { cors, requireOwner, readDoc, writeDoc } from './owner-auth.js';

const DOC = 'contact.json';
// Shape of the document before the owner has saved anything.
const BLANK = [
  { id: 1, kind: 'email', label_en: 'Email', label_ar: 'البريد الإلكتروني', value: null, url: null, sort_order: 1 },
  { id: 2, kind: 'phone', label_en: 'Phone', label_ar: 'الهاتف', value: null, url: null, sort_order: 2 },
];

const clean = (v, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isHttpUrl = (v) => /^https:\/\/[^\s]+\.[^\s]+$/i.test(v);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s().-]{6,24}$/;
const load = async () => (await readDoc(DOC)) ?? BLANK;
const sorted = (rows) => [...rows].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      return res.status(200).json(sorted(await load()));
    }

    const owner = await requireOwner(req, res);
    if (!owner) return;
    const body = req.body || {};
    const rows = await load();

    if (req.method === 'POST') {
      const label = clean(body.label, 60);
      const url = clean(body.url);
      if (!label) return res.status(400).json({ error: 'A label is required' });
      if (!isHttpUrl(url)) return res.status(400).json({ error: 'The link must start with https://' });
      if (rows.length >= 20) return res.status(400).json({ error: 'Too many links' });
      const row = {
        id: Math.max(0, ...rows.map((r) => r.id)) + 1,
        kind: 'social',
        label_en: label,
        label_ar: label,
        value: label,
        url,
        sort_order: 10,
      };
      await writeDoc(DOC, [...rows, row]);
      return res.status(201).json(row);
    }

    if (req.method === 'PUT') {
      const row = rows.find((r) => r.id === Number(body.id) && (r.kind === 'email' || r.kind === 'phone'));
      if (!row) return res.status(400).json({ error: 'Missing or invalid id' });
      const value = clean(body.value, 200);
      if (value && row.kind === 'email' && !EMAIL_RE.test(value)) return res.status(400).json({ error: 'Enter a valid email address' });
      if (value && row.kind === 'phone' && !PHONE_RE.test(value)) return res.status(400).json({ error: 'Enter a valid phone number' });
      const updated = { ...row, value: value || null, updated_at: new Date().toISOString() };
      await writeDoc(DOC, rows.map((r) => (r.id === row.id ? updated : r)));
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      const row = rows.find((r) => r.id === Number(body.id) && r.kind === 'social');
      if (!row) return res.status(400).json({ error: 'Missing or invalid id' });
      await writeDoc(DOC, rows.filter((r) => r.id !== row.id));
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
