import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "Книга памяти",
  description: "Жизнь Финансового университета во времена СВО"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Nav />
        <main className="container-arch py-8">{children}</main>
      </body>
    </html>
  );
}
