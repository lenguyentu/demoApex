import type {
  CvIntakeQueueItem,
  CvIntakeStatus,
  HeadhunterLandingPage,
} from './types';
import { DEFAULT_LANDING_CONFIG } from './defaultLandingConfig';

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,62}$/;
const RESERVED = new Set(['www', 'api', 'app', 'cdn', 'admin']);

export function validateSubdomainSlug(slug: string): string | null {
  const s = slug.trim().toLowerCase();
  if (!s) return 'Slug không được để trống';
  if (!SLUG_RE.test(s)) return 'Slug: chỉ thường, số, gạch ngang (2–63 kí tự)';
  if (RESERVED.has(s)) return 'Slug này đã được hệ thống giữ';
  return null;
}

export async function fetchTakenSubdomainSlugs(excludeUserId?: string): Promise<string[]> {
  return ['taken-demo', 'test-slug'];
}

export function isSlugTakenByOthers(
  slug: string,
  takenSlugs: string[],
  ownSlug?: string | null,
): boolean {
  const s = slug.trim().toLowerCase();
  if (!s) return false;
  if (ownSlug && s === ownSlug.trim().toLowerCase()) return false;
  return takenSlugs.includes(s);
}

// IN-MEMORY MOCK FOR LANDING PAGE
let mockLandingPage: HeadhunterLandingPage | null = {
  id: 'landing-123',
  user_id: 'mock-user-123',
  subdomain_slug: 'demo',
  landing_config: DEFAULT_LANDING_CONFIG,
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export async function getMyLandingPage(userId: string): Promise<HeadhunterLandingPage | null> {
  return mockLandingPage;
}

export async function saveMyLandingPage(
  userId: string,
  payload: {
    subdomain_slug: string;
    landing_config: Record<string, unknown>;
  },
): Promise<HeadhunterLandingPage> {
  const slugErr = validateSubdomainSlug(payload.subdomain_slug);
  if (slugErr) throw new Error(slugErr);

  mockLandingPage = {
    id: mockLandingPage?.id || 'landing-123',
    user_id: userId,
    subdomain_slug: payload.subdomain_slug,
    landing_config: payload.landing_config,
    is_published: true,
    created_at: mockLandingPage?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return mockLandingPage;
}

export function resolveIntakeStoragePathCandidates(
  storagePath: string,
  submissionId: string,
): string[] {
  return [storagePath];
}

// IN-MEMORY MOCK FOR CV QUEUE
let mockQueue: CvIntakeQueueItem[] = [
  {
    id: 'intake-1',
    created_at: new Date().toISOString(),
    storage_path: 'mock/path.pdf',
    full_name: 'Nguyễn Đình Phong',
    email: 'phong@gmail.com',
    phone: '0901234567',
    reason: 'Xin ứng tuyển frontend',
    job_ref: 'job-1',
    job_title: 'Senior Frontend',
    apply_type: 'job',
    context_job_ref: null,
    context_job_title: null,
    team_slug: 'demo',
    status: 'new',
    cvSignedUrl: 'https://example.com/cv.pdf',
  },
  {
    id: 'intake-2',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    storage_path: 'mock/path2.pdf',
    full_name: 'Trần Minh Tuấn',
    email: 'tuan@gmail.com',
    phone: '0988776655',
    reason: 'Backend dev 5 năm exp',
    job_ref: 'job-2',
    job_title: 'Backend Developer',
    apply_type: 'job',
    context_job_ref: null,
    context_job_title: null,
    team_slug: 'demo',
    status: 'reviewed',
    cvSignedUrl: 'https://example.com/cv.pdf',
  }
];

export async function fetchCvIntakeQueue(opts: {
  teamSlug?: string | null;
  status?: CvIntakeStatus | 'all';
  applyType?: 'all' | 'job' | 'advice';
  limit?: number;
  withSignedUrls?: boolean;
}): Promise<CvIntakeQueueItem[]> {
  let filtered = [...mockQueue];
  if (opts.status && opts.status !== 'all') {
    filtered = filtered.filter(q => q.status === opts.status);
  }
  return filtered;
}

export async function updateCvIntakeStatus(id: string, status: CvIntakeStatus): Promise<void> {
  const item = mockQueue.find(q => q.id === id);
  if (item) {
    item.status = status;
  }
}

export async function getIntakeCvSignedUrl(
  storagePath: string,
  submissionId?: string,
): Promise<string> {
  return 'https://example.com/cv.pdf';
}

export type LandingPhotoKind = 'hero' | 'about';

export async function uploadLandingPhoto(
  userId: string,
  file: File,
  kind: LandingPhotoKind = 'hero',
): Promise<string> {
  return URL.createObjectURL(file);
}
