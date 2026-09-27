/**
 * TanStack Query Client Configuration
 * Phase P2 Performance Optimization: Intelligent caching, stale time controls,
 * and optimistic server state sync for Mediclinic Enterprise.
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes stale time for clinical cached data
      gcTime: 15 * 60 * 1000, // 15 minutes garbage collection time
      refetchOnWindowFocus: false, // Prevent jarring refetches during active consultation typing
      retry: 2,
    },
    mutations: {
      retry: 1,
    }
  }
});
