import React, { createContext, useContext, useMemo, useState, useEffect, ReactNode } from 'react';
import { WebsiteCMSConfig, DEFAULT_WEBSITE_CONFIG } from '../domain/websiteCms';
import { useSettings } from './SettingsContext';

export interface TenantContextType {
  tenantSlug: string;
  isMultiTenantUrl: boolean;
  websiteConfig: WebsiteCMSConfig;
  updateTenantWebsiteConfig: (newConfig: WebsiteCMSConfig) => void;
  getTenantPath: (path: string) => string;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { settings, updateWebsiteConfig } = useSettings();

  // Resolve tenant slug from URL
  const { tenantSlug, isMultiTenantUrl } = useMemo(() => {
    if (typeof window === 'undefined') {
      return { tenantSlug: 'default', isMultiTenantUrl: false };
    }

    // 1. Path-based resolution: /c/:tenantSlug
    const pathname = window.location.pathname;
    if (pathname.startsWith('/c/')) {
      const parts = pathname.split('/');
      const slug = parts[2];
      if (slug) {
        return { tenantSlug: slug, isMultiTenantUrl: true };
      }
    }

    // 2. Subdomain-based resolution: e.g. "klinikutama.mediclinic.com"
    const host = window.location.hostname;
    const parts = host.split('.');
    if (parts.length > 2) {
      const sub = parts[0].toLowerCase();
      if (sub !== 'app' && sub !== 'www' && sub !== 'admin' && sub !== 'localhost') {
        return { tenantSlug: sub, isMultiTenantUrl: true };
      }
    }

    return { tenantSlug: settings.websiteConfig?.tenantSlug || 'default', isMultiTenantUrl: false };
  }, [settings.websiteConfig?.tenantSlug]);

  // Merge tenant config with settings
  const websiteConfig: WebsiteCMSConfig = useMemo(() => {
    return settings.websiteConfig || DEFAULT_WEBSITE_CONFIG;
  }, [settings.websiteConfig]);

  const updateTenantWebsiteConfig = (newConfig: WebsiteCMSConfig) => {
    updateWebsiteConfig(newConfig);
  };

  /**
   * Helper to construct tenant-aware URLs for public pages
   */
  const getTenantPath = (path: string): string => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    if (isMultiTenantUrl && tenantSlug !== 'default') {
      return `/c/${tenantSlug}${cleanPath === '/' ? '' : cleanPath}`;
    }
    return cleanPath;
  };

  return (
    <TenantContext.Provider
      value={{
        tenantSlug,
        isMultiTenantUrl,
        websiteConfig,
        updateTenantWebsiteConfig,
        getTenantPath,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
