// screens/HomeScreen.tsx
import { useEffect, useRef, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, ActivityIndicator, Alert
} from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { useHabits } from '../hooks/useHabits'
import { usePartnerships } from '../hooks/usePartnerships'
import { Colors } from '../constants/Colors'

export default function HomeScreen({ navigation }: any) {
  const { habits, habitsLoaded, fetchHabits, checkIn } = useHabits()
  const { partnerships, fetchPartnerships } = usePartnerships()
  const [displayName, setDisplayName] = useState('')
  const [initialLoading, setInitialLoading] = useState(!habitsLoaded)
  const progressAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    SecureStore.getItemAsync('displayName').then(n => setDisplayName(n ?? 'there'))
    init()
  }, [])

  const init = async () => {
    // fetchHabits() và fetchPartnerships() tự skip nếu đã có data
    await Promise.all([fetchHabits(), fetchPartnerships()])
    setInitialLoading(false)
  }

  // Animate progress ring mỗi khi habits thay đổi
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const done = habits.filter(h => h.lastCheckIn === today).length
    const total = habits.length
    const pct = total > 0 ? done / total : 0
    Animated.timing(progressAnim, {
      toValue: pct, duration: 800, useNativeDriver: false
    }).start()
  }, [habits])

  const handleCheckIn = async (id: number) => {
    try {
      await checkIn(id) // dispatch UPDATE_HABIT_CHECKIN bên trong hook
    } catch (e: any) {
      Alert.alert('', e.response?.data ?? 'Đã check-in hôm nay rồi')
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const doneCount = habits.filter(h => h.lastCheckIn === today).length
  const totalCount = habits.length
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0)

  // Map partnership để lấy đúng partnerName
  const [currentUserId, setCurrentUserId] = useState(0)
  useEffect(() => {
    SecureStore.getItemAsync('userId').then(id => setCurrentUserId(Number(id)))
  }, [])

  const mappedPartnerships = partnerships
    .filter(p => p.status === 'accepted')
    .map((p: any) => ({
      ...p,
      partnerName: p.requesterId === currentUserId ? p.receiverName : p.requesterName
    }))

  const bestPartner = mappedPartnerships[0]

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  if (initialLoading) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />

  return (
    <View style={styles.root}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.logo}>☑ HabitSync</Text>
          <TouchableOpacity>
            <Text style={styles.bellIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.greeting}>{getGreeting()}, {displayName}.</Text>

        {bestPartner && (
          <View style={styles.motivationCard}>
            <View style={styles.motivationLeft}>
              <View style={styles.streakNumBox}>
                <Text style={styles.streakNumSmall}>{bestPartner.sharedStreak}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.motivationQuote}>
                  "Don't break the chain - {bestPartner.partnerName} is counting on you!"
                </Text>
                <Text style={styles.motivationSub}>
                  Shared Habit Challenge with {bestPartner.partnerName}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.progressCard}>
          <ProgressRing percent={progressPct} />
          <Text style={styles.progressLabel}>Today's Progress</Text>
        </View>

        {bestStreak > 0 && (
          <View style={styles.streakBanner}>
            <Text style={styles.streakBannerLabel}>🔥  ACTIVE STREAK</Text>
            <Text style={styles.streakBannerNum}>{bestStreak} Day{'\n'}Streak!</Text>
            {bestPartner && (
              <View style={styles.onlineRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>{bestPartner.partnerName} is Online</Text>
              </View>
            )}
          </View>
        )}

        {mappedPartnerships.length > 0 && (
          <TouchableOpacity
            style={styles.accountabilityCard}
            onPress={() => navigation.navigate('Partnership')}
          >
            <View style={styles.avatarRow}>
              {mappedPartnerships.slice(0, 2).map((p: any, i: number) => (
                <View key={p.id} style={[styles.miniAvatar, { marginLeft: i > 0 ? -10 : 0 }]}>
                  <Text style={styles.miniAvatarText}>
                    {(p.partnerName ?? '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
              ))}
              {mappedPartnerships.length > 2 && (
                <View style={[styles.miniAvatar, styles.miniAvatarMore, { marginLeft: -10 }]}>
                  <Text style={styles.miniAvatarText}>+{mappedPartnerships.length - 2}</Text>
                </View>
              )}
            </View>
            <View>
              <Text style={styles.accountabilityTitle}>Accountability</Text>
              <Text style={styles.accountabilitySub}>
                {mappedPartnerships.length} friend{mappedPartnerships.length > 1 ? 's' : ''} synced today
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Habits</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All →</Text>
          </TouchableOpacity>
        </View>

        {habits.map(habit => {
          const checkedIn = habit.lastCheckIn === today
          return (
            <TouchableOpacity
              key={habit.id}
              style={styles.habitRow}
              onPress={() => navigation.navigate('HabitDetail', { habitId: habit.id })}
              activeOpacity={0.7}
            >
              <View style={styles.habitIcon}>
                <Text style={styles.habitIconText}>{getHabitEmoji(habit.name)}</Text>
              </View>
              <View style={styles.habitInfo}>
                <Text style={styles.habitName}>{habit.name}</Text>
                <Text style={styles.habitSub}>{habit.description ?? habit.frequency}</Text>
              </View>
              <TouchableOpacity
                style={[styles.checkCircle, checkedIn && styles.checkCircleDone]}
                onPress={() => !checkedIn && handleCheckIn(habit.id)}
              >
                {checkedIn && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
            </TouchableOpacity>
          )
        })}

        {bestPartner && (
          <TouchableOpacity
            style={styles.syncCard}
            onPress={() => navigation.navigate('Conversations')}
          >
            <View style={styles.syncAvatar}>
              <Text style={styles.syncAvatarText}>
                {(bestPartner.partnerName ?? '?').charAt(0).toUpperCase()}
              </Text>
              <View style={styles.syncOnlineDot} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.syncTitle}>Sync with {bestPartner.partnerName}</Text>
              <Text style={styles.syncSub}>Habit: "{bestPartner.habitName}"</Text>
            </View>
            <TouchableOpacity style={styles.chatBtn}>
              <Text style={styles.chatBtnIcon}>💬</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateHabit')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <BottomBar navigation={navigation} active="Home" />
    </View>
  )
}

// ---- Progress Ring ----
function ProgressRing({ percent }: { percent: number }) {
  const size = 140
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percent / 100) * circumference

  return (
    <View style={{ alignItems: 'center', marginVertical: 16 }}>
      <View style={{ width: size, height: size, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
        {/* SVG-like ring using border */}
        <View style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: strokeWidth, borderColor: Colors.inputBg,
          position: 'absolute'
        }} />
        {/* Filled arc approximation */}
        <View style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: Colors.primary,
          borderRightColor: percent < 25 ? Colors.inputBg : Colors.primary,
          borderBottomColor: percent < 50 ? Colors.inputBg : Colors.primary,
          borderLeftColor: percent < 75 ? Colors.inputBg : Colors.primary,
          position: 'absolute',
          transform: [{ rotate: '-90deg' }]
        }} />
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.progressPct}>{percent}%</Text>
          <Text style={styles.progressDay}>Today</Text>
        </View>
      </View>
    </View>
  )
}

// ---- Bottom Bar ----
function BottomBar({ navigation, active }: { navigation: any; active: string }) {
  const tabs = [
    { name: 'Home', icon: '🏠', screen: 'Home' },
    { name: 'Partner', icon: '🤝', screen: 'Partnership' },
    { name: 'Chat', icon: '💬', screen: 'Conversations' },
    { name: 'Stats', icon: '📊', screen: 'Stats' },
    { name: 'Profile', icon: '👤', screen: 'Profile' },
  ]

  return (
    <View style={styles.bottomBar}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.name}
          style={styles.bottomTab}
          onPress={() => navigation.navigate(tab.screen)}
        >
          <View style={[styles.bottomTabInner, active === tab.name && styles.bottomTabActive]}>
            <Text style={styles.bottomTabIcon}>{tab.icon}</Text>
          </View>
          <Text style={[styles.bottomTabLabel, active === tab.name && { color: Colors.primary }]}>
            {tab.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

function getHabitEmoji(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('yoga') || n.includes('tập')) return '🧘'
  if (n.includes('đọc') || n.includes('read')) return '📖'
  if (n.includes('code') || n.includes('coding') || n.includes('lập')) return '💻'
  if (n.includes('chạy') || n.includes('run')) return '🏃'
  if (n.includes('gym') || n.includes('tập')) return '💪'
  if (n.includes('thiền') || n.includes('meditat')) return '🧘'
  if (n.includes('tiếng anh') || n.includes('english')) return '📚'
  return '✨'
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingTop: 56, marginBottom: 16
  },
  logo: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  bellIcon: { fontSize: 22 },
  greeting: { fontSize: 26, fontWeight: '800', color: Colors.textDark, marginBottom: 16 },

  // Motivation card
  motivationCard: {
    backgroundColor: Colors.white, borderRadius: 16,
    padding: 16, marginBottom: 16
  },
  motivationLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streakNumBox: {
    backgroundColor: '#FFF3E0', width: 44, height: 44,
    borderRadius: 12, justifyContent: 'center', alignItems: 'center'
  },
  streakNumSmall: { fontSize: 16, fontWeight: '900', color: '#FF9800' },
  motivationQuote: { fontSize: 13, fontStyle: 'italic', color: Colors.textDark, flex: 1 },
  motivationSub: { fontSize: 11, color: Colors.textGray, marginTop: 4 },

  // Progress
  progressCard: {
    backgroundColor: Colors.white, borderRadius: 16,
    alignItems: 'center', paddingVertical: 8, marginBottom: 16
  },
  progressPct: { fontSize: 36, fontWeight: '900', color: Colors.primary },
  progressDay: { fontSize: 13, color: Colors.textGray },
  progressLabel: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginBottom: 16 },

  // Streak banner
  streakBanner: {
    backgroundColor: Colors.primary, borderRadius: 20,
    padding: 24, marginBottom: 16
  },
  streakBannerLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  streakBannerNum: { fontSize: 40, fontWeight: '900', color: '#fff', lineHeight: 46, marginBottom: 16 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  onlineText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Accountability
  accountabilityCard: {
    backgroundColor: '#EEF0FF', borderRadius: 16,
    padding: 16, flexDirection: 'row',
    alignItems: 'center', gap: 12, marginBottom: 16
  },
  avatarRow: { flexDirection: 'row' },
  miniAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#EEF0FF'
  },
  miniAvatarMore: { backgroundColor: '#7B79F7' },
  miniAvatarText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  accountabilityTitle: { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  accountabilitySub: { fontSize: 12, color: Colors.textGray },

  // Section
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.textDark },
  viewAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  // Habit rows
  habitRow: {
    backgroundColor: Colors.white, borderRadius: 14,
    padding: 14, flexDirection: 'row',
    alignItems: 'center', marginBottom: 8, gap: 12
  },
  habitIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.inputBg,
    justifyContent: 'center', alignItems: 'center'
  },
  habitIconText: { fontSize: 20 },
  habitInfo: { flex: 1 },
  habitName: { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  habitSub: { fontSize: 12, color: Colors.textGray, marginTop: 2 },
  checkCircle: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, borderColor: Colors.inputBg,
    justifyContent: 'center', alignItems: 'center'
  },
  checkCircleDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkMark: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Sync card
  syncCard: {
    backgroundColor: Colors.white, borderRadius: 16,
    padding: 14, flexDirection: 'row',
    alignItems: 'center', gap: 12, marginTop: 8
  },
  syncAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative'
  },
  syncAvatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  syncOnlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: '#4CAF50', borderWidth: 2, borderColor: Colors.white
  },
  syncTitle: { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  syncSub: { fontSize: 12, color: Colors.textGray, marginTop: 2 },
  chatBtn: {
    backgroundColor: Colors.primary, width: 44, height: 44,
    borderRadius: 12, justifyContent: 'center', alignItems: 'center'
  },
  chatBtnIcon: { fontSize: 20 },

  // FAB
  fab: {
    position: 'absolute', bottom: 90, right: 20,
    backgroundColor: Colors.primary, width: 52, height: 52,
    borderRadius: 16, justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.primary, shadowOpacity: 0.4,
    shadowRadius: 8, elevation: 6
  },
  fabIcon: { color: '#fff', fontSize: 28, fontWeight: '300' },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row', backgroundColor: Colors.white,
    paddingBottom: 24, paddingTop: 8, paddingHorizontal: 8,
    borderTopWidth: 1, borderTopColor: Colors.inputBg
  },
  bottomTab: { flex: 1, alignItems: 'center', gap: 2 },
  bottomTabInner: { padding: 6, borderRadius: 12 },
  bottomTabActive: { backgroundColor: Colors.primary },
  bottomTabIcon: { fontSize: 18 },
  bottomTabLabel: { fontSize: 10, color: Colors.textGray, fontWeight: '600' },
})