import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "TravelNest",
  description: "Unified Multimodal Travel Platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100">
        {children}
      </body>
    </html>
  );
}
