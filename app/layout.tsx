// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css"; // 確保這行有引入全域 CSS

export const metadata: Metadata = {
  title: "大航海密室逃脫",
  description: "SEA ESCAPE Interactive Game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>
        {children}
      </body>
    </html>
  );
}