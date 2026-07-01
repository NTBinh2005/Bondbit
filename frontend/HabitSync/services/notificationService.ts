// services/notificationService.ts
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import api from './api'

// Cấu hình cách hiển thị notification khi app đang mở
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

class NotificationService {

  // Xin quyền và lấy Expo Push Token
  async registerForPushNotifications(): Promise<string | null> {
    // Chỉ chạy trên thiết bị thật — simulator không nhận push notification
    if (!Device.isDevice) {
      console.log('Push notifications chỉ hoạt động trên thiết bị thật')
      return null
    }

    // Xin quyền
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.log('User từ chối quyền notification')
      return null
    }

    // Lấy Expo Push Token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data

    // Android cần notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      })

      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Daily Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250],
      })
    }

    return token
  }

  // Gửi token lên backend để lưu
  async savePushToken(token: string) {
    try {
      await api.post('/api/notifications/register-token', { token })
    } catch (e) {
      console.log('Không lưu được push token:', e)
    }
  }

  // Schedule nhắc nhở hàng ngày lúc 21:00 (9PM)
  async scheduleDailyReminder() {
    // Hủy tất cả reminder cũ trước
    await Notifications.cancelAllScheduledNotificationsAsync()

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Đừng quên habit hôm nay!',
        body: 'Bạn chưa check-in habit nào hôm nay. Cố lên!',
        sound: true,
        data: { type: 'daily_reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 21,
        minute: 0,
      },
    })

    console.log('Đã schedule daily reminder lúc 21:00')
  }

  // Hủy daily reminder (khi user đã check-in tất cả habit)
  async cancelDailyReminder() {
    await Notifications.cancelAllScheduledNotificationsAsync()
  }

  // Lắng nghe khi user tap vào notification
  addNotificationResponseListener(
    handler: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(handler)
  }

  // Lắng nghe notification khi app đang mở
  addNotificationReceivedListener(
    handler: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(handler)
  }
}

export const notificationService = new NotificationService()