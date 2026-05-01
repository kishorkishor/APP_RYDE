import { useNavigate } from "react-router";
import { Badge } from "../../components/ui/badge";
import { Clock, MapPin, User } from "lucide-react";
import { format } from "date-fns";
import { useAdminData } from "../../hooks/useAdminData";

export function MobileScheduledRides() {
  const navigate = useNavigate();
  const { rides, loading, error } = useAdminData();

  const scheduledRides = rides.filter(
    (r) =>
      (r.status === "confirmed" || r.status === "assigned") &&
      r.scheduledPickupTime.getTime() > Date.now()
  );

  const getCountdown = (scheduledTime: Date) => {
    const diff = scheduledTime.getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="p-4 space-y-3">
      <div className="mb-4">
        <h2 className="text-lg font-medium">Scheduled Rides</h2>
        <p className="text-sm text-gray-500">{error || (loading ? "Loading rides..." : `${scheduledRides.length} upcoming rides`)}</p>
      </div>

      {scheduledRides.map((ride) => (
        <div
          key={ride.id}
          onClick={() => navigate(`/mobile/ride/${ride.id}`)}
          className="bg-white border border-gray-200 rounded-lg p-4 active:bg-gray-50"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="font-medium">{ride.passengerName}</div>
              <div className="text-sm text-gray-500">{ride.companyName}</div>
            </div>
            {ride.status === "assigned" && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                Assigned
              </Badge>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="truncate">{ride.pickupLocation}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1">
                <div>{format(ride.scheduledPickupTime, "MMM d, h:mm a")}</div>
                <div className="text-xs text-orange-600 font-medium">
                  {getCountdown(ride.scheduledPickupTime)}
                </div>
              </div>
            </div>

            {ride.assignedDriver && (
              <div className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1.5">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-xs">Driver assigned</span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <Badge variant="outline" className="text-xs">
              {ride.vehicleClass}
            </Badge>
          </div>
        </div>
      ))}

      {scheduledRides.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No scheduled rides</p>
        </div>
      )}
    </div>
  );
}
