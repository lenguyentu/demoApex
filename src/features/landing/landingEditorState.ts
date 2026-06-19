import { DEFAULT_LANDING_CONFIG } from './defaultLandingConfig';

export interface StatFormRow {
  label: string;
  value: string;
  iconKey: string;
}

export interface AboutGridFormRow {
  title: string;
  linesText: string;
  iconKey: string;
}

export interface ConnectChannelFormRow {
  key: string;
  label: string;
  href: string;
  display: string;
}

export interface LandingEditorForm {
  hiPrefix: string;
  showHeart: boolean;
  name: string;
  roleTitle: string;
  bio: string;
  /** Hero — photoUrl + hero.heroImageUrl */
  photoUrl: string;
  /** About Me — aboutImageUrl + hero.aboutImageUrl (riêng với hero) */
  aboutImageUrl: string;
  chatCtaLabel: string;
  chatCtaHref: string;
  jobsCtaLabel: string;
  jobsCtaHref: string;
  socialLinkedin: string;
  socialFacebook: string;
  socialZalo: string;
  socialEmail: string;
  stats: StatFormRow[];
  aboutParagraph1: string;
  aboutParagraph2: string;
  stickyNote: string;
  aboutGrid: AboutGridFormRow[];
  connectTitle: string;
  connectSubtitle: string;
  connectChannels: ConnectChannelFormRow[];
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

export function defaultEditorForm(): LandingEditorForm {
  return configToEditorForm(DEFAULT_LANDING_CONFIG as unknown as Record<string, unknown>);
}

export function configToEditorForm(raw: Record<string, unknown>): LandingEditorForm {
  const hero = asRecord(raw.hero) ?? {};
  const social = asRecord(hero.social) ?? {};
  const chat = asRecord(hero.chatCta) ?? {};
  const jobs = asRecord(hero.jobsCta) ?? {};
  const about = asRecord(raw.about) ?? {};
  const connect = asRecord(raw.connectSection) ?? {};
  const photoUrl = str(raw.photoUrl) || str(hero.heroImageUrl);
  const aboutImageUrl =
    str(raw.aboutImageUrl) || str(hero.aboutImageUrl) || '';

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

  while (stats.length < 4) {
    stats.push({ label: '', value: '', iconKey: 'users2' });
  }

  const aboutGrid = Array.isArray(raw.aboutGrid)
    ? raw.aboutGrid.map((c, i) => {
        const row = asRecord(c) ?? {};
        const lines = Array.isArray(row.lines) ? row.lines.map((l) => str(l)).filter(Boolean) : [];
        return {
          title: str(row.title, `Block ${i + 1}`),
          linesText: lines.join('\n'),
          iconKey: str(row.iconKey, 'target'),
        };
      })
    : [];

  while (aboutGrid.length < 4) {
    aboutGrid.push({ title: '', linesText: '', iconKey: 'target' });
  }

  const connectChannels = Array.isArray(raw.connectChannels)
    ? raw.connectChannels.map((ch, i) => {
        const row = asRecord(ch) ?? {};
        return {
          key: str(row.key, `ch-${i}`),
          label: str(row.label, 'Link'),
          href: str(row.href, '#'),
          display: str(row.display),
        };
      })
    : [];

  return {
    hiPrefix: str(hero.hiPrefix, "Hi, I'm "),
    showHeart: hero.showHeart !== false,
    name: str(hero.name, 'Tên HH'),
    roleTitle: str(hero.roleTitle, 'Headhunter at TD Consulting'),
    bio: str(hero.bio) || str(raw.bio) || str(hero.tagline),
    photoUrl,
    aboutImageUrl,
    chatCtaLabel: str(chat.label, 'Chat'),
    chatCtaHref: str(chat.href, '#contact'),
    jobsCtaLabel: str(jobs.label, 'View Open Jobs'),
    jobsCtaHref: str(jobs.href, '/jobs'),
    socialLinkedin: str(social.linkedin),
    socialFacebook: str(social.facebook),
    socialZalo: str(social.zalo),
    socialEmail: str(social.email),
    stats: stats.slice(0, 4),
    aboutParagraph1: str(about.paragraph1),
    aboutParagraph2: str(about.paragraph2),
    stickyNote: str(about.stickyNote),
    aboutGrid: aboutGrid.slice(0, 4),
    connectTitle: str(connect.title, "Let's connect!"),
    connectSubtitle: str(connect.subtitle),
    connectChannels,
  };
}

/** Gộp form vào config gốc (giữ title, headerCta, … nếu có). */
export function editorFormToLandingConfig(
  form: LandingEditorForm,
  base: Record<string, unknown> = {},
): Record<string, unknown> {
  const baseHero = asRecord(base.hero) ?? {};
  const name = form.name.trim() || 'Headhunter';

  const hero = {
    ...baseHero,
    name,
    hiPrefix: form.hiPrefix,
    showHeart: form.showHeart,
    roleTitle: form.roleTitle,
    tagline: form.bio,
    bio: form.bio,
    heroImageUrl: form.photoUrl,
    aboutImageUrl: form.aboutImageUrl,
    chatCta: { label: form.chatCtaLabel, href: form.chatCtaHref },
    jobsCta: { label: form.jobsCtaLabel, href: form.jobsCtaHref },
    social: {
      linkedin: form.socialLinkedin,
      facebook: form.socialFacebook,
      zalo: form.socialZalo,
      email: form.socialEmail,
    },
  };

  const stats = form.stats
    .filter((s) => s.label.trim() || s.value.trim())
    .map((s) => ({
      label: s.label.trim(),
      value: s.value.trim(),
      iconKey: s.iconKey.trim() || 'users2',
    }));

  const aboutGrid = form.aboutGrid
    .filter((c) => c.title.trim() || c.linesText.trim())
    .map((c) => ({
      title: c.title.trim(),
      iconKey: c.iconKey.trim() || 'target',
      lines: c.linesText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    }));

  const connectChannels = form.connectChannels
    .filter((ch) => ch.href.trim())
    .map((ch) => ({
      key: ch.key.trim() || 'link',
      label: ch.label.trim() || ch.key,
      href: ch.href.trim(),
      ...(ch.display.trim() ? { display: ch.display.trim() } : {}),
    }));

  return {
    ...base,
    bio: form.bio,
    displayName: name,
    title: `${name} | TD Consulting`,
    photoUrl: form.photoUrl,
    aboutImageUrl: form.aboutImageUrl,
    hero,
    stats: stats.length ? stats : (base.stats ?? DEFAULT_LANDING_CONFIG.stats),
    about: {
      paragraph1: form.aboutParagraph1,
      paragraph2: form.aboutParagraph2,
      stickyNote: form.stickyNote,
    },
    aboutGrid: aboutGrid.length ? aboutGrid : (base.aboutGrid ?? DEFAULT_LANDING_CONFIG.aboutGrid),
    connectSection: {
      title: form.connectTitle,
      subtitle: form.connectSubtitle,
    },
    connectChannels: connectChannels.length
      ? connectChannels
      : (base.connectChannels ?? DEFAULT_LANDING_CONFIG.connectChannels),
    headerCta: base.headerCta ?? DEFAULT_LANDING_CONFIG.headerCta,
  };
}
