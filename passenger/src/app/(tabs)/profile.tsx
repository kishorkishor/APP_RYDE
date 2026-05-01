import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { T } from '@/src/theme/tokens';
import { Avatar, Badge, SettingsGroup, SettingsItem } from '@/src/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/useAuthStore';
import { account } from '@/src/services/appwrite';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const displayName = user?.name || 'RYDE rider';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'RR';

  const handleLogout = async () => {
    try {
      await account.deleteSession({ sessionId: 'current' });
    } catch {
      // Local logout still clears the app state.
    }
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerCard}>
        <View style={styles.avatarRow}>
          <Avatar initials={initials} bg={T.primary} size={72} />
          <TouchableOpacity style={styles.editBtn} activeOpacity={0.7}>
            <Ionicons name="pencil" size={14} color={T.white} />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.profileRole}>Passenger</Text>
        <Badge variant="green">Gold Member</Badge>

        <View style={styles.statsRow}>
          {[
            { value: '-', label: 'Total Rides' },
            { value: 'Now', label: 'Member Since' },
            { value: 'Passenger', label: 'Profile Type' },
          ].map((stat, i) => (
            <View key={i} style={[styles.statItem, i < 2 && { borderRightWidth: 1, borderRightColor: T.border }]}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <SettingsGroup>
        <SettingsItem icon={<Ionicons name="person-outline" size={18} color={T.text2} />} label="Personal info" value={displayName} />
        <SettingsItem icon={<Ionicons name="business-outline" size={18} color={T.text2} />} label="Company" value={user?.companyName || '-'} />
        <SettingsItem icon={<Ionicons name="briefcase-outline" size={18} color={T.text2} />} label="Project code" value={user?.projectCode || '-'} />
        <SettingsItem icon={<Ionicons name="call-outline" size={18} color={T.text2} />} label="Phone number" value={user?.phone || '-'} />
        <SettingsItem icon={<Ionicons name="mail-outline" size={18} color={T.text2} />} label="Email address" value={user?.email || '-'} />
      </SettingsGroup>

      <SettingsGroup>
        <SettingsItem icon={<Ionicons name="card-outline" size={18} color={T.text2} />} label="Payment methods" />
        <SettingsItem icon={<Ionicons name="star-outline" size={18} color={T.amber} />} label="Promotions & rewards" />
      </SettingsGroup>

      <SettingsGroup>
        <SettingsItem icon={<Ionicons name="notifications-outline" size={18} color={T.text2} />} label="Notifications" value="On" />
        <SettingsItem icon={<Ionicons name="shield-checkmark-outline" size={18} color={T.text2} />} label="Privacy & security" />
        <SettingsItem icon={<Ionicons name="help-circle-outline" size={18} color={T.text2} />} label="Help & support" />
      </SettingsGroup>

      <SettingsGroup>
        <SettingsItem
          icon={<Ionicons name="log-out-outline" size={18} color={T.red} />}
          label="Sign out"
          danger
          onPress={handleLogout}
        />
      </SettingsGroup>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  content: { paddingBottom: 40 },
  headerCard: { backgroundColor: T.white, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, alignItems: 'center', marginBottom: 16 },
  avatarRow: { position: 'relative', marginBottom: 16 },
  editBtn: { position: 'absolute', bottom: 0, right: -4, width: 28, height: 28, borderRadius: 14, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: T.white },
  name: { fontSize: 22, fontWeight: '800', color: T.text, letterSpacing: -0.5, marginBottom: 6, fontFamily: 'Inter_800ExtraBold' },
  profileRole: { fontSize: T.font.sm, color: T.text3, marginBottom: 8 },
  statsRow: { flexDirection: 'row', marginTop: 20, backgroundColor: T.gray50, borderRadius: T.radius.lg, paddingVertical: 16, width: '100%' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: T.font['2xl'], fontWeight: '800', color: T.text, fontFamily: 'Inter_800ExtraBold' },
  statLabel: { fontSize: T.font.xs, color: T.text4, marginTop: 4 },
});
