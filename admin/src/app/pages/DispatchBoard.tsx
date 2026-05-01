import { useEffect, useState, useMemo } from "react";
import { type Ride, type Driver } from "../data/mockData";
import { ApiError, assignRideDriver, unassignRideDriver, updateRideStatus } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useAdminDataContext } from "../context/AdminDataContext";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import {
  Search, Phone, Clock, X, ChevronRight, ChevronLeft,
  User, CheckCircle2, ArrowRight, MapPin, Car, UserCheck, UserX,
} from "lucide-react";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────
type PanelMode = "customer" | "driver" | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function minsUntil(t: Date) { return (t.getTime() - Date.now()) / 60000; }
function getCountdown(t: Date) {
  const diff = t.getTime() - Date.now();
  if (diff < 0) return "Overdue";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h === 0 ? `${m}m` : `${h}h ${m}m`;
}

function getRowHue(ride: Ride): "green" | "red-urgent" | "red" | "normal" {
  if (ride.status === "completed" || ride.status === "cancelled") return "normal";
  if (ride.assignedDriver) return "green";
  const mins = minsUntil(ride.scheduledPickupTime);
  if (mins <= 60) return "red-urgent";
  return "red";
}

function rowClassName(hue: ReturnType<typeof getRowHue>, selected: boolean) {
  const base = "cursor-pointer transition-colors border-l-2";
  if (selected) {
    return `${base} border-l-black dark:border-l-white bg-gray-50 dark:bg-gray-800/70`;
  }
  switch (hue) {
    case "green":
      return `${base} border-l-transparent bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30`;
    case "red-urgent":
      return `${base} border-l-red-400 blink-row hover:brightness-95`;
    case "red":
      return `${base} border-l-transparent bg-red-50/50 dark:bg-red-950/15 hover:bg-red-50 dark:hover:bg-red-950/25`;
    default:
      return `${base} border-l-transparent bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50`;
  }
}

function getStatusStyle(s: Ride["status"]) {
  switch (s) {
    case "pending":        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800";
    case "calling":        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800";
    case "confirmed":      return "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800";
    case "assigned":       return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800";
    case "heading_pickup": return "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800";
    case "arrived":        return "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800";
    case "in_progress":    return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800";
    case "completed":      return "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
    case "cancelled":      return "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800";
    default:               return "bg-gray-100 text-gray-500 border-gray-200";
  }
}

