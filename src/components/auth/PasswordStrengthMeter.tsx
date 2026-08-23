import { useDictionary } from "@/hooks/use-dictionary";
import { getPasswordStrength } from "@/utils/passwordStrength";

const BAR_TONE = [
  "bg-error-500",
  "bg-warning-500",
  "bg-info-500",
  "bg-success-500",
] as const;

export function PasswordStrengthMeter({ password }: { password: string }) {
  const dict = useDictionary();
  if (!password) return null;

  const strength = getPasswordStrength(password);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        {BAR_TONE.map((tone, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= strength ? tone : "bg-muted"}`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {dict.validation.password.strength[String(strength) as "0" | "1" | "2" | "3"]}
        {strength < 3 && ` — ${dict.validation.password.strength.hint}`}
      </p>
    </div>
  );
}
