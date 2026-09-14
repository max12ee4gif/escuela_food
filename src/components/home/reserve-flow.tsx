import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmReserve, startReserve } from "@/lib/lunch/api";
import { formatMoney } from "@/lib/utils";
import type { PaymentMethod, PublicBoard } from "@/lib/lunch/types";

type Step = "form" | "code" | "done";

export function ReserveFlow({
  board,
  onClose,
  onDone,
}: {
  board: PublicBoard;
  onClose: () => void;
  onDone: () => void;
}) {
  const day = board.day;
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState<number | null>(null);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmedQty, setConfirmedQty] = useState(1);

  if (!day) return null;

  const maxQty = Math.min(board.maxPerPerson, Math.max(1, day.remaining));

  async function sendCode() {
    setBusy(true);
    try {
      const result = await startReserve({
        data: { name, phone, quantity, paymentMethod },
      });
      setChallengeId(result.challengeId);
      setDemoCode(result.demoCode);
      setStep("code");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo enviar el código.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (challengeId == null) return;
    setBusy(true);
    try {
      const result = await confirmReserve({
        data: { challengeId, code },
      });
      setConfirmedQty(result.quantity);
      setStep("done");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo confirmar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-ink/40">
      <div className="flex h-full w-full max-w-md flex-col bg-bg">
        <header className="flex items-center gap-3 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={step === "done" ? onClose : onClose}
            className="flex size-11 items-center justify-center rounded-md text-ink hover:bg-line/70"
            aria-label="Cerrar"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {step === "done" ? "Listo" : "Reservar"}
            </p>
            <p className="font-display text-lg leading-tight text-ink">{day.dishName}</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {step === "form" && (
            <form
              className="flex flex-col gap-5"
              onSubmit={(e) => {
                e.preventDefault();
                void sendCode();
              }}
            >
              <p className="text-sm text-muted">
                {formatMoney(day.priceCents)} por plato · máximo {board.maxPerPerson} por
                número
              </p>

              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Tu nombre</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  autoCapitalize="words"
                  placeholder="Nombre y apellido"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Celular</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(210) 555-0142"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <p className="text-xs text-muted">
                  Te mandamos un código. El número queda para recordatorios y si no llegas.
                </p>
              </div>

              <fieldset className="flex flex-col gap-2">
                <Label>Cuántos</Label>
                <div className="flex gap-2">
                  {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setQuantity(n)}
                      className={`h-12 flex-1 rounded-md border text-base font-semibold tabular-nums transition-colors ${
                        quantity === n
                          ? "border-ink bg-ink text-raised"
                          : "border-line bg-raised text-ink"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="flex flex-col gap-2">
                <Label>Cómo piensas pagar</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`h-12 rounded-md border text-sm font-semibold ${
                      paymentMethod === "cash"
                        ? "border-ink bg-ink text-raised"
                        : "border-line bg-raised text-ink"
                    }`}
                  >
                    Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("online")}
                    className={`h-12 rounded-md border text-sm font-semibold ${
                      paymentMethod === "online"
                        ? "border-ink bg-ink text-raised"
                        : "border-line bg-raised text-ink"
                    }`}
                  >
                    En línea
                  </button>
                </div>
                {paymentMethod === "online" && (
                  <p className="text-xs text-muted">
                    El pago en línea se marca en caja. Stripe queda pendiente de conectar.
                  </p>
                )}
              </fieldset>

              <Button type="submit" size="lg" className="mt-2 w-full" disabled={busy}>
                {busy ? "Enviando…" : "Enviar código"}
              </Button>
            </form>
          )}

          {step === "code" && (
            <form
              className="flex flex-col gap-5"
              onSubmit={(e) => {
                e.preventDefault();
                void confirm();
              }}
            >
              <p className="text-base text-ink">
                Escribe el código que te mandamos al {phone}.
              </p>
              {demoCode && (
                <div className="rounded-lg border border-warn/30 bg-warn-soft px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-warn">
                    Modo demo · SMS sin Twilio
                  </p>
                  <p className="mt-1 font-display text-3xl tabular-nums tracking-[0.3em] text-ink">
                    {demoCode}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Cuando conectes Twilio, el código llega de verdad al celular.
                  </p>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  className="text-center font-display text-2xl tracking-[0.4em] tabular-nums"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={busy || code.length < 4}>
                {busy ? "Confirmando…" : "Confirmar reserva"}
              </Button>
              <button
                type="button"
                className="text-sm text-muted underline-offset-2 hover:underline"
                onClick={() => {
                  setStep("form");
                  setCode("");
                }}
              >
                Usar otro número
              </button>
            </form>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center gap-4 pt-10 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-leaf-soft text-leaf">
                <Check className="size-8" strokeWidth={2.4} />
              </div>
              <h2 className="font-display text-3xl text-ink">Te lo guardo</h2>
              <p className="max-w-xs text-base text-muted">
                {confirmedQty === 1 ? "1 plato" : `${confirmedQty} platos`} de {day.dishName}.
                Trae {paymentMethod === "cash" ? "efectivo" : "el pago listo"}.
              </p>
              <Button size="lg" className="mt-4 w-full" onClick={onClose}>
                Listo
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
