// screens/StartScreen.tsx
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { Colors } from '../constants/Colors'

export default function StartScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>☑ HabitSync</Text>
      </View>

      {/* Hero Image */}
      <View style={styles.heroContainer}>
        {/* Streak badge */}
        <View style={styles.streakBadge}>
          <Text style={styles.streakEmoji}>🌿</Text>
          <View>
            <Text style={styles.streakLabel}>Daily Streak</Text>
            <Text style={styles.streakValue}>14 Days</Text>
          </View>
        </View>
        {/* Placeholder cho 3D illustration */}
        <View style={styles.heroPlaceholder} />
      </View>

      {/* Tag */}
      <View style={styles.tag}>
        <View style={styles.tagDot} />
        <Text style={styles.tagText}>Better Together</Text>
      </View>

      {/* Headline */}
      <Text style={styles.headline}>Build Habits{'\n'}
        <Text style={styles.headlineBlue}>Together.</Text>
      </Text>
      <Text style={styles.subtitle}>
        Pair up with a partner and share your streak. If one misses, both lose. Positive social pressure for real results.
      </Text>

      {/* CTA Buttons */}
      <TouchableOpacity
        style={styles.btnPrimary}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.btnPrimaryText}>Start Building Habits →</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btnSecondary}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.btnSecondaryText}>Log In</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 50 },
  logo: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  heroContainer: { backgroundColor: '#E8E8F8', borderRadius: 20, height: 240, marginVertical: 20, padding: 16 },
  streakBadge: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: Colors.white, borderRadius: 12,
    padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 1
  },
  streakEmoji: { fontSize: 20 },
  streakLabel: { fontSize: 11, color: Colors.textGray },
  streakValue: { fontSize: 13, fontWeight: '700', color: Colors.textDark },
  heroPlaceholder: { flex: 1 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  tagDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  tagText: { fontSize: 13, color: Colors.textDark, borderWidth: 1, borderColor: '#DDD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  headline: { fontSize: 36, fontWeight: '800', color: Colors.textDark, lineHeight: 44, marginBottom: 12 },
  headlineBlue: { color: Colors.primary },
  subtitle: { fontSize: 15, color: Colors.textGray, lineHeight: 22, marginBottom: 32 },
  btnPrimary: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginBottom: 12 },
  btnPrimaryText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  btnSecondary: { backgroundColor: Colors.primaryLight, borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  btnSecondaryText: { color: Colors.primary, fontWeight: '700', fontSize: 16 },
})