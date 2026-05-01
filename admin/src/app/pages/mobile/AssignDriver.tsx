import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { type Driver } from "../../data/mockData";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { ArrowLeft, User, Car, MapPin } from "lucide-react";
import { useAdminData } from "../../hooks/useAdminData";
import { ApiError, assignRideDriver } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export function MobileAssignDriver() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { rides, drivers, loading, error, refreshDrivers, patchDriver } = useAdminData();
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const ride = rides.find((r) => r.id === id);

  if (!ride) {
    return (
      <div className="p-4">
        <p className="text-gray-500">{error || (loading ? "Loading ride..." : "Ride not found")}</p>
      </div>
    );
  }

  const availableDrivers = drivers.filter(
    (d) => d.availability === "available" && d.active && d.vehicleClass === ride.vehicleClass
  );

  const handleConfirm = async () => {
    if (!selectedDriver) return;
    if (selectedDriver.availability !== "available") {
      setSaveError(selectedDriver.availability === "on_ride"
        ? "Driver already has an active ride."
        : "Driver is offline and can't be assigned.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      await assignRideDriver(ride.id, selectedDriver, user);
      patchDriver(selectedDriver.id, { availability: "on_ride" });
      navigate(-1);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "driver_busy") setSaveError("Driver already has an active ride.");
        else if (err.code === "driver_offline") setSaveError("Driver is offline and can't be assigned.");
        else setSaveError(err.message || "Assignment failed");
      } else {
        setSaveError(err instanceof Error ? err.message : "Assignment failed");
      }
      void refreshDrivers();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="font-medium">Assign Driver</h2>
          <p className="text-xs text-gray-500">{ride.vehicleClass}</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {saveError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {saveError}
          </div>
        )}
        {availableDrivers.map((driver) => (
          <div
            key={driver.id}
            onClick={() => setSelectedDriver(driver)}
            className={`bg-white border rounded-lg p-4 active:bg-gray-50 ${
              selectedDriver?.id === driver.id ? "border-black" : "border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-medium">{driver.name}</div>
                <div className="text-sm text-gray-500">{driver.phone}</div>
              </div>
              <Badge className="bg-green-50 text-green-700 border-green-200">
                Available
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-gray-500">Vehicle:</span> {driver.vehicleModel}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 ml-6">Plate:</span> {driver.plateNumber}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-gray-500">Area:</span> {driver.currentArea}
                </div>
              </div>
            </div>

            {selectedDriver?.id === driver.id && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <Badge className="bg-black text-white">Selected</Badge>
              </div>
            )}
          </div>
        ))}

        {availableDrivers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No available drivers</p>
            <p className="text-sm mt-1">for {ride.vehicleClass}</p>
          </div>
        )}
      </div>

      {selectedDriver && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <Button
            onClick={handleConfirm}
            disabled={saving}
            className="w-full bg-black hover:bg-gray-800"
          >
            {saving ? "Assigning..." : "Confirm Assignment"}
          </Button>
        </div>
      )}
    </div>
  );
}
