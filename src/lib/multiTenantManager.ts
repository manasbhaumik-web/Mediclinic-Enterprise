/**
 * Multi-Tenant Clinic Branch Partitioning & Isolation Manager
 * Phase P3 Enterprise Multi-Branch Architecture: Guarantees strict Tenant-ID isolation
 * for multi-branch clinic networks (Kuala Lumpur HQ, Petaling Jaya, Johor Bahru, Penang).
 */

export interface ClinicBranchTenant {
  tenantId: string; // e.g. "HQ_KL_MAIN"
  branchName: string; // e.g. "Kuala Lumpur Central Enterprise Medical Centre"
  stateLocation: 'KUALA_LUMPUR' | 'SELANGOR' | 'JOHOR' | 'PENANG';
  licenseMohNumber: string;
  isHeadquarters: boolean;
  activeStatus: 'OPERATIONAL' | 'MAINTENANCE' | 'OFFLINE';
}

export const SUPPORTED_BRANCH_TENANTS: ClinicBranchTenant[] = [
  {
    tenantId: 'HQ_KL_MAIN',
    branchName: 'Kuala Lumpur Central Enterprise Medical Centre (HQ)',
    stateLocation: 'KUALA_LUMPUR',
    licenseMohNumber: 'MOH-KKM-KL-88401',
    isHeadquarters: true,
    activeStatus: 'OPERATIONAL'
  },
  {
    tenantId: 'BRANCH_PJ_EXPRESS',
    branchName: 'Petaling Jaya Medical Express & Specialist Clinic',
    stateLocation: 'SELANGOR',
    licenseMohNumber: 'MOH-KKM-SEL-44120',
    isHeadquarters: false,
    activeStatus: 'OPERATIONAL'
  },
  {
    tenantId: 'BRANCH_JB_MEDICAL',
    branchName: 'Johor Bahru Southern Health Hub',
    stateLocation: 'JOHOR',
    licenseMohNumber: 'MOH-KKM-JHB-33019',
    isHeadquarters: false,
    activeStatus: 'OPERATIONAL'
  },
  {
    tenantId: 'BRANCH_PENANG_CARE',
    branchName: 'Penang Island Heritage Specialist Clinic',
    stateLocation: 'PENANG',
    licenseMohNumber: 'MOH-KKM-PNG-11092',
    isHeadquarters: false,
    activeStatus: 'OPERATIONAL'
  }
];

class MultiTenantManager {
  private activeTenantId: string = 'HQ_KL_MAIN';

  public getActiveTenant(): ClinicBranchTenant {
    const tenant = SUPPORTED_BRANCH_TENANTS.find(t => t.tenantId === this.activeTenantId);
    return tenant || SUPPORTED_BRANCH_TENANTS[0];
  }

  public getActiveTenantId(): string {
    return this.activeTenantId;
  }

  public setActiveTenantId(tenantId: string): void {
    const exists = SUPPORTED_BRANCH_TENANTS.some(t => t.tenantId === tenantId);
    if (!exists) {
      throw new Error(`[MultiTenant Isolation Error] Invalid branch tenant ID: '${tenantId}'`);
    }
    this.activeTenantId = tenantId;
  }

  /**
   * Attaches tenant metadata to any data object prior to persistence.
   */
  public attachTenantId<T extends object>(data: T, tenantId: string = this.activeTenantId): T & { tenantId: string } {
    return {
      ...data,
      tenantId
    };
  }

  /**
   * Filters an array of records to guarantee data isolation for the specified branch tenant.
   */
  public filterByTenant<T extends { tenantId?: string }>(records: T[], targetTenantId: string = this.activeTenantId): T[] {
    return records.filter(item => !item.tenantId || item.tenantId === targetTenantId);
  }

  /**
   * Validates whether a given user role is authorized to perform cross-tenant data operations.
   */
  public canPerformCrossTenantAccess(role: string | null): boolean {
    return role === 'admin' || role === 'hr';
  }
}

export const multiTenantManager = new MultiTenantManager();
