import { redirect } from "next/navigation";

/** Legacy route: data-model sidebar removed; types live under Settings. */
export default function ModelRedirectPage() {
  redirect("/settings#types");
}
