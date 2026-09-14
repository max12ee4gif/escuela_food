import { createFileRoute } from "@tanstack/react-router";
import { PublicBoardView } from "@/components/home/public-board";
import { getPublicBoard } from "@/lib/lunch/api";

export const Route = createFileRoute("/")({
  loader: () => getPublicBoard(),
  component: Home,
});

function Home() {
  const initial = Route.useLoaderData();
  return <PublicBoardView initial={initial} />;
}
