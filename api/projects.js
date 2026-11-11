import supabase from './db-client.js';
import { cors, requireOwner, readDoc, writeDoc } from './owner-auth.js';

/*
 * The archive is one JSON document in the private "site-data" bucket (see owner-auth.js), so its
 * text and image paths cannot be changed with the site's public key. Until that document has been
 * saved for the first time, the original "projects" table is served instead.
 */
const DOC = 'projects.json';
const CATEGORIES = ['media', 'design', 'marketing', 'technology', 'blender'];
const SLUG_RE = /^[a-z0-9-]{1,60}$/;
const MEDIA_RE = /^\/(images|videos|uploads)\/[A-Za-z0-9._-]+$/;
// "16 / 9", or a picture's own pixel size such as "1672 / 941".
const RATIO_RE = /^\d{1,4} \/ \d{1,4}$/;

const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const lines = (v) =>
  (Array.isArray(v) ? v : [])
    .map((item) => text(item, 400))
    .filter(Boolean)
    .slice(0, 30);
// A list of two-field objects, e.g. { label, value } or { title, body }.
const pairs = (v, a, b, max) =>
  (Array.isArray(v) ? v : [])
    .map((item) => ({ [a]: text(item?.[a], 200), [b]: text(item?.[b], max) }))
    .filter((item) => item[a] && item[b])
    .slice(0, 20);

const sorted = (rows) => [...rows].sort((x, y) => x.sort_order - y.sort_order || x.id - y.id);

// Returns { records } or { error } for a submitted list of projects.
function parse(items) {
  if (!Array.isArray(items) || items.length > 60) return { error: 'Send a list of up to 60 projects' };
  const records = [];
  for (const [i, item] of items.entries()) {
    const where = `Project ${i + 1}`;
    const slug = text(item?.slug, 60);
    if (!SLUG_RE.test(slug)) return { error: `${where}: the slug must use lowercase letters, numbers or hyphens` };
    if (!CATEGORIES.includes(item.category_key)) return { error: `${where}: choose a category` };
    const cover = text(item.cover_image, 200);
    if (!MEDIA_RE.test(cover)) return { error: `${where}: the cover image must be a file in /images` };
    const video = text(item.cover_video, 200);
    if (video && !MEDIA_RE.test(video)) return { error: `${where}: the cover video must be a file on this site` };

    const record = {
      id: Number.isInteger(item.id) ? item.id : i + 1,
      slug,
      sort_order: Number.isFinite(item.sort_order) ? item.sort_order : i + 1,
      category_key: item.category_key,
      title_en: text(item.title_en, 160),
      title_ar: text(item.title_ar, 160),
      summary_en: text(item.summary_en, 400),
      summary_ar: text(item.summary_ar, 400),
      description_en: text(item.description_en, 2000),
      description_ar: text(item.description_ar, 2000),
      role_en: text(item.role_en, 160),
      role_ar: text(item.role_ar, 160),
      responsibilities_en: lines(item.responsibilities_en),
      responsibilities_ar: lines(item.responsibilities_ar),
      details_en: pairs(item.details_en, 'label', 'value', 400),
      details_ar: pairs(item.details_ar, 'label', 'value', 400),
      cover_image: cover,
      cover_video: video || null,
      is_sample: Boolean(item.is_sample),
    };
    if (!record.title_en && !record.title_ar) return { error: `${where}: a title is required` };

    // Optional fields, kept only when they are filled in.
    for (const key of ['cover_alt_en', 'cover_alt_ar', 'responsibilities_title_en', 'responsibilities_title_ar']) {
      const value = text(item[key], 300);
      if (value) record[key] = value;
    }
    if (typeof item.cover_ratio === 'string' && RATIO_RE.test(item.cover_ratio)) record.cover_ratio = item.cover_ratio;
    // "image": the entry is a single picture, shown large with its title and category only.
    if (item.view === 'image') record.view = 'image';
    for (const key of ['sections_en', 'sections_ar']) {
      const value = pairs(item[key], 'title', 'body', 2000);
      if (value.length) record[key] = value;
    }
    for (const key of ['outputs_en', 'outputs_ar']) {
      const value = lines(item[key]);
      if (value.length) record[key] = value;
    }
    records.push(record);
  }
  if (new Set(records.map((r) => r.slug)).size !== records.length) return { error: 'Each project needs a unique slug' };
  return { records };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const saved = await readDoc(DOC);
      if (saved) return res.status(200).json(sorted(saved));
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'PUT') {
      const owner = await requireOwner(req, res);
      if (!owner) return;
      const { records, error } = parse(req.body?.items);
      if (error) return res.status(400).json({ error });
      await writeDoc(DOC, records);
      return res.status(200).json(sorted(records));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
