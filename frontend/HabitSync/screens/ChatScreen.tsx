// screens/ChatScreen.tsx — phần JSX và styles thay đổi, logic giữ nguyên
import { useEffect, useState, useRef } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  Alert, ActivityIndicator, Animated
} from 'react-native'
import * as SecureStore from 'expo-secure-store'
import api from '../services/api'
import { signalRService } from '../services/signalrService'
import { Colors } from '../constants/Colors'

type Message = {
  id: number
  conversationId: number
  senderId: number
  senderName: string
  content: string
  isRead: boolean
  sentAt: string
  isPending?: boolean
}

export default function ChatScreen({ route }: any) {
  const { conversationId, partnerName, partnerStreak } = route.params
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const currentUserIdRef = useRef<number>(0)
  const isMountedRef = useRef<boolean>(true)
  const pendingQueue = useRef<{ tempId: number; content: string }[]>([])

  useEffect(() => {
    isMountedRef.current = true
    init()
    return () => {
      isMountedRef.current = false
      signalRService.off('ReceiveMessage')
    }
  }, [])

  const init = async () => {
    const uid = await SecureStore.getItemAsync('userId')
    currentUserIdRef.current = Number(uid)

    try {
      const res = await api.get(`/api/chat/conversations/${conversationId}/messages`)
      if (!isMountedRef.current) return
      setMessages(res.data.map((m: any) => ({ ...m, senderId: Number(m.senderId) })))
    } finally {
      if (isMountedRef.current) setLoading(false)
    }

    await signalRService.markAsRead(conversationId)
    setupListener()
  }

  const setupListener = () => {
    signalRService.on('ReceiveMessage', (raw: any) => {
      if (!isMountedRef.current) return
      const message: Message = { ...raw, senderId: Number(raw.senderId), isPending: false }
      if (message.conversationId !== conversationId) return

      const isOwnMessage = message.senderId === currentUserIdRef.current

      setMessages(prev => {
        if (isOwnMessage && pendingQueue.current.length > 0) {
          const pending = pendingQueue.current.shift()!
          const idx = prev.findIndex(m => m.id === pending.tempId)
          if (idx !== -1) {
            const updated = [...prev]
            updated[idx] = message
            return updated
          }
        }
        if (prev.some(m => m.id === message.id)) return prev
        return [message, ...prev]
      })

      signalRService.markAsRead(conversationId)
    })
  }

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content) return
    const tempId = -Date.now()
    setInput('')

    pendingQueue.current.push({ tempId, content })
    setMessages(prev => [{
      id: tempId, conversationId, senderId: currentUserIdRef.current,
      senderName: '', content, isRead: false,
      sentAt: new Date().toISOString(), isPending: true
    }, ...prev])

    try {
      await signalRService.sendMessage(conversationId, content)
    } catch (e) {
      pendingQueue.current = pendingQueue.current.filter(p => p.tempId !== tempId)
      setMessages(prev => prev.filter(m => m.id !== tempId))
      Alert.alert('Lỗi', 'Không gửi được tin nhắn')
    }
  }

  const groupedMessages = groupByDate(messages)

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{partnerName?.charAt(0).toUpperCase()}</Text>
          <View style={styles.headerOnlineDot} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{partnerName}</Text>
          <Text style={styles.headerStreak}>{partnerStreak ?? 0} day streak</Text>
        </View>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Text style={styles.headerIcon}>📹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Text style={styles.headerIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        data={groupedMessages}
        keyExtractor={(item, i) => item.type === 'date' ? `date-${item.date}` : `msg-${item.id}`}
        inverted
        renderItem={({ item }) => {
          if (item.type === 'date') {
            return (
              <View style={styles.dateChipWrapper}>
                <View style={styles.dateChip}>
                  <Text style={styles.dateChipText}>{item.date}</Text>
                </View>
              </View>
            )
          }
          return (
            <MessageBubble
              message={item}
              isOwn={Number(item.senderId) === currentUserIdRef.current}
            />
          )
        }}
        contentContainerStyle={styles.messageList}
      />

      {/* Reaction quick bar */}
      <View style={styles.reactionBar}>
        {[{ emoji: '🙌', label: 'High Five' }, { emoji: '👏', label: 'Clap' }, { emoji: '🔥', label: 'Fire' }].map(r => (
          <TouchableOpacity
            key={r.label}
            style={styles.reactionPill}
            onPress={() => handleSend(`${r.emoji} ${r.label}`)}
          >
            <Text style={styles.reactionEmoji}>{r.emoji}</Text>
            <Text style={styles.reactionLabel}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Partner Progress card */}
      <View style={styles.partnerProgressCard}>
        <View style={styles.partnerProgressLeft}>
          <View style={styles.miniRing}>
            <Text style={styles.miniRingText}>75%</Text>
          </View>
          <View>
            <Text style={styles.partnerProgressTitle}>Partner Progress</Text>
            <Text style={styles.partnerProgressSub}>{partnerName}: 3/4 habits today</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.nudgeBtn}
          onPress={() => handleSend(`👋 Nudging you to complete your habit!`)}
        >
          <Text style={styles.nudgeBtnText}>Nudge {partnerName} for Water Intake</Text>
        </TouchableOpacity>
      </View>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!input.trim()}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

function groupByDate(messages: Message[]) {
  const result: any[] = []
  let lastDate = ''
  // messages đã inverted (mới nhất đầu) nên duyệt xuôi để chèn date chip đúng vị trí
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    const msgDate = new Date(msg.sentAt).toLocaleDateString()
    const nextMsg = messages[i + 1]
    const nextDate = nextMsg ? new Date(nextMsg.sentAt).toLocaleDateString() : null

    result.push(msg)
    if (msgDate !== nextDate) {
      const today = new Date().toLocaleDateString()
      result.push({ type: 'date', date: msgDate === today ? 'Today' : msgDate, id: `date-${msgDate}` })
    }
  }
  return result
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(isOwn ? 16 : -16)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 120, friction: 10 })
    ]).start()
  }, [])

  return (
    <Animated.View style={[
      styles.bubbleRow, isOwn && styles.bubbleRowOwn,
      { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }
    ]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>{message.content}</Text>
        <View style={styles.bubbleMeta}>
          {message.isPending ? (
            <ActivityIndicator size={8} color={isOwn ? 'rgba(255,255,255,0.7)' : Colors.textGray} />
          ) : (
            <Text style={[styles.timeText, isOwn && { color: 'rgba(255,255,255,0.7)' }]}>
              {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {isOwn && (message.isRead ? '  ✓✓' : '  ✓')}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingTop: 56, paddingBottom: 14, paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.inputBg
  },
  backIcon: { fontSize: 22, color: Colors.primary, fontWeight: '700' },
  headerAvatar: { position: 'relative' },
  headerAvatarText: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, color: '#fff',
    textAlign: 'center', textAlignVertical: 'center',
    fontSize: 16, fontWeight: '700', overflow: 'hidden'
  },
  headerOnlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: '#4CAF50', borderWidth: 2, borderColor: Colors.white
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '800', color: Colors.textDark },
  headerStreak: { fontSize: 12, color: '#4CAF50', fontWeight: '600' },
  headerIconBtn: { padding: 4 },
  headerIcon: { fontSize: 18 },

  messageList: { padding: 16, paddingBottom: 8 },
  dateChipWrapper: { alignItems: 'center', marginVertical: 12 },
  dateChip: { backgroundColor: Colors.inputBg, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 5 },
  dateChipText: { fontSize: 11, color: Colors.textGray, fontWeight: '600' },

  bubbleRow: { flexDirection: 'row', marginBottom: 6 },
  bubbleRowOwn: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: Colors.white, borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1
  },
  bubbleOwn: { backgroundColor: Colors.primary, borderBottomLeftRadius: 18, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: Colors.white },
  bubbleText: { fontSize: 15, color: Colors.textDark, lineHeight: 21 },
  bubbleTextOwn: { color: '#fff' },
  bubbleMeta: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  timeText: { fontSize: 10, color: Colors.textGray },

  // Reaction bar
  reactionBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  reactionPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.white, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.inputBg
  },
  reactionEmoji: { fontSize: 14 },
  reactionLabel: { fontSize: 12, fontWeight: '600', color: Colors.textDark },

  // Partner progress card
  partnerProgressCard: {
    backgroundColor: Colors.white, borderRadius: 16,
    marginHorizontal: 16, marginBottom: 8, padding: 14
  },
  partnerProgressLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  miniRing: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 3, borderColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center'
  },
  miniRingText: { fontSize: 10, fontWeight: '800', color: Colors.primary },
  partnerProgressTitle: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  partnerProgressSub: { fontSize: 11, color: Colors.textGray, marginTop: 2 },
  nudgeBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  nudgeBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Input
  inputRow: {
    flexDirection: 'row', padding: 12, paddingBottom: 24,
    backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.inputBg,
    alignItems: 'flex-end', gap: 8
  },
  input: {
    flex: 1, backgroundColor: Colors.inputBg, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100
  },
  sendBtn: {
    backgroundColor: Colors.primary, width: 44, height: 44,
    borderRadius: 22, justifyContent: 'center', alignItems: 'center'
  },
  sendBtnDisabled: { backgroundColor: Colors.inputBg },
  sendIcon: { color: '#fff', fontSize: 16 },
})