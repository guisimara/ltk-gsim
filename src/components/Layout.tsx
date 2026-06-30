import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";

export function Layout() {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <main className="flex-1 min-w-0">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
