import "./globals.css";
import "leaflet/dist/leaflet.css";
import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "TravelNest",
  description: "Unified Multimodal Travel Platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100">
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#18181b",
              color: "#fff",
              fontWeight: "bold",
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
