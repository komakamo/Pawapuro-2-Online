import React from 'react';
import ReactDOM from 'react-dom/client';
import PennantGame from './PennantGame';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <PennantGame />
  </React.StrictMode>,
);
