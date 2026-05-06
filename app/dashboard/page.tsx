import DashboardClient from "@/components/DashboardClient";
import { loadDashboardData } from "@/lib/dashboard-data";

export const revalidate = 60 * 60 * 12;

export default async function DashboardPage() {
  const data = await loadDashboardData();
  return <DashboardClient {...data} />;
}
