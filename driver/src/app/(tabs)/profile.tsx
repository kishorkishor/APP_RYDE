// ─── Profile Screen ───────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DT } from '@/src/theme/tokens';
import { StatusBadge } from '@/src/components/ui';
import { useDriverAuthStore } from '@/src/store/useDriverAuthStore';
import { useDriverStatusStore } from '@/src/store/useDriverStatusStore';
import { clearCurrentSession } from '@/src/services/driverRecords';

type InfoRow = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

const DRIVER_CAR_IMAGE =
  'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=900&q=80';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useDriverAuthStore((s) => s.profile);
  const logout = useDriverAuthStore((s) => s.logout);
  const status = useDriverStatusStore((s) => s.status);

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isCarZoomVisible, setIsCarZoomVisible] = useState(false);

  const initials =
    profile?.fullName
      ?.split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() ?? 'D';

  const infoRows: InfoRow[] = [
    {
      icon: 'mail-outline',
      label: 'Email',
      value: profile?.email || '—',
    },
    {
      icon: 'call-outline',
      label: 'Phone',
      value: profile?.phone || '—',
    },
    {
      icon: 'car-outline',
      label: 'Vehicle',
      value: profile?.vehicleLabel || '—',
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Plate',
      value: profile?.plateNumber || '—',
    },
    {
      icon: 'person-circle-outline',
      label: 'Driver ID',
      value: profile ? `DRV-${profile.id.slice(-6).toUpperCase()}` : '—',
    },
  ];

  const handleSignOut = () => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            setIsSigningOut(true);
            await clearCurrentSession();
            logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Math.max(insets.top + 10, 34) },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 96 }}
      >
        {/* Title */}
        <View style={styles.titleArea}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.profileCardInner}>
            {/* Avatar */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile?.fullName ?? 'Driver'}
              </Text>
              <StatusBadge status={status} size="sm" />
            </View>
            <Pressable
              style={styles.carThumbWrap}
              onPress={() => setIsCarZoomVisible(true)}
            >
              <Image
                source={{ uri: DRIVER_CAR_IMAGE }}
                style={styles.carThumb}
                resizeMode="cover"
              />
            </Pressable>
          </View>
        </View>

        {/* Info rows */}
        <View style={styles.infoCard}>
          {infoRows.map(({ icon, label, value }, i) => (
            <View
              key={label}
              style={[
                styles.infoRow,
                i < infoRows.length - 1 && styles.infoRowBorder,
              ]}
            >
              <View style={styles.infoIconWrap}>
                <Ionicons name={icon} size={15} color={DT.textMuted} />
              </View>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {value}
              </Text>
            </View>
          ))}
        </View>

        {/* Support */}
        <TouchableOpacity style={styles.supportBtn} activeOpacity={0.8}>
          <View style={styles.supportIcon}>
            <Ionicons name="headset-outline" size={18} color="#93C5FD" />
          </View>
          <View style={styles.supportText}>
            <Text style={styles.supportTitle}>Contact Admin / Support</Text>
            <Text style={styles.supportSub}>Available 24/7 for driver assistance</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={DT.textFaint} />
        </TouchableOpacity>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.8}
          disabled={isSigningOut}
        >
          <Ionicons name="log-out-outline" size={18} color="#FCA5A5" />
          <Text style={styles.signOutText}>
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal
        visible={isCarZoomVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCarZoomVisible(false)}
      >
        <Pressable
          style={styles.zoomBackdrop}
          onPress={() => setIsCarZoomVisible(false)}
        >
          <Pressable style={styles.zoomCard} onPress={(event) => event.stopPropagation()}>
            <Image
              source={{ uri: DRIVER_CAR_IMAGE }}
              style={styles.zoomImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.zoomClose}
              onPress={() => setIsCarZoomVisible(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DT.bg },
  titleArea: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: 'Inter_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: DT.bgCard,
    borderWidth: 1,
    borderColor: DT.border,
    borderRadius: 22,
    padding: 18,
  },
  profileCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 20,
    // RN gradient fallback:
    backgroundColor: 'rgba(30,58,95,0.9)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Inter_800ExtraBold',
    color: '#FFFFFF',
  },
  profileInfo: { flex: 1, gap: 6 },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  carThumbWrap: {
    width: 80,
    height: 54,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  carThumb: {
    width: '100%',
    height: '100%',
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: DT.bgCard,
    borderWidth: 1,
    borderColor: DT.border,
    borderRadius: 20,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: DT.borderLight,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoLabel: {
    flex: 1,
    fontSize: 13,
    color: DT.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.75)',
    maxWidth: '50%',
    textAlign: 'right',
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.22)',
    borderRadius: 16,
  },
  supportIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  supportText: { flex: 1, gap: 2 },
  supportTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  supportSub: {
    fontSize: 11,
    color: DT.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    height: 52,
    borderRadius: 16,
    backgroundColor: DT.offlineBg,
    borderWidth: 1,
    borderColor: DT.offlineBorder,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#FCA5A5',
  },
  zoomBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  zoomCard: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: DT.bgCard,
    borderWidth: 1,
    borderColor: DT.border,
  },
  zoomImage: {
    width: '100%',
    height: 230,
  },
  zoomClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
