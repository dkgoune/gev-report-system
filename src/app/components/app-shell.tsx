"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { LogoutButton } from "@/app/components/logout-button";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { SessionPayload } from "@/lib/session";

type AppShellProps = {
  session: SessionPayload;
  children: React.ReactNode;
};

type NavRole = SessionPayload["role"];

type NavChild = {
  href: string;
  title: string;
  roles?: NavRole[];
};

type NavItem = {
  description: string;
  href?: string;
  roles?: NavRole[];
  title: string;
  children?: NavChild[];
};

const navItems: NavItem[] = [
  {
    href: "/",
    title: "Tableau de bord",
    description: "Vue générale de la plateforme",
  },
  {
    href: "/users",
    title: "Personnels",
    description: "Ajouter et gérer les comptes",
    children: [
      { href: "/users", title: "Liste des personnels" },
      { href: "/users/new", title: "Ajouter un personnel" },
    ],
  },
  {
    href: "/criteria",
    title: "Critères",
    description: "Créer et organiser les critères",
    children: [
      { href: "/criteria", title: "Liste des critères" },
      { href: "/criteria/new", title: "Ajouter un critère" },
    ],
  },
  {
    title: "Rapports",
    description: "Saisie journalière des services",
    children: [
      {
        href: "/reports/general/new",
        title: "Ajouter un rapport",
        roles: ["admin", "leader_envoi", "leader_piste", "leader_retrait"],
      },
      {
        href: "/reports/general",
        title: "Liste des rapports",
        roles: ["admin", "leader_envoi", "leader_piste", "leader_retrait"],
      },
    ],
  },
  {
    title: "Évaluations",
    description: "Appliquer les critères au personnel",
    children: [
      {
        href: "/evaluations/new",
        title: "Ajouter une évaluation",
        roles: ["admin", "leader_envoi", "leader_piste", "leader_retrait"],
      },
      {
        href: "/evaluations",
        title: "Liste des évaluations",
        roles: ["admin"],
      },
    ],
  },
];

export function AppShell({ session, children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNavItems = navItems
    .map((item) => ({
      ...item,
      children: item.children?.filter(
        (child) => !child.roles || child.roles.includes(session.role),
      ),
    }))
    .filter((item) => {
      const hasAccess = !item.roles || item.roles.includes(session.role);
      const hasChildren = Boolean(item.children && item.children.length > 0);
      return hasAccess && (item.href || hasChildren);
    });

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[96rem] items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir la navigation"
            >
              <Menu />
            </Button>

            <div>
              <p className="text-xs font-semibold tracking-widest text-teal-700 uppercase">
                General Express Voyages
              </p>
              <h1 className="text-lg font-bold text-slate-900">
                Plateforme de rapports
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {session.username}
              </p>
              <p className="text-xs text-slate-500">Rôle: {session.role}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[96rem] flex-1 gap-6 overflow-hidden px-4 py-6">
        <aside className="hidden h-full w-80 shrink-0 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:block">
          <p className="mb-4 text-xs font-bold tracking-wide text-slate-500 uppercase">
            Navigation
          </p>
          <nav className="space-y-2 pb-4">
            {visibleNavItems.map((item) => (
              <NavigationItem
                key={item.title}
                item={item}
                pathname={pathname}
                onNavigate={() => undefined}
              />
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <section className="min-h-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            {children}
          </section>
        </main>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Fermer la navigation"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
          />

          <div className="absolute inset-y-0 left-0 flex w-[88vw] max-w-sm flex-col border-r border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <div>
                <p className="text-xs font-semibold tracking-widest text-teal-700 uppercase">
                  Navigation
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {session.username}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => setMobileOpen(false)}
                aria-label="Fermer la navigation"
              >
                <X />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <nav className="space-y-2 pb-4">
                {visibleNavItems.map((item) => (
                  <NavigationItem
                    key={item.title}
                    item={item}
                    pathname={pathname}
                    onNavigate={() => setMobileOpen(false)}
                  />
                ))}
              </nav>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type NavigationItemProps = {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
};

function NavigationItem({ item, pathname, onNavigate }: NavigationItemProps) {
  const hasChildren = Boolean(item.children?.length);
  const [open, setOpen] = useState(false);
  const activeGroup = isGroupActive(item, pathname);

  if (!hasChildren) {
    const active = isLinkActive(pathname, item.href);

    return item.href ? (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={`block rounded-lg border p-3 transition-colors ${
          active
            ? "border-teal-300 bg-teal-50"
            : "border-slate-200 hover:border-teal-300 hover:bg-teal-50"
        }`}
      >
        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
        <p className="text-xs text-slate-600">{item.description}</p>
      </Link>
    ) : null;
  }

  return (
    <Collapsible open={activeGroup || open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-slate-200 transition-colors hover:border-teal-300 hover:bg-teal-50">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 p-3 text-left"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {item.title}
              </p>
              <p className="text-xs text-slate-600">{item.description}</p>
            </div>
            <ChevronDown
              className={`size-4 shrink-0 transition-transform ${
                activeGroup || open ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-1 border-t border-slate-200 px-3 py-3">
            {item.children?.map((child) => {
              const active = isLinkActive(pathname, child.href);

              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onNavigate}
                  className={`block rounded-md px-2 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-white font-medium text-slate-900"
                      : "text-slate-700 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  {child.title}
                </Link>
              );
            })}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function isLinkActive(pathname: string, href?: string) {
  if (!href) {
    return false;
  }

  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function isGroupActive(item: NavItem, pathname: string) {
  return Boolean(
    item.children?.some((child) => isLinkActive(pathname, child.href)),
  );
}
