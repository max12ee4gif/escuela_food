import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPublicBoard } from "@/lib/lunch/api";
import { formatMoney } from "@/lib/utils";
import { ReserveFlow } from "./reserve-flow";
import type { Phase, PublicBoard as Board } from "@/lib/lunch/types";

function phaseCopy(board: Board): { kicker: string; detail: string } {
  const day = board.day;
  if (!day || board.phase === "empty") {
    return {
      kicker: "Sin platillo",
      detail: "Aún no publican el de hoy. Vuelve más tarde.",
    };
  }
  if (board.phase === "cancelled") {
    return {
      kicker: "Hoy no voy",
      detail: day.cancelMessage || "El vendedor canceló el día.",
    };
  }
  if (day.remaining <= 0) {
    return {
      kicker: "Agotado",
      detail: "Se acabaron. Mañana hay otro.",
    };
  }
  if (board.phase === "ended") {
    return {
      kicker: "Ya cerró",
      detail: "El servicio de hoy terminó.",
    };
  }
  if (board.phase === "leftover") {
    return {
      kicker: "Platos libres",
      detail: `Quedan ${day.remaining} platos libres de ${day.dishName}.`,
    };
  }
  const sameDay = day.serviceDate === board.now.ymd;
  return {
    kicker: sameDay ? "Reserva abierta" : `Reserva para el ${day.weekdayLabel}`,
    detail: sameDay
      ? "Hasta las 8:00 AM te lo guardo. Después, lo que sobre."
      : `Hasta las 8:00 AM del ${day.weekdayLabel} te lo guardo.`,
  };
}

function statusTone(phase: Phase, remaining: number) {
  if (phase === "cancelled" || remaining <= 0 || phase === "ended" || phase === "empty") {
    return "bg-sold text-raised";
  }
  if (remaining <= 3) return "bg-chili text-raised";
  return "bg-leaf text-raised";
}

export function PublicBoardView({ initial }: { initial?: Board }) {
  const [reserveOpen, setReserveOpen] = useState(false);
  const query = useQuery({
    queryKey: ["public-board"],
    queryFn: () => getPublicBoard(),
    initialData: initial,
    refetchInterval: 4000,
  });

  const board = query.data;
  if (query.isLoading && !board) {
    return (
      <div className="mx-auto min-h-dvh w-full max-w-md bg-bg">
        <div className="h-[42vh] min-h-[240px] animate-pulse rounded-b-xl bg-line" />
        <div className="px-5 pt-6">
          <div className="h-7 w-32 animate-pulse rounded-full bg-line" />
          <div className="mt-4 h-12 w-3/4 animate-pulse rounded-md bg-line" />
          <div className="mt-3 h-6 w-20 animate-pulse rounded-md bg-line" />
        </div>
      </div>
    );
  }

  const day = board?.day ?? null;
  const remaining = day?.remaining ?? 0;
  const soldOut =
    !day ||
    remaining <= 0 ||
    board?.phase === "cancelled" ||
    board?.phase === "ended" ||
    board?.phase === "empty";
  const copy = board
    ? phaseCopy(board)
    : { kicker: "Cargando", detail: "Buscando el platillo de hoy." };

  const canReserve = Boolean(board && day && !soldOut);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md bg-bg shadow-card">
      {day?.photoUrl ? (
        <div className="relative h-[42vh] min-h-[240px] overflow-hidden rounded-b-xl">
          <img
            src={day.photoUrl}
            alt={day.dishName}
            className="size-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg to-transparent" />
        </div>
      ) : (
        <div className="flex h-[32vh] min-h-[200px] items-end rounded-b-xl bg-line px-6 pb-8">
          <p className="font-display text-3xl text-ink">Hoy Hay</p>
        </div>
      )}

      <div className="px-5 pb-12 pt-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold uppercase tracking-wide ${statusTone(board?.phase ?? "empty", remaining)}`}
          >
            {copy.kicker}
          </span>
          {board?.lastPlates && !soldOut && (
            <span className="text-sm font-semibold text-chili">Últimos platos</span>
          )}
        </div>

        <h1 className="mt-3 font-display text-[2.4rem] leading-[1.05] text-ink">
          {day?.dishName ?? "Nada publicado"}
        </h1>
        <p className="mt-2 text-xl font-semibold tabular-nums text-ink">
          {day ? formatMoney(day.priceCents) : ""}
        </p>
        <p className="mt-2 text-base text-muted">{copy.detail}</p>

        {day && board?.phase !== "empty" && (
          <div className="mt-6 rounded-lg bg-raised px-4 py-4 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {remaining <= 0
                ? "Agotado"
                : board?.phase === "leftover"
                  ? "Libres ahora"
                  : "Quedan"}
            </p>
            <p
              className={`mt-1 font-display text-5xl leading-none tabular-nums ${
                remaining <= 0 ? "text-sold" : remaining <= 3 ? "text-chili" : "text-leaf"
              }`}
            >
              {remaining}
              <span className="ml-2 text-2xl text-muted"> de {day.capacity}</span>
            </p>
          </div>
        )}

        {day?.notes && board?.phase !== "cancelled" && (
          <p className="mt-4 text-sm text-muted">{day.notes}</p>
        )}

        <button
          type="button"
          disabled={!canReserve}
          onClick={() => setReserveOpen(true)}
          className={`mt-6 flex h-14 w-full items-center justify-center rounded-md text-lg font-semibold transition-[transform,background-color] duration-150 active:scale-[0.98] ${
            canReserve ? "bg-chili text-raised hover:bg-chili-press" : "bg-sold text-raised"
          }`}
        >
          {soldOut
            ? remaining <= 0 && day && board?.phase !== "cancelled"
              ? "Agotado"
              : board?.phase === "cancelled"
                ? "Hoy no voy"
                : "Cerrado"
            : "Reservar"}
        </button>

        {board?.history && board.history.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Los otros días
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {board.history.map((item) => (
                <li
                  key={item.serviceDate}
                  className="flex items-baseline justify-between gap-3 border-b border-line py-2 last:border-0"
                >
                  <span className="text-sm text-ink">
                    <span className="capitalize text-muted">{item.weekdayLabel}</span>
                    {" · "}
                    {item.dishName}
                  </span>
                  <span className="text-xs tabular-nums text-muted">{item.sold} vendidos</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {reserveOpen && board && (
        <ReserveFlow
          board={board}
          onClose={() => setReserveOpen(false)}
          onDone={() => {
            void query.refetch();
          }}
        />
      )}
    </div>
  );
}
