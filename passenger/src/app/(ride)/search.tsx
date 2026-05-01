import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { T, shadows } from '@/src/theme/tokens';
import { CloseButton, Divider, PlaceRow } from '@/src/components/ui';
import { SAVED_PLACES, RECENT_PLACES } from '@/src/data/sampleData';
import { geocodeForward } from '@/src/services/geocoding';
import { RideLocation } from '@/src/types';
import { useRideStore } from '@/src/store/useRideStore';
import { Ionicons } from '@expo/vector-icons';

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ edit?: string; returnToConfirm?: string }>();
  const setDestination = useRideStore((s) => s.setDestination);
  const setPickup = useRideStore((s) => s.setPickup);
  const pickup = useRideStore((s) => s.pickup);
  const destination = useRideStore((s) => s.destination);
  const [focusedInput, setFocusedInput] = useState<'pickup' | 'dropoff'>(
    params.edit === 'pickup' ? 'pickup' : 'dropoff'
  );
  const [pickupQuery, setPickupQuery] = useState(pickup?.label || '');
  const [dropoffQuery, setDropoffQuery] = useState(destination?.label || '');

  const [results, setResults] = useState<RideLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const query = focusedInput === 'pickup' ? pickupQuery : dropoffQuery;

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      const res = await geocodeForward(query);
      setResults(res);
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (place: RideLocation) => {
    if (focusedInput === 'pickup') {
      setPickup(place);
      setPickupQuery(place.label);
      if (params.returnToConfirm === '1' && destination) {
        router.back();
        return;
      }
      setFocusedInput('dropoff');
    } else {
      setDestination(place);
      router.push('/(ride)/confirm-pickup');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Where to?</Text>
          <CloseButton onPress={() => router.back()} />
        </View>

        {/* Search inputs */}
        <View style={styles.inputsArea}>
          <View style={styles.dotCol}>
            <View style={[styles.dot, { backgroundColor: T.blue }]} />
            <View style={styles.dottedLine} />
            <View style={[styles.dot, { backgroundColor: T.primary, borderRadius: 2 }]} />
          </View>
          <View style={{ flex: 1, gap: 10 }}>
            <View style={[styles.inputBox, focusedInput === 'pickup' && styles.inputBoxActive]}>
              <TextInput
                placeholder="From where?"
                value={pickupQuery}
                onChangeText={setPickupQuery}
                onFocus={() => setFocusedInput('pickup')}
                style={styles.inputText}
                placeholderTextColor={T.text4}
              />
              {pickupQuery.length > 0 && focusedInput === 'pickup' && (
                <TouchableOpacity onPress={() => setPickupQuery('')} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={18} color={T.text4} />
                </TouchableOpacity>
              )}
            </View>
            <View style={[styles.inputBox, focusedInput === 'dropoff' && styles.inputBoxActive]}>
              <TextInput
                placeholder="To where?"
                value={dropoffQuery}
                onChangeText={setDropoffQuery}
                onFocus={() => setFocusedInput('dropoff')}
                style={styles.inputText}
                autoFocus
                placeholderTextColor={T.text4}
              />
              {dropoffQuery.length > 0 && focusedInput === 'dropoff' && (
                <TouchableOpacity onPress={() => setDropoffQuery('')} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={18} color={T.text4} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Results */}
      <ScrollView contentContainerStyle={styles.resultsContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {query.length === 0 ? (
          <>
            {/* Saved places */}
            <View style={styles.savedRow}>
              {[
                { p: SAVED_PLACES[0], icon: 'home' as const, color: T.blue, bg: T.blueLight },
                { p: SAVED_PLACES[1], icon: 'briefcase' as const, color: T.amber, bg: T.amberLight },
              ].map((item, i) => (
                <TouchableOpacity key={i} onPress={() => handleSelect(item.p)} activeOpacity={0.8} style={styles.savedChip}>
                  <View style={[styles.savedIcon, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={14} color={item.color} />
                  </View>
                  <Text style={styles.savedLabel}>{item.p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Divider style={{ marginVertical: 12 }} />

            {/* Recent */}
            {RECENT_PLACES.map((place, i) => (
              <PlaceRow key={i} name={place.label} address={place.address || ''} type="recent" distance={place.distanceKm} onPress={() => handleSelect(place)} />
            ))}
          </>
        ) : isLoading ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: T.text3 }}>Searching...</Text>
          </View>
        ) : (
          results.map((place, i) => (
            <PlaceRow key={i} name={place.label} address={place.address || ''} type="suggestion" distance={place.distanceKm} onPress={() => handleSelect(place)} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.white },
  header: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: T.white, ...shadows.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: T.text, letterSpacing: -0.5, fontFamily: 'Inter_800ExtraBold' },
  inputsArea: { flexDirection: 'row', gap: 12 },
  dotCol: { alignItems: 'center', paddingTop: 16, width: 16 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dottedLine: { width: 1.5, flex: 1, backgroundColor: T.gray300, marginVertical: 4, minHeight: 12 },
  inputBox: { height: 48, backgroundColor: T.gray100, borderRadius: T.radius.md, paddingHorizontal: 14, justifyContent: 'center', flexDirection: 'row', alignItems: 'center' },
  inputBoxActive: { borderWidth: 1.5, borderColor: T.primary },
  inputText: { flex: 1, fontSize: T.font.lg, color: T.text },
  resultsContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  savedRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  savedChip: { flex: 1, height: 44, backgroundColor: T.gray100, borderRadius: T.radius.md, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  savedIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  savedLabel: { fontSize: T.font.md, fontWeight: '600', color: T.text },
});
