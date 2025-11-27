import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Sidebar from "@/components/sidebar"; // <--- Import the Sidebar

// These are the default fonts setup by Next.js



export const metadata: Metadata = {
  title: "Franchise Scheduler",
  description: "Social media management for franchises",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 
         We added 'flex' and 'bg-gray-50' to the body.
         We also kept the existing font variables.
      */}
      <body
        
      >
        {/* The Sidebar sits on the left */}
        <Sidebar />

        {/* 
           The Main Content sits on the right.
           'ml-64' pushes it over so it doesn't hide behind the sidebar.
           'flex-1' makes it take up the rest of the screen width.
        */}
        <main className="flex-1 ml-64 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}