
import { Fragment } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { defaultActivities } from "@/lib/activities"
import { forwardRef } from "react"

interface ActivitySelectProps {
  value: number;
  onChange: (value: number) => void;
  hideAllActivities?: boolean;
}

const ActivitySelect = forwardRef<HTMLButtonElement, ActivitySelectProps>((props, ref) => {
  const { value, onChange, hideAllActivities } = props;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          variant="outline"
          role="combobox"
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground"
          )}
        >
          {value ? defaultActivities.find((_, index) => index + 1 === Number(value))?.name : "Select activity..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search activities..." />
          <CommandEmpty>No activity found.</CommandEmpty>
          <CommandGroup>
            {!hideAllActivities && (
              <CommandItem
                onSelect={() => {
                  onChange(0);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === 0 ? "opacity-100" : "opacity-0"
                  )}
                />
                All activities
              </CommandItem>
            )}
            {defaultActivities.map((activity, index) => (
              <CommandItem
                key={index + 1}
                onSelect={() => {
                  onChange(index + 1);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    Number(value) === index + 1 ? "opacity-100" : "opacity-0"
                  )}
                />
                {activity.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

ActivitySelect.displayName = "ActivitySelect";

export default ActivitySelect;
