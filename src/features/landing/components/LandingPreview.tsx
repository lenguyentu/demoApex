import {
  BriefcaseBusiness,
  Building2,
  Heart,
  Languages,
  Mail,
  Star,
  Target,
  Users2,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { LandingPreviewConfig } from '../parseLandingPreview';

const PINK = '#e91e63';
const PINK_SOFT = '#fce4ec';

const STAT_ICONS: Record<string, LucideIcon> = {
  users2: Users2,
  briefcasebusiness: BriefcaseBusiness,
  building2: Building2,
  star: Star,
};

const ABOUT_ICONS: Record<string, LucideIcon> = {
  target: Target,
  briefcasebusiness: BriefcaseBusiness,
  languages: Languages,
  zap: Zap,
};

function iconFor(key: string, map: Record<string, LucideIcon>, fallback: LucideIcon) {
  return map[key.toLowerCase()] ?? fallback;
}

interface LandingPreviewProps {
  config: LandingPreviewConfig;
}

export function LandingPreview({ config }: LandingPreviewProps) {
  const { hero, stats, about, aboutGrid, connectSection, connectChannels } = config;

  return (
    <div className="rounded-xl border border-slate-200 bg-white text-slate-800 shadow-inner overflow-hidden text-sm">
      <div className="px-3 py-1.5 bg-slate-100 border-b text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Preview — hero, stats, about, contact
      </div>

      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${PINK_SOFT} 0%, #fff 45%, ${PINK_SOFT} 100%)`,
        }}
      >
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:items-center">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-1 font-semibold" style={{ color: PINK }}>
              {hero.hiPrefix}
              {hero.showHeart ? (
                <Heart className="inline fill-current" size={16} strokeWidth={1.5} />
              ) : null}
            </p>
            <h2 className="mt-0.5 text-2xl font-bold leading-tight sm:text-3xl" style={{ color: PINK }}>
              {hero.name}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-800">{hero.roleTitle}</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-4">{hero.bio}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className="inline-flex rounded-xl px-3 py-1.5 text-xs font-semibold text-white"
                style={{ backgroundColor: PINK }}
              >
                {hero.chatCta.label}
              </span>
              <span
                className="inline-flex rounded-xl border-2 px-3 py-1.5 text-xs font-semibold"
                style={{ borderColor: PINK, color: PINK }}
              >
                {hero.jobsCta.label}
              </span>
            </div>
          </div>
          <div className="flex justify-center sm:justify-end">
            <div
              className="relative w-full max-w-[200px] overflow-hidden rounded-2xl shadow-lg"
              style={{ backgroundColor: PINK_SOFT }}
            >
              <div className="aspect-[4/5] w-full">
                <img
                  src={hero.heroImageUrl}
                  alt={hero.name}
                  className="h-full w-full object-cover object-center"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-3 -mb-4 pb-6">
          <div className="rounded-xl border border-slate-100 bg-white px-2 py-2 shadow-md">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stats.map((item, i) => {
                const Icon = iconFor(item.iconKey, STAT_ICONS, Users2);
                return (
                  <article key={`${item.label}-${i}`} className="flex items-center gap-2 px-1">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: PINK_SOFT, color: PINK }}
                    >
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-none" style={{ color: PINK }}>
                        {item.value}
                      </p>
                      <p className="mt-0.5 text-[9px] font-semibold leading-tight text-slate-700 line-clamp-2">
                        {item.label}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 pb-4 pt-8">
        <h3 className="text-lg font-bold text-slate-900">
          About <span className="font-normal text-slate-500">Me</span>
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,140px)_1fr]">
          <div className="relative mx-auto w-full max-w-[140px]">
            <div className="overflow-hidden rounded-2xl shadow-md aspect-[4/5] bg-[#fce4ec]">
              <img src={hero.aboutImageUrl} alt={hero.name} className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 max-w-[120px] rotate-[-3deg] rounded border border-amber-200 bg-[#fff9c4] px-2 py-1.5 text-[9px] font-semibold leading-snug text-slate-800 shadow">
              {about.stickyNote}
            </div>
          </div>
          <div className="min-w-0">
            {about.paragraph1 ? (
              <p className="text-xs leading-relaxed text-slate-600">{about.paragraph1}</p>
            ) : null}
            {about.paragraph2 ? (
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{about.paragraph2}</p>
            ) : null}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {aboutGrid.map((cell) => {
                const Icon = iconFor(cell.iconKey, ABOUT_ICONS, Target);
                return (
                  <div
                    key={cell.title}
                    className="rounded-xl border border-slate-100 bg-slate-50/90 p-2"
                  >
                    <div className="flex items-center gap-1" style={{ color: PINK }}>
                      <Icon size={12} />
                      <span className="text-[10px] font-bold text-slate-900">{cell.title}</span>
                    </div>
                    <ul className="mt-1 space-y-0.5 text-[10px] text-slate-600">
                      {cell.lines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t px-4 py-4" style={{ backgroundColor: PINK_SOFT }}>
        <div className="flex gap-2">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: PINK }}
          >
            <Heart className="fill-white" size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{connectSection.title}</h3>
            <p className="mt-0.5 text-[10px] leading-snug text-slate-600 line-clamp-2">
              {connectSection.subtitle}
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {connectChannels.map((ch) => (
            <div
              key={ch.key}
              className="flex items-center gap-2 rounded-xl border border-white/80 bg-white/90 px-2 py-2 text-[10px] font-semibold text-slate-800 shadow-sm"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: PINK_SOFT, color: PINK }}
              >
                {ch.key === 'email' ? <Mail size={14} /> : <span className="uppercase">{ch.key[0]}</span>}
              </span>
              <span className="min-w-0 truncate">
                {ch.display && ch.display !== ch.label ? ch.display : ch.label}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