function getStatusLabel(s: Ride["status"]): string {
  switch (s) {
    case "heading_pickup": return "En Route";
    case "arrived":        return "Arrived";
    case "in_progress":    return "In Progress";
    default:               return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

function getDriverAvailStyle(a: Driver["availability"]) {
  switch (a) {
    case "available":   return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800";
    case "on_ride":     return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800";
    case "unavailable": return "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
  }
}
function getDriverAvailLabel(a: Driver["availability"]) {
  return a === "on_ride" ? "On Ride" : a.charAt(0).toUpperCase() + a.slice(1);
}

function getDriverAvailReason(a: Driver["availability"]) {
  switch (a) {
    case "on_ride":     return "Driver already has an active ride";
    case "unavailable": return "Driver is offline";
    default:            return "";
  }
}

function mapAssignError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === "driver_busy") return "Driver already has an active ride.";
    if (err.code === "driver_offline") return "Driver is offline and can't be assigned.";
    if (err.status === 409) return err.message || "Driver is no longer available.";
    return err.message;
  }
  return err instanceof Error ? err.message : "Failed to assign driver";
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DispatchBoard() {
  const { user } = useAuth();
  const { rides, drivers, loading, error: adminError, reload, refreshDrivers, patchDriver } = useAdminDataContext();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");

  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

  // customer panel form
  const [callNotes, setCallNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [rideStatus, setRideStatus] = useState<Ride["status"]>("pending");

  // driver panel
  const [driverSearch, setDriverSearch] = useState("");
  const [pendingDriverId, setPendingDriverId] = useState<string | null>(null);

  // Surface load errors from useAdminData when no local action is pending.
  useEffect(() => {
    if (adminError && !error) setError(adminError);
  }, [adminError, error]);

  const filteredRides = useMemo(() => {
    const q = search.toLowerCase();
    return rides.filter((r) => {
      const ms = !q || r.passengerName.toLowerCase().includes(q) ||
        r.phone.includes(q) || r.companyName.toLowerCase().includes(q) ||
        r.projectCode.toLowerCase().includes(q);
      const mst = statusFilter === "all" || r.status === statusFilter;
      const mv  = vehicleFilter === "all" || r.vehicleClass === vehicleFilter;
      return ms && mst && mv;
    });
  }, [rides, search, statusFilter, vehicleFilter]);

  const counts = useMemo(() => ({
    pending:   rides.filter((r) => r.status === "pending").length,
    calling:   rides.filter((r) => r.status === "calling").length,
    confirmed: rides.filter((r) => r.status === "confirmed").length,
    assigned:  rides.filter((r) => r.status === "assigned").length,
    active:    rides.filter((r) => ["heading_pickup", "arrived", "in_progress"].includes(r.status)).length,
  }), [rides]);

  const openCustomerPanel = (ride: Ride) => {
    setSelectedRide(ride);
    setCallNotes(ride.callStatus || "");
    setInternalNotes(ride.internalNotes || "");
    setRideStatus(ride.status);
    setPanelMode("customer");
    setPanelCollapsed(false);
  };
  const openDriverPanel = (ride: Ride, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRide(ride);
    setPendingDriverId(ride.assignedDriver || null);
    setDriverSearch("");
    setPanelMode("driver");
    setPanelCollapsed(false);
  };
  const closePanel = () => { setPanelMode(null); setSelectedRide(null); };

  const handleSaveCustomer = async () => {
    if (!selectedRide) return;
    setSaving(true);
    setError("");
    try {
      await updateRideStatus(selectedRide.id, rideStatus, user?.name || "Admin", callNotes || internalNotes);
      await reload();
      closePanel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save ride");
    } finally {
      setSaving(false);
    }
  };
  const handleAssignDriver = async () => {
    if (!selectedRide || !pendingDriverId) return;
    const driver = drivers.find((item) => item.id === pendingDriverId);
    if (!driver) return;
    if (driver.availability !== "available") {
      setError(driver.availability === "on_ride"
        ? "Driver already has an active ride"
        : "Driver is offline and can't be assigned");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await assignRideDriver(selectedRide.id, driver, user);
      // Optimistically mark driver as on_ride so the UI doesn't briefly show
      // them as assignable while we wait for the next poll.
      patchDriver(driver.id, { availability: "on_ride" });
      await Promise.all([reload(), refreshDrivers()]);
      closePanel();
    } catch (err) {
      const friendly = mapAssignError(err);
      setError(friendly);
      // Refresh availability so we show the latest state after a rejection.
      void refreshDrivers();
    } finally {
      setSaving(false);
    }
  };
  const handleRemoveDriver = async () => {
    if (!selectedRide) return;
    setSaving(true);
    setError("");
    try {
      await unassignRideDriver(selectedRide.id, user);
      await Promise.all([reload(), refreshDrivers()]);
      closePanel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove driver");
    } finally {
      setSaving(false);
    }
  };

  const panelDrivers = useMemo(() => {
    const q = driverSearch.toLowerCase();
    return drivers
      .filter((d) => d.active && (!q || d.name.toLowerCase().includes(q) ||
        d.vehicleModel.toLowerCase().includes(q) || d.currentArea.toLowerCase().includes(q)))
      .sort((a, b) => ({ available: 0, on_ride: 1, unavailable: 2 }[a.availability] - { available: 0, on_ride: 1, unavailable: 2 }[b.availability]));
  }, [drivers, driverSearch]);

  const panelOpen = panelMode !== null && selectedRide !== null;

  return (
    <div className="relative h-full flex overflow-hidden bg-[#f7f7f5] dark:bg-gray-950">

      {/* ── Main table area ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header */}
        <div className="bg-white/95 dark:bg-gray-900 border-b border-[#e7dfcd] dark:border-gray-800 px-6 py-4 flex-shrink-0 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl tracking-tight text-gray-900 dark:text-gray-100">Riyadh Dispatch Board</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Review, assign, and manage all ride requests</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {[
                { label: "Pending", count: counts.pending, cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800" },
                { label: "Calling", count: counts.calling, cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800" },
                { label: "Confirmed", count: counts.confirmed, cls: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800" },
                { label: "Assigned", count: counts.assigned, cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800" },
                { label: "Active", count: counts.active, cls: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800" },
              ].map(({ label, count, cls }) => (
                <span key={label} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${cls}`}>
                  {count} {label}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input placeholder="Search passenger, company, code..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm border-[#e7dfcd] bg-[#f8f6f1] dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-8 text-sm border-[#e7dfcd] bg-[#f8f6f1] dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="calling">Calling</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="heading_pickup">En Route</SelectItem>
                <SelectItem value="arrived">Arrived</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger className="w-44 h-8 text-sm border-[#e7dfcd] bg-[#f8f6f1] dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                <SelectItem value="Premium Sedans">Premium Sedans</SelectItem>
                <SelectItem value="Premium SUV">Premium SUV</SelectItem>
                <SelectItem value="Custom Your Luxury">Custom Your Luxury</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{filteredRides.length} rides</span>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f5f0e5] dark:bg-gray-800/60 border-b border-[#e7dfcd] dark:border-gray-700/60 sticky top-0 z-10">
                {["Passenger", "Company", "Route", "Vehicle", "Scheduled", "Status", "Driver"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredRides.map((ride) => {
                const hue = getRowHue(ride);
                const assignedDriver = ride.assignedDriver ? drivers.find((d) => d.id === ride.assignedDriver) : null;
                const isSelected = selectedRide?.id === ride.id;
                const overdue = minsUntil(ride.scheduledPickupTime) < 0;

                return (
                  <tr key={ride.id} onClick={() => openCustomerPanel(ride)} className={rowClassName(hue, isSelected)}>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 dark:text-gray-100 leading-tight">{ride.passengerName}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{ride.phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-800 dark:text-gray-200 truncate max-w-[140px]">{ride.companyName}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[140px]">{ride.projectCode}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-1 text-sm text-gray-700 dark:text-gray-300">
                        <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="truncate max-w-[170px]" title={ride.pickupLocation}>{ride.pickupLocation}</span>
                      </div>
                      <div className="flex items-start gap-1 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        <ArrowRight className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <span className="truncate max-w-[170px]" title={ride.destination}>{ride.destination}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {ride.vehicleClass}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-800 dark:text-gray-200">{format(ride.scheduledPickupTime, "h:mm a")}</div>
                      <div className={`flex items-center gap-1 text-xs mt-0.5 ${overdue ? "text-red-500" : "text-gray-400 dark:text-gray-500"}`}>
                        <Clock className="w-3 h-3" />
                        {getCountdown(ride.scheduledPickupTime)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${getStatusStyle(ride.status)}`}>
                        {getStatusLabel(ride.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => openDriverPanel(ride, e)}>
                      {assignedDriver ? (
                        <div className="flex items-center gap-1.5 group/d">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500 flex-shrink-0" />
                          <span className="text-sm text-gray-800 dark:text-gray-200 truncate max-w-[100px]">{assignedDriver.name}</span>
                          <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600 group-hover/d:text-gray-600 dark:group-hover/d:text-gray-300 flex-shrink-0" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 group/d">
                          <UserX className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                          <span className="text-xs text-gray-400 dark:text-gray-500 group-hover/d:text-black dark:group-hover/d:text-white group-hover/d:underline">Assign driver</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredRides.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400 dark:text-gray-600 text-sm">
                    No rides match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Panel toggle strip (when collapsed) ── */}
      {panelOpen && panelCollapsed && (
        <div className="w-8 flex-shrink-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col items-center pt-4">
          <button
            onClick={() => setPanelCollapsed(false)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
            title="Expand panel"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Side panel ── */}
      {panelOpen && !panelCollapsed && (
        <div className="w-[420px] shrink-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
          {panelMode === "customer" ? (
            <CustomerPanel
              ride={selectedRide!}
              drivers={drivers}
              rideStatus={rideStatus}
              setRideStatus={setRideStatus}
              callNotes={callNotes}
              setCallNotes={setCallNotes}
              internalNotes={internalNotes}
              setInternalNotes={setInternalNotes}
              onSave={handleSaveCustomer}
              saving={saving}
              onClose={closePanel}
              onCollapse={() => setPanelCollapsed(true)}
              onOpenDriverPanel={(e) => openDriverPanel(selectedRide!, e)}
            />
          ) : (
            <DriverPanel
              ride={selectedRide!}
              currentDriver={selectedRide!.assignedDriver ? drivers.find((d) => d.id === selectedRide!.assignedDriver) || null : null}
              driverSearch={driverSearch}
              setDriverSearch={setDriverSearch}
              drivers={panelDrivers}
              pendingDriverId={pendingDriverId}
              setPendingDriverId={setPendingDriverId}
              onAssign={handleAssignDriver}
              onRemove={handleRemoveDriver}
              saving={saving}
              onClose={closePanel}
              onCollapse={() => setPanelCollapsed(true)}
            />
          )}
        </div>
      )}
      {loading && (
        <div className="absolute inset-0 bg-white/60 dark:bg-gray-950/60 flex items-center justify-center text-sm text-gray-500">
          Loading live dispatch data...
        </div>
      )}
      {error && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Customer Panel ───────────────────────────────────────────────────────────
function PanelHeader({ title, sub, onCollapse, onClose }: { title: string; sub: string; onCollapse: () => void; onClose: () => void; }) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-800 px-5 py-3.5 flex items-center justify-between flex-shrink-0">
      <div>
        <div className="text-xs text-gray-400 dark:text-gray-500">{sub}</div>
        <div className="text-sm text-gray-900 dark:text-gray-100">{title}</div>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={onCollapse} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200" title="Collapse panel">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200" title="Close panel">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CustomerPanel({ ride, drivers, rideStatus, setRideStatus, callNotes, setCallNotes, internalNotes, setInternalNotes, onSave, onClose, onCollapse, onOpenDriverPanel, saving }: {
  ride: Ride; drivers: Driver[]; rideStatus: Ride["status"]; setRideStatus: (s: Ride["status"]) => void;
  callNotes: string; setCallNotes: (v: string) => void; internalNotes: string;
  setInternalNotes: (v: string) => void; onSave: () => void; onClose: () => void;
  onCollapse: () => void; onOpenDriverPanel: (e: React.MouseEvent) => void; saving: boolean;
}) {
  const assignedDriver = ride.assignedDriver ? drivers.find((d) => d.id === ride.assignedDriver) : null;
  return (
    <>
      <PanelHeader
        title={ride.passengerName}
        sub={`${ride.id} · Customer Details`}
        onCollapse={onCollapse}
        onClose={onClose}
      />
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Call button */}
        <a href={`tel:${ride.phone}`} className="flex items-center justify-center gap-2 w-full py-2.5 bg-black dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors text-sm">
          <Phone className="w-4 h-4" />
          Call {ride.passengerName} · {ride.phone}
        </a>

        {/* Passenger */}
        <Section label="Passenger">
          <Row label="Name" value={ride.passengerName} />
          <Row label="Phone" value={ride.phone} mono />
        </Section>

        {/* Company */}
        <Section label="Company / Project">
          <Row label="Company" value={ride.companyName} />
          <Row label="Project Leader" value={ride.projectLeader} />
          <Row label="Project Code" value={ride.projectCode} mono />
        </Section>

        {/* Route */}
        <Section label="Route">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex gap-2 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-900 dark:bg-gray-100 mt-1.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Pickup</div>
                <div className="text-gray-900 dark:text-gray-100">{ride.pickupLocation}</div>
              </div>
            </div>
            <div className="ml-[3px] h-4 border-l border-dashed border-gray-300 dark:border-gray-600" />
            <div className="flex gap-2 items-start">
              <div className="w-1.5 h-1.5 rounded-full border border-gray-900 dark:border-gray-300 mt-1.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Destination</div>
                <div className="text-gray-900 dark:text-gray-100">{ride.destination}</div>
              </div>
            </div>
          </div>
        </Section>

        {/* Schedule */}
        <Section label="Schedule">
          <Row label="Vehicle Class" value={ride.vehicleClass} />
          <Row label="Pickup Time" value={format(ride.scheduledPickupTime, "MMM d, h:mm a")} />
          <Row label="Countdown" value={getCountdown(ride.scheduledPickupTime)} urgent={minsUntil(ride.scheduledPickupTime) < 0} />
        </Section>

        {/* Driver */}
        <Section label="Driver">
          {assignedDriver ? (
            <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <div>
                  <div className="text-sm text-emerald-900 dark:text-emerald-300">{assignedDriver.name}</div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-500">{assignedDriver.vehicleModel} · {assignedDriver.plateNumber}</div>
                </div>
              </div>
              <button onClick={onOpenDriverPanel} className="text-xs text-emerald-700 dark:text-emerald-400 underline hover:text-emerald-900 dark:hover:text-emerald-200">Change</button>
            </div>
          ) : (
            <button onClick={onOpenDriverPanel} className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-colors">
              <User className="w-4 h-4" />Assign a driver
            </button>
          )}
        </Section>

        {/* Status */}
        <Section label="Ride Status">
          <Select value={rideStatus} onValueChange={(v) => setRideStatus(v as Ride["status"])}>
            <SelectTrigger className="h-8 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="calling">Calling Customer</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="assigned">Driver Assigned</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </Section>

        <Section label="Call Notes">
          <Input value={callNotes} onChange={(e) => setCallNotes(e.target.value)} placeholder="e.g. Confirmed, customer ready at lobby" className="h-8 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500" />
        </Section>

        <Section label="Internal Notes">
          <Textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} placeholder="Notes visible only to admin team…" className="text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500" rows={3} />
        </Section>

        {ride.events.length > 0 && (
          <Section label="Activity">
            <div className="space-y-3">
              {ride.events.map((ev, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="text-xs text-gray-400 dark:text-gray-500 w-14 flex-shrink-0 pt-0.5 font-mono">{format(ev.timestamp, "h:mm a")}</div>
                  <div className="flex-1">
                    <div className="text-gray-800 dark:text-gray-200">{ev.action}</div>
                    {ev.notes && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{ev.notes}</div>}
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">by {ev.user}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
      <div className="border-t border-gray-200 dark:border-gray-800 px-5 py-3 flex-shrink-0 flex gap-2">
        <Button variant="outline" onClick={onClose} className="flex-1 h-8 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700">Cancel</Button>
        <Button onClick={onSave} disabled={saving} className="flex-1 h-8 text-sm bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-gray-100 text-white dark:text-gray-900">{saving ? "Saving..." : "Save Changes"}</Button>
      </div>
    </>
  );
}

// ─── Driver Panel ─────────────────────────────────────────────────────────────
function DriverPanel({ ride, currentDriver, driverSearch, setDriverSearch, drivers, pendingDriverId, setPendingDriverId, onAssign, onRemove, onClose, onCollapse, saving }: {
  ride: Ride; currentDriver: Driver | null; driverSearch: string;
  setDriverSearch: (v: string) => void; drivers: Driver[];
  pendingDriverId: string | null; setPendingDriverId: (id: string | null) => void;
  onAssign: () => void; onRemove: () => void; onClose: () => void; onCollapse: () => void; saving: boolean;
}) {
  const isReassign = !!currentDriver;
  const pendingDriver = pendingDriverId ? drivers.find((d) => d.id === pendingDriverId) : null;

  return (
    <>
      <PanelHeader
        title={isReassign ? "Change Driver" : "Assign Driver"}
        sub={`${ride.id} · ${ride.passengerName}`}
        onCollapse={onCollapse}
        onClose={onClose}
      />

      {currentDriver && (
        <div className="px-5 pt-4 flex-shrink-0">
          <div className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Currently Assigned</div>
          <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div>
                <div className="text-sm text-emerald-900 dark:text-emerald-300">{currentDriver.name}</div>
                <div className="text-xs text-emerald-600 dark:text-emerald-500">{currentDriver.vehicleModel} · {currentDriver.plateNumber} · {currentDriver.currentArea}</div>
              </div>
            </div>
            <button disabled={saving} onClick={onRemove} className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 border border-red-200 dark:border-red-800 rounded px-2 py-1 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50">{saving ? "Removing" : "Remove"}</button>
          </div>
        </div>
      )}

      <div className="px-5 pt-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Car className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Requested: </span>
          <span className="text-xs text-gray-800 dark:text-gray-200">{ride.vehicleClass}</span>
        </div>
      </div>

      <div className="px-5 pt-3 pb-2 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input placeholder="Search drivers…" value={driverSearch} onChange={(e) => setDriverSearch(e.target.value)} className="pl-8 h-8 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2">
        {drivers.map((driver) => {
          const isSelected = pendingDriverId === driver.id;
          const isCurrent  = currentDriver?.id === driver.id;
          const disabled   = driver.availability === "unavailable" || driver.availability === "on_ride";
          const reason     = getDriverAvailReason(driver.availability);

          const badge = (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${getDriverAvailStyle(driver.availability)}`}
              aria-label={`Availability: ${getDriverAvailLabel(driver.availability)}`}
            >
              {getDriverAvailLabel(driver.availability)}
            </span>
          );

          return (
            <div
              key={driver.id}
              onClick={() => !disabled && setPendingDriverId(isSelected ? null : driver.id)}
              title={disabled ? reason : undefined}
              className={`border rounded-lg p-3 transition-all ${
                disabled
                  ? "opacity-40 cursor-not-allowed border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30"
                  : isSelected
                  ? "border-black dark:border-white bg-gray-50 dark:bg-gray-800 cursor-pointer"
                  : isCurrent
                  ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 cursor-pointer"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer bg-white dark:bg-gray-800/30"
              }`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-gray-900" />
                    </div>
                  )}
                  <span className="text-sm text-gray-900 dark:text-gray-100">{driver.name}</span>
                  {isCurrent && !isSelected && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/30">Current</span>
                  )}
                </div>
                {disabled && reason ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>{badge}</TooltipTrigger>
                      <TooltipContent>{reason}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  badge
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                <div><span className="text-gray-400 dark:text-gray-500">Vehicle </span>{driver.vehicleModel}</div>
                <div><span className="text-gray-400 dark:text-gray-500">Plate </span>{driver.plateNumber}</div>
                <div><span className="text-gray-400 dark:text-gray-500">Class </span>{driver.vehicleClass}</div>
                <div><span className="text-gray-400 dark:text-gray-500">Area </span>{driver.currentArea}</div>
              </div>
              {driver.notes && <div className="mt-1.5 text-xs text-gray-400 dark:text-gray-500 italic">{driver.notes}</div>}
            </div>
          );
        })}
        {drivers.length === 0 && (
          <div className="text-center py-10 text-gray-400 dark:text-gray-600 text-sm">No drivers found</div>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 px-5 py-3 flex-shrink-0 space-y-2">
        {pendingDriver && pendingDriverId !== currentDriver?.id && (
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Assigning <strong className="text-gray-900 dark:text-gray-100">{pendingDriver.name}</strong> ({pendingDriver.vehicleModel})
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-8 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700">Cancel</Button>
          {(() => {
            const pendingUnavailable = !!pendingDriver && pendingDriver.availability !== "available";
            const disabledReason = pendingUnavailable ? getDriverAvailReason(pendingDriver!.availability) : "";
            const disabled = saving || !pendingDriverId || pendingDriverId === currentDriver?.id || pendingUnavailable;
            const btn = (
              <Button
                onClick={onAssign}
                disabled={disabled}
                className="flex-1 h-8 text-sm bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-gray-100 text-white dark:text-gray-900 disabled:opacity-40"
              >
                {saving ? "Saving..." : isReassign ? "Reassign Driver" : "Assign Driver"}
              </Button>
            );
            if (pendingUnavailable && disabledReason) {
              return (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex-1 inline-flex">{btn}</span>
                    </TooltipTrigger>
                    <TooltipContent>{disabledReason}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }
            return btn;
          })()}
        </div>
      </div>
    </>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{label}</div>
      {children}
    </section>
  );
}
function Row({ label, value, mono, urgent }: { label: string; value: string; mono?: boolean; urgent?: boolean }) {
  return (
    <div className="flex justify-between text-sm py-0.5">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`${mono ? "font-mono text-xs" : ""} ${urgent ? "text-red-500" : "text-gray-900 dark:text-gray-100"}`}>{value}</span>
    </div>
  );
}
