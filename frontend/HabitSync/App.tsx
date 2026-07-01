// App.tsx
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import StartScreen from "./screens/StartScreen";
import AuthScreen from "./screens/AuthScreen";
import HomeScreen from "./screens/HomeScreen";
import PartnershipScreen from "./screens/PartnershipScreen";
import SearchUserScreen from "./screens/SearchUserScreen";
import CreateHabitScreen from "./screens/CreateHabitScreen";
import ConversationListScreen from "./screens/ConversationListScreen";
import ChatScreen from "./screens/ChatScreen";
import { notificationService } from "./services/notificationService";
import HabitDetailScreen from "./screens/HabitDetailScreen";
import ProfileScreen from "./screens/ProfileScreen";
import StatsScreen from "./screens/StatsScreen";
import EditHabitScreen from "./screens/EditHabitScreen";

import { useEffect, useState, useRef } from "react";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import api from "./services/api";
import { AppProvider } from "./context/AppContext";

export default function App() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const Stack = createStackNavigator();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await SecureStore.getItemAsync("accessToken");

      if (!token) {
        setInitialRoute("Start");
        return;
      }

      try {
        // Gọi API đơn giản để verify token còn sống không
        await api.get("/api/habits");
        setInitialRoute("Home");
      } catch (e: any) {
        if (e.response?.status === 401) {
          // Token hết hạn → xóa và về Start
          await SecureStore.deleteItemAsync("accessToken");
          await SecureStore.deleteItemAsync("refreshToken");
          setInitialRoute("Start");
        } else {
          // Lỗi network — vẫn vào Home vì token có thể vẫn ok
          setInitialRoute("Home");
        }
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    setupNotifications();

    // Cleanup listener khi app unmount
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  const setupNotifications = async () => {
    const token = await notificationService.registerForPushNotifications();
    if (token) {
      await notificationService.savePushToken(token);
      await notificationService.scheduleDailyReminder();
    }

    // Log notification khi app đang mở
    notificationListener.current =
      notificationService.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
      });

    // Xử lý khi user tap vào notification
    responseListener.current =
      notificationService.addNotificationResponseListener((response) => {
        const data = response.notification.request.content.data;
        // Navigate đến màn hình phù hợp dựa trên type
        // (cần navigationRef để navigate từ ngoài component)
      });
  };

  // Chờ check token xong mới render navigator
  if (!initialRoute) return null;

  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Start" component={StartScreen} />
          <Stack.Screen name="Login" component={AuthScreen} />
          <Stack.Screen name="Register" component={AuthScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Partnership" component={PartnershipScreen} />
          <Stack.Screen name="SearchUser" component={SearchUserScreen} />
          <Stack.Screen name="CreateHabit" component={CreateHabitScreen} />
          <Stack.Screen
            name="Conversations"
            component={ConversationListScreen}
          />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="HabitDetail" component={HabitDetailScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Stats" component={StatsScreen} />
          <Stack.Screen name="EditHabit" component={EditHabitScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
