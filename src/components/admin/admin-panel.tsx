import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  cancelDay,
  closeDay,
  getAdminBoard,
  loginAdmin,
  logoutAdmin,
  publishDay,
  reminderPreview,
  saveConfig,
  updateReservation,
} from "@/lib/lunch/api";
import { compressImage } from "@/lib/compress-image";
import { DISH_PRESETS } from "@/lib/lunch/presets";
import { DishCasillas } from "@/components/admin/dish-casillas";
import { nextServiceDate, readClock } from "@/lib/lunch/time";
import { formatMoney } from "@/lib/utils";
import type {
  AdminBoard,
  AdminReservation,
  DeliveryStatus,
  PaymentStatus,
} from "@/lib/lunch/types";

type Tab = "hoy" | "historial" | "config";

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
