import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import DashboardWrapper from "./dashboardWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Invenio Master - Inventory Management System",
  description: "Enterprise-grade inventory management dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
  <html lang="en" data-scroll-behavior="smooth">
      <body className={inter.className}>
        <AuthProvider>
          <DashboardWrapper>{children}</DashboardWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}