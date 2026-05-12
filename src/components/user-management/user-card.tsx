import { Button } from "@/components/ui/button";
import { roleLabel, roleOptions } from "./constants";
import { PasswordResetForm } from "./password-reset-form";
import type { Role, UserFormState, UserItem } from "./types";

type UserCardProps = {
  user: UserItem;
  isAdmin: boolean;
  isEditing: boolean;
  editState: UserFormState;
  saving: boolean;
  deletingId: string | null;
  resetPasswordUserId: string | null;
  resetNewPassword: string;
  resetConfirmPassword: string;
  resetting: boolean;
  resetError: string | null;
  onStartEditing: (user: UserItem) => void;
  onEditStateChange: (nextState: UserFormState) => void;
  onCancelEditing: () => void;
  onSave: (userId: string) => Promise<void>;
  onDelete: (user: UserItem) => Promise<void>;
  onOpenResetPassword: (userId: string) => void;
  onCloseResetPassword: () => void;
  onResetNewPasswordChange: (value: string) => void;
  onResetConfirmPasswordChange: (value: string) => void;
  onResetPassword: (userId: string) => Promise<void>;
};

export function UserCard({
  user,
  isAdmin,
  isEditing,
  editState,
  saving,
  deletingId,
  resetPasswordUserId,
  resetNewPassword,
  resetConfirmPassword,
  resetting,
  resetError,
  onStartEditing,
  onEditStateChange,
  onCancelEditing,
  onSave,
  onDelete,
  onOpenResetPassword,
  onCloseResetPassword,
  onResetNewPasswordChange,
  onResetConfirmPasswordChange,
  onResetPassword,
}: UserCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      {!isEditing ? (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-slate-900">{user.fullName}</p>
              <p className="text-sm text-slate-600">
                @{user.username} • {roleLabel(user.role)} •{" "}
                {user.isActive ? "Actif" : "Inactif"}
              </p>
              {user.phone ? (
                <p className="text-sm text-slate-500">Tél: {user.phone}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => onStartEditing(user)}
                disabled={Boolean(deletingId)}
              >
                Modifier
              </Button>
              {isAdmin ? (
                <Button
                  variant="outline"
                  onClick={() => onOpenResetPassword(user.id)}
                  disabled={Boolean(deletingId)}
                >
                  Réinitialiser le mot de passe
                </Button>
              ) : null}
              <Button
                variant="destructive"
                onClick={() => void onDelete(user)}
                disabled={deletingId === user.id}
              >
                {deletingId === user.id ? "Suppression..." : "Supprimer"}
              </Button>
            </div>
          </div>

          {isAdmin && resetPasswordUserId === user.id ? (
            <PasswordResetForm
              userFullName={user.fullName}
              newPassword={resetNewPassword}
              confirmPassword={resetConfirmPassword}
              resetError={resetError}
              resetting={resetting}
              onNewPasswordChange={onResetNewPasswordChange}
              onConfirmPasswordChange={onResetConfirmPasswordChange}
              onConfirm={() => onResetPassword(user.id)}
              onCancel={onCloseResetPassword}
            />
          ) : null}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Nom complet</span>
            <input
              value={editState.fullName}
              onChange={event =>
                onEditStateChange({
                  ...editState,
                  fullName: event.target.value,
                })
              }
              className="w-full border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Nom utilisateur</span>
            <input
              value={editState.username}
              onChange={event =>
                onEditStateChange({
                  ...editState,
                  username: event.target.value,
                })
              }
              className="w-full border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Rôle</span>
            <select
              value={editState.role}
              onChange={event =>
                onEditStateChange({
                  ...editState,
                  role: event.target.value as Role,
                })
              }
              className="w-full border border-slate-300 px-3 py-2"
            >
              {roleOptions.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Téléphone</span>
            <input
              value={editState.phone}
              onChange={event =>
                onEditStateChange({
                  ...editState,
                  phone: event.target.value,
                })
              }
              className="w-full border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="md:col-span-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editState.isActive}
              onChange={event =>
                onEditStateChange({
                  ...editState,
                  isActive: event.target.checked,
                })
              }
            />
            <span>Compte actif</span>
          </label>

          <div className="md:col-span-2 flex flex-wrap gap-2">
            <Button onClick={() => void onSave(user.id)} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
            <Button
              variant="outline"
              onClick={onCancelEditing}
              disabled={saving}
            >
              Annuler
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
