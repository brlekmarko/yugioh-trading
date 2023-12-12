import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import "primereact/resources/themes/lara-light-indigo/theme.css";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
export const prefix = "/ui";

root.render(
  <React.StrictMode>
    <BrowserRouter basename={prefix}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

