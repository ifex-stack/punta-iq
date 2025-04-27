import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";

type Option = {
  value: string;
  label: string;
  disable?: boolean;
};

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: React.Dispatch<React.SetStateAction<string[]>>;
  placeholder?: string;
  className?: string;
  badges?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  className,
  badges = true,
  ...props
}: MultiSelectProps & React.ComponentPropsWithoutRef<typeof CommandPrimitive>) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = React.useCallback((option: string) => {
    onChange(selected.filter((s) => s !== option));
  }, [onChange, selected]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current;
    if (input) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (input.value === "" && selected.length > 0) {
          onChange(selected.slice(0, -1));
        }
      }
      // This is needed to prevent the form from submitting when pressing Enter
      if (e.key === "Enter" && input.value !== "") {
        e.preventDefault();
      }
    }
  }, [inputRef, onChange, selected]);

  return (
    <Command onKeyDown={handleKeyDown} className={`overflow-visible ${className}`} {...props}>
      <div
        className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
      >
        <div className="flex flex-wrap gap-1">
          {selected.map((option) => {
            const selectedOption = options.find((o) => o.value === option);
            return badges ? (
              <Badge
                key={option}
                variant="secondary"
                className="rounded-sm px-1 font-normal"
              >
                {selectedOption?.label || option}
                <button
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(option);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleUnselect(option)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            ) : (
              <span key={option} className="mr-1 px-1">
                {selectedOption?.label || option}
              </span>
            );
          })}
          <CommandInput
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            placeholder={selected.length === 0 ? placeholder : undefined}
            className="ml-0 flex-1 outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="relative">
        {open && (
          <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {options.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    disabled={option.disable}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onSelect={() => {
                      setInputValue("");
                      if (isSelected) {
                        onChange(selected.filter((s) => s !== option.value));
                      } else {
                        onChange([...selected, option.value]);
                      }
                    }}
                    className={`${
                      isSelected ? "bg-accent font-medium" : "font-normal"
                    } cursor-pointer`}
                  >
                    {option.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        )}
      </div>
    </Command>
  );
}