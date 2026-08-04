import { redirect } from "next/navigation";

export default function AdminChangeLogsRedirectPage() {
  redirect("/dashboard/feedback/change-logs");
}
