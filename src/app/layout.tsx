import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "시간외근무 ERP",
  description: "SOOSAN 시간외근무 ERP 시스템",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/favicon.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
