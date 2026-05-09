export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Tableau de bord</h2>
        <p className="mt-2 text-sm text-slate-600">
          Bienvenue dans l&apos;espace de travail des responsables. Utilisez la
          navigation latérale pour gérer les utilisateurs, les critères et les
          rapports.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Accès sécurisé
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Les routes de l&apos;application sont protégées au niveau du layout
            et réservées aux comptes admin et chefs de service.
          </p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Gestion opérationnelle
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Utilisez les sections Personnels et Critères pour piloter la
            configuration métier de la plateforme.
          </p>
        </article>
      </div>
    </div>
  );
}
