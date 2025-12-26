import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { RoleAuthProvider } from "@/lib/auth/RoleAuthContext";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Abel wellness & Homoeopathic Care Center",
  description: "Your trusted home for holistic healing and wellness.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${poppins.className} antialiased`}>
        <RoleAuthProvider>
          {children}
          <Toaster />
        </RoleAuthProvider>
      </body>
    </html>
  );
}
