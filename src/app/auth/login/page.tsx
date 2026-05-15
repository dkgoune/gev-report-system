import { LoginForm } from "@/app/auth/login/login-form";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath =
    params.next && params.next.startsWith("/") ? params.next : "/";
  const accessDenied = params.error === "unauthorized";

  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md bg-white shadow-lg p-8">
        <div className="mb-8">
          <p className="text-xs font-bold text-teal-700 tracking-widest uppercase mb-2">
            Système de rapports GENERAL EXPRESS VOYAGES
          </p>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Connexion</h1>
          <p className="text-sm text-slate-600">
            Réservé aux administrateurs et aux chefs de service.
          </p>
        </div>

        {accessDenied ? (
          <p className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Accès refusé. Seuls les comptes admin et leaders peuvent utiliser la
            plateforme.
          </p>
        ) : null}

        <LoginForm nextPath={nextPath} />
      </div>
    </div>
  );
}
