// screens/PartnershipScreen.tsx
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, FlatList
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import * as SecureStore from 'expo-secure-store'
import { partnershipApi } from '../services/partnershipApi'
import api from '../services/api'
import { Colors } from '../constants/Colors'
import { getErrorMessage } from '../utils/errorHelper'

type UserResult = {
  id: number
  displayName: string
  email: string
  avatarUrl?: string
}

type Partnership = {
  id: number
  requesterId: number
  requesterName: string
  receiverId: number
  receiverName: string
  habitName: string
  status: string
  sharedStreak: number
}

const CATEGORIES = ['All', 'Fitness', 'Study', 'Zen', 'Tasks']

export default function PartnershipScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'find' | 'mine'>('find')
  const [keyword, setKeyword] = useState('')
  const [users, setUsers] = useState<UserResult[]>([])
  const [partnerships, setPartnerships] = useState<Partnership[]>([])
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<number>(0)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [habits, setHabits] = useState<any[]>([])
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    SecureStore.getItemAsync('userId').then(id => setCurrentUserId(Number(id)))
    fetchHabits()
  }, [])

  useFocusEffect(useCallback(() => { fetchPartnerships() }, []))

  const fetchHabits = async () => {
    const res = await api.get('/api/habits')
    setHabits(res.data)
  }

  const fetchPartnerships = async () => {
    try {
      const res = await partnershipApi.getMine()
      setPartnerships(res.data)
    } catch {}
  }

  const handleSearch = (text: string) => {
    setKeyword(text)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    if (text.length < 2) { setUsers([]); return }

    debounceTimer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await api.get('/api/users/search', { params: { keyword: text } })
        setUsers(res.data)
      } finally {
        setLoading(false)
      }
    }, 500)
  }

  const handleInvite = (user: UserResult) => {
    if (habits.length === 0) {
      Alert.alert('Chưa có habit', 'Bạn cần tạo ít nhất một habit trước khi ghép cặp')
      return
    }
    Alert.alert(
      `Ghép cặp với ${user.displayName}`,
      'Chọn habit để ghép cặp:',
      [
        ...habits.map((h: any) => ({
          text: h.name,
          onPress: async () => {
            try {
              await partnershipApi.invite(user.id, h.id)
              Alert.alert('✅', `Đã gửi lời mời tới ${user.displayName}!`)
              fetchPartnerships()
            } catch (e: any) {
              Alert.alert('Lỗi', getErrorMessage(e))
            }
          }
        })),
        { text: 'Huỷ', style: 'cancel' }
      ]
    )
  }

  const handleAccept = async (id: number) => {
    try {
      await partnershipApi.accept(id)
      fetchPartnerships()
    } catch (e: any) {
      Alert.alert('Lỗi', getErrorMessage(e))
    }
  }

  const handleReject = async (id: number) => {
    Alert.alert('Từ chối', 'Bạn có chắc muốn từ chối?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Từ chối', style: 'destructive',
        onPress: async () => {
          try {
            await partnershipApi.reject(id)
            fetchPartnerships()
          } catch (e: any) {
            Alert.alert('Lỗi', getErrorMessage(e))
          }
        }
      }
    ])
  }

  const getPartnerName = (p: Partnership) =>
    p.requesterId === currentUserId ? p.receiverName : p.requesterName

  const isIncoming = (p: Partnership) => p.receiverId === currentUserId

  const pending = partnerships.filter(p => p.status === 'pending')
  const incomingPending = pending.filter(p => isIncoming(p))
  const outgoingPending = pending.filter(p => !isIncoming(p))
  const accepted = partnerships.filter(p => p.status === 'accepted')

  // Mock match % dựa trên vị trí trong kết quả tìm kiếm
  const matchPercents = [98, 94, 89, 85, 91, 87]

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>☑ HabitSync</Text>
        <View style={styles.headerIcons}>
          <Text style={styles.headerIcon}>🔔</Text>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>U</Text>
          </View>
        </View>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'find' && styles.tabBtnActive]}
          onPress={() => setActiveTab('find')}
        >
          <Text style={[styles.tabText, activeTab === 'find' && styles.tabTextActive]}>
            Find Match
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'mine' && styles.tabBtnActive]}
          onPress={() => setActiveTab('mine')}
        >
          <Text style={[styles.tabText, activeTab === 'mine' && styles.tabTextActive]}>
            My Partners
            {incomingPending.length > 0 && (
              <Text style={styles.tabBadge}> {incomingPending.length}</Text>
            )}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === 'find' ? (
          /* ---- FIND TAB ---- */
          <View style={styles.section}>
            <Text style={styles.pageTitle}>Find Your Match</Text>
            <Text style={styles.pageSub}>
              Shared accountability makes success twice as likely.
            </Text>

            {/* Search bar */}
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search friends or usernames..."
                value={keyword}
                onChangeText={handleSearch}
                placeholderTextColor={Colors.textGray}
              />
            </View>

            {/* Category chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Loading */}
            {loading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />}

            {/* Search results */}
            {users.length > 0 ? (
              users.map((user, index) => (
                <UserCard
                  key={user.id}
                  user={user}
                  matchPercent={matchPercents[index % matchPercents.length]}
                  onInvite={() => handleInvite(user)}
                />
              ))
            ) : keyword.length >= 2 && !loading ? (
              <View style={styles.emptySearch}>
                <Text style={styles.emptySearchText}>Không tìm thấy user nào với từ khoá "{keyword}"</Text>
              </View>
            ) : null}

            {/* Improvement banner */}
            <View style={styles.improvementBanner}>
              <Text style={styles.bannerTitle}>Improvement Awaits</Text>
              <Text style={styles.bannerDesc}>
                Users with a partner are 2.4x more likely to maintain their 30-day streak.
                Your perfect partner is just a click away.
              </Text>
              <View style={styles.bannerAvatars}>
                {['A', 'B', 'C'].map((a, i) => (
                  <View key={a} style={[styles.bannerAvatar, { marginLeft: i > 0 ? -8 : 0 }]}>
                    <Text style={styles.bannerAvatarText}>{a}</Text>
                  </View>
                ))}
                <Text style={styles.bannerCount}>+ 1.2k found partners today</Text>
              </View>
            </View>
          </View>
        ) : (
          /* ---- MY PARTNERS TAB ---- */
          <View style={styles.section}>

            {/* Incoming invites */}
            {incomingPending.length > 0 && (
              <View style={styles.subsection}>
                <View style={styles.subsectionHeader}>
                  <Text style={styles.subsectionTitle}>Lời mời nhận được</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{incomingPending.length}</Text>
                  </View>
                </View>
                {incomingPending.map(p => (
                  <PendingCard
                    key={p.id}
                    partnerName={getPartnerName(p)}
                    habitName={p.habitName}
                    isIncoming
                    onAccept={() => handleAccept(p.id)}
                    onReject={() => handleReject(p.id)}
                  />
                ))}
              </View>
            )}

            {/* Outgoing invites */}
            {outgoingPending.length > 0 && (
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>Lời mời đã gửi</Text>
                {outgoingPending.map(p => (
                  <PendingCard
                    key={p.id}
                    partnerName={getPartnerName(p)}
                    habitName={p.habitName}
                    isIncoming={false}
                  />
                ))}
              </View>
            )}

            {/* Active partners */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>
                Đang ghép cặp ({accepted.length})
              </Text>
              {accepted.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🤝</Text>
                  <Text style={styles.emptyTitle}>Chưa có partner nào</Text>
                  <TouchableOpacity
                    style={styles.findBtn}
                    onPress={() => setActiveTab('find')}
                  >
                    <Text style={styles.findBtnText}>Tìm Partner →</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                accepted.map(p => (
                  <View key={p.id} style={styles.partnerCard}>
                    <View style={styles.partnerAvatar}>
                      <Text style={styles.partnerAvatarText}>
                        {(getPartnerName(p) ?? '?').charAt(0).toUpperCase()}
                      </Text>
                      <View style={styles.onlineDot} />
                    </View>
                    <View style={styles.partnerInfo}>
                      <Text style={styles.partnerName}>{getPartnerName(p)}</Text>
                      <Text style={styles.partnerHabit}>🎯 {p.habitName}</Text>
                    </View>
                    <View style={styles.streakBox}>
                      <Text style={styles.streakFire}>🔥</Text>
                      <Text style={styles.streakNum}>{p.sharedStreak}</Text>
                      <Text style={styles.streakLabel}>days</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomBar navigation={navigation} active="Partner" />
    </View>
  )
}

// ---- UserCard Component ----
function UserCard({ user, matchPercent, onInvite }: {
  user: UserResult
  matchPercent: number
  onInvite: () => void
}) {
  return (
    <View style={styles.userCard}>
      {/* Match badge */}
      <View style={styles.matchBadge}>
        <Text style={styles.matchText}>{matchPercent}% Match</Text>
      </View>

      {/* Avatar */}
      <View style={styles.userAvatarWrapper}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {user.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userOnlineDot} />
      </View>

      <Text style={styles.userName}>{user.displayName}</Text>
      <Text style={styles.userBio}>{user.email}</Text>

      {/* Shared interests — dùng email domain làm placeholder */}
      <Text style={styles.interestLabel}>Shared Interests</Text>
      <View style={styles.interestRow}>
        {['Habits', 'Goals', 'Growth'].map(tag => (
          <View key={tag} style={styles.interestTag}>
            <Text style={styles.interestTagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.requestBtn} onPress={onInvite}>
        <Text style={styles.requestBtnText}>Request Partnership</Text>
      </TouchableOpacity>
    </View>
  )
}

// ---- PendingCard Component ----
function PendingCard({ partnerName, habitName, isIncoming, onAccept, onReject }: {
  partnerName: string
  habitName: string
  isIncoming: boolean
  onAccept?: () => void
  onReject?: () => void
}) {
  return (
    <View style={[styles.pendingCard, !isIncoming && { borderLeftColor: Colors.inputBg }]}>
      <View style={styles.pendingLeft}>
        <View style={styles.pendingAvatar}>
          <Text style={styles.pendingAvatarText}>
            {(partnerName ?? '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.pendingName}>{partnerName}</Text>
          <Text style={styles.pendingHabit}>🎯 {habitName}</Text>
          {isIncoming && <Text style={styles.pendingTag}>Muốn ghép cặp với bạn</Text>}
        </View>
      </View>
      {isIncoming ? (
        <View style={styles.pendingActions}>
          <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
            <Text style={styles.acceptText}>✓</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
            <Text style={styles.rejectText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.waitingPill}>
          <Text style={styles.waitingText}>⏳ Chờ</Text>
        </View>
      )}
    </View>
  )
}

// ---- BottomBar ----
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
        <TouchableOpacity key={tab.name} style={styles.bottomTab} onPress={() => navigation.navigate(tab.screen)}>
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
    paddingHorizontal: 20, paddingBottom: 12,
    backgroundColor: Colors.white
  },
  logo: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { fontSize: 20 },
  headerAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.textDark,
    justifyContent: 'center', alignItems: 'center'
  },
  headerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Tabs
  tabRow: {
    flexDirection: 'row', backgroundColor: Colors.white,
    paddingHorizontal: 20, paddingBottom: 12, gap: 8
  },
  tabBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    backgroundColor: Colors.inputBg, alignItems: 'center'
  },
  tabBtnActive: { backgroundColor: Colors.primary },
  tabText: { fontWeight: '700', color: Colors.textGray, fontSize: 14 },
  tabTextActive: { color: '#fff' },
  tabBadge: { color: '#FFD700', fontWeight: '900' },

  section: { padding: 20 },
  pageTitle: { fontSize: 26, fontWeight: '900', color: Colors.textDark, marginBottom: 6 },
  pageSub: { fontSize: 13, color: Colors.textGray, marginBottom: 16, lineHeight: 18 },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 12, gap: 8
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textDark },

  // Category chips
  categoryRow: { marginBottom: 20 },
  categoryChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: Colors.white,
    marginRight: 8, borderWidth: 1.5, borderColor: Colors.inputBg
  },
  categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryText: { fontSize: 13, fontWeight: '600', color: Colors.textGray },
  categoryTextActive: { color: '#fff' },

  // User card
  userCard: {
    backgroundColor: Colors.white, borderRadius: 18,
    padding: 18, marginBottom: 14, position: 'relative'
  },
  matchBadge: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: '#EEF0FF', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4
  },
  matchText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  userAvatarWrapper: { position: 'relative', marginBottom: 10, width: 64 },
  userAvatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center'
  },
  userAvatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  userOnlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#4CAF50', borderWidth: 2, borderColor: Colors.white
  },
  userName: { fontSize: 18, fontWeight: '800', color: Colors.textDark, marginBottom: 4 },
  userBio: { fontSize: 13, color: Colors.textGray, marginBottom: 12, lineHeight: 18 },
  interestLabel: { fontSize: 11, fontWeight: '700', color: Colors.textGray, marginBottom: 8 },
  interestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  interestTag: {
    backgroundColor: Colors.inputBg, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5
  },
  interestTagText: { fontSize: 12, fontWeight: '600', color: Colors.textDark },
  requestBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center'
  },
  requestBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Improvement banner
  improvementBanner: {
    backgroundColor: Colors.primary, borderRadius: 20,
    padding: 20, marginTop: 8
  },
  bannerTitle: { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 8 },
  bannerDesc: { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 18, marginBottom: 16 },
  bannerAvatars: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  bannerAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.primary
  },
  bannerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 10 },
  bannerCount: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '600', marginLeft: 4 },

  // Empty search
  emptySearch: { alignItems: 'center', paddingVertical: 32 },
  emptySearchText: { color: Colors.textGray, fontSize: 14, textAlign: 'center' },

  // Subsection
  subsection: { marginBottom: 24 },
  subsectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  subsectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textDark, marginBottom: 10 },
  badge: {
    backgroundColor: '#EF5350', borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  // Pending card
  pendingCard: {
    backgroundColor: Colors.white, borderRadius: 14,
    padding: 14, marginBottom: 8,
    borderLeftWidth: 3, borderLeftColor: '#FFA726',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  pendingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  pendingAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center'
  },
  pendingAvatarText: { color: '#fff', fontWeight: '700' },
  pendingName: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  pendingHabit: { fontSize: 12, color: Colors.textGray, marginTop: 2 },
  pendingTag: { fontSize: 11, color: '#FFA726', fontWeight: '600', marginTop: 2 },
  pendingActions: { flexDirection: 'row', gap: 6 },
  acceptBtn: {
    backgroundColor: '#4CAF50', width: 34, height: 34,
    borderRadius: 10, justifyContent: 'center', alignItems: 'center'
  },
  acceptText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  rejectBtn: {
    backgroundColor: '#FFEBEE', width: 34, height: 34,
    borderRadius: 10, justifyContent: 'center', alignItems: 'center'
  },
  rejectText: { color: '#EF5350', fontWeight: '800', fontSize: 14 },
  waitingPill: {
    backgroundColor: Colors.inputBg, borderRadius: 16,
    paddingHorizontal: 10, paddingVertical: 5
  },
  waitingText: { fontSize: 11, color: Colors.textGray, fontWeight: '600' },

  // Active partner card
  partnerCard: {
    backgroundColor: Colors.white, borderRadius: 14,
    padding: 14, flexDirection: 'row',
    alignItems: 'center', marginBottom: 8, gap: 12
  },
  partnerAvatar: { position: 'relative' },
  partnerAvatarText: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.primary, color: '#fff',
    textAlign: 'center', textAlignVertical: 'center',
    fontSize: 18, fontWeight: '700', overflow: 'hidden'
  },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#4CAF50', borderWidth: 2, borderColor: Colors.white
  },
  partnerInfo: { flex: 1 },
  partnerName: { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  partnerHabit: { fontSize: 12, color: Colors.textGray, marginTop: 2 },
  streakBox: { alignItems: 'center' },
  streakFire: { fontSize: 18 },
  streakNum: { fontSize: 20, fontWeight: '900', color: Colors.primary },
  streakLabel: { fontSize: 10, color: Colors.textGray },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 32, backgroundColor: Colors.white, borderRadius: 16 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginBottom: 16 },
  findBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 },
  findBtnText: { color: '#fff', fontWeight: '700' },

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