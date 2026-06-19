import { useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadLandingPhoto, type LandingPhotoKind } from '../api';

const PINK_SOFT = '#fce4ec';

type LandingPhotoUploadProps = {
  userId: string;
  photoUrl: string;
  alt: string;
  onUploaded: (publicUrl: string) => void;
  className?: string;
  frameClassName?: string;
  kind?: LandingPhotoKind;
  emptyLabel?: string;
};

export function LandingPhotoUpload({
  userId,
  photoUrl,
  alt,
  onUploaded,
  className = '',
  frameClassName = 'aspect-4/5 w-full overflow-hidden rounded-[28px] shadow-md',
  kind = 'hero',
  emptyLabel,
}: LandingPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const pickFile = () => {
    if (uploading) return;
    inputRef.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadLandingPhoto(userId, file, kind);
      onUploaded(url);
      toast.success(kind === 'about' ? 'Đã tải ảnh About' : 'Đã tải ảnh Hero');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Tải ảnh thất bại';
      toast.error(msg.includes('RLS') || msg.includes('migration') ? msg : `Tải ảnh thất bại: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={pickFile}
      disabled={uploading}
      className={`group relative block w-full text-left ring-offset-2 hover:ring-2 hover:ring-[#e91e63]/40 ${className}`}
      style={{ backgroundColor: photoUrl ? undefined : PINK_SOFT }}
      title="Nhấn để tải ảnh lên (public-assets)"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFile}
      />
      <div className={frameClassName}>
        {photoUrl ? (
          <img src={photoUrl} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 px-4 text-center text-sm text-slate-500">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-[#e91e63]" />
            ) : (
              <>
                <ImagePlus className="h-8 w-8 text-[#e91e63]/70" />
                <span>{emptyLabel ?? (kind === 'about' ? 'Tải ảnh About Me' : 'Tải ảnh Hero')}</span>
                <span className="text-[11px] text-slate-400">JPG, PNG, WebP · tối đa 5MB</span>
              </>
            )}
          </div>
        )}
        {photoUrl && uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="h-8 w-8 animate-spin text-[#e91e63]" />
          </div>
        ) : null}
        {photoUrl && !uploading ? (
          <span className="absolute inset-x-0 bottom-0 bg-black/45 py-2 text-center text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
            Đổi ảnh
          </span>
        ) : null}
      </div>
    </button>
  );
}
