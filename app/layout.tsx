import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Milwaukee Permit Dashboard | Together For Homes Coalition",
  description:
    "Explore building permits across Milwaukee neighborhoods. Filter by type, status, date, and location.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
