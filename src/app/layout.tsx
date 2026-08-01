import type { Metadata } from "next";
import { Space_Grotesk, Anton } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-heading",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RoastMyCV | AI Resume Analyzer",
  description: "Get your resume brutally roasted and improved by an AI creative agency recruiter.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${anton.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
