/* ------------------------------------------------------------------ */
/*  Intellicore CMP — Assets / CMDB seed data                          */
/*  Keyed [tenantId][environmentId]["/assets"]. One rich production     */
/*  profile per tenant, scaled down for non-prod environments.          */
/* ------------------------------------------------------------------ */

import { TENANTS } from "../../tenants";
import { buildTenantEnvShell, envName, scaleCost } from "./_env";

interface Asset {
  name: string; subtitle: string; service: string; project: string;
  region: string; state: string; costPerMonth: string; lastSeen: string;
}

const PROFILES: Record<string, Asset[]> = {
  netcore: [
    { name: "gke-prod-app", subtitle: "e2-standard-4 · 6 nodes", service: "GKE Clusters", project: "netcore-prod-1", region: "asia-south1-b", state: "RUNNING", costPerMonth: "$310.00", lastSeen: "Today, 12:34" },
    { name: "gke-prod-ml", subtitle: "n2-standard-8 · 3 nodes", service: "GKE Clusters", project: "netcore-prod-1", region: "asia-south1-b", state: "RUNNING", costPerMonth: "$540.00", lastSeen: "Today, 12:34" },
    { name: "vertex-inference-hero", subtitle: "a2-highgpu-1g", service: "Vertex AI Endpoints", project: "netcore-prod-1", region: "asia-south1-c", state: "RUNNING", costPerMonth: "$890.00", lastSeen: "Today, 12:30" },
    { name: "cloudsql-prod-primary", subtitle: "db-custom-8-32768", service: "Cloud SQL Instances", project: "netcore-prod-1", region: "asia-south1-a", state: "RUNNING", costPerMonth: "$410.00", lastSeen: "Today, 12:35" },
    { name: "aws-eks-analytics", subtitle: "m5.xlarge · 4 nodes", service: "EKS Clusters", project: "429617291000", region: "ap-south-1a", state: "RUNNING", costPerMonth: "$320.00", lastSeen: "Today, 12:20" },
  ],
  aarti: [
    { name: "erp-prod-app", subtitle: "t3.large", service: "EC2 Instances", project: "aarti-prod-1", region: "ap-south-1a", state: "RUNNING", costPerMonth: "$78.00", lastSeen: "Today, 11:50" },
    { name: "rds-erp-primary", subtitle: "db.r5.xlarge", service: "RDS Instances", project: "aarti-prod-1", region: "ap-south-1a", state: "RUNNING", costPerMonth: "$310.00", lastSeen: "Today, 11:52" },
    { name: "batch-processing-ec2", subtitle: "t3.medium", service: "EC2 Instances", project: "aarti-prod-1", region: "ap-south-1b", state: "RUNNING", costPerMonth: "$31.00", lastSeen: "Today, 11:40" },
  ],
  shopstop: [
    { name: "checkout-service-prod", subtitle: "n2-standard-4 · 12 instances", service: "VM Instances", project: "shopstop-prod-1", region: "asia-south1-a", state: "RUNNING", costPerMonth: "$280.00", lastSeen: "Today, 12:10" },
    { name: "cart-service-prod", subtitle: "e2-standard-4", service: "VM Instances", project: "shopstop-prod-1", region: "asia-south1-a", state: "RUNNING", costPerMonth: "$210.00", lastSeen: "Today, 12:11" },
    { name: "sap-hana-prod", subtitle: "m3-megamem-64 (SAP HANA)", service: "VM Instances", project: "shopstop-prod-1", region: "asia-south1-a", state: "RUNNING", costPerMonth: "$1,240.00", lastSeen: "Today, 12:12" },
    { name: "sap-app-prod", subtitle: "n2-highmem-8 (SAP ECC)", service: "VM Instances", project: "shopstop-prod-1", region: "asia-south1-a", state: "RUNNING", costPerMonth: "$410.00", lastSeen: "Today, 12:12" },
    { name: "eks-analytics-prod", subtitle: "m5.xlarge (AWS)", service: "EKS Clusters", project: "010863548913", region: "ap-south-1a", state: "RUNNING", costPerMonth: "$320.00", lastSeen: "Today, 12:05" },
  ],
  designx: [
    { name: "render-farm-prod", subtitle: "n2-highcpu-8 · 4 nodes", service: "VM Instances", project: "designx-prod-1", region: "asia-south1-a", state: "RUNNING", costPerMonth: "$390.00", lastSeen: "Today, 09:45" },
    { name: "asset-store-prod", subtitle: "e2-standard-2", service: "VM Instances", project: "designx-prod-1", region: "asia-south1-a", state: "RUNNING", costPerMonth: "$54.00", lastSeen: "Today, 09:44" },
  ],
  dmart: [
    { name: "gke-prod-commerce", subtitle: "n2-standard-8 · 6 nodes", service: "GKE Clusters", project: "dmart-prod-1", region: "asia-south1-b", state: "RUNNING", costPerMonth: "$920.00", lastSeen: "Today, 12:34" },
    { name: "gke-prod-catalog", subtitle: "n2-standard-4 · 4 nodes", service: "GKE Clusters", project: "dmart-prod-1", region: "asia-south1-b", state: "RUNNING", costPerMonth: "$540.00", lastSeen: "Today, 12:34" },
    { name: "cloudsql-commerce-primary", subtitle: "db-custom-8-32768", service: "Cloud SQL Instances", project: "dmart-prod-1", region: "asia-south1-a", state: "RUNNING", costPerMonth: "$410.00", lastSeen: "Today, 12:35" },
  ],
};

const data = buildTenantEnvShell(TENANTS, (tenant, envId, isProd) => {
  const assets = PROFILES[tenant.id].map((a) =>
    isProd
      ? a
      : {
          ...a,
          name: envName(a.name.replace("-prod", ""), envId),
          project: envName(a.project.replace("-prod-1", ""), envId),
          costPerMonth: scaleCost(a.costPerMonth, envId),
        },
  );
  return { "/assets": assets };
});

export default data;
