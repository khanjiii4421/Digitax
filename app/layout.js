import { Poppins, Inter } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata = {
  title: "DIGITAX \u2013 Pakistan Tax Filing, NTN & Business Registration",
  description: "File your taxes in Pakistan in minutes. Business registration, sales tax, NTN registration, trademark registration and USA LLC services.",
  keywords: "Pakistan Tax Filing, Income Tax Calculator, NTN Registration, Company Registration Pakistan, Sales Tax, Tax Consultants, USA LLC Registration",
  openGraph: {
    title: "DIGITAX \u2013 Pakistan Tax Filing, NTN & Business Registration",
    description: "File your taxes in Pakistan in minutes. Business registration, sales tax, NTN registration, trademark registration and USA LLC services.",
    url: "https://digitax.pk",
    siteName: "DIGITAX",
    locale: "en_PK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DIGITAX \u2013 Pakistan Tax Filing, NTN & Business Registration",
    description: "File your taxes in Pakistan in minutes.",
  },
};

import ToastProvider from "@/components/ToastProvider";
import LoadingScreen from "@/components/LoadingScreen";

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body bg-background-light text-text-primary">
        <ToastProvider>
          <LoadingScreen />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
