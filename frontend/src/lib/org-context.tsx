"use client";

/* ------------------------------------------------------------------ */
/*  Intellicore CMP — current org (tenant) + environment selection     */
/*  Backs the org switcher on Command Center. Persisted to             */
/*  localStorage so a refresh keeps you on the same customer/env.       */
/* ------------------------------------------------------------------ */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_ENV_ID,
  DEFAULT_TENANT_ID,
  TENANTS,
  getTenant,
  type Tenant,
} from "@/lib/tenants";

const TENANT_STORAGE_KEY = "intellicore_tenant_id";
const ENV_STORAGE_KEY = "intellicore_env_id";

interface OrgContextValue {
  tenantId: string;
  environment: string;
  tenant: Tenant;
  setTenantId: (id: string) => void;
  setEnvironment: (envId: string) => void;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [tenantId, setTenantIdState] = useState(DEFAULT_TENANT_ID);
  const [environment, setEnvironmentState] = useState(DEFAULT_ENV_ID);

  // Hydrate from localStorage after mount only, so server + first client
  // render match (avoids a hydration warning) and we still restore state.
  useEffect(() => {
    const storedTenant = localStorage.getItem(TENANT_STORAGE_KEY);
    const storedEnv = localStorage.getItem(ENV_STORAGE_KEY);
    const tenant = storedTenant ? TENANTS.find((t) => t.id === storedTenant) : null;
    if (tenant) {
      setTenantIdState(tenant.id);
      const env = tenant.environments.find((e) => e.id === storedEnv);
      setEnvironmentState(env ? env.id : tenant.environments[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tenant = useMemo(() => getTenant(tenantId), [tenantId]);

  function setTenantId(id: string) {
    const next = getTenant(id);
    setTenantIdState(next.id);
    localStorage.setItem(TENANT_STORAGE_KEY, next.id);
    // Keep the current environment if the new tenant has it, else fall
    // back to that tenant's first environment.
    const stillValid = next.environments.some((e) => e.id === environment);
    const nextEnv = stillValid ? environment : next.environments[0].id;
    setEnvironmentState(nextEnv);
    localStorage.setItem(ENV_STORAGE_KEY, nextEnv);
  }

  function setEnvironment(envId: string) {
    setEnvironmentState(envId);
    localStorage.setItem(ENV_STORAGE_KEY, envId);
  }

  return (
    <OrgContext.Provider
      value={{ tenantId, environment, tenant, setTenantId, setEnvironment }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg(): OrgContextValue {
  const ctx = useContext(OrgContext);
  if (!ctx) {
    throw new Error("useOrg() must be used within <OrgProvider>");
  }
  return ctx;
}
