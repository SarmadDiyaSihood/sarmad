import { scrollToId } from '../lib/scroll';
import { useLang } from '../context/LanguageContext';
import type { Channel, Remote } from '../lib/api';

interface Props {
  channels: Remote<Channel[]>;
  kind: 'email' | 'phone';
  className?: string;
}

/** The owner's email or phone as a clickable link (mailto: / tel:), with loading and missing states. */
export default function ChannelValue({ channels, kind, className = '' }: Props) {
  const { t } = useLang();

  if (channels.loading) {
    return <span aria-hidden="true" className="inline-block h-[1em] w-44 max-w-full animate-pulse bg-current align-middle opacity-15" />;
  }

  const value = channels.data?.find((c) => c.kind === kind)?.value?.trim();
  if (!value) {
    return (
      <button type="button" onClick={() => scrollToId('contact')} className={`link-line text-start ${className}`}>
        {t.contact.onRequest}
      </button>
    );
  }

  const href = kind === 'email' ? `mailto:${value}` : `tel:${value.replace(/[^+\d]/g, '')}`;
  return (
    <a href={href} className={`link-line latin break-all ${className}`} style={{ fontFamily: 'inherit' }}>
      {value}
    </a>
  );
}
