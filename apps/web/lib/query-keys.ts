/**
 * Centralized React Query Keys Factory for Digital Footprint OS.
 * Standardizes cache invalidation and ensures deterministic query key scopes.
 */

export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  dashboard: {
    kpis: ["dashboard", "kpis"] as const,
    revenueTrends: ["dashboard", "revenue-trends"] as const,
    activeProjects: ["dashboard", "active-projects"] as const,
    servicesShare: ["dashboard", "services-share"] as const,
  },
  leads: {
    all: ["leads"] as const,
    list: (filters?: Record<string, any>) => ["leads", "list", filters] as const,
    detail: (id: string) => ["leads", "detail", id] as const,
  },
  clients: {
    all: ["clients"] as const,
    list: (filters?: Record<string, any>) => ["clients", "list", filters] as const,
    detail: (id: string) => ["clients", "detail", id] as const,
    services: (id: string) => ["clients", id, "services"] as const,
  },
  projects: {
    all: ["projects"] as const,
    list: (filters?: Record<string, any>) => ["projects", "list", filters] as const,
    detail: (id: string) => ["projects", "detail", id] as const,
    tasks: (projectId: string) => ["projects", projectId, "tasks"] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    list: (filters?: Record<string, any>) => ["tasks", "list", filters] as const,
    detail: (id: string) => ["tasks", "detail", id] as const,
  },
  invoices: {
    all: ["invoices"] as const,
    list: (filters?: Record<string, any>) => ["invoices", "list", filters] as const,
    detail: (id: string) => ["invoices", "detail", id] as const,
  },
  services: {
    all: ["services"] as const,
    list: ["services", "catalogue"] as const,
  },
  attendance: {
    all: ["attendance"] as const,
    today: ["attendance", "today"] as const,
    records: (filters?: Record<string, any>) => ["attendance", "records", filters] as const,
    summary: (filters?: Record<string, any>) => ["attendance", "summary", filters] as const,
    leaveBalances: ["attendance", "leave-balances"] as const,
  },
  support: {
    all: ["support-tickets"] as const,
    list: (filters?: Record<string, any>) => ["support-tickets", "list", filters] as const,
    detail: (id: string) => ["support-tickets", "detail", id] as const,
  },
  roles: {
    all: ["roles"] as const,
    list: ["roles-list"] as const,
    permissions: ["permissions-list"] as const,
    detail: (id: string) => ["roles", "detail", id] as const,
  },
  reports: {
    all: ["reports"] as const,
    summary: ["reports", "summary"] as const,
  },
} as const;
