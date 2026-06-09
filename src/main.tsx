import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { InventoryProvider } from './context/InventoryContext.tsx';
import { FinancialProvider } from './context/FinancialContext.tsx';
import { SettingsProvider } from './context/SettingsContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <InventoryProvider>
      <FinancialProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </FinancialProvider>
    </InventoryProvider>
  </StrictMode>,
);
