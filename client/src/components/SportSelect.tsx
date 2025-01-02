import { forwardRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSports } from "@/lib/sports";
import { type ControllerRenderProps } from "react-hook-form";

// Properly type the props to match react-hook-form's expectations
interface SportSelectProps extends Partial<ControllerRenderProps> {
  value?: string | number;
  onValueChange?: (value: number) => void;
}

const SportSelect = forwardRef<HTMLButtonElement, SportSelectProps>(({ value, onValueChange, ...props }, ref) => {
  const { data: sports } = useSports();

  // Ensure we're working with strings for the select component
  const stringValue = value?.toString();

  return (
    <Select
      {...props}
      ref={ref}
      value={stringValue}
      onValueChange={(val) => onValueChange?.(Number(val))}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a sport" />
      </SelectTrigger>
      <SelectContent>
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