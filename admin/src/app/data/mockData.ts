export interface Ride {
  id: string;
  passengerName: string;
  phone: string;
  companyName: string;
  projectLeader: string;
  projectCode: string;
  pickupLocation: string;
  destination: string;
  vehicleClass: "Premium Sedans" | "Premium SUV" | "Custom Your Luxury";
  requestTime: Date;
  scheduledPickupTime: Date;
  status: "pending" | "calling" | "confirmed" | "assigned" | "heading_pickup" | "arrived" | "in_progress" | "completed" | "cancelled";
  assignedDriver?: string;
  billingStatus: "not_reviewed" | "called" | "approved" | "invoiced" | "paid" | "cancelled";
  amount?: number;
  paymentNotes?: string;
  internalNotes?: string;
  callStatus?: string;
  events: RideEvent[];
}

export interface RideEvent {
  timestamp: Date;
  action: string;
  user: string;
  notes?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleClass: "Premium Sedans" | "Premium SUV" | "Custom Your Luxury";
  vehicleModel: string;
  plateNumber: string;
  currentArea: string;
  availability: "available" | "unavailable" | "on_ride";
  active: boolean;
  notes?: string;
  // Ban fields
  banned?: boolean;
  banUntil?: Date | null;   // null = permanent ban
  banReason?: string;
}

export interface VehicleClass {
  id: string;
  name: "Premium Sedans" | "Premium SUV" | "Custom Your Luxury";
  description: string;
  availableCount: number;
  active: boolean;
}

export const mockRides: Ride[] = [
  {
    id: "R001",
    passengerName: "Sarah Chen",
    phone: "+1 (555) 123-4567",
    companyName: "TechCorp Industries",
    projectLeader: "Michael Roberts",
    projectCode: "TC-2024-045",
    pickupLocation: "TechCorp HQ, 1234 Innovation Drive",
    destination: "Metropolitan Airport Terminal 2",
    vehicleClass: "Premium SUV",
    requestTime: new Date(2026, 3, 24, 8, 30),
    scheduledPickupTime: new Date(2026, 3, 24, 14, 0),
    status: "pending",
    billingStatus: "not_reviewed",
    events: [
      {
        timestamp: new Date(2026, 3, 24, 8, 30),
        action: "Ride requested",
        user: "System",
      },
    ],
  },
  {
    id: "R002",
    passengerName: "James Wilson",
    phone: "+1 (555) 234-5678",
    companyName: "Global Finance Corp",
    projectLeader: "Emily Davis",
    projectCode: "GFC-Q2-089",
    pickupLocation: "Grand Hotel Downtown",
    destination: "Convention Center West Hall",
    vehicleClass: "Premium Sedans",
    requestTime: new Date(2026, 3, 24, 9, 15),
    scheduledPickupTime: new Date(2026, 3, 24, 10, 30),
    status: "confirmed",
    assignedDriver: "D001",
    billingStatus: "approved",
    amount: 85,
    internalNotes: "VIP client - priority service",
    callStatus: "Confirmed - client ready",
    events: [
      {
        timestamp: new Date(2026, 3, 24, 9, 15),
        action: "Ride requested",
        user: "System",
      },
      {
        timestamp: new Date(2026, 3, 24, 9, 20),
        action: "Customer called",
        user: "Admin Sarah",
        notes: "Confirmed details",
      },
      {
        timestamp: new Date(2026, 3, 24, 9, 25),
        action: "Status changed to confirmed",
        user: "Admin Sarah",
      },
      {
        timestamp: new Date(2026, 3, 24, 9, 30),
        action: "Driver assigned",
        user: "Admin Sarah",
        notes: "Assigned David Martinez - ETA 10:20",
      },
    ],
  },
  {
    id: "R003",
    passengerName: "Amanda Foster",
    phone: "+1 (555) 345-6789",
    companyName: "Nexus Consulting",
    projectLeader: "Robert Kim",
    projectCode: "NXC-2024-122",
    pickupLocation: "45 Corporate Plaza Suite 800",
    destination: "Executive Airport Private Terminal",
    vehicleClass: "Custom Your Luxury",
    requestTime: new Date(2026, 3, 24, 7, 45),
    scheduledPickupTime: new Date(2026, 3, 24, 16, 30),
    status: "assigned",
    assignedDriver: "D003",
    billingStatus: "not_reviewed",
    internalNotes: "Executive client - custom luxury requested",
    callStatus: "Confirmed - all details verified",
    events: [
      {
        timestamp: new Date(2026, 3, 24, 7, 45),
        action: "Ride requested",
        user: "System",
      },
      {
        timestamp: new Date(2026, 3, 24, 8, 0),
        action: "Customer called",
        user: "Admin Mike",
        notes: "Verified luxury requirements",
      },
      {
        timestamp: new Date(2026, 3, 24, 8, 10),
        action: "Status changed to confirmed",
        user: "Admin Mike",
      },
      {
        timestamp: new Date(2026, 3, 24, 9, 0),
        action: "Driver assigned",
        user: "Admin Mike",
        notes: "Assigned Lisa Anderson - Mercedes S-Class",
      },
    ],
  },
  {
    id: "R004",
    passengerName: "David Park",
    phone: "+1 (555) 456-7890",
    companyName: "Stellar Solutions",
    projectLeader: "Jennifer Lee",
    projectCode: "SS-DEV-078",
    pickupLocation: "Riverside Business Center",
    destination: "City Center Meeting Hall",
    vehicleClass: "Premium Sedans",
    requestTime: new Date(2026, 3, 24, 6, 30),
    scheduledPickupTime: new Date(2026, 3, 24, 9, 0),
    status: "completed",
    assignedDriver: "D002",
    billingStatus: "paid",
    amount: 65,
    paymentNotes: "Invoiced and paid via corporate account",
    events: [
      {
        timestamp: new Date(2026, 3, 24, 6, 30),
        action: "Ride requested",
        user: "System",
      },
      {
        timestamp: new Date(2026, 3, 24, 6, 45),
        action: "Customer called",
        user: "Admin Lisa",
      },
      {
        timestamp: new Date(2026, 3, 24, 6, 50),
        action: "Status changed to confirmed",
        user: "Admin Lisa",
      },
      {
        timestamp: new Date(2026, 3, 24, 7, 0),
        action: "Driver assigned",
        user: "Admin Lisa",
        notes: "Assigned Marcus Thompson",
      },
      {
        timestamp: new Date(2026, 3, 24, 9, 35),
        action: "Ride completed",
        user: "System",
      },
    ],
  },
  {
    id: "R005",
    passengerName: "Rachel Martinez",
    phone: "+1 (555) 567-8901",
    companyName: "Innovate Labs",
    projectLeader: "Thomas Anderson",
    projectCode: "IL-RD-2024",
    pickupLocation: "Downtown Metro Station Exit B",
    destination: "Research Campus Building 3",
    vehicleClass: "Premium SUV",
    requestTime: new Date(2026, 3, 24, 10, 0),
    scheduledPickupTime: new Date(2026, 3, 24, 11, 15),
    status: "calling",
    billingStatus: "not_reviewed",
    internalNotes: "Attempting to reach customer",
    events: [
      {
        timestamp: new Date(2026, 3, 24, 10, 0),
        action: "Ride requested",
        user: "System",
      },
      {
        timestamp: new Date(2026, 3, 24, 10, 5),
        action: "Calling customer",
        user: "Admin Sarah",
        notes: "First call attempt - no answer",
      },
    ],
  },
];

