import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'katex/dist/katex.min.css'
import './styles/fonts.css'
import './styles/theme.css'
import './styles/global.css'
import './styles/prose.css'
import App from './App'
import { theme } from './site.config'
import { applyTheme } from './styles/themes'

applyTheme(theme)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
