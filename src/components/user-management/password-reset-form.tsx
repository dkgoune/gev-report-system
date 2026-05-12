import { Button } from "@/components/ui/button";

type PasswordResetFormProps = {
  userFullName: string;
  newPassword: string;
  confirmPassword: string;
  resetError: string | null;
  resetting: boolean;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export function PasswordResetForm({
  userFullName,
  newPassword,
  confirmPassword,
  resetError,
  resetting,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onConfirm,
  onCancel,
}: PasswordResetFormProps) {
  return (
    <div className="mt-3 space-y-2 border border-amber-200 bg-amber-50 p-3">
      <p className="text-sm font-medium text-amber-800">
        Réinitialisation du mot de passe — {userFullName}
      </p>

      {resetError ? <p className="text-xs text-red-600">{resetError}</p> : null}

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Nouveau mot de passe</span>
        <input
          type="password"
          value={newPassword}
          onChange={event => onNewPasswordChange(event.target.value)}
          className="w-full border border-slate-300 px-3 py-2"
          minLength={6}
          autoFocus
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">
          Confirmer le mot de passe
        </span>
        <input
          type="password"
          value={confirmPassword}
          onChange={event => onConfirmPasswordChange(event.target.value)}
          className="w-full border border-slate-300 px-3 py-2"
          minLength={6}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void onConfirm()} disabled={resetting}>
          {resetting ? "Réinitialisation..." : "Confirmer"}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={resetting}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
