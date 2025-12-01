import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Production: Silence console output for white-label deployment
if (import.meta.env.PROD) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}

createRoot(document.getElementById("root")!).render(<App />);
