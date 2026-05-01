import { useEffect, useState, useMemo } from "react";
import { type Driver } from "../data/mockData";
import { useDriverAvailability } from "../hooks/useDriverAvailability";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Plus, Edit, Phone, Search, ShieldBan, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { format, addHours, addDays, addWeeks, addMonths } from "date-fns";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isBanActive(driver: Driver): boolean {
  if (!driver.banned) return false;
  if (!driver.banUntil) return true; // permanent
  return driver.banUntil.getTime() > Date.now();
}

function banLabel(driver: Driver): string {
  if (!driver.banUntil) return "Banned · Permanent";
  const remaining = driver.banUntil.getTime() - Date.now();
  if (remaining <= 0) return "";
  const h = Math.floor(remaining / 3600000);
  if (h < 24) return `Banned · ${h}h remaining`;
  const d = Math.floor(h / 24);
  return `Banned · ${d}d remaining`;
}

function availabilityStyle(a: Driver["availability"]) {
  switch (a) {
    case "available":   return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800";
    case "on_ride":     return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800";
    case "unavailable": return "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
  }
}

const BAN_DURATIONS = [
  { label: "1 hour",     value: "1h" },
  { label: "6 hours",    value: "6h" },
  { label: "1 day",      value: "1d" },
  { label: "3 days",     value: "3d" },
  { label: "1 week",     value: "1w" },
  { label: "2 weeks",    value: "2w" },
  { label: "1 month",    value: "1mo" },
  { label: "Permanent",  value: "perm" },
];

