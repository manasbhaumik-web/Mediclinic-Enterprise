/**
 * Global Multi-Tenant Branch Switcher Component
 * Provides interactive branch selection, operational LED status indicators,
 * state location badges, and MOH License display across top application headers.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, ShieldCheck, MapPin, Activity } from 'lucide-react';
import { useClinicStore } from '../store/useClinicStore';
import { SUPPORTED_BRANCH_TENANTS, ClinicBranchTenant } from '../lib/multiTenantManager';

export interface BranchSwitcherProps {
  compact?: boolean;
}

export default function BranchSwitcher({ compact = false }: BranchSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeBranchId = useClinicStore(state => state.activeBranchId);
  const activeBranch = useClinicStore(state => state.activeBranch);
  const setActiveBranchId = useClinicStore(state => state.setActiveBranchId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectBranch = (tenantId: string) => {
    setActiveBranchId(tenantId);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-none border transition-all cursor-pointer font-sans shadow-2xs focus-visible:ring-2 focus-visible:ring-[#2dd4bf] focus-visible:outline-none ${
          compact
            ? 'px-2.5 py-1 text-xs bg-white/10 hover:bg-white/20 text-white border-white/30'
            : 'px-3 py-1.5 text-xs bg-white dark:bg-[#082830] text-[#0f3c4c] dark:text-[#5eead4] border-[#99f6e4] dark:border-teal-800 hover:bg-[#e0f5f2]'
        }`}
      >
        <Building2 className={`w-3.5 h-3.5 shrink-0 ${compact ? 'text-teal-200' : 'text-[#0d9488] dark:text-[#2dd4bf]'}`} />
        
        <div className="flex flex-col text-left min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="font-extrabold truncate max-w-[160px] sm:max-w-[220px]">
              {activeBranch.branchName}
            </span>
          </div>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-80 bg-white dark:bg-[#06242c] border-2 border-[#99f6e4] dark:border-teal-800 rounded-none shadow-2xl z-50 animate-fadeIn font-sans text-xs">
          
          {/* Header Banner */}
          <div className="bg-[#d5f0eb] dark:bg-[#082830] p-3 border-b border-[#99f6e4] dark:border-teal-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#0f3c4c] dark:text-[#5eead4] font-black uppercase tracking-wider text-[10px]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0d9488]" />
              <span>Multi-Branch Tenant Selector</span>
            </div>
            <span className="bg-[#0d9488] text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-none uppercase">
              {SUPPORTED_BRANCH_TENANTS.length} Branches Active
            </span>
          </div>

          {/* Branch List */}
          <div className="p-1 space-y-1 max-h-72 overflow-y-auto custom-scrollbar">
            {SUPPORTED_BRANCH_TENANTS.map((branch) => {
              const isSelected = branch.tenantId === activeBranchId;
              return (
                <button
                  key={branch.tenantId}
                  type="button"
                  onClick={() => handleSelectBranch(branch.tenantId)}
                  className={`w-full text-left p-2.5 rounded-none border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-xs font-bold'
                      : 'bg-white dark:bg-[#082830] text-[#0f3c4c] dark:text-slate-200 border-[#99f6e4] dark:border-teal-800 hover:bg-[#e0f5f2] dark:hover:bg-[#0e4857]'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${branch.activeStatus === 'OPERATIONAL' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                      <strong className="block text-xs font-black truncate">{branch.branchName}</strong>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] opacity-90 font-mono">
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />
                        {branch.stateLocation}
                      </span>
                      <span>·</span>
                      <span>{branch.licenseMohNumber}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="shrink-0 bg-white text-[#0d9488] p-1 rounded-none font-bold">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="p-2.5 bg-[#f0fdfa] dark:bg-[#082830] border-t border-[#99f6e4] dark:border-teal-800 text-[10px] text-slate-600 dark:text-slate-400 font-mono flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#0d9488]" />
              Data isolated per branch tenant
            </span>
            <span className="font-bold text-[#0d9488]">MOH Act 586</span>
          </div>

        </div>
      )}
    </div>
  );
}
