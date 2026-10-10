import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { interaction } from './components/shared/styles.js';

// The focus ring's colour for index.css, from the one colour source (BA2).
for (const [name, value] of Object.entries(interaction)) document.documentElement.style.setProperty(name, value);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
