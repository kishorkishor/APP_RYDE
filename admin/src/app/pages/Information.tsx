import { useState, useMemo } from "react";
import { useAdminDataContext } from "../context/AdminDataContext";
import { FileText, Search, Download, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 25;

function formatTime(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function Information() {
  const { rides, loading, error } = useAdminDataContext();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    const base = search.trim()
      ? rides.filter(
          (r) =>
            r.passengerName.toLowerCase().includes(search.toLowerCase()) ||
            r.projectCode.toLowerCase().includes(search.toLowerCase()) ||
            r.pickupLocation.toLowerCase().includes(search.toLowerCase()) ||
            r.destination.toLowerCase().includes(search.toLowerCase())
        )
      : rides;

    // Sort: completed/cancelled rides by completedAt (newest first), then others by requestTime
    const filtered = [...base].sort((a, b) => {
      const aTime = a.completedAt?.getTime() ?? a.requestTime.getTime();
      const bTime = b.completedAt?.getTime() ?? b.requestTime.getTime();
      return bTime - aTime;
    });

    return filtered.map((r, idx) => {
      const requestedAt = r.requestTime;
      const scheduled = r.scheduledPickupTime;
      const diff = Math.max(0, Math.round((scheduled.getTime() - requestedAt.getTime()) / 60000));

      return {
        sl: idx + 1,
        passengerName: r.passengerName,
        caseCode: r.projectCode,
        dated: requestedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        pickup: r.pickupLocation,
        dropoff: r.destination,
        actualPickupTime: formatTime(scheduled),
        dropoffTime: r.completedAt ? formatTime(r.completedAt) : "-",
        waitingTime: diff > 0 ? `${diff} min` : "-",
        status: r.status,
      };
    });
  }, [rides, search]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleExportCSV = () => {
    const headers = ["SL", "Passenger Name", "Case Code", "Dated", "Pickup", "Dropoff", "Actual Pickup Time", "Drop-off Time", "Waiting Time", "Status"];
    const csvRows = [headers.join(",")];
    for (const r of rows) {
      csvRows.push(
        [r.sl, `"${r.passengerName}"`, `"${r.caseCode}"`, `"${r.dated}"`, `"${r.pickup}"`, `"${r.dropoff}"`, `"${r.actualPickupTime}"`, `"${r.dropoffTime}"`, `"${r.waitingTime}"`, `"${r.status}"`].join(",")
      );
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ride-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-[#d7b35f] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#d7b35f]" />
              Information
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Ride log with {rides.length} total records
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search passenger, code, address..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-9 pr-4 py-2 w-72 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d7b35f]/50"
              />
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 w-12">SL</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Passenger Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Case Code</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Dated</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Pickup</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Dropoff</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actual Pickup Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Drop-off Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Waiting Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-400">
                    {search ? "No rides match your search" : "No ride records found"}
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => (
                  <tr key={r.sl} className="hover:bg-gray-50/60 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{r.sl}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{r.passengerName}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-[#d7b35f]/10 text-[#d7b35f] text-xs font-medium">
                        {r.caseCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.dated}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[180px] truncate" title={r.pickup}>{r.pickup}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[180px] truncate" title={r.dropoff}>{r.dropoff}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{r.actualPickupTime}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{r.dropoffTime}</td>
                    <td className="px-4 py-3">
                      {r.waitingTime !== "-" ? (
                        <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-500 text-xs font-medium">{r.waitingTime}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                        r.status === "completed" ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                        r.status === "cancelled" ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                        r.status === "in_progress" ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" :
                        r.status === "heading_pickup" ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" :
                        r.status === "arrived" ? "bg-teal-500/10 text-teal-600 dark:text-teal-400" :
                        r.status === "assigned" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                        "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}>
                        {r.status === "heading_pickup" ? "En Route" :
                         r.status === "in_progress" ? "In Progress" :
                         r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 pb-4 flex-shrink-0 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, rows.length)} of {rows.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
