import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, Save, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../auth/store';
import {
  fetchTakenSubdomainSlugs,
  getMyLandingPage,
  isSlugTakenByOthers,
  saveMyLandingPage,
  validateSubdomainSlug,
} from '../api';
import {
  configToEditorForm,
  defaultEditorForm,
  editorFormToLandingConfig,
  type LandingEditorForm,
} from '../landingEditorState';
import type { HeadhunterLandingPage } from '../types';
import { LandingPersonalEditor } from './LandingPersonalEditor';

function suggestSlugFromEmail(email?: string | null): string {
  if (!email) return '';
  const local = email.split('@')[0] ?? '';
  return local
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 63);
}

function formatUpdatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function LandingSetupTab() {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingRow, setExistingRow] = useState<HeadhunterLandingPage | null>(null);
  const [takenSlugs, setTakenSlugs] = useState<string[]>([]);
  const [subdomainSlug, setSubdomainSlug] = useState('');
  const [form, setForm] = useState<LandingEditorForm>(defaultEditorForm());
  const [baseConfig, setBaseConfig] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [row, taken] = await Promise.all([
          getMyLandingPage(user.id),
          fetchTakenSubdomainSlugs(user.id),
        ]);
        if (cancelled) return;

        setTakenSlugs(taken);
        setExistingRow(row);

        if (row) {
          setSubdomainSlug(row.subdomain_slug);
          setBaseConfig(row.landing_config);
          setForm(configToEditorForm(row.landing_config));
          setTakenSlugs((prev) =>
            prev.filter((s) => s !== row.subdomain_slug.toLowerCase()),
          );
        } else {
          const suggested = suggestSlugFromEmail(user.email);
          const free =
            suggested && !taken.includes(suggested.toLowerCase()) ? suggested : '';
          setSubdomainSlug(free);
          const initial = defaultEditorForm();
          setForm(initial);
          setBaseConfig(editorFormToLandingConfig(initial));
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Không tải được cấu hình landing');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.email]);

  const normalizedSlug = subdomainSlug.trim().toLowerCase();
  const ownSlug = existingRow?.subdomain_slug ?? null;
  const slugTaken = isSlugTakenByOthers(normalizedSlug, takenSlugs, ownSlug);
  const slugFormatErr = normalizedSlug ? validateSubdomainSlug(normalizedSlug) : null;

  const handleSave = async (overrideForm?: LandingEditorForm) => {
    if (!user?.id) return;

    const slugErr = validateSubdomainSlug(subdomainSlug);
    if (slugErr) {
      toast.error(slugErr);
      return;
    }
    if (slugTaken) {
      toast.error(`Slug "${normalizedSlug}" đã được HH khác dùng — chọn tên khác`);
      return;
    }

    const formToSave = overrideForm ?? form;
    const landingConfig = editorFormToLandingConfig(formToSave, baseConfig);

    setSaving(true);
    try {
      const saved = await saveMyLandingPage(user.id, {
        subdomain_slug: normalizedSlug,
        landing_config: landingConfig,
      });
      setExistingRow(saved);
      setBaseConfig(landingConfig);
      const taken = await fetchTakenSubdomainSlugs(user.id);
      setTakenSlugs(taken);
      toast.success(existingRow ? 'Đã lưu — landing live ngay' : 'Đã tạo landing — live ngay');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Lưu thất bại';
      if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('đã được')) {
        toast.error(msg.includes('đã được') ? msg : 'Slug đã được HH khác dùng — chọn slug khác');
        const taken = await fetchTakenSubdomainSlugs(user.id).catch(() => []);
        setTakenSlugs(taken);
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const previewHost = normalizedSlug ? `https://${normalizedSlug}.tdconsulting.vn` : null;

  /** Auto-save khi upload ảnh thành công (chỉ khi đã có record) */
  const handlePhotoUploaded = (updatedForm: LandingEditorForm) => {
    setForm(updatedForm);
    if (existingRow) {
      handleSave(updatedForm);
    } else {
      toast('Ảnh đã upload — bấm Lưu để tạo landing', { icon: '💾' });
    }
  };

  const hasRecord = Boolean(existingRow);

  const takenHint = useMemo(() => {
    if (takenSlugs.length === 0) return null;
    return takenSlugs.join(', ');
  }, [takenSlugs]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col gap-4">
      <div className="shrink-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            {hasRecord ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <CheckCircle2 size={14} />
                    Đã có landing · lưu là cập nhật live
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Slug hiện tại:{' '}
                  <strong className="text-gray-700 dark:text-gray-300">{existingRow!.subdomain_slug}</strong>
                  {' · '}
                  Cập nhật: {formatUpdatedAt(existingRow!.updated_at)}
                </p>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                <Sparkles size={14} />
                Chưa có landing — chọn slug chưa ai dùng, chỉnh preview, rồi Lưu
              </span>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Nhấn chữ/nút trong preview để sửa · nhấn ảnh để upload{' '}
              <code className="rounded bg-gray-100 px-1 text-xs dark:bg-gray-800">public-assets</code>
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving || Boolean(slugTaken) || Boolean(slugFormatErr)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {hasRecord ? 'Lưu thay đổi' : 'Tạo landing'}
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Subdomain slug{hasRecord ? ' (đã gắn — mỗi người 1 landing)' : ''}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={subdomainSlug}
                readOnly={hasRecord}
                onChange={(e) => setSubdomainSlug(e.target.value.toLowerCase())}
                placeholder="quynhnguyen"
                className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                  hasRecord
                    ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'
                    : slugTaken
                      ? 'border-red-400 bg-white ring-1 ring-red-200 dark:border-red-600 dark:bg-gray-950'
                      : 'border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-950'
                }`}
              />
              <span className="whitespace-nowrap text-sm text-gray-500">.tdconsulting.vn</span>
            </div>

            {slugTaken ? (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                <AlertCircle size={14} />
                Slug này đã được HH khác dùng — đặt tên khác
              </p>
            ) : null}

            {takenHint ? (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-600 dark:text-gray-300">Slug đã có trên hệ thống:</span>{' '}
                {takenHint}
              </p>
            ) : (
              <p className="mt-2 text-xs text-gray-500">Chưa có slug nào khác — bạn có thể đặt tự do.</p>
            )}
          </div>

          {previewHost ? (
            <a
              href={hasRecord ? previewHost : undefined}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!hasRecord) {
                  e.preventDefault();
                  toast('Lưu lần đầu để mở link live', { icon: 'ℹ️' });
                }
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium ${
                hasRecord
                  ? 'border-brand-200 text-brand-600 hover:bg-brand-50 dark:border-brand-800'
                  : 'border-gray-200 text-gray-500 dark:border-gray-700'
              }`}
            >
              <ExternalLink size={16} />
              <span className="max-w-[200px] truncate sm:max-w-none">{previewHost.replace('https://', '')}</span>
            </a>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 justify-center overflow-auto rounded-2xl bg-slate-100/90 py-6 dark:bg-gray-900/60">
        <div className="w-[70vw] max-w-[70vw] min-w-[320px] shrink-0">
          {user?.id ? (
            <LandingPersonalEditor
              userId={user.id}
              form={form}
              onChange={setForm}
              onPhotoUploaded={handlePhotoUploaded}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
