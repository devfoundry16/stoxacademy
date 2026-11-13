import { redirect } from "next/navigation";
import WebinarClient from "./webinar-client";

export const metadata = {
  title: "التسجيل في الويبينار المجاني | أكاديمية ستوكس",
};

export default async function WebinarPage({ params }) {
  const { locale } = await params;
  if (locale !== "ar") redirect("/ar/funnel/webinar");

  return <WebinarClient />;
}
