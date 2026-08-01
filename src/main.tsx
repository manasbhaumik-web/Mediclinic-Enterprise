import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { InventoryProvider } from './context/InventoryContext.tsx';
import { FinancialProvider } from './context/FinancialContext.tsx';
import { SettingsProvider } from './context/SettingsContext.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <InventoryProvider>
        <FinancialProvider>
          <SettingsProvider>
            <App />
          </SettingsProvider>
        </FinancialProvider>
      </InventoryProvider>
    </AuthProvider>
  </StrictMode>,
);
