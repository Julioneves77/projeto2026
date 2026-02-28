import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden overflow-y-auto w-full max-w-[100vw]">
      <div className="relative z-10 flex min-h-screen flex-col w-full max-w-[100vw] overflow-x-hidden">
        <Header />
        <main className="flex-1 w-full max-w-[100vw] overflow-x-hidden bg-slate-50">{children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
