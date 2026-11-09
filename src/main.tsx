import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import '@fontsource-variable/figtree';
import '@fontsource/red-hat-display/500.css';
import '@fontsource/red-hat-display/700.css';
import '@fontsource/red-hat-display/800.css';
import './styles.css';
import App from './App';
import { useStore } from './store';

// One shared clock drives match simulation, pricing and settlement.
setInterval(() => useStore.getState().tick(), 1000);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
