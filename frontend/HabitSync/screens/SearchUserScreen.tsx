// screens/SearchUserScreen.tsx
import { useState, useRef } from 'react'
import {
  View, Text, TextInput, FlatList,
  TouchableOpacity, StyleSheet, Alert, ActivityIndicator
} from 'react-native'
import { partnershipApi } from '../services/partnershipApi'
import api from '../services/api'
import { Colors } from '../constants/Colors'

type UserResult = { id: number; displayName: string; email: string; avatarUrl?: string }

export default function SearchUserScreen({ navigation }: any) {
  const [keyword, setKeyword] = useState('')
  const [users, setUsers] = useState<UserResult[]>([])
  const [habits, setHabits] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = async (text: string) => {
    setKeyword(text)
    if (text.length < 2) { setUsers([]); return }

    // Hủy timer cũ nếu user vẫn đang gõ
    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    if (text.length < 2) { setUsers([]); return }

    // Chờ 500ms sau khi gõ xong mới gọi API
    debounceTimer.current = setTimeout(async () => {
        setLoading(true)
        try {
            const res = await partnershipApi.searchUsers(text)
            console.log('Search result:', JSON.stringify(res.data))
            setUsers(res.data)
        } catch (e: any) {
                console.log('Search error:', e.response?.status, JSON.stringify(e.response?.data))
        } finally {
            setLoading(false)
            }
        }, 500)
    }

  const handleSelectUser = async (user: UserResult) => {
    setSelectedUser(user)
    // Load danh sách habit của mình để chọn ghép cặp
    const res = await api.get('/api/habits')
    setHabits(res.data)
  }

  const handleInvite = async (habitId: number) => {
    if (!selectedUser) return
    try {
      await partnershipApi.invite(selectedUser.id, habitId)
      Alert.alert('✅', `Đã gửi lời mời tới ${selectedUser.displayName}`)
      navigation.goBack()
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data ?? 'Không gửi được lời mời')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tìm Partner</Text>

      <TextInput
        style={styles.input}
        placeholder="Tìm theo tên hoặc email..."
        value={keyword}
        onChangeText={handleSearch}
        autoFocus
      />

      {loading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 12 }} />}

      {/* Chưa chọn user → hiển thị danh sách tìm kiếm */}
      {!selectedUser && (
        <FlatList
          data={users}
          keyExtractor={u => u.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.userCard}
              onPress={() => handleSelectUser(item)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.userName}>{item.displayName}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Đã chọn user → chọn habit để ghép cặp */}
      {selectedUser && (
        <View>
          <View style={styles.selectedUser}>
            <Text style={styles.selectedLabel}>
              Ghép cặp với <Text style={{ color: Colors.primary }}>{selectedUser.displayName}</Text>
            </Text>
            <TouchableOpacity onPress={() => setSelectedUser(null)}>
              <Text style={styles.changeBtn}>Đổi</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Chọn habit để ghép cặp:</Text>
          <FlatList
            data={habits}
            keyExtractor={h => h.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.habitCard}
                onPress={() => handleInvite(item.id)}
              >
                <Text style={styles.habitName}>{item.name}</Text>
                <Text style={styles.habitFreq}>{item.frequency}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textDark, marginBottom: 16 },
  input: {
    backgroundColor: Colors.white, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.inputBg
  },
  userCard: {
    backgroundColor: Colors.white, borderRadius: 12,
    padding: 14, flexDirection: 'row',
    alignItems: 'center', gap: 12, marginBottom: 8
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center'
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  userName: { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  userEmail: { fontSize: 12, color: Colors.textGray },
  selectedUser: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16
  },
  selectedLabel: { fontSize: 15, fontWeight: '600', color: Colors.textDark },
  changeBtn: { color: Colors.primary, fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textGray, marginBottom: 8 },
  habitCard: {
    backgroundColor: Colors.white, borderRadius: 12,
    padding: 14, marginBottom: 8
  },
  habitName: { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  habitFreq: { fontSize: 12, color: Colors.textGray, marginTop: 2 },
})