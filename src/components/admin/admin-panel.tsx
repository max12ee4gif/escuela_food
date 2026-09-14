import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAdminBoard, loginAdmin, logoutAdmin } from "@/lib/lunch/api";
import type { AdminBoard } from "@/lib/lunch/types";
import { PublishCard } from "./admin-publish";
import { MoneyStrip, ReservationList, DayActions } from "./admin-ops";
import { HistoryTab, ConfigTab } from "./admin-meta";
import { DebtsTab } from "./admin-debts";

type Tab = "hoy" | "deudas" | "historial" | "config";

export function AdminPanel({ initial }: { initial?: AdminBoard }) {
  const query = useQuery({
    queryKey: ["admin-board"],
    queryFn: () => getAdminBoard(),
    initialData: initial,
    refetchInterval: (q) => (q.state.data?.authenticated ? 4000 : false),
  });
  const board = query.data;

  if (!board) {
    return (
      <Shell>
        <p className="p-6 text-muted">Cargando panel…</p>
      </Shell>
    );
  }

  if (!board.authenticated) {
    return (
      <Shell>
        <LoginForm onOk={() => void query.refetch()} />
      </Shell>
    );
  }

  return (
    <Shell>
      <SignedIn board={board} onRefresh={() => void query.refetch()} />
    </Shell>
  );
}

function Shell({ children }: { children: import("react").ReactNode }) {
  return <div className="mx-auto min-h-dvh w-full max-w-lg bg-bg shadow-card">{children}</div>;
}

function LoginForm({ onOk }: { onOk: () => void }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="flex flex-col gap-4 px-5 pb-10 pt-12"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await loginAdmin({ data: { username, password } });
          onOk();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "No se pudo entrar.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Panel</p>
      <h1 className="font-display text-4xl text-ink">Hoy Hay</h1>
      <p className="text-sm text-muted">Solo el vendedor. La home no enlaza aquí.</p>
      <div className="mt-4 flex flex-col gap-2">
        <Label htmlFor="user">Usuario</Label>
        <Input id="user" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="pass">Contraseña</Label>
        <Input id="pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" size="lg" disabled={busy}>
        {busy ? "Entrando…" : "Entrar"}
      </Button>
      <p className="text-xs text-muted">Demo: admin / plato10. 2FA por SMS queda pendiente.</p>
    </form>
  );
}

function SignedIn({ board, onRefresh }: { board: AdminBoard; onRefresh: () => void }) {
  const [tab, setTab] = useState<Tab>("hoy");
  const tabs = [
    ["hoy", "Hoy"],
    ["deudas", "Deudas"],
    ["historial", "Historial"],
    ["config", "Config"],
  ] as const;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-end justify-between gap-3 px-5 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Vendedor</p>
          <h1 className="font-display text-3xl text-ink">Panel</h1>
        </div>
        <button
          type="button"
          className="h-11 text-sm font-medium text-muted"
          onClick={async () => {
            await logoutAdmin();
            onRefresh();
          }}
        >
          Salir
        </button>
      </header>
      <nav className="mx-5 grid grid-cols-4 rounded-md bg-line/70 p-1">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`h-10 rounded-sm text-[13px] font-semibold ${
              tab === id ? "bg-raised text-ink shadow-card" : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="flex-1 px-5 py-5">
        {tab === "hoy" && <HoyTab board={board} onRefresh={onRefresh} />}
        {tab === "deudas" && <DebtsTab />}
        {tab === "historial" && <HistoryTab board={board} />}
        {tab === "config" && <ConfigTab board={board} onRefresh={onRefresh} />}
      </div>
    </div>
  );
}

function HoyTab({ board, onRefresh }: { board: AdminBoard; onRefresh: () => void }) {
  return (
    <div className="flex flex-col gap-8 pb-16">
      <PublishCard board={board} onRefresh={onRefresh} />
      {board.day && <MoneyStrip day={board.day} phase={board.phase} />}
      {board.day && <ReservationList board={board} onRefresh={onRefresh} />}
      {board.day && <DayActions onRefresh={onRefresh} />}
    </div>
  );
}
