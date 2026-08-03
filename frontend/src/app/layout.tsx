import type { Metadata } from "next";
import "./globals.css";

const description =
  "Intellicore CMP is an AI-native cloud management platform with a per-tenant Memory graph. " +
  "It fuses CloudOps, FinOps, Cloud Security, DevOps and AIOps into one operational memory so " +
  "every incident, fix and cost pattern becomes institutional knowledge the platform reuses " +
  "automatically — built and managed by Searce's CSRE squad.";

export const metadata: Metadata = {
  title: {
    default: "Intellicore CMP — AI-Native Cloud Management by Searce",
    template: "%s · Intellicore CMP",
  },
  description,
  applicationName: "Intellicore CMP",
  keywords: [
    "Intellicore CMP",
    "cloud management platform",
    "AI cloud operations",
    "FinOps",
    "CloudOps",
    "Cloud Security",
    "DevOps automation",
    "AIOps",
    "Searce CSRE",
    "multi-cloud memory graph",
  ],
  authors: [{ name: "Searce" }],
  openGraph: {
    title: "Intellicore CMP — AI-Native Cloud Management by Searce",
    description,
    siteName: "Intellicore CMP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Intellicore CMP — AI-Native Cloud Management by Searce",
    description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Set the theme before paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
