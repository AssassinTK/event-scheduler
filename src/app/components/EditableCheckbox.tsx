import { Checkbox } from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { EditableText } from './EditableText';

interface EditableCheckboxProps {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
  onLabelChange: (label: string) => void;
}

export function EditableCheckbox({ checked, label, onCheckedChange, onLabelChange }: EditableCheckboxProps) {
  return (
    <div className="flex items-start gap-2 group">
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={`w-5 h-5 border-2 rounded flex items-center justify-center shrink-0 mt-1 ${
          checked ? 'bg-[#27AE60] border-[#27AE60]' : 'border-[#DEE2E6] bg-white dark:bg-[#1E1E1E]'
        }`}
      >
        {checked && <Check className="w-4 h-4 text-white" />}
      </Checkbox>
      <EditableText
        value={label}
        onChange={onLabelChange}
        className="flex-1"
      />
    </div>
  );
}
