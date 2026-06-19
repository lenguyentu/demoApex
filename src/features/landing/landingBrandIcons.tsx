import { Globe2, Mail } from 'lucide-react';

/** Icon giống landing Next.js — chỉ hiển thị, không chỉnh. */

export function LinkedInGlyph({ className = 'h-[18px] w-[18px]' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function FacebookGlyph({ className = 'h-[18px] w-[18px]' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

/** Chat dots (Zalo / Chat CTA trên landing). */
export function ChatDotsIcon({ className = 'h-[18px] w-[18px]' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3C7.03 3 3 6.58 3 11c0 2.02.9 3.86 2.38 5.24L4 21l5.05-1.28A9.77 9.77 0 0 0 12 19c4.97 0 9-3.58 9-8s-4.03-8-9-8zm-2.5 8.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm-5-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
    </svg>
  );
}

const socialCircle =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#e91e63]/35 text-[#e91e63] transition hover:border-[#e91e63] hover:bg-[#fff5f8]';

export function ConnectChannelIcon({ channelKey, className }: { channelKey: string; className?: string }) {
  const box = className ?? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fce4ec] text-[#e91e63]';
  const icon = 'h-[18px] w-[18px]';
  switch (channelKey) {
    case 'linkedin':
      return (
        <span className={box}>
          <LinkedInGlyph className={icon} />
        </span>
      );
    case 'facebook':
      return (
        <span className={box}>
          <FacebookGlyph className={icon} />
        </span>
      );
    case 'zalo':
      return (
        <span className={box}>
          <ChatDotsIcon className={icon} />
        </span>
      );
    case 'email':
      return (
        <span className={box}>
          <Mail className={icon} strokeWidth={2} />
        </span>
      );
    default:
      return (
        <span className={box}>
          <Globe2 className={icon} strokeWidth={2} />
        </span>
      );
  }
}

export function HeroSocialIcon({
  channelKey,
  className,
}: {
  channelKey: 'linkedin' | 'facebook' | 'zalo' | 'email';
  className?: string;
}) {
  const icon = 'h-[18px] w-[18px]';
  const wrap = className ?? socialCircle;
  switch (channelKey) {
    case 'linkedin':
      return (
        <span className={wrap}>
          <LinkedInGlyph className={icon} />
        </span>
      );
    case 'facebook':
      return (
        <span className={wrap}>
          <FacebookGlyph className={icon} />
        </span>
      );
    case 'zalo':
      return (
        <span className={wrap}>
          <ChatDotsIcon className={icon} />
        </span>
      );
    case 'email':
      return (
        <span className={wrap}>
          <Mail className={icon} strokeWidth={2} />
        </span>
      );
  }
}
