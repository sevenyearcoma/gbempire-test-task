import type { Metadata } from "next";
import AppTour from "@/components/AppTour";
import ThemeToggle from "@/components/ThemeToggle";
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
    <html lang="ru" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground transition-colors">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                const savedTheme = localStorage.getItem("dashboard-theme");
                const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                const theme = savedTheme || (prefersDark ? "dark" : "light");
                document.documentElement.classList.toggle("dark", theme === "dark");
                document.documentElement.dataset.theme = theme;
              })();
            `,
          }}
        />
        <div className="fixed right-4 top-4 z-50">
          <ThemeToggle />
        </div>
        <AppTour />
        {children}
      </body>
    </html>
  );
}
