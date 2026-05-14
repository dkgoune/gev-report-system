"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { LogoutButton } from "@/components/layout/logout-button";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { canAccessAgencyAdminWorkspace } from "@/lib/authz";
import type { SessionPayload } from "@/lib/session";

type MembershipOption = {
  agencyId: string;
  agencyName: string;
  role: SessionPayload["activeMembershipRole"];
};

type AppShellProps = {
  session: SessionPayload;
  memberships: MembershipOption[];
  children: React.ReactNode;
};

type NavRole = SessionPayload["activeMembershipRole"];

type NavChild = {
  href: string;
  title: string;
  roles?: NavRole[];
  match?: "exact" | "prefix";
};

type NavItem = {
  description: string;
  href?: string;
  roles?: NavRole[];
  title: string;
  children?: NavChild[];
};

const adminNavItems: NavItem[] = [
  {
    href: "/",
    title: "Tableau de bord",
    description: "Vue générale de la plateforme",
    children: [
      { href: "/", match: "exact", title: "Vue d'ensemble" },
      { href: "/analytics", match: "exact", title: "Analyse" },
      {
        href: "/evaluations-analytics",
        match: "exact",
        title: "Évaluations du personnel",
      },
    ],
  },

  {
    href: "/users",
    title: "Personnels",
    description: "Ajouter et gérer les comptes",
    children: [
      { href: "/users", match: "exact", title: "Liste des personnels" },
      { href: "/users/new", match: "exact", title: "Ajouter un personnel" },
    ],
  },
  {
    href: "/services",
    title: "Services",
    description: "Configurer les services de l'agence",
  },
  {
    href: "/posts",
    title: "Postes",
    description: "Gerer les postes de travail",
  },
  {
    href: "/work-schedules",
    title: "Planning",
    description: "Planifier les services et les affectations",
    children: [
      { href: "/work-schedules", match: "exact", title: "Liste par semaines" },
      {
        href: "/work-schedules/list",
        match: "exact",
        title: "Liste par jours",
      },
      { href: "/work-schedules/new", match: "exact", title: "Nouveau" },
    ],
  },
  {
    href: "/reports",
    title: "Rapports",
    description: "Rapport journalière et incidents",
    children: [
      { href: "/reports", match: "exact", title: "Liste des rapports" },
      { href: "/reports/new", title: "Ajouter un rapport" },
      {
        href: "/reports/incidents",
        match: "exact",
        title: "Definitions d'incidents",
        roles: ["admin"],
      },
    ],
  },
  {
    href: "/criteria",
    title: "Critères",
    description: "Créer et organiser les critères",
    children: [
      { href: "/criteria", match: "exact", title: "Liste des critères" },
      { href: "/criteria/new", title: "Ajouter un critère" },
    ],
  },

  {
    title: "Évaluations",
    description: "Appliquer les critères au personnel",
    children: [
      {
        href: "/evaluations",
        match: "exact",
        title: "Liste des évaluations",
        roles: ["admin"],
      },
      {
        href: "/evaluations/new",
        match: "exact",
        title: "Ajouter une évaluation",
        roles: ["admin", "scheduler", "reporter"],
      },
    ],
  },
  {
    title: "Signatures de bordereaux",
    description: "Enregistrez les signataires de bordereaux",
    children: [
      { href: "/signatures", match: "exact", title: "Liste des signatures" },
      { href: "/signatures/new", match: "exact", title: "Nouvelle signature" },
    ],
  },
  {
    href: "/settings",
    title: "Paramètres",
    description: "Règles automatiques et réglages d'administration",
    roles: ["admin"],
  },
];

function getOperatorNavItems(role: NavRole): NavItem[] {
  if (role === "scheduler") {
    return [
      {
        title: "Rapports",
        description: "Rapports journaliers et incidents",
        children: [
          { href: "/reports", match: "exact", title: "Liste des rapports" },
          { href: "/reports/new", match: "exact", title: "Nouveau rapport" },
        ],
      },
      {
        title: "Évaluations",
        description: "Appliquer un critère au personnel autorisé",
        children: [{ href: "/evaluations/new", title: "Nouvelle évaluation" }],
      },
      {
        title: "Planning",
        description: "Créer et gérer les horaires de travail",
        children: [
          { href: "/work-schedules", match: "exact", title: "Vue d'ensemble" },
          { href: "/work-schedules/list", match: "exact", title: "Liste" },
          { href: "/work-schedules/new", match: "exact", title: "Nouveau" },
        ],
      },
      {
        title: "Signatures de bordereaux",
        description: "Enregistrez les signataires de bordereaux",
        children: [
          { href: "/signatures", title: "Liste des signatures" },
          { href: "/signatures/new", title: "Nouvelle signature" },
        ],
      },
    ];
  }
  if (role === "reporter") {
    return [
      {
        title: "Rapports",
        description: "Rapports journaliers et incidents",
        children: [
          { href: "/reports", match: "exact", title: "Liste des rapports" },
          { href: "/reports/new", match: "exact", title: "Nouveau rapport" },
        ],
      },
    ];
  }

  return [];
}

function getNavItems(session: SessionPayload): NavItem[] {
  return canAccessAgencyAdminWorkspace(session)
    ? adminNavItems
    : getOperatorNavItems(session.activeMembershipRole);
}

