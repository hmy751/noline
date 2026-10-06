import { Text, View } from 'react-native';
import { Pressable } from '@repo/ui';
import { useRouter } from 'expo-router';

/** 기존 여행에 도시 시간대가 없을 때 UTC 호환 표시의 의미를 알린다. */
export function TripTimeZoneNotice({ timeZone, onRepair }: { timeZone?: string | null; onRepair?: () => void }) {
  if (timeZone) return null;
  return <UnresolvedNotice onRepair={onRepair} />;
}

function UnresolvedNotice({ onRepair }: { onRepair?: () => void }) {
  const router = useRouter();
  return (
    <View className='gap-xs p-sm'>
      <Text className='text-label text-muted-foreground'>시간대 확인 필요 · UTC 기준</Text>
      <Pressable variant='outline' onPress={onRepair ?? (() => router.push('/(tabs)'))}>
        {onRepair ? '여행 시간대 확인' : '홈에서 여행 시간대 확인'}
      </Pressable>
    </View>
  );
}
