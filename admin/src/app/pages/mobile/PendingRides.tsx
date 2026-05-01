import { useNavigate } from "react-router";
import { Badge } from "../../components/ui/badge";
import { Clock, MapPin, Phone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAdminDataContext } from "../../context/AdminDataContext";

export function MobilePendingRides() {
  const navigate = useNavigate();
  const { rides, loading, error } = useAdminDataContext();

  const pendingRides = rides.filter(
    (r) => r.status === "pending" || r.status === "calling"
  );

  return (
    <div className="p-4 space-y-3">
      <div className="mb-4">
        <h2 className="text-lg font-medium">Pending Requests</h2>
        <p className="text-sm text-gray-500">{error || (loading ? "Loading rides..." : `${pendingRides.length} rides awaiting action`)}</p>
      </div>

      {pendingRides.map((ride) => (
        <div
          key={ride.id}
          onClick={() => navigate(`/mobile/ride/${ride.id}`)}
          className="bg-white border border-gray-200 rounded-lg p-4 active:bg-gray-50"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="font-medium">{ride.passengerName}</div>
              <div className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3" />
                {ride.phone}
              </div>
            </div>
            <Badge
              className={
                ride.status === "pending"
                  ? "bg-orange-100 text-orange-700 border-orange-200"
                  : "bg-blue-100 text-blue-700 border-blue-200"
              }
            >
              {ride.status}
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="truncate">{ride.pickupLocation}</div>
                <div className="text-gray-500 truncate text-xs">→ {ride.destination}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              Requested {formatDistanceToNow(ride.requestTime, { addSuffix: true })}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-gray-500">Company:</span>{" "}
              <span className="font-medium">{ride.companyName}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {ride.vehicleClass}
            </Badge>
          </div>
        </div>
      ))}

      {pendingRides.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No pending requests</p>
        </div>
      )}
    </div>
  );
}
