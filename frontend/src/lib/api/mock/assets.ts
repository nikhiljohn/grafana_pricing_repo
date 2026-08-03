/* ------------------------------------------------------------------ */
/*  Intellicore CMP — Assets / CMDB seed data                         */
/*  Served by apiFetch('/assets') when no backend is configured.       */
/* ------------------------------------------------------------------ */

const data: Record<string, unknown> = {
  "/assets": [
    {
      name: "cloudlens-dev-new",
      subtitle: "e2-standard-2",
      service: "VM Instances",
      project: "138101788",
      region: "asia-south1-c",
      state: "RUNNING",
      costPerMonth: "$53.81",
      lastSeen: "Jul 28, 12:34",
    },
    {
      name: "cl-icore",
      subtitle: "e2-standard-2",
      service: "VM Instances",
      project: "138101788",
      region: "asia-south1-c",
      state: "RUNNING",
      costPerMonth: "$53.81",
      lastSeen: "Jul 28, 12:34",
    },
    {
      name: "clens-dev",
      subtitle: "e2-standard-2",
      service: "VM Instances",
      project: "138101788",
      region: "asia-south1-b",
      state: "RUNNING",
      costPerMonth: "$53.81",
      lastSeen: "Jul 28, 12:34",
    },
    {
      name: "Bastion-Host",
      subtitle: "t2.small · 52.66.236.205",
      service: "EC2 Instances",
      project: "010863548913",
      region: "ap-south-1b",
      state: "RUNNING",
      costPerMonth: "$18.10",
      lastSeen: "Jul 28, 12:28",
    },
    {
      name: "pgsql",
      subtitle: "POSTGRES_18 · db-f1-micro",
      service: "Cloud SQL Instances",
      project: "1087551233922",
      region: "us-central1",
      state: "SUSPENDED",
      costPerMonth: "$15.33",
      lastSeen: "Jul 28, 12:35",
    },
    {
      name: "dns-tester",
      subtitle: "Ready: True",
      service: "Cloud Run Services",
      project: "138101788",
      region: "asia-southeast1",
      state: "UNKNOWN",
      costPerMonth: "$5.00",
      lastSeen: "Jul 28, 12:34",
    },
    {
      name: "awr-migration-automation",
      subtitle: "Ready: True",
      service: "Cloud Run Services",
      project: "138101788",
      region: "us-central1",
      state: "UNKNOWN",
      costPerMonth: "$5.00",
      lastSeen: "Jul 28, 12:34",
    },
  ],
};

export default data;