function AgencySwitcher({
  session,
  memberships,
}: {
  session: SessionPayload;
  memberships: MembershipOption[];
}) {
  const [pending, setPending] = useState(false);

  async function onSwitch(agencyId: string) {
    // if (!agencyId || agencyId === session.activeAgencyId) {
    //   return;
    // }

    setPending(true);
    try {
      const response = await fetch("/api/auth/switch-agency", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agencyId }),
      });

      if (!response.ok) {
        setPending(false);
        return;
      }

      window.location.reload();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="hidden min-w-57.5 sm:block">
      <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
        Agence active
      </label>
      <select
        className="w-full border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
        value={session.activeAgencyId}
        disabled={pending || memberships.length <= 1}
        onChange={event => onSwitch(event.target.value)}
      >
        {memberships.map(membership => (
          <option key={membership.agencyId} value={membership.agencyId}>
            {membership.agencyName}
          </option>
        ))}
      </select>
    </div>
  );
}

export function AppShell({ session, memberships, children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    function setSidebarStateFromStorage() {
      const storedSidebarOpen = localStorage.getItem("sidebarOpen");
      if (storedSidebarOpen !== null) {
        setSidebarOpen(storedSidebarOpen === "true");
      }
    }
    setSidebarStateFromStorage();
  }, []);

  function toggleSidebarOpen() {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);

    localStorage.setItem("sidebarOpen", newState.toString());
  }

  const visibleNavItems = getNavItems(session)
    .map(item => ({
      ...item,
      children: item.children?.filter(
        child =>
          !child.roles || child.roles.includes(session.activeMembershipRole)
      ),
    }))
    .filter(item => {
      const hasAccess =
        !item.roles || item.roles.includes(session.activeMembershipRole);
      const hasChildren = Boolean(item.children && item.children.length > 0);
      return hasAccess && (item.href || hasChildren);
    });

  const roleDisplay = formatRole(session.activeMembershipRole);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[linear-gradient(180deg,#ecfeff_0%,#f8fafc_16%,#f8fafc_100%)]">
      <header className="shrink-0 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-440 items-center justify-between gap-4 px-4 py-4 xl:px-6">
          <div className="flex min-w-0 items-center gap-3">
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

            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="hidden md:inline-flex"
              onClick={toggleSidebarOpen}
              aria-label={
                sidebarOpen ? "Masquer la navigation" : "Afficher la navigation"
              }
            >
              {sidebarOpen ? <X /> : <Menu />}
            </Button>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.24em] text-teal-700 uppercase">
                General Express Voyages
              </p>
              <h1 className="truncate text-lg font-bold text-slate-900">
                Plateforme de rapports
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AgencySwitcher session={session} memberships={memberships} />

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {session.username}
              </p>
              <p className="text-xs text-slate-500">
                Role: {session.activeMembershipRole}
              </p>
            </div>

            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-440 flex-1 gap-6 overflow-hidden px-4 py-6 xl:px-6">
        {sidebarOpen ? (
          <aside className="hidden h-full min-h-0 w-88 shrink-0 overflow-hidden border border-slate-200/80 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.08)] md:block">
            <div className="flex h-full min-h-0 flex-col overflow-hidden p-4">
              <p className="mb-4 text-xs font-bold tracking-[0.18em] text-slate-500 uppercase">
                Navigation
              </p>
              <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 pb-4">
                {visibleNavItems.map(item => (
                  <NavigationItem
                    key={item.title}
                    item={item}
                    pathname={pathname}
                    onNavigate={() => undefined}
                  />
                ))}
              </nav>
            </div>
          </aside>
        ) : null}

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="space-y-4">
            <section className="overflow-hidden border border-slate-200/80 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
              <div className="p-4 sm:p-6">{children}</div>
            </section>
          </div>
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
            <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#0f766e_0%,#115e59_52%,#1e293b_100%)] px-4 py-4 text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-teal-100 uppercase">
                    Navigation
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {session.username}
                  </p>
                  <p className="text-xs text-teal-50/85">{roleDisplay}</p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Fermer la navigation"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  <X />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <nav className="space-y-2 pb-4">
                {visibleNavItems.map(item => (
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
        className={`block border p-3 transition-colors ${
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
      <div
        className={`border transition-colors ${
          activeGroup
            ? "border-teal-300 bg-teal-50 shadow-sm"
            : "border-slate-200 hover:border-teal-300 hover:bg-teal-50"
        }`}
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={`flex w-full items-center justify-between gap-3 p-3 text-left ${
              activeGroup ? "text-teal-950" : "text-inherit"
            }`}
          >
            <div>
              <p
                className={`text-sm font-semibold ${
                  activeGroup ? "text-teal-950" : "text-slate-900"
                }`}
              >
                {item.title}
              </p>
              <p
                className={`text-xs ${
                  activeGroup ? "text-teal-800" : "text-slate-600"
                }`}
              >
                {item.description}
              </p>
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
            {item.children?.map(child => {
              const active = isLinkActive(pathname, child.href, child.match);

              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onNavigate}
                  className={`block border-l-2 px-3 py-2 text-sm transition-colors ${
                    active
                      ? "border-teal-600 bg-white font-semibold text-teal-900 shadow-xs"
                      : "border-transparent text-slate-700 hover:bg-white hover:text-slate-900"
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

function isLinkActive(
  pathname: string,
  href?: string,
  match: "exact" | "prefix" = "prefix"
) {
  if (!href) {
    return false;
  }

  if (href === "/" || match === "exact") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function isGroupActive(item: NavItem, pathname: string) {
  return Boolean(
    item.children?.some(child =>
      isLinkActive(pathname, child.href, child.match)
    )
  );
}

function formatRole(role: NavRole) {
  switch (role) {
    case "admin":
      return "Administrateur";
    case "scheduler":
      return "Planificateur";
    case "reporter":
      return "Rapporteur";
    case "worker":
      return "Agent";
    default:
      return role;
  }
}
