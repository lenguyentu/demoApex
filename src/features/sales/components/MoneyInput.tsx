import { useEffect, useState } from 'react';

export const formatMoney = (value: number) => {
  if (!value && value !== 0) return '';
  return new Intl.NumberFormat('vi-VN').format(value);
};

interface MoneyInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function MoneyInput({
  label,
  value,
  onChange,
  disabled,
  className = '',
  placeholder = '0',
}: MoneyInputProps) {
  const [displayValue, setDisplayValue] = useState(formatMoney(value));

  useEffect(() => {
    const currentNum = Number(displayValue.replace(/\D/g, '')) || 0;
    if (currentNum !== value) {
      setDisplayValue(formatMoney(value));
    }
  }, [displayValue, value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const num = raw === '' ? 0 : parseInt(raw, 10);
    setDisplayValue(formatMoney(num));
    onChange(num);
  };

  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>}
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={(e) => e.target.select()}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-500 outline-none text-sm disabled:bg-gray-50 focus:border-brand-500 ${className}`}
      />
    </div>
  );
}
