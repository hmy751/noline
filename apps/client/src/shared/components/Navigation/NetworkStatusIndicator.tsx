import { View, Text } from 'react-native';
import { Wifi } from 'lucide-react-native';

export function NetworkStatusIndicator() {
  // TODO: Add logic to check actual network status
  const isOnline = true;

  if (!isOnline) {
    return null;
  }

  return (
    <View className='flex-row items-center'>
      <Wifi size={14} color='hsl(140, 65%, 45%)' />
      <Text className='text-label text-status-online ml-1'>온라인</Text>
    </View>
  );
}
