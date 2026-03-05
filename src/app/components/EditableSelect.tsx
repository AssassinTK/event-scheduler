import { useState, useRef, useEffect } from 'react';

interface EditableSelectProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  className?: string;
}

export function EditableSelect({ value, options, onChange, className = '' }: EditableSelectProps) {
  const [isEditing, setIsEditing] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing && selectRef.current) {
      selectRef.current.focus();
    }
  }, [isEditing]);

  const handleClick = () => {
    setIsEditing(true);
  };

  const handleChange = (newValue: string) => {
    onChange(newValue);
    setIsEditing(false);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <select
        ref={selectRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        className={`${className} border-2 border-[#F39C12] outline-none rounded px-2 py-1 bg-white dark:bg-[#2C3E50]`}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  const getStatusColor = () => {
    if (value === '已確認') return 'text-[#27AE60]';
    if (value === '缺席') return 'text-red-500';
    if (value === '未確認') return 'text-[#F39C12]';
    return '';
  };

  return (
    <span
      onClick={handleClick}
      className={`${className} ${getStatusColor()} cursor-pointer hover:bg-[#FFF8DC] rounded px-2 py-1 transition-colors inline-block`}
    >
      {value}
    </span>
  );
}
