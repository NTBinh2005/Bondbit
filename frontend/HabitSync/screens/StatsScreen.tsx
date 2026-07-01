// screens/StatsScreen.tsx
import { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'
import api from '../services/api'
import { Colors } from '../constants/Colors'

type StatsData = {
  streakMomentum: { label: string; completedCount: number }[]
  totalStreakDays: number
  weeklyProgress: { day: string; percent: number; isDone: boolean }[]
  partnerSynergy: { partnerName: string; compatibilityScore: number; partnerAvatarInitial: string } | null
}

export default function StatsScreen({ navigation }: any) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useFocusEffect(useCallback(() => { fetchStats() }, []))

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/stats')
      setStats(res.data)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />

  const maxBar = Math.max(...stats.streakMomentum.map(w => w.completedCount), 1)
  const highlightWeek = stats.streakMomentum.reduce((maxI, w, i, arr) =>
    w.completedCount > arr[maxI].completedCount ? i : maxI, 0)

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>☑ HabitSync</Text>
          <View style={styles.headerIcons}>
            <Text style={styles.icon}>🌙</Text>
            <Text style={styles.icon}>🔔</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Growth{'\n'}Analytics</Text>
          <Text style={styles.subtitle}>
            Real-time breakdown of your collective momentum and habit trends.
          </Text>
        </View>

        {/* Streak Momentum chart */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Streak{'\n'}Momentum</Text>
              <Text style={styles.cardSub}>Last 30 days performance</Text>
            </View>
            <View style={styles.totalPill}>
              <Text style={styles.totalPillText}>Total: {stats.totalStreakDays}{'\n'}Days</Text>
            </View>
          </View>

          <View style={styles.barChart}>
            {stats.streakMomentum.map((w, i) => (
              <View key={w.label} style={styles.barCol}>
                <View style={styles.barWrapper}>
                  <View style={[
                    styles.bar,
                    {
                      height: Math.max(8, (w.completedCount / maxBar) * 100),
                      backgroundColor: i === highlightWeek ? Colors.primary : '#D6D6F5'
                    }
                  ]} />
                </View>
                <Text style={styles.barLabel}>{w.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Partner Synergy */}
        {stats.partnerSynergy && (
          <View style={styles.synergyCard}>
            <Text style={styles.synergyTitle}>Partner Synergy</Text>
            <Text style={styles.synergySub}>
              Matched with {stats.partnerSynergy.partnerName}
            </Text>
            <Text style={styles.synergyScore}>{stats.partnerSynergy.compatibilityScore}%</Text>
            <Text style={styles.synergyLabel}>COMPATIBILITY SCORE</Text>

            <View style={styles.synergyAvatars}>
              <View style={styles.synergyAvatar}>
                <Text style={styles.synergyAvatarText}>You</Text>
              </View>
              <View style={[styles.synergyAvatar, { marginLeft: -10, backgroundColor: '#FF9800' }]}>
                <Text style={styles.synergyAvatarText}>
                  {stats.partnerSynergy.partnerAvatarInitial}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Weekly Progress */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>Weekly Progress</Text>
            <Text style={styles.checkIcon}>✅</Text>
          </View>

          {stats.weeklyProgress.map(d => (
            <View key={d.day} style={styles.progressRow}>
              <Text style={styles.progressDay}>{d.day}</Text>
              <View style={styles.progressBarBg}>
                <View style={[
                  styles.progressBarFill,
                  {
                    width: `${d.percent}%`,
                    backgroundColor: d.isDone ? '#4CAF50' : Colors.primary
                  }
                ]} />
              </View>
              <Text style={styles.progressPct}>
                {d.isDone ? 'Done!' : `${d.percent}%`}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomBar navigation={navigation} active="Stats" />
    </View>
  )
}

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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingTop: 56,
    paddingHorizontal: 20, marginBottom: 16
  },
  logo: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  headerIcons: { flexDirection: 'row', gap: 16 },
  icon: { fontSize: 18 },

  titleSection: { paddingHorizontal: 20, marginBottom: 20 },
  title: { fontSize: 30, fontWeight: '900', color: Colors.textDark, lineHeight: 36 },
  subtitle: { fontSize: 13, color: Colors.textGray, marginTop: 8, lineHeight: 18 },

  card: {
    backgroundColor: Colors.white, borderRadius: 18,
    marginHorizontal: 20, marginBottom: 16, padding: 18
  },
  cardHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 16
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: Colors.textDark, lineHeight: 22 },
  cardSub: { fontSize: 11, color: Colors.textGray, marginTop: 4 },
  totalPill: {
    backgroundColor: Colors.primary, borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 6
  },
  totalPillText: { color: '#fff', fontSize: 10, fontWeight: '700', textAlign: 'center' },

  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, paddingTop: 8 },
  barCol: { flex: 1, alignItems: 'center' },
  barWrapper: { height: 100, justifyContent: 'flex-end' },
  bar: { width: 28, borderRadius: 8 },
  barLabel: { fontSize: 10, color: Colors.textGray, marginTop: 6, fontWeight: '600' },

  // Synergy
  synergyCard: {
    backgroundColor: Colors.primary, borderRadius: 18,
    marginHorizontal: 20, marginBottom: 16, padding: 20
  },
  synergyTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  synergySub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
  synergyScore: { fontSize: 46, fontWeight: '900', color: '#fff' },
  synergyLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
  synergyAvatars: { flexDirection: 'row' },
  synergyAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#7B79F7',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.primary
  },
  synergyAvatarText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Weekly progress
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.textDark },
  checkIcon: { fontSize: 18 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  progressDay: { width: 32, fontSize: 12, fontWeight: '700', color: Colors.textDark },
  progressBarBg: {
    flex: 1, height: 8, backgroundColor: Colors.inputBg,
    borderRadius: 4, overflow: 'hidden'
  },
  progressBarFill: { height: 8, borderRadius: 4 },
  progressPct: { width: 40, fontSize: 11, color: Colors.textGray, textAlign: 'right' },

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