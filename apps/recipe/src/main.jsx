import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import PageError from './components/PageError.jsx';
import './index.css';
import { interaction } from './components/shared/styles.js';

// The focus ring's colour for index.css, from the one colour source (BA2).
for (const [name, value] of Object.entries(interaction)) document.documentElement.style.setProperty(name, value);

// An error anywhere outside the tabs, or in the figures App works out before
// drawing, shows a message in place of the whole page (EO-S1).
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PageError whole>
      <App />
    </PageError>
  </StrictMode>,
);
