export default function StatsPage() {
  const stats = {
    totalShowsLoaded: 0,
    rainsubsRequests: 0,
    tmdbRequests: 0,
    wyzieSubsRequests: 0,
    totalGBLoaded: 0,
    bandwidthUsed: "0 GB",
    lastUpdated: new Date().toISOString(),
  }
  // this isnt working yet.

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
          Vidluna Stats
        </h1>

        {/* JSON Display */}
        <div className="bg-zinc-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-300">JSON Format</h2>
          <pre className="bg-black p-4 rounded text-green-400 text-sm overflow-x-auto">
            {JSON.stringify(stats, null, 2)}
          </pre>
        </div>

        {/* Text Display */}
        <div className="bg-zinc-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-300">Text Format</h2>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between border-b border-zinc-700 pb-2">
              <span className="text-gray-400">Total Shows Loaded:</span>
              <span className="text-white font-semibold">{stats.totalShowsLoaded.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-700 pb-2">
              <span className="text-gray-400">RainSubs Requests:</span>
              <span className="text-white font-semibold">{stats.rainsubsRequests.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-700 pb-2">
              <span className="text-gray-400">TMDB Requests:</span>
              <span className="text-white font-semibold">{stats.tmdbRequests.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-700 pb-2">
              <span className="text-gray-400">Wyzie Subs Requests:</span>
              <span className="text-white font-semibold">{stats.wyzieSubsRequests.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-700 pb-2">
              <span className="text-gray-400">Total GB Loaded:</span>
              <span className="text-white font-semibold">{stats.totalGBLoaded.toLocaleString()} GB</span>
            </div>
            <div className="flex justify-between border-b border-zinc-700 pb-2">
              <span className="text-gray-400">Bandwidth Used:</span>
              <span className="text-white font-semibold">{stats.bandwidthUsed}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-gray-400">Last Updated:</span>
              <span className="text-gray-500 text-xs">{stats.lastUpdated}</span>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>Stats are updated in real-time</p>
        </div>
      </div>
    </div>
  )
}
