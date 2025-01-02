import { forwardRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSports } from "@/lib/sports";
import { type ControllerRenderProps } from "react-hook-form";

interface SportSelectProps {
  value?: number;
  onChange?: (value: number | null) => void;
  required?: boolean;
  allowClear?: boolean;
}

const SportSelect = forwardRef<HTMLButtonElement, SportSelectProps>(({ 
  value, 
  onChange,
  required,
  allowClear 
}, ref) => {
  const { data: sports } = useSports();

  return (
    <Select
      ref={ref}
      value={value?.toString() || ""}
      onValueChange={(val) => onChange?.(val ? Number(val) : null)}
      required={required}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a sport" />
      </SelectTrigger>
      <SelectContent>
        {allowClear && (
          <SelectItem value="">All Sports</SelectItem>
        )}
        {sports?.map((sport) => (
          <SelectItem key={sport.id} value={sport.id.toString()}>
            {sport.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

SportSelect.displayName = "SportSelect";

export default SportSelect;