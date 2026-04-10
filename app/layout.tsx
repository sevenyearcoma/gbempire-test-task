import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Заказы",
  description: "Заказы RetailCRM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className="dark h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full bg-[#0b1326] text-[#dae2fd]">
        {children}
      </body>
    </html>
  );
}
