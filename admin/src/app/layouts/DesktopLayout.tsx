import { Outlet, Link, useLocation } from "react-router";
import { Radio, Car, Users, Receipt, FileText, Settings, LogOut, Sun, Moon, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { BrandMark } from "../components/BrandMark";

export function DesktopLayout() {
  const location = useLocation();
  const { isDark, toggle } = useTheme();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("ryde-sidebar-collapsed") === "true");

  const isActive = (path: string) => {
    if (
      (path === "/dashboard/dispatch") &&
      (location.pathname === "/dashboard" || location.pathname === "/dashboard/dispatch")
    ) return true;
    if (path !== "/dashboard/dispatch" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const toggleSidebar = () => {
    setCollapsed((next) => {
      localStorage.setItem("ryde-sidebar-collapsed", String(!next));
      return !next;
    });
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className={`${collapsed ? "w-[76px]" : "w-64"} bg-white/95 dark:bg-[#11110f] border-r border-gray-200 dark:border-[#2d281b] flex flex-col flex-shrink-0 transition-[width] duration-200 backdrop-blur`}>
        <div className={`${collapsed ? "px-3" : "px-5"} py-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2`}>
          <BrandMark size="sm" showText={!collapsed} className={collapsed ? "mx-auto" : ""} />
          <button
            onClick={toggleSidebar}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {[
            { to: "/dashboard/dispatch", icon: Radio, label: "Dispatch Board" },
            { to: "/dashboard/vehicles", icon: Car, label: "Vehicle Availability" },
            { to: "/dashboard/drivers", icon: Users, label: "Drivers" },
            { to: "/dashboard/billing", icon: Receipt, label: "Billing Review" },
            { to: "/dashboard/information", icon: FileText, label: "Information" },
            { to: "/dashboard/settings", icon: Settings, label: "Settings" },
          ].map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={`flex items-center ${collapsed ? "justify-center px-2" : "gap-2.5 px-3"} py-2 rounded-lg transition-colors text-sm ${
                isActive(to)
                  ? "bg-[#171715] text-[#f5dd95] shadow-sm dark:bg-[#d7b35f] dark:text-[#171715]"
                  : "text-gray-700 dark:text-gray-300 hover:bg-[#f5f0e5] dark:hover:bg-[#211d14]"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1">
          <button
            onClick={toggle}
            className={`w-full flex items-center ${collapsed ? "justify-center px-2" : "gap-2.5 px-3"} py-2 text-gray-500 dark:text-gray-400 hover:bg-[#f5f0e5] dark:hover:bg-[#211d14] rounded-lg transition-colors text-sm`}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {!collapsed && (isDark ? "Light Mode" : "Dark Mode")}
          </button>
          <Link
            to="/login"
            onClick={logout}
            className={`flex items-center ${collapsed ? "justify-center px-2" : "gap-2.5 px-3"} py-2 text-gray-500 dark:text-gray-400 hover:bg-[#f5f0e5] dark:hover:bg-[#211d14] rounded-lg transition-colors text-sm`}
            title={collapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && "Sign Out"}
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
