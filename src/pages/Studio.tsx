import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import supabase from '../lib/supabase';
import { SHOW_EXPERIENCE } from '../lib/features';
import type { Channel, Experience, ExperienceCategory } from '../lib/api';

interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  lang: string | null;
  is_read: boolean;
  created_at: string;
}

const CATEGORY_NAMES: Record<ExperienceCategory, string> = {
  training: 'Training & Motivation',
  media: 'Media, Artistic Production & Technology',
  marketing: 'Marketing & Management',
  hr: 'Human Resources & Administration',
};
const DATE_RE = /^\d{4}(-(0[1-9]|1[0-2]))?$/;
const BLANK_DRAFT = {
  id: '',
  category: 'training' as ExperienceCategory,
  title_en: '',
  title_ar: '',
  org_en: '',
  org_ar: '',
  type_en: '',
  type_ar: '',
  start: '',
  end: '',
  current: false,
  resp_en: '',
  resp_ar: '',
};
const toLines = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const input = 'mt-2 block w-full rounded-md border border-white/20 bg-white/5 px-3 py-3 text-white outline-none placeholder:text-white/30 focus:border-electric';
const button = 'inline-flex min-h-11 items-center justify-center rounded-md bg-electric px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50';
const ghost = 'inline-flex min-h-11 items-center justify-center rounded-md border border-white/20 px-4 text-sm text-white/80 transition-colors hover:border-white hover:text-white disabled:opacity-50';

