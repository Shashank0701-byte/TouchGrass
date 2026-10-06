import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import "./globals.css";

export const metadata: Metadata = {
  title: "TouchGrass AI — Your next quest starts outside",
  description:
    "Make a small plan to get outside. Save it on your device and take it with you, even when the signal disappears.",
  applicationName: "TouchGrass AI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TouchGrass",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#f2f2eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
