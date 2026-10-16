import type { Metadata, Viewport } from "next";
import { Shippori_Mincho, VT323, Zen_Kaku_Gothic_New } from "next/font/google";
import { Shell } from "@/components/Shell";
import "./globals.css";

const shippori = Shippori_Mincho({
  variable: "--font-shippori",
  weight: ["500", "700", "800"],
  subsets: ["latin"],
});

const zen = Zen_Kaku_Gothic_New({
  variable: "--font-zen",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

const vt323 = VT323({
  variable: "--font-vt323",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "旅 Japan '27",
  description: "Josh & Sam's Japan trip — 29 Mar to 11 Apr 2027",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Japan '27", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2ebdd" },
    { media: "(prefers-color-scheme: dark)", color: "#1b191e" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${shippori.variable} ${zen.variable} ${vt323.variable} antialiased`}
    >
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
