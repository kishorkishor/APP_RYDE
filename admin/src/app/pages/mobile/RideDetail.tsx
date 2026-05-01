import { useNavigate, useParams } from "react-router";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { ArrowLeft, Phone, MapPin, Clock, User, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { useAdminDataContext } from "../../context/AdminDataContext";

export function MobileRideDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { rides, drivers, loading, error } = useAdminDataContext();

  const ride = rides.find((r) => r.id === id);

  if (!ride) {
    return (
      <div className="p-4">
        <p className="text-gray-500">{error || (loading ? "Loading ride..." : "Ride not found")}</p>
      </div>
    );
  }

  const assignedDriver = ride.assignedDriver
    ? drivers.find((d) => d.id === ride.assignedDriver)
    : null;

  const getStatusColor = (status: typeof ride.status) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "calling":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "confirmed":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "assigned":
        return "bg-green-100 text-green-700 border-green-200";
      case "heading_pickup":
        return "bg-cyan-100 text-cyan-700 border-cyan-200";
      case "arrived":
        return "bg-teal-100 text-teal-700 border-teal-200";
      case "in_progress":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "completed":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "";
    }
  };

  const getStatusLabel = (status: typeof ride.status) => {
    switch (status) {
      case "heading_pickup": return "En Route";
      case "arrived":        return "Arrived";
      case "in_progress":    return "In Progress";
      default:               return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="font-medium">Ride {ride.id}</h2>
        </div>
        <Badge className={getStatusColor(ride.status)}>
          {getStatusLabel(ride.status)}
        </Badge>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">Passenger</div>
            <div className="font-medium">{ride.passengerName}</div>
            <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Phone className="w-3 h-3" />
              {ride.phone}
            </div>
          </div>

          <Button variant="outline" size="sm" className="w-full">
            <Phone className="w-4 h-4 mr-2" />
            Call Customer
          </Button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">Company / Project</div>
            <div className="font-medium">{ride.companyName}</div>
            <div className="text-sm text-gray-500 mt-1">
              {ride.projectLeader} · {ride.projectCode}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div>
            <div className="text-xs text-gray-500 mb-2">Route</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Pickup</div>
                  <div>{ride.pickupLocation}</div>
                </div>
              </div>
              <div className="h-px bg-gray-200"></div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Destination</div>
                  <div>{ride.destination}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-24 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
            Map Preview
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Vehicle Class</span>
            <Badge variant="outline">{ride.vehicleClass}</Badge>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <div className="flex-1">
              <div className="text-xs text-gray-500">Scheduled Pickup</div>
              <div className="font-medium">
                {format(ride.scheduledPickupTime, "MMM d, h:mm a")}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="text-xs text-gray-500 mb-2">Ride Status</div>
          <Select defaultValue={ride.status}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="calling">Calling Customer</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="assigned">Driver Assigned</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {assignedDriver ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-green-700" />
              <span className="text-sm font-medium text-green-900">Driver Assigned</span>
            </div>
            <div className="text-sm text-green-700">{assignedDriver.name}</div>
            <div className="text-xs text-green-600 mt-1">
              {assignedDriver.vehicleModel} · {assignedDriver.plateNumber}
            </div>
          </div>
        ) : (
          <Button
            onClick={() => navigate(`/mobile/assign-driver/${ride.id}`)}
            className="w-full bg-black hover:bg-gray-800"
          >
            <User className="w-4 h-4 mr-2" />
            Assign Driver
          </Button>
        )}

        {ride.amount && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Billing Amount</span>
              <div className="flex items-center gap-1 font-medium">
                <DollarSign className="w-4 h-4 text-gray-400" />
                {ride.amount.toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
