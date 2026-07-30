import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Intellicore CMP",
  description: "AI-native multi-cloud management. Never again worry about your cloud.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
