
import { forwardRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSports } from "@/lib/sports";

const SportSelect = forwardRef((props: any, ref) => {
  const { data: sports } = useSports();

  return (
    <Select {...props} ref={ref}>
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
