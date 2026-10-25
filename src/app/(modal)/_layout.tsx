import { Stack } from 'expo-router';

export default function ModalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' },
        presentation: 'modal',
      }}
    />
  );
}
