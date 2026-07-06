import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@trimble-oss/moduswebcomponents/modus-wc-styles.css'
import '@trimble-oss/moduswebcomponents/modus-icons.css'
import { defineCustomElements } from '@trimble-oss/moduswebcomponents/loader'

import './index.css'
import App from './App.tsx'

// Register the Modus custom elements so the web components become interactive.
defineCustomElements()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
