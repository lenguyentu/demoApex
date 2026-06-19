import { useState } from 'react';
import {
  BriefcaseBusiness,
  Building2,
  Heart,
  Languages,
  Star,
  Target,
  Users2,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { LandingEditorForm, StatFormRow } from '../landingEditorState';
import { HeroSocialIcon, ChatDotsIcon, ConnectChannelIcon } from '../landingBrandIcons';
import { ClickEdit, ClickEditHrefOnly, ClickEditLink } from './ClickEdit';
import { LandingPhotoUpload } from './LandingPhotoUpload';

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

function iconFor(key: string, map: Record<string, LucideIcon>, fb: LucideIcon) {
  return map[key.toLowerCase()] ?? fb;
}

interface LandingPersonalEditorProps {
  userId: string;
  form: LandingEditorForm;
  onChange: (next: LandingEditorForm) => void;
  onPhotoUploaded?: (updatedForm: LandingEditorForm) => void;
}

export function LandingPersonalEditor({
  userId,
  form,
  onChange,
  onPhotoUploaded,
}: LandingPersonalEditorProps) {
  const [activeField, setActiveField] = useState<string | null>(null);

  const patch = (partial: Partial<LandingEditorForm>) => onChange({ ...form, ...partial });

  const patchStat = (index: number, partial: Partial<StatFormRow>) => {
    const stats = [...form.stats];
    stats[index] = { ...stats[index], ...partial };
    patch({ stats });
  };

  const patchAboutGrid = (index: number, linesText: string) => {
    const aboutGrid = [...form.aboutGrid];
    aboutGrid[index] = { ...aboutGrid[index], linesText };
    patch({ aboutGrid });
  };

  const patchAboutTitle = (index: number, title: string) => {
    const aboutGrid = [...form.aboutGrid];
    aboutGrid[index] = { ...aboutGrid[index], title };
    patch({ aboutGrid });
  };

  const patchChannel = (index: number, partial: Partial<LandingEditorForm['connectChannels'][0]>) => {
    const connectChannels = [...form.connectChannels];
    connectChannels[index] = { ...connectChannels[index], ...partial };
    patch({ connectChannels });
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
      <p className="border-b bg-slate-50 py-2 text-center text-[11px] text-slate-500">
        Nhấn chữ/nút để sửa · nhấn ảnh Hero hoặc ảnh About (riêng) để upload public-assets
      </p>

      {/* Phần 1: Hero */}
      <section
        className="relative pb-14"
        style={{
          background: `linear-gradient(160deg, ${PINK_SOFT} 0%, #fff 50%, ${PINK_SOFT} 100%)`,
        }}
      >
        <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 sm:items-center">
          <div className="min-w-0 space-y-2">
            <p className="flex flex-wrap items-center gap-1 text-2xl sm:text-3xl font-semibold" style={{ color: PINK }}>
              <ClickEdit
                fieldId="hiPrefix"
                activeField={activeField}
                setActiveField={setActiveField}
                value={form.hiPrefix}
                onChange={(hiPrefix) => patch({ hiPrefix })}
                className="font-serif italic"
              />
              {form.showHeart ? (
                <Heart className="inline fill-current shrink-0" size={28} strokeWidth={1.5} />
              ) : null}
            </p>

            <ClickEdit
              fieldId="name"
              activeField={activeField}
              setActiveField={setActiveField}
              value={form.name}
              onChange={(name) => patch({ name })}
              as="h2"
              className="block text-4xl sm:text-5xl font-bold leading-tight text-[#e91e63]"
            />

            <ClickEdit
              fieldId="roleTitle"
              activeField={activeField}
              setActiveField={setActiveField}
              value={form.roleTitle}
              onChange={(roleTitle) => patch({ roleTitle })}
              as="p"
              className="block text-lg sm:text-xl font-semibold text-slate-800"
            />

            <ClickEdit
              fieldId="bio"
              activeField={activeField}
              setActiveField={setActiveField}
              value={form.bio}
              onChange={(bio) => patch({ bio })}
              multiline
              as="p"
              className="block text-[15px] leading-relaxed text-slate-600 max-w-lg"
            />

            <div className="flex flex-wrap gap-2 pt-2">
              <ClickEditLink
                fieldId="chatCta"
                activeField={activeField}
                setActiveField={setActiveField}
                label={form.chatCtaLabel}
                href={form.chatCtaHref}
                onLabelChange={(chatCtaLabel) => patch({ chatCtaLabel })}
                onHrefChange={(chatCtaHref) => patch({ chatCtaHref })}
                className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-md bg-[#e91e63]"
              >
                <ChatDotsIcon className="h-5 w-5 shrink-0 text-white" />
                {form.chatCtaLabel || 'Chat'}
              </ClickEditLink>

              <ClickEditLink
                fieldId="jobsCta"
                activeField={activeField}
                setActiveField={setActiveField}
                label={form.jobsCtaLabel}
                href={form.jobsCtaHref}
                onLabelChange={(jobsCtaLabel) => patch({ jobsCtaLabel })}
                onHrefChange={(jobsCtaHref) => patch({ jobsCtaHref })}
                className="inline-flex items-center gap-1 rounded-2xl border-2 border-[#e91e63] text-[#e91e63] bg-white px-5 py-3 text-sm font-semibold"
              >
                <BriefcaseBusiness size={18} />
                {form.jobsCtaLabel || 'Jobs'}
              </ClickEditLink>
            </div>

            <div className="flex gap-3 pt-2">
              {(
                [
                  ['linkedin', form.socialLinkedin],
                  ['facebook', form.socialFacebook],
                  ['zalo', form.socialZalo],
                  ['email', form.socialEmail],
                ] as const
              ).map(([key, href]) => (
                <ClickEditHrefOnly
                  key={key}
                  fieldId={`social-${key}`}
                  activeField={activeField}
                  setActiveField={setActiveField}
                  href={href}
                  onHrefChange={(v) => {
                    if (key === 'linkedin') patch({ socialLinkedin: v });
                    if (key === 'facebook') patch({ socialFacebook: v });
                    if (key === 'zalo') patch({ socialZalo: v });
                    if (key === 'email') patch({ socialEmail: v });
                  }}
                  className="inline-flex p-0 border-0 bg-transparent shadow-none"
                >
                  <HeroSocialIcon channelKey={key} />
                </ClickEditHrefOnly>
              ))}
            </div>
          </div>

          <div className="flex justify-center sm:justify-end">
            <LandingPhotoUpload
              userId={userId}
              kind="hero"
              photoUrl={form.photoUrl}
              alt={form.name}
              onUploaded={(photoUrl) => {
                const updated = { ...form, photoUrl };
                onChange(updated);
                onPhotoUploaded?.(updated);
              }}
              className="w-full max-w-[280px]"
              frameClassName="aspect-4/5 w-full overflow-hidden rounded-[28px] shadow-lg bg-[#fce4ec]"
            />
          </div>
        </div>

        <div className="relative z-10 mx-4 -mb-8">
          <div className="rounded-[22px] border border-slate-100 bg-white px-4 py-4 shadow-lg">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {form.stats.map((stat, i) => {
                const Icon = iconFor(stat.iconKey, STAT_ICONS, Users2);
                return (
                  <article key={i} className="flex items-center gap-2">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: PINK_SOFT, color: PINK }}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <ClickEdit
                        fieldId={`stat-value-${i}`}
                        activeField={activeField}
                        setActiveField={setActiveField}
                        value={stat.value}
                        onChange={(value) => patchStat(i, { value })}
                        className="block text-xl font-bold leading-none text-[#e91e63]"
                      />
                      <ClickEdit
                        fieldId={`stat-label-${i}`}
                        activeField={activeField}
                        setActiveField={setActiveField}
                        value={stat.label}
                        onChange={(label) => patchStat(i, { label })}
                        className="block text-[10px] font-semibold text-slate-800 mt-0.5 leading-tight"
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Phần 2: About + Connect */}
      <section className="bg-white px-6 pb-10 pt-12 sm:px-10">
        <h2 className="mb-8 text-2xl font-bold text-slate-900 sm:text-3xl">
          <span className="relative inline-block pb-2">
            About
            <span
              className="absolute bottom-0 left-0 h-1 w-12 rounded-full"
              style={{ backgroundColor: PINK }}
              aria-hidden
            />
          </span>
          <span> Me</span>
        </h2>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-start">
          <div className="relative mx-auto w-full max-w-[280px] lg:mx-0">
            <LandingPhotoUpload
              userId={userId}
              kind="about"
              photoUrl={form.aboutImageUrl}
              alt={`${form.name} — About`}
              onUploaded={(aboutImageUrl) => {
                const updated = { ...form, aboutImageUrl };
                onChange(updated);
                onPhotoUploaded?.(updated);
              }}
              frameClassName="aspect-4/5 w-full overflow-hidden rounded-[28px] shadow-md bg-[#fce4ec]"
            />
            <ClickEdit
              fieldId="stickyNote"
              activeField={activeField}
              setActiveField={setActiveField}
              value={form.stickyNote}
              onChange={(stickyNote) => patch({ stickyNote })}
              className="absolute -bottom-2 -right-2 z-10 max-w-[160px] -rotate-3 rounded-lg border border-amber-200 bg-[#fff9c4] px-2.5 py-2 text-xs font-semibold leading-snug text-slate-800 shadow-md"
            />
          </div>

          <div className="min-w-0 space-y-4">
            <ClickEdit
              fieldId="about1"
              activeField={activeField}
              setActiveField={setActiveField}
              value={form.aboutParagraph1}
              onChange={(aboutParagraph1) => patch({ aboutParagraph1 })}
              multiline
              as="p"
              className="block text-[15px] leading-7 text-slate-600"
            />
            <ClickEdit
              fieldId="about2"
              activeField={activeField}
              setActiveField={setActiveField}
              value={form.aboutParagraph2}
              onChange={(aboutParagraph2) => patch({ aboutParagraph2 })}
              multiline
              as="p"
              className="block text-[15px] leading-7 text-slate-600"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {form.aboutGrid.map((cell, i) => {
                const Icon = iconFor(cell.iconKey, ABOUT_ICONS, Target);
                return (
                  <div key={i} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="mb-2 flex items-center gap-2" style={{ color: PINK }}>
                      <Icon size={18} strokeWidth={2} />
                      <ClickEdit
                        fieldId={`about-title-${i}`}
                        activeField={activeField}
                        setActiveField={setActiveField}
                        value={cell.title}
                        onChange={(title) => patchAboutTitle(i, title)}
                        className="text-sm font-bold text-slate-900"
                      />
                    </div>
                    <ClickEdit
                      fieldId={`about-lines-${i}`}
                      activeField={activeField}
                      setActiveField={setActiveField}
                      value={cell.linesText}
                      onChange={(linesText) => patchAboutGrid(i, linesText)}
                      multiline
                      as="p"
                      className="block whitespace-pre-line text-sm leading-relaxed text-slate-600"
                      placeholder="Má»—i dÃ²ng má»™t má»¥c"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t px-6 py-10 sm:px-10" style={{ backgroundColor: '#fff5f8' }}>
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="flex gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
              style={{ backgroundColor: PINK }}
            >
              <Heart className="fill-white" size={26} strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <ClickEdit
                fieldId="connectTitle"
                activeField={activeField}
                setActiveField={setActiveField}
                value={form.connectTitle}
                onChange={(connectTitle) => patch({ connectTitle })}
                as="h2"
                className="block text-xl font-bold text-slate-900 sm:text-2xl"
              />
              <ClickEdit
                fieldId="connectSubtitle"
                activeField={activeField}
                setActiveField={setActiveField}
                value={form.connectSubtitle}
                onChange={(connectSubtitle) => patch({ connectSubtitle })}
                multiline
                as="p"
                className="block text-sm leading-relaxed text-slate-600 sm:text-[15px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {form.connectChannels.map((ch, i) => (
              <ClickEditLink
                key={`${ch.key}-${i}`}
                fieldId={`connect-${i}`}
                activeField={activeField}
                setActiveField={setActiveField}
                label={ch.label}
                href={ch.href}
                onLabelChange={(label) => patchChannel(i, { label })}
                onHrefChange={(href) => patchChannel(i, { href })}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:shadow-md"
              >
                <ConnectChannelIcon channelKey={ch.key} />
                <span className="min-w-0 truncate">
                  {ch.display && ch.display !== ch.label ? ch.display : ch.label}
                </span>
              </ClickEditLink>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
