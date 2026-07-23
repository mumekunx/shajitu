import { useEffect } from 'react';
import AppLayout from './components/Layout/AppLayout';
import { startEngine, stopEngine } from './engine/simulationEngine';

function App() {
  useEffect(() => {
    startEngine();
    return () => stopEngine();
  }, []);

  return <AppLayout />;
}

export default App;
