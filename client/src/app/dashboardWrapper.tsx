"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/app/(components)/Navbar";
import Sidebar from "@/app/(components)/Sidebar";
import StoreProvider, { useAppSelector } from "./redux";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  }, [isDarkMode]);

  return (
    <div
      className={`${
        isDarkMode ? "dark" : "light"
      } flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 w-full min-h-screen transition-colors duration-300`}
    >
      <Sidebar />
      <main
        className={`flex flex-col w-full h-full py-7 px-9 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 ${
          isSidebarCollapsed ? "md:pl-24" : "md:pl-72"
        }`}
      >
        <Navbar />
        {children}
      </main>
    </div>
  );
};

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { isLoading } = useAuth();

  // Don't show dashboard layout for auth pages
  if (pathname === '/login' || pathname === '/register') {
    return <>{children}</>;
  }

  // Show loading while auth is initializing
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <StoreProvider>
      <ProtectedRoute>
        <DashboardLayout>{children}</DashboardLayout>
      </ProtectedRoute>
    </StoreProvider>
  );
};

export default DashboardWrapper;