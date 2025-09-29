export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Vidluna Embed Documentation</h1>
          <p className="text-xl text-muted-foreground">
            Complete guide to embedding and customizing the Vidluna video player
          </p>
        </div>

        <div className="space-y-12">
          {/* Quick Start */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Quick Start</h2>
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Basic Embed Code</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                <code>{`<iframe 
  src="https://your-domain.com/embed/movie/550" 
  width="100%" 
  height="500"
  frameborder="0"
  allowfullscreen>
</iframe>`}</code>
              </pre>
            </div>
          </section>

          {/* URL Structure */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">URL Structure</h2>
            <div className="grid gap-6">
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Movies</h3>
                <code className="bg-muted px-3 py-2 rounded text-sm">/embed/movie/{"{tmdb_id}"}</code>
                <p className="text-sm text-muted-foreground mt-2">
                  Example: <code>/embed/movie/550</code> (Fight Club)
                </p>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">TV Shows</h3>
                <code className="bg-muted px-3 py-2 rounded text-sm">
                  /embed/tv/{"{tmdb_id}"}/{"{season}"}/{"{episode}"}
                </code>
                <p className="text-sm text-muted-foreground mt-2">
                  Example: <code>/embed/tv/1434/22/9</code> (Family Guy S22E9)
                </p>
              </div>
            </div>
          </section>

          {/* Parameters */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">URL Parameters</h2>
            <div className="bg-card border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-4 font-medium">Parameter</th>
                    <th className="text-left p-4 font-medium">Description</th>
                    <th className="text-left p-4 font-medium">Example</th>
                    <th className="text-left p-4 font-medium">Default</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-4">
                      <code>color</code>
                    </td>
                    <td className="p-4">Accent color (hex without #)</td>
                    <td className="p-4">
                      <code>?color=ff6b6b</code>
                    </td>
                    <td className="p-4">
                      <code>ef4444</code>
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-4">
                      <code>autoplay</code>
                    </td>
                    <td className="p-4">Auto-start playback</td>
                    <td className="p-4">
                      <code>?autoplay=true</code>
                    </td>
                    <td className="p-4">
                      <code>false</code>
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-4">
                      <code>server</code>
                    </td>
                    <td className="p-4">Preferred server</td>
                    <td className="p-4">
                      <code>?server=vienna</code>
                    </td>
                    <td className="p-4">
                      <code>veronica</code>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Examples */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Examples</h2>
            <div className="space-y-6">
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Movie with Custom Theme</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`<iframe 
  src="/embed/movie/550?color=dc2626" 
  width="100%" 
  height="500"
  frameborder="0"
  allowfullscreen>
</iframe>`}</code>
                </pre>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Responsive TV Show Embed</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`<div style="position: relative; padding-bottom: 56.25%; height: 0;">
  <iframe 
    src="/embed/tv/1434/1/1?color=3b82f6&autoplay=true" 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
    frameborder="0"
    allowfullscreen>
  </iframe>
</div>`}</code>
                </pre>
              </div>
            </div>
          </section>

          {/* Features */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-3">🎬 HLS Streaming</h3>
                <p className="text-sm text-muted-foreground">
                  Adaptive bitrate streaming with automatic quality adjustment
                </p>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-3">🌍 Multiple Servers</h3>
                <p className="text-sm text-muted-foreground">
                  Veronica (US) and Vienna (Austria) with automatic failover
                </p>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-3">📝 Subtitles</h3>
                <p className="text-sm text-muted-foreground">Multi-language subtitles from Wyzie and Rainsubs APIs</p>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-3">🎨 Custom Theming</h3>
                <p className="text-sm text-muted-foreground">URL-based color customization for brand matching</p>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-3">⌨️ Keyboard Controls</h3>
                <p className="text-sm text-muted-foreground">Full keyboard navigation with standard shortcuts</p>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-3">📱 Responsive</h3>
                <p className="text-sm text-muted-foreground">Works seamlessly on desktop and mobile devices</p>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Keyboard Shortcuts</h2>
            <div className="bg-card border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-4 font-medium">Key</th>
                    <th className="text-left p-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Space / K", "Play/Pause"],
                    ["F", "Toggle Fullscreen"],
                    ["M", "Toggle Mute"],
                    ["← →", "Seek backward/forward 10s"],
                    ["↑ ↓", "Volume up/down"],
                  ].map(([key, action], index) => (
                    <tr key={index} className="border-t">
                      <td className="p-4">
                        <code className="bg-muted px-2 py-1 rounded text-sm">{key}</code>
                      </td>
                      <td className="p-4">{action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* JavaScript Integration */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">JavaScript Integration</h2>
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Dynamic Player Creation</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                <code>{`function createPlayer(containerId, type, id, season, episode, options = {}) {
  const container = document.getElementById(containerId);
  const params = new URLSearchParams();
  
  if (options.color) params.set('color', options.color);
  if (options.autoplay) params.set('autoplay', 'true');
  if (options.server) params.set('server', options.server);
  
  const url = season && episode 
    ? \`/embed/\${type}/\${id}/\${season}/\${episode}?\${params}\`
    : \`/embed/\${type}/\${id}?\${params}\`;
    
  container.innerHTML = \`
    <iframe 
      src="\${url}" 
      width="100%" 
      height="500"
      frameborder="0"
      allowfullscreen>
    </iframe>
  \`;
}

// Usage
createPlayer('player-container', 'movie', '550', null, null, {
  color: 'ef4444',
  autoplay: true
});`}</code>
              </pre>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
