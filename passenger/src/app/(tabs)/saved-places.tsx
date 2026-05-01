import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { T, shadows } from '@/src/theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { SAVED_PLACES, RECENT_PLACES } from '@/src/data/sampleData';

export default function SavedPlacesScreen() {
  const allPlaces = [
    { ...SAVED_PLACES[0], kind: 'home' as const, icon: 'home' as const, color: T.blue, bg: T.blueLight },
    { ...SAVED_PLACES[1], kind: 'work' as const, icon: 'briefcase' as const, color: T.amber, bg: T.amberLight },
    ...RECENT_PLACES.slice(0, 3).map((p) => ({ ...p, kind: 'saved' as const, icon: 'star' as const, color: T.green, bg: T.greenLight })),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Places</Text>
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.7}>
          <Ionicons name="add" size={20} color={T.white} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {allPlaces.map((place, i) => (
          <TouchableOpacity key={i} activeOpacity={0.85} style={styles.placeCard}>
            <View style={[styles.placeIcon, { backgroundColor: place.bg }]}>
              <Ionicons name={place.icon as any} size={18} color={place.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.placeName}>{place.label}</Text>
              <Text style={styles.placeAddr} numberOfLines={1}>{place.address}</Text>
            </View>
            <Ionicons name="ellipsis-vertical" size={16} color={T.text4} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: T.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: '800', color: T.text, letterSpacing: -0.5, fontFamily: 'Inter_800ExtraBold' },
  addBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 20, gap: 10 },
  placeCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: T.white, borderRadius: T.radius.lg, padding: 16, ...shadows.sm },
  placeIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  placeName: { fontSize: T.font.lg, fontWeight: '600', color: T.text },
  placeAddr: { fontSize: T.font.sm, color: T.text3, marginTop: 2 },
});
