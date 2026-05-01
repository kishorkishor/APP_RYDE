import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { T } from '@/src/theme/tokens';
import { Button, Avatar, StarRating, InfoRow, Divider } from '@/src/components/ui';
import { SAMPLE_DRIVER } from '@/src/data/sampleData';
import { useRideStore } from '@/src/store/useRideStore';
import { Ionicons } from '@expo/vector-icons';
import { databases, databaseId, COLLECTIONS } from '@/src/services/appwrite';

export default function CompletedScreen() {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const { selectedRide, activeRide, durationMinutes, distanceKm } = useRideStore();
  const resetRide = useRideStore((s) => s.resetRide);
  const d = SAMPLE_DRIVER;

  const handleDone = async () => {
    if (activeRide?.id) {
      try {
        await databases.updateDocument({
          databaseId,
          collectionId: COLLECTIONS.RIDES,
          documentId: activeRide.id,
          data: { status: 'completed' },
        });
      } catch (error) {
        console.error('Failed to mark ride completed', error);
      }
    }
    resetRide();
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      {/* Success header */}
      <View style={styles.header}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={32} color={T.green} />
        </View>
        <Text style={styles.title}>Trip completed!</Text>
        <Text style={styles.subtitle}>Thank you for riding with RYDE</Text>
      </View>

      {/* Trip summary */}
      <View style={styles.summaryCard}>
        <InfoRow label="Ride type" value={selectedRide?.name || 'Swift Go'} />
        <InfoRow label="Duration" value={`${durationMinutes || 0} min`} style={{ marginTop: 12 }} />
        <InfoRow label="Distance" value={`${distanceKm || 0} km`} style={{ marginTop: 12 }} />
      </View>

      {/* Rate driver */}
      <View style={styles.rateSection}>
        <Text style={styles.rateLabel}>Rate your driver</Text>
        <View style={styles.driverRow}>
          <Avatar initials={d.initials} bg={d.avatarBg!} size={48} photoUrl={d.photoUrl} />
          <View>
            <Text style={styles.driverName}>{d.name}</Text>
            <Text style={styles.driverVehicle}>{d.vehicle}</Text>
          </View>
        </View>
        <StarRating rating={rating} size={32} interactive onChange={setRating} />
      </View>



      <View style={styles.cta}>
        <Button variant="primary" size="lg" fullWidth onPress={handleDone}>
          Done
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.white },
  header: { alignItems: 'center', paddingTop: 80, paddingBottom: 24 },
  checkCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: T.greenLight, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: T.text, letterSpacing: -0.5, marginBottom: 8, fontFamily: 'Inter_800ExtraBold' },
  subtitle: { fontSize: T.font.lg, color: T.text3 },
  summaryCard: { marginHorizontal: 20, backgroundColor: T.gray50, borderRadius: T.radius.lg, padding: 20, marginBottom: 24 },
  rateSection: { alignItems: 'center', gap: 16, marginBottom: 20 },
  rateLabel: { fontSize: T.font.xs, fontWeight: '700', color: T.text4, letterSpacing: 0.8, textTransform: 'uppercase' },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  driverName: { fontSize: T.font.lg, fontWeight: '600', color: T.text },
  driverVehicle: { fontSize: T.font.sm, color: T.text3 },
  cta: { paddingHorizontal: 20, paddingBottom: 36 },
});
