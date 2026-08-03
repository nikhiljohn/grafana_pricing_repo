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
