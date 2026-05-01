import { useEffect, useState } from "react";
import { type VehicleClass } from "../../data/mockData";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Car, Plus, Minus } from "lucide-react";
import { useAdminDataContext } from "../../context/AdminDataContext";
import { updateVehicleClass } from "../../services/api";

export function MobileVehicleAvailability() {
  const { vehicleClasses: loadedVehicleClasses, loading, error } = useAdminDataContext();
  const [vehicleClasses, setVehicleClasses] = useState<VehicleClass[]>([]);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setVehicleClasses(loadedVehicleClasses);
  }, [loadedVehicleClasses]);

  const updateCount = async (id: string, delta: number) => {
    const current = vehicleClasses.find((vc) => vc.id === id);
    if (!current) return;
    const next = { ...current, availableCount: Math.max(0, current.availableCount + delta) };
    setVehicleClasses((prev) =>
      prev.map((vc) => vc.id === id ? next : vc)
    );
    try {
      await updateVehicleClass(id, next);
    } catch (err) {
      setVehicleClasses((prev) => prev.map((vc) => vc.id === id ? current : vc));
      setSaveError(err instanceof Error ? err.message : "Failed to update availability");
    }
  };

  return (
    <div className="p-4 space-y-3">
      <div className="mb-4">
        <h2 className="text-lg font-medium">Vehicle Availability</h2>
        <p className="text-sm text-gray-500">{saveError || error || (loading ? "Loading availability..." : "Quick update availability")}</p>
      </div>

      {vehicleClasses.map((vc) => (
        <div
          key={vc.id}
          className="bg-white border border-gray-200 rounded-lg p-4"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="font-medium">{vc.name}</div>
              <p className="text-sm text-gray-500 mt-1">{vc.description}</p>
            </div>
            <Badge variant={vc.active ? "default" : "secondary"}>
              {vc.active ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateCount(vc.id, -1)}
              disabled={vc.availableCount === 0}
              className="h-12 w-12"
            >
              <Minus className="w-5 h-5" />
            </Button>

            <div className="flex-1 flex items-center justify-center gap-2">
              <Car className="w-5 h-5 text-gray-400" />
              <span className="text-3xl font-medium">{vc.availableCount}</span>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => updateCount(vc.id, 1)}
              className="h-12 w-12"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500 mt-2">Available</div>
        </div>
      ))}
    </div>
  );
}
