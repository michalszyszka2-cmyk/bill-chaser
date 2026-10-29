import type { Metadata } from "next";
import "./globals.css";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "The bill chaser: a demo for trades",
  description: "Job done, invoice written, polite reminders, paid. A working demo by Quietside.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className="h-full">
      <body className="min-h-full flex flex-col">
        <header className="qs-head">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            <a href="https://quietside.co.uk/" className="brand" aria-label="Quietside home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${BASE}/quietside-logo.svg`} alt="Quietside" width={150} height={40} />
            </a>
            <a className="qs-link" href="https://quietside.co.uk/portfolio/">
              Portfolio
            </a>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
