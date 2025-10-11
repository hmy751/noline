import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View className='flex-1 items-center justify-center bg-blue-500'>
      <Text className='text-white text-2xl font-bold'>Tailwind CSS is working!</Text>
      <StatusBar style='auto' />
    </View>
  );
}
