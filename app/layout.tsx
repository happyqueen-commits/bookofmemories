import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Книга участников",
  description: "Жизнь Финансового университета во времена СВО"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen" style={{ ["--font-sans" as string]: "Inter" }}>
        <div className="flex min-h-screen flex-col">
          <Nav />
          <main className="container-arch flex-1 py-6 md:py-8">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
