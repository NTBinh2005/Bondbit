// screens/HabitDetailScreen.tsx
import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native'
import { useHabits } from '../hooks/useHabits'

import api from '../services/api'
import { Colors } from '../constants/Colors'

type LogEntry = { date: string; isCompleted: boolean }
type HabitDetail = {
  id: number
  name: string
  description?: string
  frequency: string
  currentStreak: number
  lastCheckIn?: string
  createdAt: string
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function HabitDetailScreen({ route, navigation }: any) {
  const { deleteHabit } = useHabits()
  const { habitId } = route.params
  const [habit, setHabit] = useState<HabitDetail | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/api/habits/${habitId}`),
      api.get(`/api/habits/${habitId}/logs?days=90`)
    ]).then(([habitRes, logsRes]) => {
      setHabit(habitRes.data)
      setLogs(logsRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const handleDelete = () => {
  Alert.alert('Xoá Habit', 'Bạn có chắc muốn xoá habit này không?', [
    { text: 'Huỷ', style: 'cancel' },
    {
      text: 'Xoá', style: 'destructive',
      onPress: async () => {
        await deleteHabit(habitId) // dispatch REMOVE_HABIT + reset partnerships
        navigation.goBack()
      }
    }
  ])
}

  if (loading || !habit) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />

  const completedSet = new Set(logs.filter(l => l.isCompleted).map(l => l.date))

  // Stats
  const totalDays = Math.max(1, Math.round(
    (new Date().getTime() - new Date(habit.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  ))
  const completedCount = logs.filter(l => l.isCompleted).length
  const successRate = Math.round((completedCount / totalDays) * 100)

  // Calendar helpers
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  // Adjust so week starts Monday (0=Mon ... 6=Sun)
  const startOffset = (firstDay === 0 ? 6 : firstDay - 1)

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Completion history (last 10 logs)
  const recentLogs = [...logs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10)

  // Peak performance — count by day of week
  const dayCount = [0, 0, 0, 0, 0, 0, 0]
  logs.filter(l => l.isCompleted).forEach(l => {
    const d = new Date(l.date).getDay() // 0=Sun
    const idx = d === 0 ? 6 : d - 1    // Convert to Mon=0
    dayCount[idx]++
  })
  const maxDay = Math.max(...dayCount)

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HabitSync</Text>
        <TouchableOpacity>
          <Text style={styles.shareBtn}>⬆</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Habit title */}
        <View style={styles.titleSection}>
          <View style={styles.habitIconLarge}>
            <Text style={styles.habitIconEmoji}>💻</Text>
          </View>
          <View>
            <Text style={styles.habitTitle}>{habit.name}</Text>
            <Text style={styles.habitSubtitle}>
              {habit.frequency === 'daily' ? 'Daily' : 'Weekly'} • {habit.description ?? '6:00 PM'}
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⚡</Text>
            <Text style={styles.statLabel}>SUCCESS RATE</Text>
            <Text style={styles.statValue}>{successRate}%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statLabel}>STREAK</Text>
            <Text style={[styles.statValue, { color: '#FF9800' }]}>
              {habit.currentStreak} Days
            </Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarTitle}>Monthly{'\n'}Activity</Text>
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={() => setCurrentMonth(new Date(year, month - 1, 1))}>
                <Text style={styles.navBtn}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthLabel}>{monthName}</Text>
              <TouchableOpacity onPress={() => setCurrentMonth(new Date(year, month + 1, 1))}>
                <Text style={styles.navBtn}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Day labels */}
          <View style={styles.calGrid}>
            {DAYS.map((d, i) => (
              <Text key={i} style={styles.dayLabel}>{d}</Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.calGrid}>
            {/* Empty cells before first day */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.calCell} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isCompleted = completedSet.has(dateStr)
              const isToday = today.getDate() === day &&
                today.getMonth() === month &&
                today.getFullYear() === year
              const isFuture = new Date(dateStr) > today

              return (
                <View key={day} style={[
                  styles.calCell,
                  isCompleted && styles.calCellDone,
                  isToday && !isCompleted && styles.calCellToday,
                ]}>
                  <Text style={[
                    styles.calCellText,
                    isCompleted && styles.calCellTextDone,
                    isFuture && styles.calCellTextFuture,
                    isToday && !isCompleted && styles.calCellTextToday,
                  ]}>{day}</Text>
                </View>
              )
            })}
          </View>

          {/* Summary */}
          <View style={styles.calSummary}>
            <View style={styles.calSummaryItem}>
              <Text style={styles.calSummaryLabel}>COMPLETED</Text>
              <Text style={[styles.calSummaryValue, { color: Colors.textDark }]}>
                {completedCount} Days
              </Text>
            </View>
            <View style={styles.calSummaryItem}>
              <Text style={styles.calSummaryLabel}>SKIPPED</Text>
              <Text style={[styles.calSummaryValue, { color: Colors.textGray }]}>
                {Math.max(0, totalDays - completedCount)} Days
              </Text>
            </View>
            <View style={styles.calSummaryItem}>
              <Text style={styles.calSummaryLabel}>PENDING</Text>
              <Text style={[styles.calSummaryValue, { color: Colors.textGray }]}>
                {Math.max(0, daysInMonth - today.getDate())} Days
              </Text>
            </View>
          </View>
        </View>

        {/* Completion History */}
        <Text style={styles.sectionTitle}>Completion History</Text>
        {recentLogs.slice(0, 3).map(log => (
          <View key={log.date} style={styles.historyRow}>
            <View style={[styles.historyIcon, !log.isCompleted && styles.historyIconMissed]}>
              <Text style={styles.historyIconText}>{log.isCompleted ? '✓' : '✕'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.historyDate}>
                {new Date(log.date).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric'
                })}
              </Text>
              <Text style={styles.historySub}>
                {log.isCompleted ? 'Completed' : 'Missed'}
              </Text>
            </View>
            <Text style={styles.historyChevron}>›</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.viewAllBtn}>
          <Text style={styles.viewAllText}>View All History</Text>
        </TouchableOpacity>

        {/* Peak Performance */}
        <View style={styles.peakCard}>
          <Text style={styles.peakTitle}>Peak Performance</Text>
          <Text style={styles.peakDesc}>
            You're {maxDay > 0 ? Math.round((dayCount[DAYS.indexOf(DAYS[dayCount.indexOf(maxDay)])] / maxDay) * 100) : 0}%
            more likely to complete this habit on{' '}
            <Text style={{ fontWeight: '800' }}>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayCount.indexOf(maxDay)]}s
            </Text>{' '}
            compared to other days.
          </Text>

          {/* Bar chart */}
          <View style={styles.barChart}>
            {DAYS.map((d, i) => (
              <View key={i} style={styles.barCol}>
                <View style={styles.barWrapper}>
                  <View style={[
                    styles.bar,
                    {
                      height: maxDay > 0 ? Math.max(8, (dayCount[i] / maxDay) * 80) : 8,
                      backgroundColor: dayCount[i] === maxDay ? Colors.primary : Colors.inputBg
                    }
                  ]} />
                </View>
                <Text style={styles.barLabel}>{d}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom buttons */}
      <View style={styles.bottomBtns}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('EditHabit', { habitId })}
        >
          <Text style={styles.editBtnText}>✏  Edit Habit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>🗑  Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12,
    backgroundColor: Colors.white
  },
  backBtn: { fontSize: 22, color: Colors.primary, fontWeight: '700' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.primary },
  shareBtn: { fontSize: 20, color: Colors.primary },

  // Title
  titleSection: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 20, backgroundColor: Colors.white, marginBottom: 12
  },
  habitIconLarge: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center'
  },
  habitIconEmoji: { fontSize: 26 },
  habitTitle: { fontSize: 20, fontWeight: '800', color: Colors.textDark },
  habitSubtitle: { fontSize: 13, color: Colors.textGray, marginTop: 3 },

  // Stats
  statsRow: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 20, marginBottom: 12
  },
  statCard: {
    flex: 1, backgroundColor: Colors.white,
    borderRadius: 14, padding: 14
  },
  statIcon: { fontSize: 16, marginBottom: 4 },
  statLabel: { fontSize: 10, fontWeight: '700', color: Colors.textGray, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '900', color: Colors.primary },

  // Calendar
  calendarCard: {
    backgroundColor: Colors.white, borderRadius: 16,
    marginHorizontal: 20, marginBottom: 12, padding: 16
  },
  calendarHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16
  },
  calendarTitle: { fontSize: 18, fontWeight: '800', color: Colors.textDark },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navBtn: { fontSize: 20, color: Colors.primary, fontWeight: '700', paddingHorizontal: 4 },
  monthLabel: { fontSize: 13, fontWeight: '700', color: Colors.textDark },
  calGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginBottom: 4
  },
  dayLabel: {
    width: '14.28%', textAlign: 'center',
    fontSize: 12, fontWeight: '700',
    color: Colors.textGray, marginBottom: 6
  },
  calCell: {
    width: '14.28%', aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2
  },
  calCellDone: {
    backgroundColor: '#4CAF50',
    borderRadius: 100,
  },
  calCellToday: {
    borderWidth: 2, borderColor: Colors.primary, borderRadius: 100
  },
  calCellText: { fontSize: 13, fontWeight: '600', color: Colors.textDark },
  calCellTextDone: { color: '#fff' },
  calCellTextFuture: { color: Colors.inputBg },
  calCellTextToday: { color: Colors.primary },
  calSummary: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.inputBg
  },
  calSummaryItem: { alignItems: 'center' },
  calSummaryLabel: { fontSize: 10, fontWeight: '700', color: Colors.textGray, marginBottom: 2 },
  calSummaryValue: { fontSize: 14, fontWeight: '800' },

  // History
  sectionTitle: {
    fontSize: 18, fontWeight: '800', color: Colors.textDark,
    marginHorizontal: 20, marginBottom: 10, marginTop: 4
  },
  historyRow: {
    backgroundColor: Colors.white, borderRadius: 12,
    marginHorizontal: 20, marginBottom: 8,
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12
  },
  historyIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#4CAF50',
    justifyContent: 'center', alignItems: 'center'
  },
  historyIconMissed: { backgroundColor: '#EF5350' },
  historyIconText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  historyDate: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  historySub: { fontSize: 12, color: Colors.textGray, marginTop: 2 },
  historyChevron: { fontSize: 20, color: Colors.textGray },
  viewAllBtn: { alignItems: 'center', marginVertical: 8 },
  viewAllText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },

  // Peak performance
  peakCard: {
    backgroundColor: Colors.white, borderRadius: 16,
    margin: 20, padding: 16
  },
  peakTitle: { fontSize: 18, fontWeight: '800', color: Colors.textDark, marginBottom: 8 },
  peakDesc: { fontSize: 13, color: Colors.textGray, lineHeight: 20, marginBottom: 16 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 100 },
  barCol: { flex: 1, alignItems: 'center' },
  barWrapper: { height: 80, justifyContent: 'flex-end' },
  bar: { width: 20, borderRadius: 6 },
  barLabel: { fontSize: 11, color: Colors.textGray, marginTop: 4, fontWeight: '600' },

  // Bottom buttons
  bottomBtns: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 12, padding: 20,
    paddingBottom: 36, backgroundColor: Colors.background,
    borderTopWidth: 1, borderTopColor: Colors.inputBg
  },
  editBtn: {
    flex: 1, backgroundColor: Colors.white,
    borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1.5,
    borderColor: Colors.textDark
  },
  editBtnText: { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  deleteBtn: {
    flex: 1, backgroundColor: '#FFF0F0',
    borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1.5,
    borderColor: '#EF5350'
  },
  deleteBtnText: { fontSize: 15, fontWeight: '700', color: '#EF5350' },
})