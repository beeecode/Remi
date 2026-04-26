import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Remi | Your Personal AI Assistant",
  description: "A warm, personal AI assistant for tasks and schedule management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
