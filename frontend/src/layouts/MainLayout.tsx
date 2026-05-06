import Sidebar from "../components/Sidebar";
import type { ReactNode } from "react";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f1f1f1] text-[#111827] lg:flex">
      <Sidebar />
      <main className="flex-1 px-4 py-5 sm:px-6 lg:px-[30px] lg:py-[30px]">{children}</main>
    </div>
  );
}
