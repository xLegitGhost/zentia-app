import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { LogOut } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <SafeAreaView className="flex-1 bg-black px-6 pt-4 justify-between">
      <View>
        <Text className="text-white text-2xl font-bold mb-6">
          Mi Perfil
        </Text>

        <View className="bg-[#121214] border border-zinc-800 rounded-3xl p-5 mb-6">
          <Text className="text-white text-lg font-bold">
            {user?.fullName || user?.name || 'Usuario Zentia'}
          </Text>
          <Text className="text-zinc-400 text-xs mt-0.5">
            {user?.email || 'usuario@zentia.app'}
          </Text>
          {user?.phoneNumber && (
            <Text className="text-zinc-500 text-xs mt-2">
              Tel: {user.phoneNumber}
            </Text>
          )}
        </View>
      </View>

      <View className="pb-8">
        <Pressable
          onPress={handleLogout}
          className="w-full bg-red-950/40 border border-red-900/50 h-14 rounded-full flex-row items-center justify-center active:opacity-80"
        >
          <LogOut size={18} color="#EF4444" className="mr-2" />
          <Text className="text-red-400 font-bold text-sm tracking-wider uppercase ml-2">
            CERRAR SESIÓN
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
