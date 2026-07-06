"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, KeyRound, Loader2, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";

type ProfileWidgetProps = {
  initialUser: {
    fullName: string;
    username: string;
    phone: string | null;
  };
  systemRole: string;
  isRoot: boolean;
};

export function ProfileWidget({
  initialUser,
  systemRole,
  isRoot,
}: ProfileWidgetProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"info" | "password">("info");

  // Info Form State
  const [fullName, setFullName] = useState(initialUser.fullName);
  const [username, setUsername] = useState(initialUser.username);
  const [phone, setPhone] = useState(initialUser.phone || "");
  const [submittingInfo, setSubmittingInfo] = useState(false);

  // Password Form State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // Initials for avatar
  const initials =
    fullName
      .split(" ")
      .map(n => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  async function handleUpdateInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) {
      toast.error("Le nom et le nom d'utilisateur sont obligatoires.");
      return;
    }

    setSubmittingInfo(true);
    try {
      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, username, phone }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || "Impossible de mettre à jour les informations."
        );
      }

      toast.success("Informations mises à jour avec succès.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingInfo(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!oldPassword) {
      toast.error("Veuillez saisir votre ancien mot de passe.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Le nouveau mot de passe doit faire au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    setSubmittingPassword(true);
    try {
      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || "Impossible de modifier le mot de passe."
        );
      }

      toast.success("Mot de passe modifié avec succès.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingPassword(false);
    }
  }

  const roleLabel =
    systemRole === "super_admin"
      ? "Super Administrateur"
      : "Personnel standard";

  return (
    <article className="border border-slate-200 bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Top Banner Widget */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-teal-850 p-6 text-white flex items-center gap-4 border-b border-slate-200">
        <div className="h-14 w-14 rounded-full bg-linear-to-tr from-teal-500 to-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-inner border border-teal-200/20">
          {initials}
        </div>
        <div className="space-y-0.5">
          <h3 className="font-bold text-lg truncate max-w-50" title={fullName}>
            {fullName}
          </h3>
          <p className="text-xs text-slate-300 font-mono">@{username}</p>
          <span className="inline-flex items-center gap-1 bg-teal-500/20 border border-teal-500/30 text-teal-300 text-[10px] px-2 py-0.5 font-semibold rounded-full uppercase tracking-wider mt-1">
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50/50">
        <button
          type="button"
          onClick={() => setActiveTab("info")}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border-b-2 ${
            activeTab === "info"
              ? "border-teal-600 text-teal-700 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/70"
          }`}
        >
          <User className="size-4" />
          Mes Infos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("password")}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border-b-2 ${
            activeTab === "password"
              ? "border-teal-600 text-teal-700 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/70"
          }`}
        >
          <KeyRound className="size-4" />
          Sécurité
        </button>
      </div>

      {/* Form Content */}
      <div className="p-6">
        {isRoot && (
          <div className="mb-4 border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900 rounded-md font-semibold">
            La modification du profil du super utilisateur principal (root) est
            interdite pour des raisons de sécurité.
          </div>
        )}

        {activeTab === "info" ? (
          <form onSubmit={handleUpdateInfo} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="fullName-input"
                className="text-xs font-bold uppercase tracking-wider text-slate-600 block"
              >
                Nom complet *
              </label>
              <input
                id="fullName-input"
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 transition focus:outline-hidden focus:ring-1 focus:ring-teal-500 focus:border-teal-500 rounded-md disabled:bg-slate-100 disabled:text-slate-500"
                required
                disabled={isRoot || submittingInfo}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="username-input"
                className="text-xs font-bold uppercase tracking-wider text-slate-600 block"
              >
                Nom d'utilisateur *
              </label>
              <input
                id="username-input"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 transition focus:outline-hidden focus:ring-1 focus:ring-teal-500 focus:border-teal-500 rounded-md disabled:bg-slate-100 disabled:text-slate-500"
                required
                disabled={isRoot || submittingInfo}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="phone-input"
                className="text-xs font-bold uppercase tracking-wider text-slate-600 block"
              >
                Téléphone
              </label>
              <input
                id="phone-input"
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Ex. 0601020304"
                className="w-full border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 transition focus:outline-hidden focus:ring-1 focus:ring-teal-500 focus:border-teal-500 rounded-md disabled:bg-slate-100 disabled:text-slate-500"
                disabled={isRoot || submittingInfo}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 rounded-md shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              disabled={isRoot || submittingInfo}
            >
              {submittingInfo ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                <>
                  <UserCog className="size-4" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="oldPassword-input"
                className="text-xs font-bold uppercase tracking-wider text-slate-600 block"
              >
                Mot de passe actuel *
              </label>
              <input
                id="oldPassword-input"
                type="password"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                placeholder="Saisissez votre ancien mot de passe"
                className="w-full border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 transition focus:outline-hidden focus:ring-1 focus:ring-teal-500 focus:border-teal-500 rounded-md disabled:bg-slate-100 disabled:text-slate-500"
                required
                disabled={isRoot || submittingPassword}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="newPassword-input"
                className="text-xs font-bold uppercase tracking-wider text-slate-600 block"
              >
                Nouveau mot de passe *
              </label>
              <input
                id="newPassword-input"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Au moins 6 caractères"
                className="w-full border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 transition focus:outline-hidden focus:ring-1 focus:ring-teal-500 focus:border-teal-500 rounded-md disabled:bg-slate-100 disabled:text-slate-500"
                required
                disabled={isRoot || submittingPassword}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword-input"
                className="text-xs font-bold uppercase tracking-wider text-slate-600 block"
              >
                Confirmer le nouveau mot de passe *
              </label>
              <input
                id="confirmPassword-input"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Ressaisissez le nouveau mot de passe"
                className="w-full border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 transition focus:outline-hidden focus:ring-1 focus:ring-teal-500 focus:border-teal-500 rounded-md disabled:bg-slate-100 disabled:text-slate-500"
                required
                disabled={isRoot || submittingPassword}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 rounded-md shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              disabled={isRoot || submittingPassword}
            >
              {submittingPassword ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Modification...
                </>
              ) : (
                <>
                  <KeyRound className="size-4" />
                  Modifier le mot de passe
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </article>
  );
}
