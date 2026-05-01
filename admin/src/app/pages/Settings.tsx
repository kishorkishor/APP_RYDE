import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Settings as SettingsIcon, Users, Building, Bell, Database } from "lucide-react";

export function Settings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl mb-1">Settings</h1>
        <p className="text-sm text-gray-500">Configure system settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <CardTitle className="text-base">Admin Users</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <div className="font-medium text-sm">Admin Sarah</div>
                <div className="text-xs text-gray-500">sarah@ryde.com</div>
              </div>
              <Badge>Owner</Badge>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <div className="font-medium text-sm">Admin Mike</div>
                <div className="text-xs text-gray-500">mike@ryde.com</div>
              </div>
              <Badge variant="outline">Admin</Badge>
            </div>
            <div className="flex items-center justify-between pb-3">
              <div>
                <div className="font-medium text-sm">Admin Lisa</div>
                <div className="text-xs text-gray-500">lisa@ryde.com</div>
              </div>
              <Badge variant="outline">Admin</Badge>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Manage Users
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              <CardTitle className="text-base">User Roles</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="font-medium">Owner</span>
                <span className="text-gray-500">Full access</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="font-medium">Admin</span>
                <span className="text-gray-500">Dispatch & billing</span>
              </div>
              <div className="flex items-center justify-between pb-2">
                <span className="font-medium">Dispatcher</span>
                <span className="text-gray-500">Ride management only</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Configure Roles
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              <CardTitle className="text-base">Companies & Projects</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-500">
              Manage corporate clients and project codes for ride categorization and billing.
            </div>
            <div className="space-y-2">
              <div>
                <Label htmlFor="newCompany">Add Company</Label>
                <Input
                  id="newCompany"
                  placeholder="Company name"
                  className="mt-1.5"
                />
              </div>
              <Button variant="outline" size="sm" className="w-full">
                View All Companies
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <CardTitle className="text-base">Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-500">
              Configure notification templates for customers and drivers.
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>SMS notifications</span>
                <Badge variant="outline">Configured</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Email templates</span>
                <Badge variant="outline">Configured</Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Manage Templates
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              <CardTitle className="text-base">Backend Configuration</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-500">
              This system uses Appwrite as the backend. Current collections: profiles, rides,
              vehicle_classes. Planned: drivers, ride_events, admin_users.
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">Database</div>
                <div className="font-medium">Appwrite Cloud</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">Collections</div>
                <div className="font-medium">3 Active</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">Status</div>
                <Badge className="bg-green-100 text-green-700 border-green-200">Connected</Badge>
              </div>
            </div>
            <Button variant="outline" size="sm">
              View Appwrite Console
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
