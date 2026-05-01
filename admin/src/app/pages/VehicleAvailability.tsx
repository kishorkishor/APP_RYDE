import { useEffect, useState, useMemo } from "react";
import { type Driver, type VehicleClass } from "../data/mockData";
import { fetchAdminData, updateVehicleClass } from "../services/api";
import { Switch } from "../components/ui/switch";
import { Badge } from "../components/ui/badge";
import { Car, Users, CheckCircle2, AlertCircle, Wifi, WifiOff } from "lucide-react";

function availStyle(a: Driver["availability"]) {
  switch (a) {
    case "available":   return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800";
    case "on_ride":     return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800";
    case "unavailable": return "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
  }
}
function availLabel(a: Driver["availability"]) {
  return a === "on_ride" ? "On Ride" : a.charAt(0).toUpperCase() + a.slice(1);
}

export function VehicleAvailability() {
  const [vehicleClasses, setVehicleClasses] = useState<VehicleClass[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminData()
      .then((data) => {
        setVehicleClasses(data.vehicleClasses);
        setDrivers(data.drivers);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load vehicle data"));
  }, []);

  const toggleClass = async (id: string) => {
    const current = vehicleClasses.find((item) => item.id === id);
    if (!current) return;
    const next = { ...current, active: !current.active };
    setVehicleClasses((prev) => prev.map((vc) => vc.id === id ? next : vc));
    try {
      await updateVehicleClass(id, next);
    } catch (err) {
      setVehicleClasses((prev) => prev.map((vc) => vc.id === id ? current : vc));
      setError(err instanceof Error ? err.message : "Failed to update vehicle class");
    }
  };

  const grouped = useMemo(() => {
    return vehicleClasses.map((vc) => ({
      ...vc,
      drivers: drivers.filter((d) => d.vehicleClass === vc.name),
    }));
  }, [vehicleClasses, drivers]);

  const totalAvailable   = drivers.filter((d) => d.availability === "available").length;
  const totalOnRide      = drivers.filter((d) => d.availability === "on_ride").length;
  const totalUnavailable = drivers.filter((d) => d.availability === "unavailable").length;

  return (
    <div className="h-full flex flex-col bg-[#f7f7f5] dark:bg-gray-950 overflow-auto">

      {/* Header */}
      <div className="bg-white/95 dark:bg-gray-900 border-b border-[#e7dfcd] dark:border-gray-800 px-6 py-4 flex-shrink-0 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl tracking-tight text-gray-900 dark:text-gray-100">Riyadh Vehicle Availability</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Driver availability is live from the driver app and cannot be changed here. Toggle vehicle class booking status below.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />{totalAvailable} Available
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800">
              <Car className="w-3.5 h-3.5" />{totalOnRide} On Ride
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
              <AlertCircle className="w-3.5 h-3.5" />{totalUnavailable} Offline
            </span>
          </div>
        </div>
      </div>

      {/* Sync notice */}
      <div className="px-6 pt-4 flex-shrink-0">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
          {error || "Driver availability is automatically synced from the Riyadh driver app. Drivers go online/offline on their own device."}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 pt-4 space-y-5">
        {grouped.map((group) => {
          const availCount  = group.drivers.filter((d) => d.availability === "available").length;
          const onRideCount = group.drivers.filter((d) => d.availability === "on_ride").length;
          const offlineCount = group.drivers.filter((d) => d.availability === "unavailable").length;

          return (
            <div key={group.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              {/* Group header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Car className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{group.name}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{group.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Mini stats */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-emerald-600 dark:text-emerald-400">{availCount} avail</span>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <span className="text-blue-600 dark:text-blue-400">{onRideCount} riding</span>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <span className="text-gray-500 dark:text-gray-400">{offlineCount} offline</span>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <Users className="w-3 h-3" />{group.drivers.length}
                    </span>
                  </div>
                  {/* Booking toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Accepting bookings</span>
                    <Switch
                      checked={group.active}
                      onCheckedChange={() => toggleClass(group.id)}
                    />
                    <Badge variant="outline" className={`text-xs ${group.active ? "text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/30" : "text-gray-500 border-gray-200 bg-gray-50 dark:text-gray-400 dark:border-gray-700 dark:bg-gray-800"}`}>
                      {group.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Driver rows — read-only */}
              <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {group.drivers.map((driver) => (
                  <div key={driver.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        driver.availability === "available" ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" :
                        driver.availability === "on_ride"   ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                      }`} />
                      <div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">{driver.name}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {driver.vehicleModel} · {driver.plateNumber} · {driver.currentArea}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {driver.notes && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 italic max-w-[140px] truncate hidden sm:block" title={driver.notes}>
                          {driver.notes}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5">
                        {driver.availability !== "unavailable" ? (
                          <Wifi className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                        ) : (
                          <WifiOff className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${availStyle(driver.availability)}`}>
                          {availLabel(driver.availability)}
                        </span>
                      </div>
                      {/* Read-only indicator */}
                      <span className="text-[10px] text-gray-300 dark:text-gray-600 hidden md:block">app-controlled</span>
                    </div>
                  </div>
                ))}
                {group.drivers.length === 0 && (
                  <div className="px-5 py-4 text-sm text-gray-400 dark:text-gray-600">No drivers in this class</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