export const mockDrivers: Driver[] = [
  {
    id: "D001",
    name: "David Martinez",
    phone: "+1 (555) 111-2222",
    vehicleClass: "Premium Sedans",
    vehicleModel: "BMW 7 Series",
    plateNumber: "VEL 001",
    currentArea: "Downtown",
    availability: "on_ride",
    active: true,
  },
  {
    id: "D002",
    name: "Marcus Thompson",
    phone: "+1 (555) 222-3333",
    vehicleClass: "Premium Sedans",
    vehicleModel: "Audi A8",
    plateNumber: "VEL 002",
    currentArea: "Airport",
    availability: "available",
    active: true,
  },
  {
    id: "D003",
    name: "Lisa Anderson",
    phone: "+1 (555) 333-4444",
    vehicleClass: "Custom Your Luxury",
    vehicleModel: "Mercedes S-Class",
    plateNumber: "VEL 003",
    currentArea: "North District",
    availability: "on_ride",
    active: true,
  },
  {
    id: "D004",
    name: "Kevin Chen",
    phone: "+1 (555) 444-5555",
    vehicleClass: "Premium SUV",
    vehicleModel: "Cadillac Escalade",
    plateNumber: "VEL 004",
    currentArea: "Business District",
    availability: "available",
    active: true,
  },
  {
    id: "D005",
    name: "Nina Rodriguez",
    phone: "+1 (555) 555-6666",
    vehicleClass: "Premium SUV",
    vehicleModel: "Lincoln Navigator",
    plateNumber: "VEL 005",
    currentArea: "West Side",
    availability: "available",
    active: true,
  },
  {
    id: "D006",
    name: "James Wilson",
    phone: "+1 (555) 666-7777",
    vehicleClass: "Premium Sedans",
    vehicleModel: "Lexus LS",
    plateNumber: "VEL 006",
    currentArea: "East Side",
    availability: "unavailable",
    active: true,
    notes: "Off duty until 2 PM",
  },
];

export const mockVehicleClasses: VehicleClass[] = [
  {
    id: "VC001",
    name: "Premium Sedans",
    description: "Luxury sedans for executive travel and business meetings",
    availableCount: 3,
    active: true,
  },
  {
    id: "VC002",
    name: "Premium SUV",
    description: "Spacious premium SUVs for group travel and airport transfers",
    availableCount: 2,
    active: true,
  },
  {
    id: "VC003",
    name: "Custom Your Luxury",
    description: "Ultra-premium custom luxury vehicles for VIP clients",
    availableCount: 1,
    active: true,
  },
];