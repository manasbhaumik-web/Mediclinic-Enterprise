import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  role: string;
  details?: Record<string, unknown> | string;
  severity: 'info' | 'warning' | 'critical';
}

export interface TelemetryContextType {
  activeSessionId: string;
  latencyMs: number;
  auditLogs: AuditEvent[];
  logAuditEvent: (action: string, details?: Record<string, unknown> | string, severity?: 'info' | 'warning' | 'critical') => void;
  exportTelemetryJson: (filenamePrefix?: string) => void;
  clearTelemetryLogs: () => void;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const { user, role, fullName } = useAuth();
  const [activeSessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const [latencyMs, setLatencyMs] = useState(12);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);

  // Simulated live latency jitter
  useEffect(() => {
    const interval = setInterval(() => {
      setLatencyMs(Math.floor(10 + Math.random() * 8));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const logAuditEvent = useCallback((
    action: string,
    details?: Record<string, unknown> | string,
    severity: 'info' | 'warning' | 'critical' = 'info'
  ) => {
    const newEvent: AuditEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      actor: fullName || user?.email || 'Authenticated User',
      role: role || 'clinician',
      details,
      severity,
    };
    setAuditLogs((prev) => [newEvent, ...prev.slice(0, 99)]);
  }, [fullName, user, role]);

  const clearTelemetryLogs = useCallback(() => {
    setAuditLogs([]);
  }, []);

  const exportTelemetryJson = useCallback((filenamePrefix = 'mediclinic-clinical-telemetry') => {
    const telemetryPayload = {
      sessionId: activeSessionId,
      exportedAt: new Date().toISOString(),
      user: fullName || user?.email || 'Clinician',
      role: role || 'clinician',
      latencyMs,
      auditLogsCount: auditLogs.length,
      auditLogs,
    };

    const blob = new Blob([JSON.stringify(telemetryPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [activeSessionId, fullName, user, role, latencyMs, auditLogs]);

  const value = useMemo(() => ({
    activeSessionId,
    latencyMs,
    auditLogs,
    logAuditEvent,
    exportTelemetryJson,
    clearTelemetryLogs,
  }), [activeSessionId, latencyMs, auditLogs, logAuditEvent, exportTelemetryJson, clearTelemetryLogs]);

  return (
    <TelemetryContext.Provider value={value}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry(): TelemetryContextType {
  const context = useContext(TelemetryContext);
  if (!context) {
    return {
      activeSessionId: 'session_fallback',
      latencyMs: 12,
      auditLogs: [],
      logAuditEvent: () => {},
      exportTelemetryJson: () => {},
      clearTelemetryLogs: () => {},
    };
  }
  return context;
}
