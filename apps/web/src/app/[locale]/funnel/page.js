import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import FunnelClient from "./funnel-client";

export const metadata = {
  title: "دورة الذهب والفوركس | أكاديمية ستوكس",
};

export default async function FunnelPage({ params }) {
  // Arabic-only page: send any other locale to /ar/funnel so the header matches.
  const { locale } = await params;
  if (locale !== "ar") redirect("/ar/funnel");

  return (
    <div dir="rtl">
      <Header />
      <div className="pt-16">
        <FunnelClient />
      </div>
      <Footer />
    </div>
  );
}
