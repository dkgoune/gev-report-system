"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";

type AutoFilterFormProps = {
  children: ReactNode;
  className?: string;
};

const TEXT_INPUT_TYPES = new Set(["search", "text"]);

export function AutoFilterForm({ children, className }: AutoFilterFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function navigateWithForm() {
    if (!formRef.current) {
      return;
    }

    const formData = new FormData(formRef.current);
    const params = new URLSearchParams();

    for (const [key, value] of formData.entries()) {
      const normalizedValue = typeof value === "string" ? value.trim() : "";

      if (!normalizedValue || key === "page") {
        continue;
      }

      params.set(key, normalizedValue);
    }

    params.set("page", "1");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function scheduleNavigation(delay: number) {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      navigateWithForm();
    }, delay);
  }

  function handleChange(event: ChangeEvent<HTMLFormElement>) {
    const target = event.target;

    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
      return;
    }

    if (target instanceof HTMLInputElement && TEXT_INPUT_TYPES.has(target.type)) {
      scheduleNavigation(300);
      return;
    }

    scheduleNavigation(0);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    scheduleNavigation(0);
  }

  return (
    <form
      ref={formRef}
      className={className}
      onChange={handleChange}
      onSubmit={handleSubmit}
    >
      {children}
    </form>
  );
}