import { useEffect } from 'react'

function App() {
  useEffect(() => {
    window.location.replace('/sensor-watch-ir-sender/')
  }, [])

  return null
}

export default App
