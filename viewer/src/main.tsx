import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import '@seoul-dengoku/shared-web-ui/styles.css'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/gdd">
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
