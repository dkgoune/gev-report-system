"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchableSelectOption = {
  value: string;
  label: string;
  keywords?: string[];
};

type SearchableSelectProps = {
  emptyMessage?: string;
  options: SearchableSelectOption[];
  placeholder: string;
  searchPlaceholder?: string;
  value: string;
  onValueChange: (value: string) => void;
};

export function SearchableSelect({
  emptyMessage = "Aucun resultat.",
  options,
  placeholder,
  searchPlaceholder = "Rechercher...",
  value,
  onValueChange,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const selectedOption = options.find(option => option.value === value);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter(option => {
      const haystacks = [option.label, ...(option.keywords ?? [])];
      return haystacks.some(entry =>
        entry.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [options, query]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    inputRef.current?.focus();
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between border border-slate-300 bg-white px-3 py-2 text-left text-sm shadow-xs",
          open && "border-slate-400 ring-2 ring-slate-200"
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        onClick={() => setOpen(current => !current)}
      >
        <span
          className={cn(
            "truncate",
            selectedOption ? "text-slate-900" : "text-slate-500"
          )}
        >
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown className="size-4 text-slate-500" />
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-200 p-2">
            <label className="flex items-center gap-2 border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <Search className="size-4" />
              <input
                ref={inputRef}
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent outline-none"
              />
            </label>
          </div>

          <div
            id={listboxId}
            role="listbox"
            className="max-h-64 overflow-y-auto p-1"
          >
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-500">{emptyMessage}</p>
            ) : (
              filteredOptions.map(option => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-sm",
                      isSelected
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                    onClick={() => {
                      onValueChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <span>{option.label}</span>
                    {isSelected ? <Check className="size-4" /> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}