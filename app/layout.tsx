import type { Metadata } from "next";
import { Archivo, Young_Serif } from "next/font/google";
import "./globals.css";

const youngSerif = Young_Serif({ weight: "400", subsets: ["latin"], variable: "--font-young-serif" });
const archivo = Archivo({ weight: ["400", "500", "600"], subsets: ["latin"], variable: "--font-archivo" });

export const metadata: Metadata = {
  title: "The bill chaser: a demo for trades",
  description: "Job done, invoice written, polite reminders, paid. A working demo by Witmark.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${youngSerif.variable} ${archivo.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
