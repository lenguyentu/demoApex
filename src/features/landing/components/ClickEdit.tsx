import { useEffect, useRef } from 'react';

const hoverRing =
  'cursor-pointer rounded-sm px-0.5 -mx-0.5 transition-shadow hover:ring-2 hover:ring-[#e91e63]/35 hover:bg-white/40';

type ClickEditProps = {
  fieldId: string;
  activeField: string | null;
  setActiveField: (id: string | null) => void;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  as?: 'span' | 'p' | 'h2';
};

export function ClickEdit({
  fieldId,
  activeField,
  setActiveField,
  value,
  onChange,
  className = '',
  placeholder = 'Nhấn để nhập…',
  multiline = false,
  as = 'span',
}: ClickEditProps) {
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const editing = activeField === fieldId;

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  const finish = () => setActiveField(null);

  if (editing) {
    const common = {
      ref: ref as React.RefObject<HTMLInputElement & HTMLTextAreaElement>,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        onChange(e.target.value),
      onBlur: finish,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') finish();
        if (!multiline && e.key === 'Enter') finish();
      },
      className:
        'w-full rounded-lg border-2 border-[#e91e63]/50 bg-white px-2 py-1 text-inherit shadow-sm focus:outline-none',
    };
    if (multiline) {
      return <textarea {...common} rows={4} ref={ref as React.RefObject<HTMLTextAreaElement>} />;
    }
    return <input type="text" {...common} ref={ref as React.RefObject<HTMLInputElement>} />;
  }

  const Tag = as;
  return (
    <Tag
      role="button"
      tabIndex={0}
      onClick={() => setActiveField(fieldId)}
      onKeyDown={(e) => e.key === 'Enter' && setActiveField(fieldId)}
      className={`${hoverRing} ${className} ${!value ? 'text-slate-400 italic' : ''}`}
      title="Nhấn để sửa"
    >
      {value || placeholder}
    </Tag>
  );
}

type ClickEditLinkProps = {
  fieldId: string;
  activeField: string | null;
  setActiveField: (id: string | null) => void;
  label: string;
  href: string;
  onLabelChange: (v: string) => void;
  onHrefChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
  hrefOnly?: boolean;
};

/** Nhấn nút/link → sửa nhãn + URL (chỉ text/link). */
export function ClickEditLink({
  fieldId,
  activeField,
  setActiveField,
  label,
  href,
  onLabelChange,
  onHrefChange,
  children,
  className = '',
  hrefOnly = false,
}: ClickEditLinkProps) {
  const editing = activeField === fieldId;

  if (editing) {
    return (
      <div className="rounded-xl border-2 border-[#e91e63]/40 bg-white p-3 shadow-lg space-y-2 text-left z-20">
        {!hrefOnly && (
          <>
            <p className="text-[10px] font-bold uppercase text-slate-400">Nhãn</p>
            <input
              type="text"
              value={label}
              onChange={(e) => onLabelChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              autoFocus
            />
          </>
        )}
        <p className="text-[10px] font-bold uppercase text-slate-400">Link</p>
        <input
          type="text"
          value={href}
          onChange={(e) => onHrefChange(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
          placeholder="https:// hoặc #contact"
          autoFocus={hrefOnly}
        />
        <button
          type="button"
          onClick={() => setActiveField(null)}
          className="text-xs font-semibold text-[#e91e63]"
        >
          Xong
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActiveField(fieldId)}
      className={`${hoverRing} ${className}`}
      title={hrefOnly ? 'Nhấn để sửa link' : 'Nhấn để sửa nhãn & link'}
    >
      {children}
    </button>
  );
}

/** Chỉ sửa URL — giữ nguyên icon con (children). */
export function ClickEditHrefOnly({
  fieldId,
  activeField,
  setActiveField,
  href,
  onHrefChange,
  children,
  className = '',
}: Omit<ClickEditLinkProps, 'label' | 'onLabelChange' | 'hrefOnly' | 'onHrefChange'> & {
  onHrefChange: (v: string) => void;
}) {
  return (
    <ClickEditLink
      fieldId={fieldId}
      activeField={activeField}
      setActiveField={setActiveField}
      label=""
      href={href}
      onLabelChange={() => {}}
      onHrefChange={onHrefChange}
      hrefOnly
      className={className}
    >
      {children}
    </ClickEditLink>
  );
}
