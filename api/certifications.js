import { cors, requireOwner, readDoc, writeDoc } from './owner-auth.js';

// Stored as one JSON document in the private "site-data" bucket (see owner-auth.js).
const DOC = 'certifications.json';
const CATEGORIES = ['security', 'web', 'business', 'leadership'];
// Text fields (each kept in English and Arabic) with their maximum length.
const FIELDS = { name: 200, issuer: 200, country: 120, desc: 1500, status: 200 };
const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Returns { records } or { error } for a submitted list. The list order is the display order.
function parse(items) {
  if (!Array.isArray(items) || items.length > 100) return { error: 'Send a list of up to 100 certifications' };
  const records = [];
  for (const [i, item] of items.entries()) {
    if (!item || !CATEGORIES.includes(item.category)) return { error: `Certification ${i + 1}: choose a category` };
    const record = { id: text(item.id, 40) || `c${String(i + 1).padStart(2, '0')}`, category: item.category };
    for (const [field, max] of Object.entries(FIELDS)) {
      record[`${field}_en`] = text(item[`${field}_en`], max);
      record[`${field}_ar`] = text(item[`${field}_ar`], max);
    }
    if (!record.name_en && !record.name_ar) return { error: `Certification ${i + 1}: a name is required` };
    records.push(record);
  }
  if (new Set(records.map((r) => r.id)).size !== records.length) return { error: 'Each certification needs a unique id' };
  return { records };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      return res.status(200).json((await readDoc(DOC)) ?? []);
    }

    if (req.method === 'PUT') {
      const owner = await requireOwner(req, res);
      if (!owner) return;
      const { records, error } = parse(req.body?.items);
      if (error) return res.status(400).json({ error });
      await writeDoc(DOC, records);
      return res.status(200).json(records);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
