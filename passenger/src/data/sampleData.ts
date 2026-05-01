// ─── Sample Data ──────────────────────────────────────────────────────────────
// Ported 1:1 from the Figma prototype's sampleData.ts

import type {
  RideOption,
  DriverAssignment,
  TripRecord,
  PaymentCard,
  RideLocation,
} from '@/src/types';

export const RIDE_OPTIONS: RideOption[] = [
  {
    id: 'premium_sedan',
    name: 'Premium Sedans',
    tagline: 'Executive sedans for private city travel',
    eta: 6,
    capacity: 4,
    availabilityCount: 0,
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'premium_suv',
    name: 'Premium SUV',
    tagline: 'Spacious premium SUVs for group comfort',
    eta: 8,
    capacity: 6,
    availabilityCount: 0,
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'custom_luxury',
    name: 'Custom Your Luxury',
    tagline: 'Tailored luxury booking for special requests',
    eta: 12,
    capacity: 4,
    availabilityCount: 0,
    sortOrder: 3,
    isActive: true,
  },
];

export const SAMPLE_DRIVER: DriverAssignment = {
  id: 'drv001',
  name: 'Marcus Johnson',
  rating: 4.95,
  totalTrips: 2847,
  vehicle: 'Toyota Camry',
  vehicleColor: 'Pearl White',
  plateNumber: 'ABC · 1234',
  initials: 'MJ',
  avatarBg: '#1E293B',
  etaMinutes: 4,
  distanceAway: '0.8 km away',
  photoUrl:
    'https://images.unsplash.com/photo-1741389265274-fd22f41dd5e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
};

export const RECENT_PLACES: RideLocation[] = [
  { label: 'Kingdom Centre', address: 'King Fahd Road, Al Olaya, Riyadh', latitude: 24.7114, longitude: 46.6744, distanceKm: 2.3, cityId: 'riyadh', countryCode: 'SA' },
  { label: 'Riyadh Park', address: 'Northern Ring Branch Road, Riyadh', latitude: 24.7569, longitude: 46.6300, distanceKm: 8.1, cityId: 'riyadh', countryCode: 'SA' },
  { label: 'King Khalid International Airport', address: 'Airport Road, Riyadh', latitude: 24.9576, longitude: 46.6988, distanceKm: 34.2, cityId: 'riyadh', countryCode: 'SA' },
  { label: 'Boulevard Riyadh City', address: 'Hittin, Riyadh', latitude: 24.7692, longitude: 46.6047, distanceKm: 11.5, cityId: 'riyadh', countryCode: 'SA' },
  { label: 'Al Faisaliah Tower', address: 'King Fahd Road, Al Olaya, Riyadh', latitude: 24.6905, longitude: 46.6853, distanceKm: 1.8, cityId: 'riyadh', countryCode: 'SA' },
];

export const SAVED_PLACES: RideLocation[] = [
  { label: 'Home', address: 'Al Olaya, Riyadh', latitude: 24.6942, longitude: 46.6828, cityId: 'riyadh', countryCode: 'SA' },
  { label: 'Work', address: 'King Abdullah Financial District, Riyadh', latitude: 24.7641, longitude: 46.6406, cityId: 'riyadh', countryCode: 'SA' },
];

export const SEARCH_SUGGESTIONS: RideLocation[] = [
  { label: 'Kingdom Centre', address: 'King Fahd Road, Al Olaya, Riyadh', latitude: 24.7114, longitude: 46.6744, distanceKm: 2.3, cityId: 'riyadh', countryCode: 'SA' },
  { label: 'Riyadh Front', address: 'Airport Road, Riyadh', latitude: 24.8380, longitude: 46.7292, distanceKm: 18.4, cityId: 'riyadh', countryCode: 'SA' },
  { label: 'The Zone', address: 'Al Mohammadiyyah, Riyadh', latitude: 24.7377, longitude: 46.6550, distanceKm: 6.7, cityId: 'riyadh', countryCode: 'SA' },
  { label: 'Diriyah Gate', address: 'At-Turaif, Diriyah', latitude: 24.7343, longitude: 46.5759, distanceKm: 15.9, cityId: 'riyadh', countryCode: 'SA' },
  { label: 'Riyadh Gallery Mall', address: 'King Fahd Road, Riyadh', latitude: 24.7435, longitude: 46.6573, distanceKm: 6.9, cityId: 'riyadh', countryCode: 'SA' },
];

export const TRIP_HISTORY: TripRecord[] = [
  { id: 'r001', dateLabel: 'Today, 9:15 AM', pickup: 'Home', dropoff: 'One World Trade Center', fare: 14.2, rideName: 'Comfort', status: 'completed', durationMin: 22, distanceKm: 8.3, driverName: 'Marcus J.', rating: 5 },
  { id: 'r002', dateLabel: 'Yesterday, 7:42 PM', pickup: 'Times Square', dropoff: 'JFK Airport', fare: 38.5, rideName: 'Premium', status: 'completed', durationMin: 45, distanceKm: 18.9, driverName: 'Sarah K.', rating: 5 },
  { id: 'r003', dateLabel: 'Mon, Apr 19', pickup: 'Brooklyn Bridge', dropoff: 'Central Park', fare: 12.8, rideName: 'Swift Go', status: 'completed', durationMin: 28, distanceKm: 7.2, driverName: 'Daniel R.', rating: 4 },
  { id: 'r004', dateLabel: 'Sun, Apr 18', pickup: 'LaGuardia Airport', dropoff: 'Midtown Hotel', fare: 28.4, rideName: 'XL', status: 'completed', durationMin: 35, distanceKm: 14.1, driverName: 'James W.', rating: 5 },
  { id: 'r005', dateLabel: 'Fri, Apr 16', pickup: 'Home', dropoff: 'Barclays Center', fare: 18.9, rideName: 'Comfort', status: 'cancelled', durationMin: 0, distanceKm: 0, driverName: 'Cancelled' },
  { id: 'r006', dateLabel: 'Thu, Apr 15', pickup: 'Grand Central', dropoff: 'Home', fare: 11.4, rideName: 'Swift Go', status: 'completed', durationMin: 18, distanceKm: 5.8, driverName: 'Ana M.', rating: 5 },
];

export const PAYMENT_METHODS: PaymentCard[] = [
  { id: 'card1', type: 'visa', label: 'Visa', last4: '4242', isDefault: true },
  { id: 'card2', type: 'mastercard', label: 'Mastercard', last4: '1337', isDefault: false },
  { id: 'wallet', type: 'wallet', label: 'RYDE Wallet', balance: 45.8, isDefault: false },
];

export const USER_PROFILE = {
  name: 'Alex Morgan',
  phone: '+1 (555) 123-4567',
  email: 'alex.morgan@email.com',
  initials: 'AM',
  avatarBg: '#0F0F0F',
  memberSince: 'March 2022',
  totalTrips: 127,
  rating: 4.92,
};

export const ONBOARDING_SLIDES = [
  {
    title: 'Get there fast',
    subtitle: 'Request a ride and be picked up within minutes, anywhere in the city.',
    emoji: '🚗',
  },
  {
    title: 'Safe & secure',
    subtitle: 'Every ride is tracked in real-time. Share your trip with friends and family.',
    emoji: '🛡️',
  },
  {
    title: 'Best prices',
    subtitle: 'Transparent pricing with no hidden fees. See your fare before you ride.',
    emoji: '💰',
  },
];
