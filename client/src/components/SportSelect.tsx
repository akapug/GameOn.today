import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { type Sport } from "@db/schema";

interface SportSelectProps {
  value: number;
  onChange: (value: number | null) => void;
  allowClear?: boolean;
}

export default function SportSelect({ value, onChange, allowClear }: SportSelectProps) {
  const { data: sports = [] } = useQuery<Sport[]>({
    queryKey: ["sports"],
    queryFn: () => fetch("/api/sports").then(res => res.json()),
  });

  return (
    <Select 
      value={value?.toString() || "0"} 
      onValueChange={(v) => onChange(v === "0" ? null : parseInt(v, 10))}
    >
      <SelectTrigger>
        <SelectValue placeholder="Filter by sport" />
      </SelectTrigger>
      <SelectContent>
        {allowClear && (
          <SelectItem value="0">All Sports</SelectItem>
        )}
        {sports.map((sport) => (
          <SelectItem key={sport.id} value={sport.id.toString()}>
            {sport.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}