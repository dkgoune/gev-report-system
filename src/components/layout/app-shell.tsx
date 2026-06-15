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
import { isSuperAdmin } from "@/lib/authz";
import type { SessionPayload } from "@/lib/session";
import { UserPermission } from "@/generated/prisma/browser";
import { hasPermission } from "@/lib/permissions";

type MembershipOption = {
  agencyId: string;
  agencyName: string;
};

type AppShellProps = {
  session: SessionPayload;
  memberships: MembershipOption[];
  children: React.ReactNode;
};

type NavChild = {
  href: string;
  title: string;
  match?: "exact" | "prefix";
  permissions?: UserPermission[];
};

type NavItem = {
  description: string;
  href?: string;
  title: string;
  permissions?: UserPermission[];
  children?: NavChild[];
};

const navItems: NavItem[] = [
  {
    href: "/",
    title: "Tableau de bord",
    description: "Vue générale de la plateforme",
    children: [
      {
        href: "/",
        match: "exact",
        title: "Mon espace",
      },
      {
        href: "/dashboard",
        match: "exact",
        title: "Vue d'ensemble",
        permissions: ["dashboard_view"],
      },
      {
        href: "/analytics",
        match: "exact",
        title: "Analyse",
        permissions: ["dashboard_analytics_view"],
      },
      {
        href: "/evaluations-analytics",
        match: "exact",
        title: "Évaluations du personnel",
        permissions: ["dashboard_evaluations_view"],
      },
    ],
  },

  {
    href: "/users",
    title: "Personnels",
    description: "Ajouter et gérer les comptes",
    permissions: ["user_create", "user_read", "user_manage_permissions"],
    children: [
      {
        href: "/users",
        match: "exact",
        title: "Liste des personnels",
        permissions: ["user_read"],
      },
      {
        href: "/users/new",
        match: "exact",
        title: "Ajouter un personnel",
        permissions: ["user_create"],
      },
      {
        href: "/roles",
        match: "prefix",
        title: "Gestion des rôles",
        permissions: ["user_manage_permissions"],
      },
    ],
  },
  {
    href: "/services",
    title: "Services",
    description: "Configurer les services de l'agence",
    permissions: ["service_create", "service_read"],
  },
  {
    href: "/posts",
    title: "Postes",
    description: "Gerer les postes de travail",
    permissions: ["post_create", "post_read"],
  },
  {
    href: "/work-schedules",
    title: "Planning",
    description: "Planifier les services et les affectations",
    permissions: ["work_schedule_create", "work_schedule_read"],
    children: [
      {
        href: "/work-schedules",
        match: "exact",
        title: "Liste par semaines",
        permissions: ["work_schedule_read"],
      },
      {
        href: "/work-schedules/list",
        match: "exact",
        title: "Liste par jours",
        permissions: ["work_schedule_read"],
      },
      {
        href: "/work-schedules/new",
        match: "exact",
        title: "Nouveau",
        permissions: ["work_schedule_create"],
      },
    ],
  },
  {
    href: "/reports",
    title: "Rapports",
    description: "Rapport journalière et incidents",
    permissions: [
      "report_read",
      "report_create",
      "incident_template_read",
      "incident_binding_manage",
    ],
    children: [
      {
        href: "/reports",
        match: "exact",
        title: "Liste des rapports",
        permissions: ["report_read"],
      },
      {
        href: "/reports/new",
        title: "Ajouter un rapport",
        permissions: ["report_create"],
      },
      {
        href: "/reports/reported-incidents",
        match: "exact",
        title: "Incidents signalés",
        permissions: ["report_read"],
      },
      {
        href: "/reports/incidents",
        match: "exact",
        title: "Definitions d'incidents",
        permissions: ["incident_template_read", "incident_binding_manage"],
      },
    ],
  },
  {
    href: "/criteria",
    title: "Critères",
    description: "Créer et organiser les critères",
    permissions: ["criteria_read", "criteria_create"],
    children: [
      {
        href: "/criteria",
        match: "exact",
        title: "Liste des critères",
        permissions: ["criteria_read"],
      },
      {
        href: "/criteria/new",
        title: "Ajouter un critère",
        permissions: ["criteria_create"],
      },
    ],
  },

  {
    title: "Évaluations",
    description: "Appliquer les critères au personnel",
    permissions: ["evaluation_create", "evaluation_read"],
    children: [
      {
        href: "/evaluations",
        match: "exact",
        title: "Liste des évaluations",
        permissions: ["evaluation_read"],
      },
      {
        href: "/evaluations/new",
        match: "exact",
        title: "Ajouter une évaluation",
        permissions: ["evaluation_create"],
      },
    ],
  },
  {
    title: "Signatures de bordereaux",
    description: "Enregistrez les signataires de bordereaux",
    permissions: ["signature_read", "signature_create"],
    children: [
      {
        href: "/signatures",
        match: "exact",
        title: "Liste des signatures",
        permissions: ["signature_read"],
      },
      {
        href: "/signatures/new",
        match: "exact",
        title: "Nouvelle signature",
        permissions: ["signature_create"],
      },
    ],
  },
  {
    href: "/settings",
    title: "Paramètres",
    description: "Règles automatiques et réglages d'administration",
    permissions: ["settings_view"],
  },
];

function getNavItems(session: SessionPayload): NavItem[] {
  let items = [...navItems];
  if (isSuperAdmin(session)) {
    items = [
      ...items,
      {
        href: "/agencies",
        title: "Agences",
        description: "Créer et administrer les agences",
        permissions: [
          "agency_create",
          "agency_read",
          "agency_update",
          "agency_delete",
        ],
      },
    ];
  }

  return items
    .filter(item =>
      !item.permissions ? true : hasPermission(session, ...item.permissions)
    )
    .map(item => ({
      ...item,
      children: item.children?.filter(child =>
        !child.permissions ? true : hasPermission(session, ...child.permissions)
      ),
    }));
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

  const visibleNavItems = getNavItems(session);

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
            {" "}
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {session.username}
              </p>
            </div>
            <AgencySwitcher session={session} memberships={memberships} />
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
            <section className="border border-slate-200/80 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
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
            {item.children?.map((child, index) => {
              const active = isLinkActive(pathname, child.href, child.match);

              return (
                <Link
                  key={index}
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
