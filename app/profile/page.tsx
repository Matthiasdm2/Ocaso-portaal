import { redirect } from "next/navigation";

export default function ProfileIndexPage() {
  // Standaard doorsturen naar je eerste tab
  redirect("/profile/info");
}
