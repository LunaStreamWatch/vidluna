import PlayerPage from "@/components/PlayerPage";

type Params = { params: { type: string; id: string } };

export default function EmbedBase({ params }: Params) {
  return <PlayerPage type={params.type} id={params.id} />;
}
