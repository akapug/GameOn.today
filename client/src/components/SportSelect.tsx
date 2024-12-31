import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { type Sport } from "@db/schema";

interface SportSelectProps {
  value: number;
  onChange: (value: number) => void;
}

export default function SportSelect({ value, onChange }: SportSelectProps) {
  const { data: sports = [] } = useQuery<Sport[]>({
    queryKey: ["sports"],
    queryFn: () => fetch("/api/sports").then(res => res.json()),
  });

  return (
    <Select value={value?.toString()} onValueChange={(v) => onChange(parseInt(v, 10))}>
      <SelectTrigger>
        <SelectValue placeholder="Select a sport" />
      </SelectTrigger>
      <SelectContent>
        {sports.map((sport) => (
          <SelectItem key={sport.id} value={sport.id.toString()}>
            {sport.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}