/** Private owner area: read contact-form messages and set the contact details shown on the site. */
export default function Studio() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [busy, setBusy] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [social, setSocial] = useState({ label: '', url: '' });
  const [newPassword, setNewPassword] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [draft, setDraft] = useState(BLANK_DRAFT);

  useEffect(() => {
    const root = document.documentElement;
    const previous = { lang: root.lang, dir: root.dir, title: document.title };
    root.lang = 'en';
    root.dir = 'ltr';
    document.title = 'Studio — Sarmad Diya Sihood';
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => {
      data.subscription.unsubscribe();
      root.lang = previous.lang;
      root.dir = previous.dir;
      document.title = previous.title;
    };
  }, []);

  const token = session?.access_token;

  const call = useCallback(
    async (url: string, method = 'GET', body?: unknown) => {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
      return json;
    },
    [token],
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [m, c, x] = await Promise.all([call('/api/messages'), call('/api/contact-channels'), call('/api/experiences')]);
      setMessages(m);
      setChannels(c);
      setExperiences(x);
      setDrafts(Object.fromEntries((c as Channel[]).map((ch) => [ch.id, ch.value ?? ''])));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [call, token]);

  useEffect(() => {
    void load();
  }, [load]);

  // Runs an owner action, then re-fetches so the screen always shows what is stored.
  const run = async (action: () => Promise<unknown>, done?: string) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      await load();
      if (done) setNotice(done);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const signIn = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!email.trim() || !password) return setAuthError('Enter your email and password.');
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) setAuthError(err.message);
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (newPassword.length < 8) return setError('The new password needs at least 8 characters.');
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(false);
    if (err) return setError(err.message);
    setNewPassword('');
    setNotice('Password updated.');
  };

  const addSocial = (e: FormEvent) => {
    e.preventDefault();
    if (!social.label.trim()) return setError('Give the link a name, for example the platform.');
    if (!/^https:\/\/\S+\.\S+$/i.test(social.url.trim())) return setError('The link must be a full address starting with https://');
    void run(async () => {
      await call('/api/contact-channels', 'POST', social);
      setSocial({ label: '', url: '' });
    }, 'Link added.');
  };

  const saveExperience = (e: FormEvent) => {
    e.preventDefault();
    setNotice('');
    if (!draft.title_en.trim() && !draft.title_ar.trim()) return setError('Enter the job title in at least one language.');
    if (!draft.org_en.trim() && !draft.org_ar.trim()) return setError('Enter the organization in at least one language.');
    if (!DATE_RE.test(draft.start.trim())) return setError('Start date must be a year (2021) or a year and month (2021-09).');
    if (!draft.current && draft.end.trim() && !DATE_RE.test(draft.end.trim())) return setError('End date must be a year (2023) or a year and month (2023-04).');
    const body = { ...draft, start: draft.start.trim(), end: draft.end.trim(), resp_en: toLines(draft.resp_en), resp_ar: toLines(draft.resp_ar) };
    void run(async () => {
      await call('/api/experiences', draft.id ? 'PUT' : 'POST', body);
      setDraft(BLANK_DRAFT);
    }, 'Experience saved.');
  };

  const editExperience = (x: Experience) => {
    setDraft({ ...x, resp_en: x.resp_en.join('\n'), resp_ar: x.resp_ar.join('\n') });
    document.getElementById('experience-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!ready) return <div className="grid min-h-screen place-items-center bg-navy text-white/60">Loading…</div>;

  if (!session) {
    return (
      <main className="grid min-h-screen place-items-center bg-navy px-5 text-white">
        <form onSubmit={signIn} noValidate className="w-full max-w-sm">
          <p className="label text-electric">Studio</p>
          <h1 className="display-2 mt-3 text-4xl">Owner sign-in</h1>
          <p className="mt-3 text-white/60">Read messages from the contact form and set the contact details shown on the site.</p>
          <label htmlFor="st-email" className="label mt-8 block text-white/60">
            Email
          </label>
          <input id="st-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          <label htmlFor="st-pass" className="label mt-5 block text-white/60">
            Password
          </label>
          <input id="st-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
          {authError && (
            <p role="alert" className="mt-4 text-sm text-ice">
              {authError}
            </p>
          )}
          <button type="submit" disabled={busy} className={`${button} mt-6 w-full`}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <a href="#" className="mt-6 inline-block text-sm text-white/60 underline-offset-4 hover:text-white hover:underline">
            ← Back to the site
          </a>
        </form>
      </main>
    );
  }

  const unread = messages.filter((m) => !m.is_read).length;
  const editable = channels.filter((c) => c.kind !== 'social');
  const socials = channels.filter((c) => c.kind === 'social');

  return (
    <main className="min-h-screen bg-navy px-5 py-8 text-white md:px-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-6">
        <div>
          <p className="label text-electric">Studio</p>
          <h1 className="display-2 mt-2 text-3xl md:text-4xl">Sarmad Diya Sihood</h1>
        </div>
        <div className="flex gap-3">
          <a href="#" className={ghost}>
            View site
          </a>
          <button type="button" onClick={() => void supabase.auth.signOut()} className={ghost}>
            Sign out
          </button>
        </div>
      </header>

      {error && (
        <p role="alert" className="mt-6 rounded-md border border-ice/40 bg-ice/10 px-4 py-3 text-ice">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-6 rounded-md border border-electric/50 bg-electric/15 px-4 py-3">
          {notice}
        </p>
      )}

      <div className="mt-10 grid gap-14 lg:grid-cols-12 lg:gap-10">
        <section className="lg:col-span-7" aria-labelledby="inbox-title">
          <h2 id="inbox-title" className="font-display text-2xl font-bold">
            Messages <span className="text-white/50">({unread} unread of {messages.length})</span>
          </h2>
          {loading && messages.length === 0 ? (
            <p className="mt-6 animate-pulse text-white/50">Loading messages…</p>
          ) : messages.length === 0 ? (
            <p className="mt-6 border-t border-white/15 pt-6 text-white/60">No messages yet. Messages sent from the contact form will appear here.</p>
          ) : (
            <ul className="mt-6 space-y-4">
              {messages.map((m) => (
                <li key={m.id} className={`rounded-lg border p-5 ${m.is_read ? 'border-white/10' : 'border-electric bg-electric/10'}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold">{m.name}</p>
                    <time className="text-xs text-white/50" dateTime={m.created_at}>
                      {new Date(m.created_at).toLocaleString()}
                    </time>
                  </div>
                  <a href={`mailto:${m.email}`} className="text-sm text-ice underline-offset-4 hover:underline">
                    {m.email}
                  </a>
                  <p dir="auto" className="mt-3 whitespace-pre-wrap break-words leading-relaxed text-white/85">
                    {m.message}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" disabled={busy} onClick={() => void run(() => call('/api/messages', 'PUT', { id: m.id, is_read: !m.is_read }))} className={ghost}>
                      {m.is_read ? 'Mark as unread' : 'Mark as read'}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm(`Delete the message from ${m.name}? This cannot be undone.`)) void run(() => call('/api/messages', 'DELETE', { id: m.id }), 'Message deleted.');
                      }}
                      className={ghost}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-12 lg:col-span-5">
          <section aria-labelledby="contact-title">
            <h2 id="contact-title" className="font-display text-2xl font-bold">
              Contact details
            </h2>
            <p className="mt-2 text-sm text-white/60">Shown in the final section of the site. Leave a field empty to show “shared on request”.</p>
            <div className="mt-5 space-y-5">
              {editable.map((c) => (
                <form
                  key={c.id}
                  onSubmit={(e) => {
                    e.preventDefault();
                    void run(() => call('/api/contact-channels', 'PUT', { id: c.id, value: drafts[c.id] ?? '' }), `${c.label_en} saved.`);
                  }}
                >
                  <label htmlFor={`ch-${c.id}`} className="label text-white/60">
                    {c.label_en}
                  </label>
                  <div className="flex gap-3">
                    <input
                      id={`ch-${c.id}`}
                      type={c.kind === 'email' ? 'email' : 'tel'}
                      value={drafts[c.id] ?? ''}
                      onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                      className={input}
                    />
                    <button type="submit" disabled={busy} className={`${button} mt-2`}>
                      Save
                    </button>
                  </div>
                </form>
              ))}
            </div>

            <h3 className="label mt-9 text-white/60">Social links</h3>
            {socials.length === 0 && <p className="mt-2 text-sm text-white/50">None added yet.</p>}
            <ul className="mt-3 space-y-2">
              {socials.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 rounded-md border border-white/10 px-3 py-2">
                  <span className="min-w-0">
                    <span className="block font-semibold">{c.label_en}</span>
                    <span className="block truncate text-sm text-white/50">{c.url}</span>
                  </span>
                  <button type="button" disabled={busy} onClick={() => void run(() => call('/api/contact-channels', 'DELETE', { id: c.id }), 'Link removed.')} className={ghost}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <form onSubmit={addSocial} noValidate className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
              <div>
                <label htmlFor="so-label" className="label text-white/60">
                  Name
                </label>
                <input id="so-label" value={social.label} maxLength={60} onChange={(e) => setSocial((s) => ({ ...s, label: e.target.value }))} placeholder="Platform" className={input} />
              </div>
              <div>
                <label htmlFor="so-url" className="label text-white/60">
                  Link
                </label>
                <input id="so-url" type="url" value={social.url} onChange={(e) => setSocial((s) => ({ ...s, url: e.target.value }))} placeholder="https://" className={input} />
              </div>
              <button type="submit" disabled={busy} className={button}>
                Add
              </button>
            </form>
          </section>

          <section aria-labelledby="account-title">
            <h2 id="account-title" className="font-display text-2xl font-bold">
              Account
            </h2>
            <p className="mt-2 text-sm text-white/60">Signed in as {session.user.email}</p>
            <form onSubmit={changePassword} noValidate className="mt-4 flex gap-3">
              <div className="flex-1">
                <label htmlFor="new-pass" className="label text-white/60">
                  New password
                </label>
                <input id="new-pass" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={input} />
              </div>
              <button type="submit" disabled={busy} className={`${button} mt-2 self-end`}>
                Update
              </button>
            </form>
          </section>
        </div>
      </div>

      <section className="mt-16 border-t border-white/15 pt-10" aria-labelledby="experience-title">
        <h2 id="experience-title" className="font-display text-2xl font-bold">
          Experience timeline <span className="text-white/50">({experiences.length})</span>
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          {SHOW_EXPERIENCE
            ? 'Entries shown in the Experience section of the site.'
            : 'The Experience section is currently hidden from the public site. These entries are kept here and will show again when the section is switched back on.'}{' '}
          Fill in English, Arabic or both: if one language is left empty the site shows the other. Write one responsibility per line.
        </p>

        <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-10">
          <form id="experience-form" onSubmit={saveExperience} noValidate className="scroll-mt-6 space-y-5 lg:col-span-7">
            <h3 className="label text-electric">{draft.id ? 'Edit experience' : 'Add an experience'}</h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="x-title-en" className="label text-white/60">
                  Job title (English)
                </label>
                <input id="x-title-en" maxLength={160} value={draft.title_en} onChange={(e) => setDraft((d) => ({ ...d, title_en: e.target.value }))} className={input} />
              </div>
              <div>
                <label htmlFor="x-title-ar" className="label text-white/60">
                  Job title (Arabic)
                </label>
                <input id="x-title-ar" dir="rtl" lang="ar" maxLength={160} value={draft.title_ar} onChange={(e) => setDraft((d) => ({ ...d, title_ar: e.target.value }))} className={input} />
              </div>
              <div>
                <label htmlFor="x-org-en" className="label text-white/60">
                  Organization (English)
                </label>
                <input id="x-org-en" maxLength={160} value={draft.org_en} onChange={(e) => setDraft((d) => ({ ...d, org_en: e.target.value }))} className={input} />
              </div>
              <div>
                <label htmlFor="x-org-ar" className="label text-white/60">
                  Organization (Arabic)
                </label>
                <input id="x-org-ar" dir="rtl" lang="ar" maxLength={160} value={draft.org_ar} onChange={(e) => setDraft((d) => ({ ...d, org_ar: e.target.value }))} className={input} />
              </div>
              <div>
                <label htmlFor="x-type-en" className="label text-white/60">
                  Employment type (English)
                </label>
                <input id="x-type-en" maxLength={60} placeholder="Full-time" value={draft.type_en} onChange={(e) => setDraft((d) => ({ ...d, type_en: e.target.value }))} className={input} />
              </div>
              <div>
                <label htmlFor="x-type-ar" className="label text-white/60">
                  Employment type (Arabic)
                </label>
                <input id="x-type-ar" dir="rtl" lang="ar" maxLength={60} placeholder="دوام كامل" value={draft.type_ar} onChange={(e) => setDraft((d) => ({ ...d, type_ar: e.target.value }))} className={input} />
              </div>
              <div>
                <label htmlFor="x-category" className="label text-white/60">
                  Category
                </label>
                <select id="x-category" value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as ExperienceCategory }))} className={`${input} [&>option]:text-navy`}>
                  {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
                    <option key={key} value={key}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex min-h-11 items-center gap-3 self-end text-sm text-white/80">
                <input type="checkbox" checked={draft.current} onChange={(e) => setDraft((d) => ({ ...d, current: e.target.checked }))} className="h-5 w-5 accent-[#1769FF]" />
                This is a current position
              </label>
              <div>
                <label htmlFor="x-start" className="label text-white/60">
                  Start (YYYY or YYYY-MM)
                </label>
                <input id="x-start" inputMode="numeric" maxLength={7} placeholder="2021-09" value={draft.start} onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))} className={input} />
              </div>
              <div>
                <label htmlFor="x-end" className="label text-white/60">
                  End (YYYY or YYYY-MM)
                </label>
                <input id="x-end" inputMode="numeric" maxLength={7} placeholder="2023-04" disabled={draft.current} value={draft.current ? '' : draft.end} onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))} className={`${input} disabled:opacity-40`} />
              </div>
            </div>
            <div>
              <label htmlFor="x-resp-en" className="label text-white/60">
                Responsibilities (English, one per line)
              </label>
              <textarea id="x-resp-en" rows={4} value={draft.resp_en} onChange={(e) => setDraft((d) => ({ ...d, resp_en: e.target.value }))} className={`${input} resize-y`} />
            </div>
            <div>
              <label htmlFor="x-resp-ar" className="label text-white/60">
                Responsibilities (Arabic, one per line)
              </label>
              <textarea id="x-resp-ar" dir="rtl" lang="ar" rows={4} value={draft.resp_ar} onChange={(e) => setDraft((d) => ({ ...d, resp_ar: e.target.value }))} className={`${input} resize-y`} />
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={busy} className={button}>
                {draft.id ? 'Save changes' : 'Add experience'}
              </button>
              {draft.id && (
                <button type="button" onClick={() => setDraft(BLANK_DRAFT)} className={ghost}>
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="lg:col-span-5">
            <h3 className="label text-white/60">On the site now</h3>
            {experiences.length === 0 ? (
              <p className="mt-4 text-sm text-white/50">No experiences added yet. The site shows a short “being prepared” note until the first one is added.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {experiences.map((x) => (
                  <li key={x.id} className="rounded-md border border-white/10 px-4 py-3">
                    <p dir="auto" className="font-semibold">
                      {x.title_en || x.title_ar}
                    </p>
                    <p dir="auto" className="text-sm text-white/60">
                      {x.org_en || x.org_ar}
                    </p>
                    <p className="mt-1 text-xs text-white/50">
                      {x.start} — {x.current ? 'Present' : x.end || '…'} · {CATEGORY_NAMES[x.category]}
                    </p>
                    <div className="mt-3 flex gap-3">
                      <button type="button" disabled={busy} onClick={() => editExperience(x)} className={ghost}>
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm(`Delete “${x.title_en || x.title_ar}”? This cannot be undone.`)) void run(() => call('/api/experiences', 'DELETE', { id: x.id }), 'Experience deleted.');
                        }}
                        className={ghost}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
