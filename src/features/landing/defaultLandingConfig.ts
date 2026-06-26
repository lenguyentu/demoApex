/**
 * Schema landing_config — project landing đọc đúng shape này.
 * Nút "Tải mẫu" trong Setup dùng object này.
 */
export const DEFAULT_LANDING_CONFIG = {
  bio: 'Headhunter IT — kết nối ứng viên với team product, engineering và data. Minh bạch process, phản hồi nhanh.',
  hero: {
    name: 'Thùy Dung',
    social: {
      zalo: 'https://zalo.me/',
      email: 'mailto:thuydung.demo@tdconsulting.vn',
      facebook: 'https://www.facebook.com/',
      linkedin: 'https://www.linkedin.com/',
    },
    chatCta: {
      href: '#contact',
      label: 'Chat with Thùy Dung',
    },
    jobsCta: {
      href: '/jobs',
      label: 'View Open Jobs',
    },
    tagline:
      'Headhunter IT — kết nối ứng viên với team product, engineering và data. Minh bạch process, phản hồi nhanh.',
    hiPrefix: "Hi, I'm ",
    roleTitle: 'Headhunter at TD Consulting',
    showHeart: true,
  },
  about: {
    paragraph1:
      'Mình tập trung vào các vị trí tech và digital product — ưu tiên fit hai chiều thay vì gửi JD hàng loạt.',
    paragraph2:
      'Trước khi giới thiệu, mình luôn làm rõ JD, team culture và kỳ vọng lương để bạn chủ động quyết định.',
    stickyNote: 'Your next role starts with a real conversation.',
  },
  stats: [
    { label: 'Years of Experience', value: '3+', iconKey: 'users2' },
    { label: 'Successful Placements', value: '80+', iconKey: 'briefcasebusiness' },
    { label: 'Partners & Clients', value: '30+', iconKey: 'building2' },
    { label: 'Candidate Satisfaction', value: '4.8/5', iconKey: 'star' },
  ],
  title: 'Thùy Dung | TD Consulting',
  photoUrl: '',
  aboutImageUrl: '',
  aboutGrid: [
    {
      lines: ['Full-stack', 'Product', 'Data / AI'],
      title: 'Expertise',
      iconKey: 'target',
    },
    {
      lines: ['Fintech', 'SaaS', 'E-commerce'],
      title: 'Industries',
      iconKey: 'briefcasebusiness',
    },
    {
      lines: ['Vietnamese', 'English'],
      title: 'Languages',
      iconKey: 'languages',
    },
    {
      lines: ['Fast feedback', 'Clear timeline', 'No ghosting'],
      title: 'Working style',
      iconKey: 'zap',
    },
  ],
  headerCta: {
    href: '/#contact',
    label: 'Contact Me',
  },
  displayName: 'Thùy Dung',
  connectSection: {
    title: "Let's connect!",
    subtitle: 'Chọn kênh bạn hay dùng — Zalo/Facebook cho hỏi nhanh, email khi gửi CV.',
  },
  connectChannels: [
    { key: 'facebook', href: 'https://www.facebook.com/', label: 'Facebook' },
    { key: 'zalo', href: 'https://zalo.me/', label: 'Zalo' },
    { key: 'email', href: 'mailto:minhanh.demo@tdconsulting.vn', label: 'Email' },
    { key: 'linkedin', href: 'https://www.linkedin.com/', label: 'LinkedIn' },
  ],
} as const;

const REQUIRED_TOP_KEYS = [
  'bio',
  'hero',
  'about',
  'stats',
  'title',
  'photoUrl',
  'aboutGrid',
  'headerCta',
  'displayName',
  'connectSection',
  'connectChannels',
] as const;

/** Kiểm tra tối thiểu đúng shape landing project. */
export function validateLandingConfigShape(config: Record<string, unknown>): string | null {
  for (const key of REQUIRED_TOP_KEYS) {
    if (!(key in config)) return `Thiếu trường bắt buộc: ${key}`;
  }
  if (typeof config.bio !== 'string') return 'bio phải là string';
  if (typeof config.title !== 'string') return 'title phải là string';
  if (typeof config.displayName !== 'string') return 'displayName phải là string';
  if (typeof config.photoUrl !== 'string') return 'photoUrl phải là string';
  if (!config.hero || typeof config.hero !== 'object' || Array.isArray(config.hero)) {
    return 'hero phải là object';
  }
  if (!config.about || typeof config.about !== 'object' || Array.isArray(config.about)) {
    return 'about phải là object';
  }
  if (!Array.isArray(config.stats)) return 'stats phải là array';
  if (!Array.isArray(config.aboutGrid)) return 'aboutGrid phải là array';
  if (!Array.isArray(config.connectChannels)) return 'connectChannels phải là array';
  return null;
}
