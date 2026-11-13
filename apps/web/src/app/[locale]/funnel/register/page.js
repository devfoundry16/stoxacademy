import { redirect } from "next/navigation";
import RegisterClient from "./register-client";

export const metadata = {
  title: "التسجيل في الدورة | أكاديمية ستوكس",
};

export default async function RegisterPage({ params }) {
  const { locale } = await params;
  if (locale !== "ar") redirect("/ar/funnel/register");

  return <RegisterClient />;
}
