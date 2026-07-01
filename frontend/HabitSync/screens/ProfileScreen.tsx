// screens/ProfileScreen.tsx
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import api from "../services/api";
import { Colors } from "../constants/Colors";
import { signalRService } from "../services/signalrService";
import { useAppContext } from "../context/AppContext";

export default function ProfileScreen({ navigation }: any) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [notifEnabled, setNotifEnabled] = useState(true);

  const { dispatch } = useAppContext()

  const [stats, setStats] = useState({
    totalHabits: 0,
    totalPartners: 0,
    longestStreak: 0,
    completedToday: 0,
  });

  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  const loadProfile = async () => {
    const name = await SecureStore.getItemAsync("displayName");
    const mail = await SecureStore.getItemAsync("email");
    setDisplayName(name ?? "");
    setEmail(mail ?? "");
  };

  const loadStats = async () => {
    try {
      const [habitsRes, partnersRes] = await Promise.all([
        api.get("/api/habits"),
        api.get("/api/partnerships/mine"),
      ]);

      const today = new Date().toISOString().split("T")[0];
      const habits = habitsRes.data;
      const partners = partnersRes.data.filter(
        (p: any) => p.status === "accepted",
      );

      setStats({
        totalHabits: habits.length,
        totalPartners: partners.length,
        longestStreak: habits.reduce(
          (max: number, h: any) => Math.max(max, h.currentStreak),
          0,
        ),
        completedToday: habits.filter((h: any) => h.lastCheckIn === today)
          .length,
      });
    } catch (e) {
      console.log("Không load được stats");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất không?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          // 1. Gọi API logout
          try {
            const refreshToken = await SecureStore.getItemAsync("refreshToken");
            if (refreshToken) await api.post("/api/auth/logout", refreshToken);
          } catch {}

          // 2. Disconnect SignalR — phải trước khi xóa token
          console.log("[Logout] Disconnecting SignalR...");
          await signalRService.disconnect();

          // 3. Xóa toàn bộ storage
          await Promise.all([
            SecureStore.deleteItemAsync("accessToken"),
            SecureStore.deleteItemAsync("refreshToken"),
            SecureStore.deleteItemAsync("userId"),
            SecureStore.deleteItemAsync("displayName"),
            SecureStore.deleteItemAsync("email"),
          ]);

          dispatch({ type: 'CLEAR' })
          navigation.reset({ index: 0, routes: [{ name: 'Start' }] })

          // 4. Reset toàn bộ navigation stack
          // navigation.replace chỉ thay màn hình hiện tại
          // navigation.reset xóa toàn bộ stack → tất cả screen unmount → cleanup chạy
          navigation.reset({
            index: 0,
            routes: [{ name: "Start" }],
          });
        },
      },
    ]);
  };

  const menuItems = [
    {
      icon: "✏️",
      label: "Chỉnh sửa hồ sơ",
      onPress: () => Alert.alert("Coming soon", "Tính năng đang phát triển"),
    },
    {
      icon: "🔔",
      label: "Thông báo",
      right: (
        <Switch
          value={notifEnabled}
          onValueChange={setNotifEnabled}
          trackColor={{ true: Colors.primary }}
        />
      ),
    },
    {
      icon: "🔒",
      label: "Đổi mật khẩu",
      onPress: () => Alert.alert("Coming soon", "Tính năng đang phát triển"),
    },
    {
      icon: "❓",
      label: "Trợ giúp & Hỗ trợ",
      onPress: () => Alert.alert("Coming soon", "Tính năng đang phát triển"),
    },
    {
      icon: "⭐",
      label: "Đánh giá ứng dụng",
      onPress: () => Alert.alert("Coming soon", "Tính năng đang phát triển"),
    },
  ];

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerBg}>
          <Text style={styles.logo}>☑ HabitSync</Text>
        </View>

        {/* Avatar + Name */}
        <View style={styles.profileSection}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>
              {(displayName ?? "?").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalHabits}</Text>
            <Text style={styles.statLabel}>Habits</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalPartners}</Text>
            <Text style={styles.statLabel}>Partners</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.longestStreak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.completedToday}</Text>
            <Text style={styles.statLabel}>Done Today</Text>
          </View>
        </View>

        {/* Menu items */}
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuRow,
                index < menuItems.length - 1 && styles.menuRowBorder,
              ]}
              onPress={item.onPress}
              activeOpacity={item.right ? 1 : 0.6}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              {item.right ? (
                item.right
              ) : (
                <Text style={styles.menuChevron}>›</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* App version */}
        <Text style={styles.version}>HabitSync v1.0.0</Text>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Đăng xuất</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  headerBg: {
    backgroundColor: Colors.white,
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  logo: { fontSize: 20, fontWeight: "800", color: Colors.primary },

  // Profile
  profileSection: { alignItems: "center", paddingVertical: 24 },
  avatarLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarText: { color: "#fff", fontSize: 36, fontWeight: "800" },
  displayName: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textDark,
    marginBottom: 4,
  },
  email: { fontSize: 14, color: Colors.textGray },

  // Stats
  statsGrid: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.primary,
    marginBottom: 2,
  },
  statLabel: { fontSize: 11, color: Colors.textGray, fontWeight: "600" },
  statDivider: { width: 1, backgroundColor: Colors.inputBg, marginVertical: 4 },

  // Menu
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 12,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.inputBg,
  },
  menuIcon: { fontSize: 18, width: 28 },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textDark,
  },
  menuChevron: { fontSize: 22, color: Colors.textGray },

  // Logout
  version: {
    textAlign: "center",
    color: Colors.textGray,
    fontSize: 12,
    marginBottom: 16,
  },
  logoutBtn: {
    marginHorizontal: 20,
    backgroundColor: "#FFF0F0",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#EF5350",
  },
  logoutText: { color: "#EF5350", fontWeight: "700", fontSize: 15 },
});
