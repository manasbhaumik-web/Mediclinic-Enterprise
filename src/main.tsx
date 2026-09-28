import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { InventoryProvider } from './context/InventoryContext.tsx';
import { FinancialProvider } from './context/FinancialContext.tsx';
import { SettingsProvider } from './context/SettingsContext.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
// Styles: src/index.css is linked once from index.html (<head>) so it applies before any JS runs.

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
