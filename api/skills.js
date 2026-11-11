import { cors, requireOwner, readDoc, writeDoc } from './owner-auth.js';

// Stored as one JSON document in the private "site-data" bucket (see owner-auth.js).
const DOC = 'skills.json';
const ID_RE = /^[a-z0-9-]{1,40}$/;
const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Returns { groups } or { error } for a submitted list. Group and skill order is the display order.
function parse(items) {
  if (!Array.isArray(items) || items.length > 20) return { error: 'Send a list of up to 20 skill groups' };
  const groups = [];
  for (const [i, item] of items.entries()) {
    const id = text(item?.id, 40);
    if (!ID_RE.test(id)) return { error: `Group ${i + 1}: the id must use lowercase letters, numbers or hyphens` };
    const group = { id, title_en: text(item.title_en, 160), title_ar: text(item.title_ar, 160), skills: [] };
    if (!group.title_en && !group.title_ar) return { error: `Group ${i + 1}: a title is required` };
    if (!Array.isArray(item.skills) || item.skills.length > 80) return { error: `Group ${i + 1}: send up to 80 skills` };
    for (const [j, entry] of item.skills.entries()) {
      // "latin" is the Latin-script term shown beside the Arabic name (for example "SEO").
      const skill = { ar: text(entry?.ar, 200), en: text(entry?.en, 200), latin: text(entry?.latin, 120) };
      if (!skill.ar && !skill.en) return { error: `Group ${i + 1}, skill ${j + 1}: a name is required` };
      group.skills.push(skill);
    }
    groups.push(group);
  }
  if (new Set(groups.map((g) => g.id)).size !== groups.length) return { error: 'Each group needs a unique id' };
  return { groups };
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
      const { groups, error } = parse(req.body?.items);
      if (error) return res.status(400).json({ error });
      await writeDoc(DOC, groups);
      return res.status(200).json(groups);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
