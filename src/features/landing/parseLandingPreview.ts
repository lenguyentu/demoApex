import { validateLandingConfigShape } from './defaultLandingConfig';

export interface LandingPreviewCta {
  href: string;
  label: string;
}

export interface LandingPreviewConfig {
  displayName: string;
  hero: {
    hiPrefix: string;
    showHeart: boolean;
    name: string;
    roleTitle: string;
    bio: string;
    heroImageUrl: string;
    aboutImageUrl: string;
    chatCta: LandingPreviewCta;
    jobsCta: LandingPreviewCta;
    social: {
      linkedin?: string;
      facebook?: string;
      zalo?: string;
      email?: string;
    };
  };
  stats: { label: string; value: string; iconKey: string }[];
  about: { paragraph1: string; paragraph2: string; stickyNote: string };
  aboutGrid: { title: string; lines: string[]; iconKey: string }[];
  connectSection: { title: string; subtitle: string };
  connectChannels: { key: string; label: string; href: string; display?: string }[];
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function cta(v: unknown, fallback: LandingPreviewCta): LandingPreviewCta {
  const o = asRecord(v);
  if (!o) return fallback;
  return { href: str(o.href, fallback.href), label: str(o.label, fallback.label) };
}

/** Parse JSON text → config preview (cùng field landing Next.js dùng). */
export function parseLandingPreviewFromJson(
  jsonText: string,
): { config: LandingPreviewConfig | null; error: string | null } {
  try {
    const parsed = JSON.parse(jsonText) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { config: null, error: 'JSON phải là object' };
    }
    const raw = parsed as Record<string, unknown>;
    const shapeErr = validateLandingConfigShape(raw);
    if (shapeErr) return { config: null, error: shapeErr };

    const heroRaw = asRecord(raw.hero) ?? {};
    const aboutRaw = asRecord(raw.about) ?? {};
    const socialRaw = asRecord(heroRaw.social) ?? {};
    const photoUrl = str(raw.photoUrl);

    const heroImageUrl =
      str(heroRaw.heroImageUrl) || photoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800';
    const aboutImageUrl = str(heroRaw.aboutImageUrl) || photoUrl || heroImageUrl;

    const bio =
      str(heroRaw.bio) ||
      str(raw.bio) ||
      str(heroRaw.tagline) ||
      'Mô tả ngắn trên hero.';

    const stats = Array.isArray(raw.stats)
      ? raw.stats.map((s, i) => {
          const row = asRecord(s) ?? {};
          return {
            label: str(row.label, `Stat ${i + 1}`),
            value: str(row.value, '—'),
            iconKey: str(row.iconKey, 'users2'),
          };
        })
      : [];

    const aboutGrid = Array.isArray(raw.aboutGrid)
      ? raw.aboutGrid.map((c, i) => {
          const row = asRecord(c) ?? {};
          const lines = Array.isArray(row.lines)
            ? row.lines.map((l) => str(l)).filter(Boolean)
            : [];
          return {
            title: str(row.title, `Block ${i + 1}`),
            lines,
            iconKey: str(row.iconKey, 'target'),
          };
        })
      : [];

    const connectRaw = asRecord(raw.connectSection) ?? {};
    const channels = Array.isArray(raw.connectChannels)
      ? raw.connectChannels.map((ch, i) => {
          const row = asRecord(ch) ?? {};
          return {
            key: str(row.key, `ch-${i}`),
            label: str(row.label, 'Link'),
            href: str(row.href, '#'),
            display: str(row.display) || undefined,
          };
        })
      : [];

    const config: LandingPreviewConfig = {
      displayName: str(raw.displayName) || str(heroRaw.name, 'Headhunter'),
      hero: {
        hiPrefix: str(heroRaw.hiPrefix, "Hi, I'm "),
        showHeart: heroRaw.showHeart !== false,
        name: str(heroRaw.name, 'Tên HH'),
        roleTitle: str(heroRaw.roleTitle, 'Headhunter at TD Consulting'),
        bio,
        heroImageUrl,
        aboutImageUrl,
        chatCta: cta(heroRaw.chatCta, { href: '#contact', label: 'Chat' }),
        jobsCta: cta(heroRaw.jobsCta, { href: '/jobs', label: 'View Open Jobs' }),
        social: {
          linkedin: str(socialRaw.linkedin) || undefined,
          facebook: str(socialRaw.facebook) || undefined,
          zalo: str(socialRaw.zalo) || undefined,
          email: str(socialRaw.email) || undefined,
        },
      },
      stats,
      about: {
        paragraph1: str(aboutRaw.paragraph1),
        paragraph2: str(aboutRaw.paragraph2),
        stickyNote: str(aboutRaw.stickyNote, 'Sticky note'),
      },
      aboutGrid,
      connectSection: {
        title: str(connectRaw.title, "Let's connect!"),
        subtitle: str(connectRaw.subtitle),
      },
      connectChannels: channels,
    };

    return { config, error: null };
  } catch {
    return { config: null, error: 'JSON không hợp lệ' };
  }
}
