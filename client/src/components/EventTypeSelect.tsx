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
import { useQuery } from "@tanstack/react-query";
import { forwardRef } from "react"
import { type EventType } from "@db/schema";

interface EventTypeSelectProps {
  value: number | null;
  onChange: (value: number | null) => void;
  hideAllTypes?: boolean;
}

const EventTypeSelect = forwardRef<HTMLButtonElement, EventTypeSelectProps>((props, ref) => {
  const { value, onChange, hideAllTypes } = props;

  const { data: eventTypes, error, isLoading } = useQuery<EventType[]>({
    queryKey: ['/api/event-types'],
  });

  const selectedType = eventTypes?.find(t => t.id === value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          variant="outline"
          role="combobox"
          aria-label="Event Type"
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground"
          )}
        >
          {selectedType ? selectedType.name : "Select event type..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search event types..." />
          <CommandEmpty>
            {error ? "Error loading event types" : 
             isLoading ? "Loading event types..." : 
             eventTypes ? "No event type found." : "No event types available"}
          </CommandEmpty>
          <CommandGroup>
            {!hideAllTypes && eventTypes && (
              <CommandItem
                onSelect={() => {
                  onChange(null);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === null ? "opacity-100" : "opacity-0"
                  )}
                />
                All event types
              </CommandItem>
            )}
            {eventTypes?.map((eventType) => (
              <CommandItem
                key={eventType.id}
                onSelect={() => {
                  onChange(eventType.id);
                }}
                role="option"
                aria-selected={value === eventType.id}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === eventType.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {eventType.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

EventTypeSelect.displayName = "EventTypeSelect";

export default EventTypeSelect;