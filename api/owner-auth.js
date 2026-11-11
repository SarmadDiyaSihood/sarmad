import supabase from './db-client.js';

export const OWNER_EMAIL = 'owner@sarmad-portfolio.com';

export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Returns the owner user, or sends a 401/403 and returns null.
export async function requireOwner(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    res.status(401).json({ error: 'Invalid session' });
    return null;
  }
  if ((data.user.email || '').toLowerCase() !== OWNER_EMAIL) {
    res.status(403).json({ error: 'This account is not authorised' });
    return null;
  }
  return data.user;
}

/*
 * Owner-managed site content (contact details, experience timeline) lives as JSON documents
 * in the private "site-data" storage bucket. Only the server-side service role can read or
 * change that bucket, so this content cannot be altered with the site's public key.
 */
const DOCS = 'site-data';

// Returns the parsed document, or null when it has never been saved.
export async function readDoc(name) {
  const bucket = supabase.storage.from(DOCS);
  const { data: found, error: listError } = await bucket.list('', { search: name, limit: 10 });
  if (listError) throw listError;
  if (!(found || []).some((f) => f.name === name)) return null;
  const { data, error } = await bucket.download(name);
  if (error) throw error;
  return JSON.parse(await data.text());
}

export async function writeDoc(name, value) {
  const { error } = await supabase.storage.from(DOCS).upload(name, Buffer.from(JSON.stringify(value)), {
    contentType: 'application/json',
    upsert: true,
    cacheControl: '0',
  });
  if (error) throw error;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  const user = await requireOwner(req, res);
  if (!user) return;
  return res.status(200).json({ ok: true, email: user.email });
}
