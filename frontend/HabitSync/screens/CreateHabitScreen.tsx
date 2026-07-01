// screens/CreateHabitScreen.tsx
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import api from '../services/api'
import { Colors } from '../constants/Colors'

export default function CreateHabitScreen({ navigation }: any) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily')

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Tên habit không được để trống')
      return
    }
    try {
      await api.post('/api/habits', { name, description, frequency })
      navigation.goBack()
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data ?? 'Không tạo được habit')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tạo Habit Mới</Text>

      <Text style={styles.label}>Tên habit</Text>
      <TextInput
        style={styles.input}
        placeholder="Ví dụ: Đọc sách 20 trang"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Mô tả (tuỳ chọn)</Text>
      <TextInput
        style={styles.input}
        placeholder="Mô tả thêm..."
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Tần suất</Text>
      <View style={styles.freqRow}>
        {(['daily', 'weekly'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.freqBtn, frequency === f && styles.freqBtnActive]}
            onPress={() => setFrequency(f)}
          >
            <Text style={[styles.freqText, frequency === f && styles.freqTextActive]}>
              {f === 'daily' ? 'Hàng ngày' : 'Hàng tuần'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={handleCreate}>
        <Text style={styles.submitText}>Tạo Habit</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textDark, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textDark, marginBottom: 6 },
  input: {
    backgroundColor: Colors.white, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, marginBottom: 16
  },
  freqRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  freqBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: Colors.inputBg, alignItems: 'center'
  },
  freqBtnActive: { backgroundColor: Colors.primary },
  freqText: { fontWeight: '600', color: Colors.textGray },
  freqTextActive: { color: '#fff' },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center'
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})