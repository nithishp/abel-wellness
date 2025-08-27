import {Poppins} from "next/font/google";
import "./globals.css";
import Nav from "./components/CornerNav";
import { Toaster } from "@/components/ui/sonner";


const poppins = Poppins({subsets:['latin'],weight:['100','200','300','400','500','600','700','800']})
export const metadata = {
  title: "Dental Care",
  description: "A Modern Dental Website",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${poppins.className}  antialiased`}>
        <Nav />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
