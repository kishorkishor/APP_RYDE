import { createBrowserRouter, Navigate } from "react-router";
import { Login } from "./pages/Login";
import { DesktopLayout } from "./layouts/DesktopLayout";
import { MobileLayout } from "./layouts/MobileLayout";
import { Dashboard } from "./pages/Dashboard";
import { DispatchBoard } from "./pages/DispatchBoard";
import { DriverManagement } from "./pages/DriverManagement";
import { VehicleAvailability } from "./pages/VehicleAvailability";
import { BillingReview } from "./pages/BillingReview";
import { Settings } from "./pages/Settings";
import { Information } from "./pages/Information";
import { MobilePendingRides } from "./pages/mobile/PendingRides";
import { MobileScheduledRides } from "./pages/mobile/ScheduledRides";
import { MobileRideDetail } from "./pages/mobile/RideDetail";
import { MobileAssignDriver } from "./pages/mobile/AssignDriver";
import { MobileDriverList } from "./pages/mobile/DriverList";
import { MobileVehicleAvailability } from "./pages/mobile/VehicleAvailability";
import { useAuth } from "./context/AuthContext";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    loader: () => {
      window.location.href = "/login";
      return null;
    },
    Component: () => null,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/dashboard",
    Component: () => (
      <ProtectedRoute>
        <DesktopLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: DispatchBoard },
      { path: "dispatch", Component: DispatchBoard },
      { path: "vehicles", Component: VehicleAvailability },
      { path: "drivers", Component: DriverManagement },
      { path: "billing", Component: BillingReview },
      { path: "information", Component: Information },
      { path: "settings", Component: Settings },
    ],
  },
  {
    path: "/mobile",
    Component: () => (
      <ProtectedRoute>
        <MobileLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: MobilePendingRides },
      { path: "scheduled", Component: MobileScheduledRides },
      { path: "ride/:id", Component: MobileRideDetail },
      { path: "assign-driver/:id", Component: MobileAssignDriver },
      { path: "drivers", Component: MobileDriverList },
      { path: "vehicles", Component: MobileVehicleAvailability },
    ],
  },
]);
