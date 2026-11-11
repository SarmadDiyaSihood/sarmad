import { useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import { gsap } from '../lib/gsap';
import { useGsap } from '../lib/hooks';
import { scrollToId } from '../lib/scroll';
import { sound } from '../lib/sound';
import { useLang } from '../context/LanguageContext';
import type { Channel, Remote } from '../lib/api';
import { scene } from '../lib/features';
import { SceneLabel, Split } from './Reveal';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
type Status = 'idle' | 'sending' | 'sent' | 'error' | 'tooMany';

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label text-white/60">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-ice">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass = 'mt-2 block w-full border-b border-white/30 bg-transparent py-3 text-lg text-white outline-none transition-colors duration-300 placeholder:text-white/30 focus:border-electric aria-[invalid=true]:border-ice';

export default function Contact({ channels }: { channels: Remote<Channel[]> }) {
  const root = useRef<HTMLElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const reduced = useReducedMotion();
  const { t, lang } = useLang();
  const f = t.contact.form;

  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({ name: '', email: '', message: '', company: '' });
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [status, setStatus] = useState<Status>('idle');

  useGsap(root, () => {
    gsap.from('[data-headline] .rv-inner', {
      yPercent: 118,
      duration: 1.3,
      ease: 'expo.out',
      stagger: 0.09,
      scrollTrigger: { trigger: '[data-headline]', start: 'top 82%', once: true },
    });
    gsap.from('[data-in]', {
      autoAlpha: 0,
      y: 24,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.1,
      scrollTrigger: { trigger: '[data-ins]', start: 'top 85%', once: true },
    });
    gsap.fromTo('[data-foot]', { yPercent: 40 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '[data-foot]', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  });

  const openForm = () => {
    if (!open) sound.play('open');
    setOpen(true);
    window.setTimeout(() => nameInput.current?.focus(), reduced ? 0 : 450);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!values.name.trim()) next.name = f.errName;
    if (!EMAIL_RE.test(values.email.trim())) next.email = f.errEmail;
    if (values.message.trim().length < 10) next.message = f.errMessage;
    setErrors(next);
    if (Object.keys(next).length) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, lang }),
      });
      if (res.status === 429) return setStatus('tooMany');
      if (!res.ok) throw new Error(String(res.status));
      setStatus('sent');
      sound.play('reveal');
      setValues({ name: '', email: '', message: '', company: '' });
    } catch {
      setStatus('error');
    }
  };

  const list = channels.data ?? [];
  const email = list.find((c) => c.kind === 'email')?.value?.trim();
  const phone = list.find((c) => c.kind === 'phone')?.value?.trim();
  const socials = list.filter((c) => c.kind === 'social' && c.url);
  const onRequest = (
    <button type="button" onClick={openForm} className="link-line text-start text-white/70 hover:text-white">
      {t.contact.onRequest}
    </button>
  );

  return (
    <section ref={root} id="contact" data-section className="grain relative overflow-hidden bg-navy text-white">
      <div className="relative z-10 px-5 pb-10 pt-28 md:px-10 md:pt-44">
        <SceneLabel n={scene(14)} label={t.contact.label} className="text-ice/80" />

        <h2 data-headline data-sound-reveal="contact" className="display mt-10 text-[clamp(1.9rem,9.6vw,11.5rem)]" aria-label={t.contact.heading.join(' ')}>
          {t.contact.heading.map((line, i) => (
            <span key={line} aria-hidden="true" className={`block ${i === 2 ? 'text-electric' : ''} ${i === 1 ? 'ms-[8vw]' : ''}`}>
              <Split text={line} />
            </span>
          ))}
        </h2>

        <div data-ins className="mt-14 grid gap-14 md:mt-24 md:grid-cols-12 md:gap-10">
          <div data-in className="md:col-span-5">
            <p className="max-w-[24ch] text-[clamp(1.3rem,2.2vw,2rem)] font-light leading-[1.35]">{t.contact.sub}</p>
            <button type="button" onClick={openForm} aria-expanded={open} aria-controls="contact-form" className="btn label mt-9 border-white bg-white text-navy">
              {t.contact.cta}
              <ArrowUpRight size={16} strokeWidth={1.5} className="rtl:-scale-x-100" aria-hidden="true" />
            </button>
          </div>

          <dl data-in className="border-t border-white/15 md:col-span-6 md:col-start-7">
            {channels.loading ? (
              <div className="space-y-4 py-5" role="status" aria-label={t.work.loading}>
                <div className="h-5 w-2/3 animate-pulse bg-white/10" />
                <div className="h-5 w-1/2 animate-pulse bg-white/10" />
              </div>
            ) : channels.error ? (
              <div className="flex flex-wrap items-center gap-4 py-5 text-white/70" role="alert">
                {t.contact.channelsError}
                <button type="button" onClick={channels.reload} className="link-line text-white">
                  {t.work.retry}
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-2 border-b border-white/15 py-5 sm:grid-cols-[6.5rem_minmax(0,1fr)] lg:grid-cols-[9rem_minmax(0,1fr)]">
                  <dt className="label pt-1 text-white/55">{t.contact.email}</dt>
                  <dd className="text-lg">
                    {email ? (
                      <a href={`mailto:${email}`} className="link-line latin break-all" style={{ fontFamily: 'inherit' }}>
                        {email}
                      </a>
                    ) : (
                      onRequest
                    )}
                  </dd>
                </div>
                <div className="grid gap-2 border-b border-white/15 py-5 sm:grid-cols-[6.5rem_minmax(0,1fr)] lg:grid-cols-[9rem_minmax(0,1fr)]">
                  <dt className="label pt-1 text-white/55">{t.contact.phone}</dt>
                  <dd className="text-lg">
                    {phone ? (
                      <a href={`tel:${phone.replace(/[^+\d]/g, '')}`} className="link-line latin break-all" style={{ fontFamily: 'inherit' }}>
                        {phone}
                      </a>
                    ) : (
                      onRequest
                    )}
                  </dd>
                </div>
                {socials.length > 0 && (
                  <div className="grid gap-2 border-b border-white/15 py-5 sm:grid-cols-[6.5rem_minmax(0,1fr)] lg:grid-cols-[9rem_minmax(0,1fr)]">
                    <dt className="label pt-1 text-white/55">{t.contact.social}</dt>
                    <dd className="text-lg">
                      <ul className="flex flex-wrap gap-x-6 gap-y-2">
                        {socials.map((c) => (
                          <li key={c.id}>
                            <a href={c.url ?? undefined} target="_blank" rel="noopener noreferrer" className="link-line">
                              {lang === 'ar' ? c.label_ar : c.label_en}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}
              </>
            )}
          </dl>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id="contact-form"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-16 border-t border-white/15 pt-10 md:mt-24 md:grid md:grid-cols-12 md:gap-10">
                <h3 className="display-2 text-[clamp(1.8rem,3.4vw,3.25rem)] md:col-span-5">{f.title}</h3>

                {status === 'sent' ? (
                  <div role="status" className="mt-8 md:col-span-6 md:col-start-7 md:mt-0">
                    <p className="font-display text-3xl font-extrabold text-electric">{f.sentTitle}</p>
                    <p className="mt-3 max-w-[40ch] text-lg text-white/75">{f.sentBody}</p>
                    <button type="button" onClick={() => setStatus('idle')} className="btn label mt-8">
                      {f.again}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={submit} noValidate className="mt-8 space-y-8 md:col-span-6 md:col-start-7 md:mt-0">
                    <Field id="cf-name" label={f.name} error={errors.name}>
                      <input
                        ref={nameInput}
                        id="cf-name"
                        type="text"
                        autoComplete="name"
                        maxLength={120}
                        value={values.name}
                        onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? 'cf-name-error' : undefined}
                        className={inputClass}
                      />
                    </Field>
                    <Field id="cf-email" label={f.email} error={errors.email}>
                      <input
                        id="cf-email"
                        type="email"
                        dir="ltr"
                        autoComplete="email"
                        maxLength={200}
                        value={values.email}
                        onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? 'cf-email-error' : undefined}
                        className={`${inputClass} rtl:text-end`}
                      />
                    </Field>
                    <Field id="cf-message" label={f.message} error={errors.message}>
                      <textarea
                        id="cf-message"
                        rows={4}
                        maxLength={4000}
                        value={values.message}
                        onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
                        aria-invalid={Boolean(errors.message)}
                        aria-describedby={errors.message ? 'cf-message-error' : undefined}
                        className={`${inputClass} resize-y`}
                      />
                    </Field>
                    {/* Honeypot: hidden from people, tempting to bots. */}
                    <input
                      type="text"
                      name="company"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      value={values.company}
                      onChange={(e) => setValues((v) => ({ ...v, company: e.target.value }))}
                      className="absolute h-0 w-0 opacity-0"
                    />
                    {(status === 'error' || status === 'tooMany') && (
                      <p role="alert" className="border-s-2 border-ice ps-4 text-ice">
                        {status === 'error' ? f.fail : f.tooMany}
                      </p>
                    )}
                    <button type="submit" disabled={status === 'sending'} className="btn label disabled:opacity-60">
                      {status === 'sending' ? `${f.sending}\u2026` : f.send}
                      <ArrowUpRight size={16} strokeWidth={1.5} className="rtl:-scale-x-100" aria-hidden="true" />
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="relative z-10 mt-20 overflow-hidden border-t border-white/15 px-5 pb-8 pt-10 md:mt-28 md:px-10">
        <p data-foot className="display whitespace-nowrap text-[6vw] text-white rtl:text-[9vw]">{t.contact.footerName}</p>
        <div className="label mt-8 flex flex-col gap-5 text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>{t.contact.rights}</p>
          <div className="flex items-center gap-6">
            <button type="button" onClick={() => scrollToId('home')} className="flex min-h-11 items-center gap-3 text-white hover:text-ice">
              {t.contact.top}
              <span className="grid h-9 w-9 place-items-center rounded-full border border-white/30">
                <ArrowUp size={15} strokeWidth={1.5} aria-hidden="true" />
              </span>
            </button>
          </div>
        </div>
      </footer>
    </section>
  );
}
