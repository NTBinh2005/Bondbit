// screens/AuthScreen.tsx
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Colors } from '../constants/Colors'
import { LinearGradient } from 'expo-linear-gradient'
import * as SecureStore from 'expo-secure-store'
import api from '../services/api'

export default function AuthScreen() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const navigation = useNavigation<any>()

  const handleSubmit = async () => {
    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register'
      const payload = tab === 'login'
        ? { email, password }
        : { email, password, displayName }

      const res = await api.post(endpoint, payload)

      // Lưu token vào SecureStore
      await SecureStore.setItemAsync('accessToken', res.data.accessToken)
      await SecureStore.setItemAsync('refreshToken', res.data.refreshToken)
      await SecureStore.setItemAsync('userId', res.data.userId.toString()) 
      await SecureStore.setItemAsync('displayName', res.data.displayName)
      await SecureStore.setItemAsync('email', email)

      // Thêm dòng này để verify
      const saved = await SecureStore.getItemAsync('accessToken')
      console.log('Token saved:', saved ? saved.substring(0, 20) + '...' : 'NULL')

      // Điều hướng sang Home
      navigation.replace('Home')
    } catch (e: any) {
      console.log('Status:', e.response?.status)
      console.log('Data:', JSON.stringify(e.response?.data))
      console.log('Message:', e.message)
      Alert.alert('Lỗi', e.response?.data?.message ?? 'Đăng nhập thất bại')
  }
}

  return (
    <LinearGradient colors={['#E8E8FF', '#F4F4FF', '#E8FFE8']} style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>☑</Text>
        </View>
        <Text style={styles.logoText}>HabitSync</Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        {/* Tab switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, tab === 'login' && styles.tabActive]}
            onPress={() => setTab('login')}
          >
            <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'register' && styles.tabActive]}
            onPress={() => setTab('register')}
          >
            <Text style={[styles.tabText, tab === 'register' && styles.tabTextActive]}>Register</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{tab === 'login' ? 'Welcome Back' : 'Create Account'}</Text>
        <Text style={styles.subtitle}>
          {tab === 'login' ? 'Your community is waiting for you.' : 'Start your habit journey today.'}
        </Text>

        {/* Social buttons */}
        <TouchableOpacity style={styles.socialBtn}>
          <Text style={styles.socialBtnText}>🌐  Continue with Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.socialBtn, styles.socialBtnDark]}>
          <Text style={[styles.socialBtnText, { color: Colors.white }]}>🍎  Continue with Apple</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>or</Text>

        {/* Form fields */}
        {tab === 'register' && (
          <TextInput
            style={styles.input}
            placeholder="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
          />
        )}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="name@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.passwordRow}>
          <Text style={styles.label}>Password</Text>
          {tab === 'login' && <Text style={styles.forgot}>Forgot?</Text>}
        </View>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmit}>
          <Text style={styles.btnSubmitText}>{tab === 'login' ? 'Sign In' : 'Create Account'}</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom trust indicators */}
      <View style={styles.trustRow}>
        {[['👥', '50k+\nPartners'], ['✅', 'Safe\nSpace'], ['✨', 'Smart\nTracking']].map(([icon, label]) => (
          <View key={label} style={styles.trustItem}>
            <Text style={styles.trustIcon}>{icon}</Text>
            <Text style={styles.trustLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
  logoContainer: { alignItems: 'center', marginBottom: 24 },
  logoBox: { backgroundColor: Colors.primary, width: 64, height: 64, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  logoIcon: { fontSize: 28, color: Colors.white },
  logoText: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  card: { backgroundColor: Colors.white, borderRadius: 24, padding: 24, marginBottom: 24 },
  tabBar: { flexDirection: 'row', backgroundColor: Colors.inputBg, borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontWeight: '600', color: Colors.textGray },
  tabTextActive: { color: Colors.white },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textDark, marginBottom: 4 },
  subtitle: { fontSize: 13, color: Colors.textGray, marginBottom: 20 },
  socialBtn: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  socialBtnDark: { backgroundColor: '#1A1A2E', borderColor: '#1A1A2E' },
  socialBtnText: { fontWeight: '600', fontSize: 15, color: Colors.textDark },
  orText: { textAlign: 'center', color: Colors.textGray, marginVertical: 12 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textDark, marginBottom: 6 },
  passwordRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forgot: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  input: { backgroundColor: Colors.inputBg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 14 },
  btnSubmit: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  btnSubmitText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  trustRow: { flexDirection: 'row', justifyContent: 'space-around' },
  trustItem: { alignItems: 'center', gap: 4 },
  trustIcon: { fontSize: 22 },
  trustLabel: { fontSize: 11, color: Colors.textGray, textAlign: 'center' },
})