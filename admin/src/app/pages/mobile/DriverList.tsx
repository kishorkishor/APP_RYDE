import { Badge } from "../../components/ui/badge";
import { Phone, Car, MapPin } from "lucide-react";
import { useAdminDataContext } from "../../context/AdminDataContext";

export function MobileDriverList() {
  const { drivers, loading, error } = useAdminDataContext();

  return (
    <div className="p-4 space-y-3">
      <div className="mb-4">
        <h2 className="text-lg font-medium">Drivers</h2>
        <p className="text-sm text-gray-500">{error || (loading ? "Loading drivers..." : `${drivers.length} total drivers`)}</p>
      </div>

      {drivers.map((driver) => (
        <div
          key={driver.id}
          className="bg-white border border-gray-200 rounded-lg p-4"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="font-medium">{driver.name}</div>
              <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <Phone className="w-3 h-3" />
                {driver.phone}
              </div>
            </div>
            <Badge
              className={
                driver.availability === "available"
                  ? "bg-green-100 text-green-700 border-green-200"
                  : driver.availability === "on_ride"
                  ? "bg-blue-100 text-blue-700 border-blue-200"
                  : "bg-gray-100 text-gray-700 border-gray-200"
              }
            >
              {driver.availability.replace("_", " ")}
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                <div>{driver.vehicleModel}</div>
                <div className="text-xs text-gray-500">{driver.plateNumber}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{driver.currentArea}</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <Badge variant="outline" className="text-xs">
              {driver.vehicleClass}
            </Badge>
            {!driver.active && (
              <Badge variant="secondary" className="text-xs ml-2">
                Inactive
              </Badge>
            )}
          </div>

          {driver.notes && (
            <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1.5">
              {driver.notes}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
