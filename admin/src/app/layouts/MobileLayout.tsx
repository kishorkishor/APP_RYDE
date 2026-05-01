import { Outlet, Link, useLocation } from "react-router";
import { Clock, Calendar, Users, Car } from "lucide-react";
import { BrandMark } from "../components/BrandMark";
import { AdminDataProvider } from "../context/AdminDataContext";

export function MobileLayout() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/mobile" && location.pathname === "/mobile") return true;
    if (path !== "/mobile" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <BrandMark size="sm" />
      </header>

      <main className="flex-1 overflow-auto">
        <AdminDataProvider>
          <Outlet />
        </AdminDataProvider>
      </main>

      <nav className="bg-white border-t border-gray-200 grid grid-cols-4 p-2">
        <Link
          to="/mobile"
          className={`flex flex-col items-center gap-1 py-2 rounded-lg ${
            isActive("/mobile") && location.pathname === "/mobile"
              ? "bg-[#171715] text-[#f5dd95]"
              : "text-gray-600"
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-xs">Pending</span>
        </Link>

        <Link
          to="/mobile/scheduled"
          className={`flex flex-col items-center gap-1 py-2 rounded-lg ${
            isActive("/mobile/scheduled")
              ? "bg-[#171715] text-[#f5dd95]"
              : "text-gray-600"
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-xs">Scheduled</span>
        </Link>

        <Link
          to="/mobile/drivers"
          className={`flex flex-col items-center gap-1 py-2 rounded-lg ${
            isActive("/mobile/drivers")
              ? "bg-[#171715] text-[#f5dd95]"
              : "text-gray-600"
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-xs">Drivers</span>
        </Link>

        <Link
          to="/mobile/vehicles"
          className={`flex flex-col items-center gap-1 py-2 rounded-lg ${
            isActive("/mobile/vehicles")
              ? "bg-[#171715] text-[#f5dd95]"
              : "text-gray-600"
          }`}
        >
          <Car className="w-5 h-5" />
          <span className="text-xs">Vehicles</span>
        </Link>
      </nav>
    </div>
  );
}
