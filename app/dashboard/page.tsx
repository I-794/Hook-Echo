import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard/Dashboard";

export const metadata: Metadata = {
  title: "Dashboard - Hook Echo",
  description:
    "Live NWS alert map, animated radar, and severe-weather notifications.",
};

export default function DashboardPage() {
  return <Dashboard />;
}
