// screens/ConversationListScreen.tsx
import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'
import api from '../services/api'
import { signalRService } from '../services/signalrService'
import { Colors } from '../constants/Colors'

type Conversation = {
  id: number
  partnershipId: number
  partnerName: string
  habitName: string
  lastMessage?: { content: string; sentAt: string; senderId: number }
  unreadCount: number
}

export default function ConversationListScreen({ navigation }: any) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<number[]>([])

  useEffect(() => {
    connectSignalR()
    return () => { signalRService.off('ReceiveMessage') }
  }, [])

  useFocusEffect(useCallback(() => { fetchConversations() }, []))

  const connectSignalR = async () => {
    if (!signalRService.isConnected()) await signalRService.connect()

    // Lắng nghe tin nhắn mới → cập nhật lastMessage ngay
    signalRService.on('ReceiveMessage', (message: any) => {
      setConversations(prev => prev.map(c =>
        c.id === message.conversationId
          ? { ...c, lastMessage: message, unreadCount: c.unreadCount + 1 }
          : c
      ))
    })

    signalRService.on('OnlineUsers', (userIds: number[]) => setOnlineUsers(userIds))
    signalRService.on('UserOnline', (userId: number) =>
      setOnlineUsers(prev => [...new Set([...prev, userId])]))
    signalRService.on('UserOffline', (userId: number) =>
      setOnlineUsers(prev => prev.filter(id => id !== userId)))
  }

  const fetchConversations = async () => {
    try {
      const res = await api.get('/api/chat/conversations')
      setConversations(res.data)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      <FlatList
        data={conversations}
        keyExtractor={c => c.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Chat', {
              conversationId: item.id,
              partnerName: item.partnerName
            })}
          >
            {/* Avatar + online indicator */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.partnerName.charAt(0).toUpperCase()}
                </Text>
              </View>
              {onlineUsers.includes(item.partnershipId) && (
                <View style={styles.onlineDot} />
              )}
            </View>

            {/* Content */}
            <View style={styles.cardContent}>
              <View style={styles.cardTop}>
                <Text style={styles.partnerName}>{item.partnerName}</Text>
                {item.lastMessage && (
                  <Text style={styles.timeText}>
                    {new Date(item.lastMessage.sentAt).toLocaleTimeString([], {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </Text>
                )}
              </View>
              <View style={styles.cardBottom}>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.lastMessage?.content ?? `Habit: ${item.habitName}`}
                </Text>
                {item.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unreadCount}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào</Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textDark, marginBottom: 16 },
  card: {
    backgroundColor: Colors.white, borderRadius: 14,
    padding: 14, flexDirection: 'row',
    alignItems: 'center', marginBottom: 8, gap: 12
  },
  avatarContainer: { position: 'relative' },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center'
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2, borderColor: Colors.white
  },
  cardContent: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  partnerName: { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  timeText: { fontSize: 11, color: Colors.textGray },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessage: { fontSize: 13, color: Colors.textGray, flex: 1 },
  unreadBadge: {
    backgroundColor: Colors.primary, borderRadius: 10,
    minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 5
  },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: Colors.textGray, marginTop: 40 },
})