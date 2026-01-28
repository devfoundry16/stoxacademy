import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "Stock and Academy",
  description: "Stock and Academy is a platform for learning about stocks and the stock market.",
};

// Root layout - middleware handles redirecting to locale
export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`${cairo.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
