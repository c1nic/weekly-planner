import { Playfair_Display, DM_Mono } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
});

export const metadata = {
  title: "Weekly Life & Content Planner",
  description: "Interactive weekly planner for football journalism and life goals.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${dmMono.variable} antialiased bg-white text-gray-900 min-h-screen`}
        style={{ fontFamily: "'Georgia', serif" }}
      >
        {children}
      </body>
    </html>
  );
}
