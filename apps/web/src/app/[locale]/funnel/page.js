import { redirect } from "next/navigation";
import FunnelClient from "./funnel-client";

export const metadata = {
  title: "دورة الذهب والفوركس | أكاديمية ستوكس",
};

export default async function FunnelPage({ params }) {
  // Arabic-only page: send any other locale to /ar/funnel.
  const { locale } = await params;
  if (locale !== "ar") redirect("/ar/funnel");

  return <FunnelClient />;
}
