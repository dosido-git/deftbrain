import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { track } from './utils/analytics'; // owned, anonymous usage beacons — installs global page_view/print tracking

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Real-visitor load times → the metrics report's "Load times" table.
reportWebVitals(m => track('web_vital', { name: m.name, value: m.value }));
