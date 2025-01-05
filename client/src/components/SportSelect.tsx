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
import { defaultSports } from "@/lib/sports"
import { forwardRef } from "react"

interface SportSelectProps {
  value: number;
  onChange: (value: number) => void;
  hideAllOption?: boolean;
}

const SportSelect = forwardRef<HTMLButtonElement, SportSelectProps>((props, ref) => {
  const { value, onChange, hideAllOption } = props;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground"
          )}
        >
          {value ? defaultSports.find((_, index) => index + 1 === Number(value))?.name : "Select sport..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search sports..." />
          <CommandEmpty>No sport found.</CommandEmpty>
          <CommandGroup>
            {!hideAllOption && (
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
                All sports
              </CommandItem>
            )}
            {defaultSports.map((sport, index) => (
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
                {sport.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

SportSelect.displayName = "SportSelect";

export default SportSelect;