function banUntilFromValue(value: string): Date | null {
  const now = new Date();
  switch (value) {
    case "1h":  return addHours(now, 1);
    case "6h":  return addHours(now, 6);
    case "1d":  return addDays(now, 1);
    case "3d":  return addDays(now, 3);
    case "1w":  return addWeeks(now, 1);
    case "2w":  return addWeeks(now, 2);
    case "1mo": return addMonths(now, 1);
    case "perm": return null;
    default:    return addDays(now, 1);
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DriverManagement() {
  const { drivers: liveDrivers, error: pollError } = useDriverAvailability();
  // Local copy lets us layer in admin-only state (ban, edits) on top of the
  // polled live availability. We re-merge whenever the poll returns new data.
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [availFilter, setAvailFilter] = useState("all");

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banningDriver, setBanningDriver] = useState<Driver | null>(null);

  // Merge live availability into local state on each poll, preserving
  // admin-only fields (banned, banUntil, banReason, notes overrides).
  useEffect(() => {
    setDrivers((prev) => {
      const prevById = new Map(prev.map((d) => [d.id, d]));
      return liveDrivers.map((live) => {
        const existing = prevById.get(live.id);
        if (!existing) return live;
        return {
          ...live,
          banned: existing.banned,
          banUntil: existing.banUntil,
          banReason: existing.banReason,
          notes: existing.notes ?? live.notes,
        };
      });
    });
  }, [liveDrivers]);

  useEffect(() => {
    setError(pollError);
  }, [pollError]);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return drivers.filter((d) => {
      const ms = !q || d.name.toLowerCase().includes(q) ||
        d.phone.includes(q) || d.vehicleModel.toLowerCase().includes(q) ||
        d.vehicleClass.toLowerCase().includes(q) || d.currentArea.toLowerCase().includes(q) ||
        d.plateNumber.toLowerCase().includes(q);
      const mc = classFilter === "all" || d.vehicleClass === classFilter;
      const ma = availFilter === "all" || d.availability === availFilter;
      return ms && mc && ma;
    });
  }, [drivers, search, classFilter, availFilter]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const openBanDialog = (driver: Driver) => {
    setBanningDriver(driver);
    setShowBanDialog(true);
  };

  const handleUnban = (driverId: string) => {
    setDrivers((prev) => prev.map((d) => d.id === driverId ? { ...d, banned: false, banUntil: undefined, banReason: undefined } : d));
  };

  const handleBanConfirm = (driverId: string, duration: string, reason: string) => {
    const banUntil = banUntilFromValue(duration);
    setDrivers((prev) => prev.map((d) => d.id === driverId ? { ...d, banned: true, banUntil, banReason: reason } : d));
    setShowBanDialog(false);
    setBanningDriver(null);
  };

  const handleEditSave = (updated: Partial<Driver>) => {
    if (editingDriver) {
      setDrivers((prev) => prev.map((d) => d.id === editingDriver.id ? { ...d, ...updated } : d));
    } else {
      // add new
      const newDriver: Driver = {
        id: `D${String(drivers.length + 1).padStart(3, "0")}`,
        name: updated.name || "",
        phone: updated.phone || "",
        vehicleClass: updated.vehicleClass || "Premium Sedans",
        vehicleModel: updated.vehicleModel || "",
        plateNumber: updated.plateNumber || "",
        currentArea: updated.currentArea || "",
        availability: "unavailable",
        active: true,
        notes: updated.notes,
      };
      setDrivers((prev) => [...prev, newDriver]);
    }
    setShowEditDialog(false);
    setEditingDriver(null);
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    available:   drivers.filter((d) => d.availability === "available" && !isBanActive(d)).length,
    onRide:      drivers.filter((d) => d.availability === "on_ride").length,
    unavailable: drivers.filter((d) => d.availability === "unavailable").length,
    banned:      drivers.filter((d) => isBanActive(d)).length,
  }), [drivers]);

  return (
    <div className="h-full flex flex-col bg-[#f7f7f5] dark:bg-gray-950 overflow-auto">

      {/* Header */}
      <div className="bg-white/95 dark:bg-gray-900 border-b border-[#e7dfcd] dark:border-gray-800 px-6 py-4 flex-shrink-0 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-xl tracking-tight text-gray-900 dark:text-gray-100">Riyadh Driver Management</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {error || "Driver availability synced live from driver app. Admin cannot override online/offline status"}
            </p>
          </div>
          <Button onClick={() => { setEditingDriver(null); setShowEditDialog(true); }} className="bg-[#171715] text-[#f5dd95] hover:bg-[#27231a] dark:bg-[#d7b35f] dark:text-[#171715] dark:hover:bg-[#e4c878] h-8 text-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Driver
          </Button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {[
            { label: "Available", count: stats.available, cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800" },
            { label: "On Ride",   count: stats.onRide,    cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800" },
            { label: "Offline",   count: stats.unavailable, cls: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700" },
            { label: "Banned",    count: stats.banned,    cls: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800" },
          ].map(({ label, count, cls }) => (
            <span key={label} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${cls}`}>
              {count} {label}
            </span>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 items-center flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              placeholder="Search name, vehicle, area, plate…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-44 h-8 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              <SelectItem value="Premium Sedans">Premium Sedans</SelectItem>
              <SelectItem value="Premium SUV">Premium SUV</SelectItem>
              <SelectItem value="Custom Your Luxury">Custom Your Luxury</SelectItem>
            </SelectContent>
          </Select>
          <Select value={availFilter} onValueChange={setAvailFilter}>
            <SelectTrigger className="w-36 h-8 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="on_ride">On Ride</SelectItem>
              <SelectItem value="unavailable">Offline</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{filtered.length} drivers</span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 p-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700/60">
                {["Driver", "Vehicle", "Area", "App Status", "Ban", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((driver) => {
                const banned = isBanActive(driver);
                return (
                  <tr key={driver.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors ${banned ? "opacity-70" : ""}`}>

                    {/* Driver */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* Live sync dot */}
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          driver.availability === "available" ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" :
                          driver.availability === "on_ride"   ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                        }`} title="Live from driver app" />
                        <div>
                          <div className="text-sm text-gray-900 dark:text-gray-100">{driver.name}</div>
                          <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {driver.phone}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Vehicle */}
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-800 dark:text-gray-200">{driver.vehicleModel}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{driver.plateNumber}</div>
                      <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                        {driver.vehicleClass}
                      </span>
                    </td>

                    {/* Area */}
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-800 dark:text-gray-200">{driver.currentArea}</div>
                      {driver.notes && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic">{driver.notes}</div>}
                    </td>

                    {/* App Status — read-only, from driver app */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {driver.availability === "available" ? (
                          <Wifi className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        ) : driver.availability === "on_ride" ? (
                          <Wifi className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        ) : (
                          <WifiOff className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        )}
                        <Badge className={`text-xs border ${availabilityStyle(driver.availability)}`}>
                          {driver.availability === "on_ride" ? "On Ride" : driver.availability.charAt(0).toUpperCase() + driver.availability.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-600 mt-1 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-green-400 inline-block" />
                        Synced from app
                      </div>
                    </td>

                    {/* Ban status */}
                    <td className="px-4 py-3">
                      {banned ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800">
                            <ShieldBan className="w-3 h-3" />
                            Banned
                          </span>
                          <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                            {driver.banUntil ? `Until ${format(driver.banUntil, "MMM d, h:mm a")}` : "Permanent"}
                          </div>
                          {driver.banReason && (
                            <div className="text-[10px] text-gray-400 dark:text-gray-500 italic max-w-[120px] truncate" title={driver.banReason}>
                              {driver.banReason}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setEditingDriver(driver); setShowEditDialog(true); }}
                          className="h-7 text-xs dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        {banned ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnban(driver.id)}
                            className="h-7 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          >
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Lift Ban
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openBanDialog(driver)}
                            className="h-7 text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <ShieldBan className="w-3 h-3 mr-1" />
                            Ban
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 dark:text-gray-600 text-sm">
                    No drivers match your search
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Add Dialog */}
      <DriverEditDialog
        open={showEditDialog}
        driver={editingDriver}
        onClose={() => { setShowEditDialog(false); setEditingDriver(null); }}
        onSave={handleEditSave}
      />

      {/* Ban Dialog */}
      {banningDriver && (
        <BanDialog
          open={showBanDialog}
          driver={banningDriver}
          onClose={() => { setShowBanDialog(false); setBanningDriver(null); }}
          onConfirm={handleBanConfirm}
        />
      )}
    </div>
  );
}

// ─── Edit / Add Dialog ────────────────────────────────────────────────────────
function DriverEditDialog({ open, driver, onClose, onSave }: {
  open: boolean; driver: Driver | null;
  onClose: () => void; onSave: (d: Partial<Driver>) => void;
}) {
  const [form, setForm] = useState<Partial<Driver>>(
    driver || { name: "", phone: "", vehicleClass: "Premium Sedans", vehicleModel: "", plateNumber: "", currentArea: "", notes: "" }
  );

  // Sync form when driver changes
  useState(() => {
    setForm(driver || { name: "", phone: "", vehicleClass: "Premium Sedans", vehicleModel: "", plateNumber: "", currentArea: "", notes: "" });
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg dark:bg-gray-900 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">{driver ? "Edit Driver" : "Add New Driver"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs dark:text-gray-300">Driver Name</Label>
              <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 h-8 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
            </div>
            <div>
              <Label className="text-xs dark:text-gray-300">Phone Number</Label>
              <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 h-8 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
            </div>
          </div>
          <div>
            <Label className="text-xs dark:text-gray-300">Vehicle Class</Label>
            <Select value={form.vehicleClass} onValueChange={(v) => setForm({ ...form, vehicleClass: v as Driver["vehicleClass"] })}>
              <SelectTrigger className="mt-1 h-8 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Premium Sedans">Premium Sedans</SelectItem>
                <SelectItem value="Premium SUV">Premium SUV</SelectItem>
                <SelectItem value="Custom Your Luxury">Custom Your Luxury</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs dark:text-gray-300">Vehicle Model</Label>
              <Input value={form.vehicleModel || ""} onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })} placeholder="e.g. BMW 7 Series" className="mt-1 h-8 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
            </div>
            <div>
              <Label className="text-xs dark:text-gray-300">Plate Number</Label>
              <Input value={form.plateNumber || ""} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} placeholder="e.g. VEL 007" className="mt-1 h-8 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
            </div>
          </div>
          <div>
            <Label className="text-xs dark:text-gray-300">Current Area</Label>
            <Input value={form.currentArea || ""} onChange={(e) => setForm({ ...form, currentArea: e.target.value })} placeholder="e.g. Downtown" className="mt-1 h-8 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
          </div>
          <div>
            <Label className="text-xs dark:text-gray-300">Notes</Label>
            <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes…" className="mt-1 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" rows={2} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 h-8 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">Cancel</Button>
            <Button onClick={() => onSave(form)} className="flex-1 h-8 text-sm bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-gray-100 text-white dark:text-gray-900">
              {driver ? "Save Changes" : "Add Driver"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Ban Dialog ───────────────────────────────────────────────────────────────
function BanDialog({ open, driver, onClose, onConfirm }: {
  open: boolean; driver: Driver;
  onClose: () => void; onConfirm: (driverId: string, duration: string, reason: string) => void;
}) {
  const [duration, setDuration] = useState("1d");
  const [reason, setReason] = useState("");

  const banUntil = banUntilFromValue(duration);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md dark:bg-gray-900 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100 flex items-center gap-2">
            <ShieldBan className="w-5 h-5 text-red-500" />
            Ban Driver
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {/* Driver info */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg px-4 py-3">
            <div className="text-sm text-gray-900 dark:text-gray-100">{driver.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{driver.vehicleModel} · {driver.plateNumber}</div>
          </div>

          <div>
            <Label className="text-xs dark:text-gray-300">Ban Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="mt-1 h-8 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BAN_DURATIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {banUntil && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Ban lifts automatically on {format(banUntil, "MMM d, yyyy 'at' h:mm a")}
              </p>
            )}
            {!banUntil && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                Permanent ban — must be manually lifted by an admin
              </p>
            )}
          </div>

          <div>
            <Label className="text-xs dark:text-gray-300">Reason for Ban</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe why this driver is being banned…"
              className="mt-1 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1 h-8 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">Cancel</Button>
            <Button
              onClick={() => { if (reason.trim()) onConfirm(driver.id, duration, reason); }}
              disabled={!reason.trim()}
              className="flex-1 h-8 text-sm bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
            >
              <ShieldBan className="w-3.5 h-3.5 mr-1.5" />
              Confirm Ban
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
