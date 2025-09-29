import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white overflow-y-auto">
      <div className="container mx-auto px-4 py-8 max-w-5xl pb-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-3 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
            Vidluna
          </h1>
          <p className="text-gray-400 text-lg mb-6">
            Professional video player with HLS streaming, multi-server support, and advanced subtitle features
          </p>
          <Link
            href="/embed/movie/550?color=ef4444"
            className="inline-block px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg transition-colors font-medium"
          >
            Try Demo →
          </Link>
        </div>

        {/* Quick Start */}
        <div className="bg-zinc-900 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-red-400">Movies</h3>
              <code className="block bg-black p-3 rounded text-sm text-green-400">
                vidluna.fun/embed/movie/{"{tmdb_id}"}
              </code>
              <p className="text-gray-400 text-sm mt-2">Example: /embed/movie/550</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-red-400">TV Shows</h3>
              <code className="block bg-black p-3 rounded text-sm text-green-400">
                vidluna.fun/embed/tv/{"{tmdb_id}"}/{"{season}"}/{"{episode}"}
              </code>
              <p className="text-gray-400 text-sm mt-2">Example: /embed/tv/1399/1/1</p>
            </div>
          </div>
        </div>

        {/* URL Parameters */}
        <div className="bg-zinc-900 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">URL Parameters</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="text-left py-2 px-3 font-semibold">Parameter</th>
                  <th className="text-left py-2 px-3 font-semibold">Type</th>
                  <th className="text-left py-2 px-3 font-semibold">Description</th>
                  <th className="text-left py-2 px-3 font-semibold">Default</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-zinc-800">
                  <td className="py-2 px-3">
                    <code className="text-red-400">color</code>
                  </td>
                  <td className="py-2 px-3">string</td>
                  <td className="py-2 px-3">Accent color (hex without #)</td>
                  <td className="py-2 px-3">
                    <code>fbc9ff</code>
                  </td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="py-2 px-3">
                    <code className="text-red-400">autoplay</code>
                  </td>
                  <td className="py-2 px-3">boolean</td>
                  <td className="py-2 px-3">Auto-start playback</td>
                  <td className="py-2 px-3">
                    <code>false</code>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3">
                    <code className="text-red-400">muted</code>
                  </td>
                  <td className="py-2 px-3">boolean</td>
                  <td className="py-2 px-3">Start muted</td>
                  <td className="py-2 px-3">
                    <code>false</code>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 bg-zinc-800 p-3 rounded">
            <p className="text-sm text-gray-400 mb-2">Example with multiple parameters:</p>
            <code className="text-green-400 text-xs">
              vidluna.fun/embed/movie/550?color=fbc9ff&autoplay=true&muted=false
            </code>
          </div>
        </div>

        {/* Embedding */}
        <div className="bg-zinc-900 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Embedding</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Basic Embed</h3>
              <pre className="bg-black p-4 rounded text-xs text-green-400 overflow-x-auto">
                {`<iframe 
  src="https://vidluna.fun/embed/movie/550" 
  width="100%" 
  height="500"
  frameborder="0"
  allowfullscreen
  allow="autoplay; fullscreen">
</iframe>`}
              </pre>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Responsive (16:9)</h3>
              <pre className="bg-black p-4 rounded text-xs text-green-400 overflow-x-auto">
                {`<div style="position: relative; padding-bottom: 56.25%; height: 0;">
  <iframe 
    src="https://vidluna.fun/embed/movie/550" 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
    frameborder="0"
    allowfullscreen
    allow="autoplay; fullscreen">
  </iframe>
</div>`}
              </pre>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-zinc-900 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Features</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-red-400 mb-2">Streaming</h3>
              <ul className="text-gray-400 space-y-1">
                <li>• HLS adaptive streaming</li>
                <li>• Multi-server support (US & Austria)</li>
                <li>• Automatic failover</li>
                <li>• Buffer optimization</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-red-400 mb-2">Subtitles</h3>
              <ul className="text-gray-400 space-y-1">
                <li>• Multi-language support</li>
                <li>• RainSubs integration (rainbow colors)</li>
                <li>• Custom fonts & colors</li>
                <li>• Timing adjustment</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-red-400 mb-2">Controls</h3>
              <ul className="text-gray-400 space-y-1">
                <li>• Keyboard shortcuts</li>
                <li>• Playback speed control</li>
                <li>• Volume control</li>
                <li>• Fullscreen support</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-red-400 mb-2">Customization</h3>
              <ul className="text-gray-400 space-y-1">
                <li>• Custom accent colors</li>
                <li>• Autoplay options</li>
                <li>• Responsive design</li>
                <li>• URL-based configuration</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="bg-zinc-900 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Keyboard Shortcuts</h2>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            {[
              ["Space / K", "Play/Pause"],
              ["F", "Fullscreen"],
              ["M", "Mute"],
              ["← →", "Seek ±10s"],
              ["↑ ↓", "Volume ±10%"],
              ["Esc", "Exit fullscreen"],
            ].map(([key, action]) => (
              <div key={key} className="flex justify-between items-center bg-zinc-800 p-3 rounded">
                <code className="text-red-400 font-mono">{key}</code>
                <span className="text-gray-400">{action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* API Integration */}
        <div className="bg-zinc-900 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">API Integration</h2>
          <div>
            <h3 className="text-lg font-semibold mb-2">RainSubs API</h3>
            <p className="text-gray-400 text-sm mb-3">
              Rainbow-colored subtitles fetched automatically based on TMDB ID
            </p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500 mb-1">Movies:</p>
                <code className="block bg-black p-2 rounded text-xs text-green-400">
                  rainsubs.vercel.app/api/subtitles?tmdbId=286217
                </code>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">TV Shows:</p>
                <code className="block bg-black p-2 rounded text-xs text-green-400">
                  rainsubs.vercel.app/api/subtitles?tmdbId=1399&season=1&episode=1
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>Vidluna • Professional Video Embedding Platform</p>
        </div>
      </div>
    </div>
  )
}
