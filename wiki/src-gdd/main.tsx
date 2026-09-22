import { renderMermaid } from "../src/mermaid-lazy.js";
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/gdd">
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

void renderMermaid;
