"use client";

import { useRef } from "react";

type WorkSchedulesListFiltersProps = {
  children: React.ReactNode;
};

export function WorkSchedulesListFilters({
  children,
}: WorkSchedulesListFiltersProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function submitWithReset() {
    if (!formRef.current) {
      return;
    }

    const pageInput = formRef.current.elements.namedItem(
      "page"
    ) as HTMLInputElement | null;

    if (pageInput) {
      pageInput.value = "1";
    }

    formRef.current.requestSubmit();
  }

  function onInput(event: React.FormEvent<HTMLFormElement>) {
    const target = event.target as HTMLElement | null;

    if (!target || target.tagName !== "INPUT") {
      return;
    }

    const input = target as HTMLInputElement;

    if (input.name !== "q") {
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      submitWithReset();
    }, 350);
  }

  function onChange(event: React.FormEvent<HTMLFormElement>) {
    const target = event.target as HTMLElement | null;

    if (!target) {
      return;
    }

    if (target.tagName === "INPUT") {
      const input = target as HTMLInputElement;

      if (input.name === "q") {
        return;
      }
    }

    submitWithReset();
  }

  return (
    <form
      ref={formRef}
      method="GET"
      onInput={onInput}
      onChange={onChange}
      className="grid gap-3 rounded border border-slate-200 bg-slate-50 p-4 md:grid-cols-6 lg:grid-cols-7"
    >
      {children}
    </form>
  );
}
