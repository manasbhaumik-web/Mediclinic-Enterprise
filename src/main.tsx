import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import { queryClient } from './lib/queryClient';
import { InventoryProvider } from './context/InventoryContext.tsx';
import { FinancialProvider } from './context/FinancialContext.tsx';
import { SettingsProvider } from './context/SettingsContext.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { AuxiliaryProvider } from './context/AuxiliaryContext.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
// Styles: src/index.css is linked once from index.html (<head>) so it applies before any JS runs.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <InventoryProvider>
              <FinancialProvider>
                <SettingsProvider>
                  <AuxiliaryProvider>
                    <App />
                  </AuxiliaryProvider>
                </SettingsProvider>
              </FinancialProvider>
            </InventoryProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
