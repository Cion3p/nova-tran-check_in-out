import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ['400', '700'] 
});

export const metadata: Metadata = {
  title: "Transport Check-in/out",
  description: "Check-in and Check-out system with photo and location.",
  icons: {
    icon: 'https://datacenter.novamodular.co.th/img/nova_logo.png',
    apple: 'https://datacenter.novamodular.co.th/img/nova_logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={poppins.className}>{children}</body>
    </html>
  );
}
