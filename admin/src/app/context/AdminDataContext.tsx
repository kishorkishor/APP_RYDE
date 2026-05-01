import { createContext, useContext } from "react";
import { useAdminData } from "../hooks/useAdminData";
import type { Driver, Ride, VehicleClass } from "../data/mockData";

interface AdminDataContextType {
  rides: Ride[];
  drivers: Driver[];
  vehicleClasses: VehicleClass[];
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  refreshDrivers: () => Promise<void>;
  patchDriver: (id: string, patch: Partial<Driver>) => void;
}

const AdminDataContext = createContext<AdminDataContextType | null>(null);

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const data = useAdminData();
  return (
    <AdminDataContext.Provider value={data}>
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminDataContext(): AdminDataContextType {
  const value = useContext(AdminDataContext);
  if (!value) throw new Error("useAdminDataContext must be used within AdminDataProvider");
  return value;
}
