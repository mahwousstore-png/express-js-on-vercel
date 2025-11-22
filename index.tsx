import React from 'react';
import ReactDOM from 'react-dom/client';
import AppWrapper from './App';

// Firebase is initialized in firebase.ts, no need to do it here.

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
