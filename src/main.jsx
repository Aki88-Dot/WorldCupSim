import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import WC2026 from './WC2026Simulator.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WC2026 />
  </StrictMode>
);
