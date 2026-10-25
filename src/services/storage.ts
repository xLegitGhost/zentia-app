import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const JWT_KEY = 'zentia_jwt_token';
const USER_KEY = 'zentia_user_data';

export const storage = {
  async setToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(JWT_KEY, token);
      } catch (e) {
        console.warn('Error saving token to localStorage:', e);
      }
      return;
    }
    await SecureStore.setItemAsync(JWT_KEY, token);
  },

  async getToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(JWT_KEY);
      } catch (e) {
        return null;
      }
    }
    return await SecureStore.getItemAsync(JWT_KEY);
  },

  async removeToken(): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(JWT_KEY);
      } catch (e) {
        console.warn('Error removing token from localStorage:', e);
      }
      return;
    }
    await SecureStore.deleteItemAsync(JWT_KEY);
  },

  async setUserData(data: object): Promise<void> {
    const raw = JSON.stringify(data);
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(USER_KEY, raw);
      } catch (e) {}
      return;
    }
    await SecureStore.setItemAsync(USER_KEY, raw);
  },

  async getUserData<T>(): Promise<T | null> {
    let raw: string | null = null;
    if (Platform.OS === 'web') {
      try {
        raw = localStorage.getItem(USER_KEY);
      } catch (e) {
        return null;
      }
    } else {
      raw = await SecureStore.getItemAsync(USER_KEY);
    }
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async clearSession(): Promise<void> {
    await this.removeToken();
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(USER_KEY);
      } catch (e) {}
    } else {
      await SecureStore.deleteItemAsync(USER_KEY);
    }
  },
};

export default storage;
