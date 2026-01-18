import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PageLayout from "./components/PageLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GetInsight — Invisible Feedback, Instant Insights",
  description: "Replace surveys with invisible feedback. Capture real reactions during tasks using webcam signals — attention, engagement, micro-expressions, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <PageLayout>{children}</PageLayout>
      </body>
    </html>
  );
}
