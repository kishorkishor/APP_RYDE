import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { useAdminDataContext } from "../context/AdminDataContext";
import { Clock, Calendar, CheckCircle2, XCircle, Users, Car, Filter, Loader2 } from "lucide-react";
import { formatDistanceToNow, format, isToday, differenceInMinutes } from "date-fns";
import type { Ride } from "../data/mockData";

export function Dashboard() {
  const { rides, drivers, vehicleClasses, loading, error } = useAdminDataContext();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const companies = useMemo(
    () => [...new Set(rides.map((r) => r.companyName).filter(Boolean))].sort(),
    [rides]
  );

  const filteredRides = useMemo(() => {
    return rides.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (companyFilter !== "all" && r.companyName !== companyFilter) return false;
      if (dateFilter === "today" && !isToday(r.scheduledPickupTime)) return false;
      if (dateFilter === "week") {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (r.scheduledPickupTime.getTime() < weekAgo) return false;
      }
      return true;
    });
  }, [rides, statusFilter, companyFilter, dateFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">Failed to load data</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const pendingRides = filteredRides.filter((r) => r.status === "pending" || r.status === "calling");
  const scheduledDueSoon = filteredRides.filter(
    (r) =>
      (r.status === "confirmed" || r.status === "assigned") &&
      r.scheduledPickupTime.getTime() - Date.now() < 2 * 60 * 60 * 1000 &&
      r.scheduledPickupTime.getTime() > Date.now()
  );
  const assignedRides = filteredRides.filter((r) => r.status === "assigned");
  const completedToday = filteredRides.filter((r) => r.status === "completed" && isToday(r.scheduledPickupTime));
  const cancelledToday = filteredRides.filter((r) => r.status === "cancelled" && isToday(r.requestTime));
  const availableDrivers = drivers.filter((d) => d.availability === "available" && d.active);

  const recentActivity = rides
    .flatMap((ride) =>
      ride.events.map((event) => ({
        ...event,
        rideId: ride.id,
        passengerName: ride.passengerName,
      }))
    )
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);

  const upcomingScheduled = filteredRides
    .filter(
      (r) =>
        (r.status === "confirmed" || r.status === "assigned") &&
        r.scheduledPickupTime.getTime() > Date.now()
    )
    .sort((a, b) => a.scheduledPickupTime.getTime() - b.scheduledPickupTime.getTime())
    .slice(0, 8);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl mb-1">Operations Dashboard</h1>
          <p className="text-sm text-gray-500">Overview of ride operations and fleet status</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Filter className="w-4 h-4" />
            Filters:
          </div>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="calling">Calling</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="Company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="text-2xl">{pendingRides.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">Scheduled Due Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <span className="text-2xl">{scheduledDueSoon.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">Assigned Rides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              <span className="text-2xl">{assignedRides.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-2xl">{completedToday.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">Cancelled Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-2xl">{cancelledToday.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">Available Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-gray-700" />
              <span className="text-2xl">{availableDrivers.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {vehicleClasses.map((vc) => (
          <Card key={vc.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{vc.name}</CardTitle>
                <Badge variant={vc.active ? "default" : "secondary"}>
                  {vc.active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-3">{vc.description}</p>
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-gray-400" />
                <span className="text-xl">{vc.availableCount}</span>
                <span className="text-sm text-gray-500">available</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ride Log Spreadsheet */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Ride Log</CardTitle>
            <span className="text-xs text-gray-400">{filteredRides.length} rides</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Passenger</TableHead>
                <TableHead className="text-xs">Company</TableHead>
                <TableHead className="text-xs">Pickup</TableHead>
                <TableHead className="text-xs">Drop-off</TableHead>
                <TableHead className="text-xs">Pickup Time</TableHead>
                <TableHead className="text-xs">Drop-off Time</TableHead>
                <TableHead className="text-xs">Wait (min)</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-400 py-8">
                    No rides match current filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredRides
                  .sort((a, b) => b.scheduledPickupTime.getTime() - a.scheduledPickupTime.getTime())
                  .slice(0, 50)
                  .map((ride) => (
                    <RideLogRow key={ride.id} ride={ride} />
                  ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Activity + Scheduled */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
              ) : (
                recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                    <div className="text-xs text-gray-400 w-16 flex-shrink-0 pt-0.5">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        <span className="font-medium">{activity.action}</span>
                        {" · "}
                        <span className="text-gray-600">{activity.passengerName}</span>
                        {" · "}
                        <span className="text-gray-400">{activity.rideId}</span>
                      </div>
                      {activity.notes && (
                        <p className="text-xs text-gray-500 mt-1">{activity.notes}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">by {activity.user}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scheduled Rides Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingScheduled.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No upcoming scheduled rides</p>
              ) : (
                upcomingScheduled.map((ride) => {
                  const timeUntil = ride.scheduledPickupTime.getTime() - Date.now();
                  const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
                  const minutesUntil = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));

                  return (
                    <div key={ride.id} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                      <div className="text-xs w-20 flex-shrink-0 pt-0.5">
                        <div className="font-medium">{format(ride.scheduledPickupTime, "h:mm a")}</div>
                        <div className="text-gray-400">
                          {hoursUntil > 0 ? `${hoursUntil}h ${minutesUntil}m` : `${minutesUntil}m`}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{ride.passengerName}</div>
                        <div className="text-xs text-gray-500 truncate">{ride.pickupLocation}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {ride.vehicleClass}
                          </Badge>
                          {ride.status === "assigned" && (
                            <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                              Driver assigned
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const statusColors: Record<string, string> = {
  pending: "bg-orange-100 text-orange-700",
  calling: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  assigned: "bg-purple-100 text-purple-700",
  heading_pickup: "bg-cyan-100 text-cyan-700",
  arrived: "bg-teal-100 text-teal-700",
  in_progress: "bg-indigo-100 text-indigo-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  heading_pickup: "En Route",
  arrived: "Arrived",
  in_progress: "In Progress",
};

function RideLogRow({ ride }: { ride: Ride }) {
  const pickupEvent = ride.events.find((e) => e.action.toLowerCase().includes("picked up") || e.action.toLowerCase().includes("driver arrived"));
  const dropoffEvent = ride.events.find((e) => e.action.toLowerCase().includes("completed") || e.action.toLowerCase().includes("dropped"));

  const actualPickupTime = pickupEvent ? format(pickupEvent.timestamp, "h:mm a") : format(ride.scheduledPickupTime, "h:mm a");
  const dropoffTime = dropoffEvent ? format(dropoffEvent.timestamp, "h:mm a") : "—";

  const waitingMinutes = pickupEvent
    ? differenceInMinutes(pickupEvent.timestamp, ride.scheduledPickupTime)
    : null;

  return (
    <TableRow>
      <TableCell className="text-xs text-gray-600">
        {format(ride.scheduledPickupTime, "MMM d")}
      </TableCell>
      <TableCell className="text-xs font-medium">{ride.passengerName}</TableCell>
      <TableCell className="text-xs text-gray-500 max-w-[120px] truncate">{ride.companyName}</TableCell>
      <TableCell className="text-xs text-gray-500 max-w-[150px] truncate">{ride.pickupLocation}</TableCell>
      <TableCell className="text-xs text-gray-500 max-w-[150px] truncate">{ride.destination}</TableCell>
      <TableCell className="text-xs">{actualPickupTime}</TableCell>
      <TableCell className="text-xs">{dropoffTime}</TableCell>
      <TableCell className="text-xs">
        {waitingMinutes !== null ? (
          <span className={waitingMinutes > 5 ? "text-red-600 font-medium" : "text-gray-600"}>
            {waitingMinutes > 0 ? `${waitingMinutes}` : "0"}
          </span>
        ) : "—"}
      </TableCell>
      <TableCell>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[ride.status] || "bg-gray-100 text-gray-600"}`}>
          {statusLabels[ride.status] || ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
        </span>
      </TableCell>
    </TableRow>
  );
}
