// services/api.ts
import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

// const BASE_URL = 'http://192.168.1.112:5189' // không dùng localhost trên mobile
const BASE_URL = 'http://10.87.18.163:5189' 

const api = axios.create({ baseURL: BASE_URL })

// Tự động gắn token vào mọi request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`

  const requestUrl = `${config.baseURL ?? ''}${config.url ?? ''}`
  console.log('Request URL:', requestUrl)

  return config
})

export default api