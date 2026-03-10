import './App.css'

const TOOLS = [
  {
    title: 'IR Sender',
    description: 'Send the current time to Sensor Watch Pro via phone screen or flashlight using on-off keying over IR/visible light.',
    href: '/sensor-watch-ir-sender/',
  },
  {
    title: 'Simulator',
    description: 'Run the Sensor Watch firmware in your browser via WebAssembly.',
    href: '/simulator/firmware.html',
  },
]

function App() {
  return (
    <div className="container">
      <header className="site-header">
        <h1>Sensor Watch Tools</h1>
      </header>
      <main className="tool-grid">
        {TOOLS.map(tool => (
          <a key={tool.href} href={tool.href} className="tool-card">
            <h2>{tool.title}</h2>
            <p>{tool.description}</p>
          </a>
        ))}
      </main>
    </div>
  )
}

export default App
