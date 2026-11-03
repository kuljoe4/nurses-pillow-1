import {StrictMode} from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AvailabilityProvider } from './context/AvailabilityContext';

// Handle Vite dynamic import failures (usually due to deploying a new version and older clients requesting stale chunks).
// This auto-reloads the page to fetch the new `index.html` with correct chunk hashes.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <APIProvider apiKey={(import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || ''}
      solutionChannel="GMP_devsite_samples_v3_rgmautocomplete"
      onError={(error) => console.error('Failed to load Google Maps API.', error)}
    >
      <AvailabilityProvider>
        <App />
      </AvailabilityProvider>
    </APIProvider>
  </StrictMode>,
);
