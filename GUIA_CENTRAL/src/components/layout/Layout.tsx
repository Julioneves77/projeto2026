import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import ParticleBackground from "@/components/ParticleBackground";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden overflow-y-auto cyber-grid noise-bg w-full max-w-[100vw]">
      <ParticleBackground />
      <div className="relative z-10 flex min-h-screen flex-col w-full max-w-[100vw] overflow-x-hidden">
        <Header />
        <main className="flex-1 w-full max-w-[100vw] overflow-x-hidden">{children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
