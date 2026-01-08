"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const Combobox = React.forwardRef(
  (
    {
      options = [],
      value,
      onChange,
      placeholder = "Select option...",
      searchPlaceholder = "Search...",
      emptyMessage = "No results found.",
      className,
      disabled = false,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);

    const selectedOption = options.find((option) => option.value === value);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between rounded-lg bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600 hover:text-white focus:border-emerald-500",
              !value && "text-slate-400",
              className
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-slate-800 border-slate-700 rounded-lg overflow-hidden">
          <Command className="bg-transparent">
            <CommandInput
              placeholder={searchPlaceholder}
              className="h-9 text-white placeholder:text-slate-400 border-slate-700"
            />
            <CommandList>
              <CommandEmpty className="text-slate-400 py-4 text-center text-sm">
                {emptyMessage}
              </CommandEmpty>
              <CommandGroup className="p-1">
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onChange(option.value === value ? "" : option.value);
                      setOpen(false);
                    }}
                    className="text-white rounded-md cursor-pointer hover:!bg-slate-600 data-[selected=true]:!bg-slate-600 data-[selected=true]:!text-white"
                  >
                    {option.label}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4 text-emerald-500",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

Combobox.displayName = "Combobox";

export { Combobox };
