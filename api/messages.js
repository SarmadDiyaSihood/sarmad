import { createHash, randomBytes } from 'node:crypto';
import supabase from './db-client.js';
import { cors, requireOwner } from './owner-auth.js';

/*
 * Contact-form messages contain visitors' personal details, so they are NOT kept in a
 * database table (tables in this project can be read with the site's public key).
 * Each message is one JSON object in the private "inbox" storage bucket, which only
 * the server-side service role can list, read or change.
 */
const BUCKET = 'inbox';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ID_RE = /^\d{13}_[a-f0-9]{16}_[a-f0-9]{12}\.json$/;
const inbox = () => supabase.storage.from(BUCKET);
const senderKey = (email) => createHash('sha256').update(email).digest('hex').slice(0, 16);

async function readMessage(id) {
  const { data, error } = await inbox().download(id);
  if (error || !data) return null;
  try {
    return JSON.parse(await data.text());
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // Public: a visitor sends a message from the contact form.
    if (req.method === 'POST') {
      const body = req.body || {};
      // Honeypot field: real visitors never fill it in.
      if (typeof body.company === 'string' && body.company.trim()) {
        return res.status(201).json({ ok: true });
      }
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      const errors = {};
      if (!name || name.length > 120) errors.name = 'invalid';
      if (!EMAIL_RE.test(email) || email.length > 200) errors.email = 'invalid';
      if (message.length < 10 || message.length > 4000) errors.message = 'invalid';
      if (Object.keys(errors).length) return res.status(400).json({ error: 'Validation failed', fields: errors });

      // Light throttle: at most 3 messages per address every 10 minutes.
      const key = senderKey(email);
      const { data: recent, error: listError } = await inbox().list('', {
        search: key,
        limit: 20,
        sortBy: { column: 'name', order: 'desc' },
      });
      if (listError) throw listError;
      const cutoff = Date.now() - 10 * 60 * 1000;
      const sentRecently = (recent || []).filter((f) => Number(f.name.split('_')[0]) > cutoff).length;
      if (sentRecently >= 3) return res.status(429).json({ error: 'Too many messages' });

      const created = Date.now();
      const id = `${created}_${key}_${randomBytes(6).toString('hex')}.json`;
      const record = {
        name,
        email,
        message,
        lang: body.lang === 'ar' ? 'ar' : 'en',
        is_read: false,
        created_at: new Date(created).toISOString(),
      };
      const { error } = await inbox().upload(id, Buffer.from(JSON.stringify(record)), {
        contentType: 'application/json',
        upsert: false,
      });
      if (error) throw error;
      return res.status(201).json({ ok: true });
    }

    // Everything else is owner-only.
    const owner = await requireOwner(req, res);
    if (!owner) return;

    if (req.method === 'GET') {
      const { data: files, error } = await inbox().list('', {
        limit: 200,
        sortBy: { column: 'name', order: 'desc' },
      });
      if (error) throw error;
      const items = await Promise.all(
        (files || [])
          .filter((f) => ID_RE.test(f.name))
          .map(async (f) => {
            const record = await readMessage(f.name);
            return record ? { id: f.name, ...record } : null;
          }),
      );
      return res.status(200).json(items.filter(Boolean));
    }

    const id = req.body?.id;
    if (typeof id !== 'string' || !ID_RE.test(id)) return res.status(400).json({ error: 'Missing or invalid id' });

    if (req.method === 'PUT') {
      const record = await readMessage(id);
      if (!record) return res.status(404).json({ error: 'Message not found' });
      const updated = { ...record, is_read: Boolean(req.body.is_read) };
      const { error } = await inbox().upload(id, Buffer.from(JSON.stringify(updated)), {
        contentType: 'application/json',
        upsert: true,
      });
      if (error) throw error;
      return res.status(200).json({ id, ...updated });
    }
    if (req.method === 'DELETE') {
      const { error } = await inbox().remove([id]);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
