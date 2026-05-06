import type { Metadata } from "next";
import EmbedClient from "@/components/EmbedClient";
import { loadDashboardData } from "@/lib/dashboard-data";

export const revalidate = 60 * 60 * 12;

export const metadata: Metadata = {
  title: "Milwaukee Permit Dashboard | Together For Homes",
  description: "Live Milwaukee building permit data — embed-ready public dashboard.",
  robots: { index: false, follow: false },
};

export default async function EmbedPage() {
  const data = await loadDashboardData();
  return <EmbedClient {...data} />;
}
