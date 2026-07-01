// screens/EditHabitScreen.tsx
import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView
} from 'react-native'
import api from '../services/api'
import { Colors } from '../constants/Colors'

export default function EditHabitScreen({ route, navigation }: any) {
  const { habitId } = route.params
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get(`/api/habits/${habitId}`).then(res => {
      setName(res.data.name)
      setDescription(res.data.description ?? '')
      setFrequency(res.data.frequency)
    }).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Tên habit không được để trống')
      return
    }
    setSaving(true)
    try {
      await api.put(`/api/habits/${habitId}`, { name, description, frequency })
      Alert.alert('✅', 'Đã cập nhật habit!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ])
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message ?? 'Không cập nhật được')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Habit</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <Text style={styles.saveBtn}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Icon preview */}
        <View style={styles.iconPreview}>
          <View style={styles.iconBox}>
            <Text style={styles.iconEmoji}>✨</Text>
          </View>
          <TouchableOpacity style={styles.changeIconBtn}>
            <Text style={styles.changeIconText}>Change Icon</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <Text style={styles.label}>Habit Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ví dụ: Đọc sách 20 trang"
            maxLength={100}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Mô tả thêm về habit này..."
            multiline
            numberOfLines={3}
            maxLength={300}
          />

          <Text style={styles.label}>Frequency</Text>
          <View style={styles.freqRow}>
            {(['daily', 'weekly'] as const).map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.freqBtn, frequency === f && styles.freqBtnActive]}
                onPress={() => setFrequency(f)}
              >
                <Text style={styles.freqIcon}>{f === 'daily' ? '📅' : '🗓'}</Text>
                <Text style={[styles.freqText, frequency === f && styles.freqTextActive]}>
                  {f === 'daily' ? 'Hàng ngày' : 'Hàng tuần'}
                </Text>
                <Text style={[styles.freqSub, frequency === f && { color: 'rgba(255,255,255,0.8)' }]}>
                  {f === 'daily' ? '7 days/week' : '1 day/week'}
                </Text>
                {frequency === f && (
                  <View style={styles.freqCheck}>
                    <Text style={styles.freqCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tips for Success</Text>
          <Text style={styles.tipItem}>• Tên habit nên cụ thể và có thể đo được</Text>
          <Text style={styles.tipItem}>• Bắt đầu nhỏ — 2 phút rule của James Clear</Text>
          <Text style={styles.tipItem}>• Liên kết với habit cũ (habit stacking)</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom save button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveFullBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveFullBtnText}>💾  Save Changes</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingTop: 56,
    paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.inputBg
  },
  backBtn: { fontSize: 22, color: Colors.primary, fontWeight: '700', width: 40 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.textDark },
  saveBtn: { fontSize: 15, fontWeight: '700', color: Colors.primary, width: 40, textAlign: 'right' },
  container: { flex: 1, padding: 20 },

  // Icon preview
  iconPreview: { alignItems: 'center', paddingVertical: 24 },
  iconBox: {
    width: 80, height: 80, borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
    shadowColor: Colors.primary, shadowOpacity: 0.35,
    shadowRadius: 10, elevation: 6
  },
  iconEmoji: { fontSize: 36 },
  changeIconBtn: {
    backgroundColor: Colors.inputBg, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 6
  },
  changeIconText: { fontSize: 13, fontWeight: '600', color: Colors.textGray },

  // Form
  formCard: {
    backgroundColor: Colors.white, borderRadius: 18,
    padding: 18, marginBottom: 14
  },
  label: { fontSize: 12, fontWeight: '700', color: Colors.textGray, marginBottom: 8, marginTop: 4 },
  input: {
    backgroundColor: Colors.inputBg, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, color: Colors.textDark, marginBottom: 16
  },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 12 },

  // Frequency
  freqRow: { flexDirection: 'row', gap: 10 },
  freqBtn: {
    flex: 1, backgroundColor: Colors.inputBg,
    borderRadius: 14, padding: 14, position: 'relative'
  },
  freqBtnActive: { backgroundColor: Colors.primary },
  freqIcon: { fontSize: 22, marginBottom: 6 },
  freqText: { fontSize: 14, fontWeight: '700', color: Colors.textDark, marginBottom: 2 },
  freqTextActive: { color: '#fff' },
  freqSub: { fontSize: 11, color: Colors.textGray },
  freqCheck: {
    position: 'absolute', top: 10, right: 10,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center'
  },
  freqCheckText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  // Tips
  tipsCard: {
    backgroundColor: '#FFF8E1', borderRadius: 16,
    padding: 16, marginBottom: 8
  },
  tipsTitle: { fontSize: 14, fontWeight: '800', color: '#F57F17', marginBottom: 10 },
  tipItem: { fontSize: 13, color: '#795548', marginBottom: 6, lineHeight: 18 },

  // Bottom save
  bottomBar: {
    padding: 16, paddingBottom: 32,
    backgroundColor: Colors.background,
    borderTopWidth: 1, borderTopColor: Colors.inputBg
  },
  saveFullBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center'
  },
  saveFullBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})