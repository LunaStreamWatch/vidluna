import PlayerPage from "@/components/PlayerPage";

type Params = { params: { type: string; id: string; season: string; episode: string } };

export default function EmbedEpisode({ params }: Params) {
  return (
    <PlayerPage
      type={params.type}
      id={params.id}
      season={params.season}
      episode={params.episode}
    />
  );
}
