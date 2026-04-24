import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "Книга участников",
  description: "Жизнь Финансового университета во времена СВО"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body style={{ ["--font-sans" as string]: "Inter" }}>
        <Nav />
        <main className="container-arch py-6 md:py-8">{children}</main>
      </body>
    </html>
  );
}
