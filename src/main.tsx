// src/main.tsx - Versión Final Limpia
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Importar funciones de verificación (solo para consola)
import './utils/consoleVerification';

// Verificar que tenemos un elemento root
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Make sure you have <div id="root"></div> in your HTML.');
}

// Crear la aplicación React
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)