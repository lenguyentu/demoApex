import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppQueryProvider } from "./lib/react-query";
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppQueryProvider>
      <App />
    </AppQueryProvider>
  </StrictMode>,
)
