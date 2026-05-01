import { useEffect, useState } from "react";
import { type Ride } from "../data/mockData";
import { fetchAdminData } from "../services/api";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { DollarSign, Phone } from "lucide-react";
import { format } from "date-fns";

export function BillingReview() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [amount, setAmount] = useState("");
  const [billingStatus, setBillingStatus] = useState<Ride["billingStatus"]>("not_reviewed");
  const [paymentNotes, setPaymentNotes] = useState("");

  useEffect(() => {
    fetchAdminData()
      .then((data) => setRides(data.rides))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load billing data"));
  }, []);

  const filteredRides = rides
    .filter((r) => r.status === "completed" || r.status === "assigned")
    .filter((r) => statusFilter === "all" || r.billingStatus === statusFilter)
    .filter((r) => companyFilter === "all" || r.companyName === companyFilter);

  const companies = Array.from(new Set(rides.map((r) => r.companyName)));

  const getBillingStatusColor = (status: Ride["billingStatus"]) => {
    switch (status) {
      case "not_reviewed":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "called":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "approved":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "invoiced":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "paid":
        return "bg-green-100 text-green-700 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "";
    }
  };

  const handleRideClick = (ride: Ride) => {
    setSelectedRide(ride);
    setAmount(ride.amount?.toString() || "");
    setBillingStatus(ride.billingStatus);
    setPaymentNotes(ride.paymentNotes || "");
  };

  const handleSave = () => {
    console.log("Saving billing info:", { amount, billingStatus, paymentNotes });
    setSelectedRide(null);
  };

  return (
    <div className="min-h-full bg-[#f7f7f5] p-6 space-y-6 dark:bg-gray-950">
      <div>
        <h1 className="text-2xl mb-1">Riyadh Billing Review</h1>
        <p className="text-sm text-gray-500">{error || "Review and manage ride billing"}</p>
      </div>

      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Billing Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="not_reviewed">Not Reviewed</SelectItem>
            <SelectItem value="called">Called</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="invoiced">Invoiced</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company} value={company}>
                {company}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white border border-[#e7dfcd] rounded-xl overflow-hidden shadow-sm dark:bg-gray-900 dark:border-gray-800">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Ride ID
              </th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Passenger
              </th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Company / Project
              </th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Billing Status
              </th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRides.map((ride) => (
              <tr key={ride.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="font-mono text-sm">{ride.id}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{ride.passengerName}</div>
                  <div className="text-sm text-gray-500">{ride.phone}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">{ride.companyName}</div>
                  <div className="text-xs text-gray-500">{ride.projectCode}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">
                    {format(ride.scheduledPickupTime, "MMM d, yyyy")}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(ride.scheduledPickupTime, "h:mm a")}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {ride.amount ? (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{ride.amount.toFixed(2)}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Not set</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge className={getBillingStatusColor(ride.billingStatus)}>
                    {ride.billingStatus.replace("_", " ")}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRideClick(ride)}
                  >
                    Review
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={selectedRide !== null} onOpenChange={(open) => !open && setSelectedRide(null)}>
        <DialogContent className="max-w-lg">
          {selectedRide && (
            <>
              <DialogHeader>
                <DialogTitle>Billing Review · {selectedRide.id}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Passenger</span>
                    <span className="font-medium">{selectedRide.passengerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Company</span>
                    <span>{selectedRide.companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Project Code</span>
                    <span className="font-mono text-xs">{selectedRide.projectCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vehicle Class</span>
                    <Badge variant="outline">{selectedRide.vehicleClass}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ride Date</span>
                    <span>{format(selectedRide.scheduledPickupTime, "MMM d, yyyy h:mm a")}</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="amount">Amount (USD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="billingStatus">Billing Status</Label>
                  <Select
                    value={billingStatus}
                    onValueChange={(val) => setBillingStatus(val as Ride["billingStatus"])}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_reviewed">Not Reviewed</SelectItem>
                      <SelectItem value="called">Called</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="invoiced">Invoiced</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="paymentNotes">Payment Notes</Label>
                  <Textarea
                    id="paymentNotes"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Add payment notes, invoice number, etc..."
                    className="mt-1.5"
                    rows={3}
                  />
                </div>

                <div className="pt-2">
                  <Button variant="outline" className="w-full">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Customer
                  </Button>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedRide(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="flex-1 bg-black hover:bg-gray-800">
                    Save Changes
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
