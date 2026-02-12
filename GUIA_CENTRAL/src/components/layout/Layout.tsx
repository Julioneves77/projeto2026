import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import FloatingSupport from "@/components/FloatingSupport";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingSupport />
    </div>
  );
};

export default Layout;
