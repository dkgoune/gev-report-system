"use client";

import { CalendarClock, X } from "lucide-react";
import moment, { type Moment } from "moment";
import { useMemo } from "react";
import Datetime from "react-datetime";
import { cn } from "@/lib/utils";
import { Button } from "./button";

const INTERNAL_FORMAT = "YYYY-MM-DDTHH:mm";
const DISPLAY_FORMAT = "DD/MM/YYYY HH:mm";

type DateTimeInputProps = {
  className?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value: string;
};

function normalizeValue(value: Moment | string) {
  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return "";
    }

    const parsed = moment(trimmed, [DISPLAY_FORMAT, INTERNAL_FORMAT], true);
    return parsed.isValid() ? parsed.format(INTERNAL_FORMAT) : "";
  }

  return value.isValid() ? value.format(INTERNAL_FORMAT) : "";
}

export function DateTimeInput({
  className,
  disabled,
  onChange,
  placeholder = "JJ/MM/AAAA HH:mm",
  required,
  value,
}: DateTimeInputProps) {
  const hasValue = value.trim().length > 0;

  const pickerValue = useMemo(() => {
    if (!value) {
      return "";
    }

    const parsed = moment(value, INTERNAL_FORMAT, true);
    return parsed.isValid() ? parsed : "";
  }, [value]);

  return (
    <div className={cn("datetime-field", className)}>
      <Datetime
        closeOnSelect
        dateFormat="DD/MM/YYYY"
        timeFormat="HH:mm"
        locale="fr"
        strictParsing
        value={pickerValue}
        onChange={(nextValue) => onChange(normalizeValue(nextValue))}
        inputProps={{
          className:
            "h-11 w-full border border-slate-300 bg-white px-3 pr-24 text-sm text-slate-900 placeholder:text-slate-400 transition-[border-color,box-shadow] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
          disabled,
          placeholder,
          required,
        }}
        renderInput={(props, openCalendar) => (
          <div className="relative">
            <input {...props} />
            <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1  bg-slate-50/90 px-1 py-1">
              {hasValue ? (
                <button
                  type="button"
                  onClick={() => onChange("")}
                  disabled={disabled}
                  className="inline-flex size-7 items-center justify-center text-slate-500 transition-colors hover:bg-white hover:text-slate-700 disabled:pointer-events-none disabled:opacity-50"
                  aria-label="Effacer la date et l'heure"
                >
                  <X className="size-4" />
                </button>
              ) : null}
              <Button
                variant="outline"
                type="button"
                onClick={() => openCalendar()}
                disabled={disabled}
                // className="inline-flex size-7 items-center justify-center bg-teal-600 text-white transition-colors hover:bg-teal-700 disabled:pointer-events-none disabled:bg-slate-300"
                aria-label="Ouvrir le sélecteur de date et d'heure"
              >
                <CalendarClock className="size-4" />
              </Button>
            </div>
          </div>
        )}
      />
    </div>
  );
}
