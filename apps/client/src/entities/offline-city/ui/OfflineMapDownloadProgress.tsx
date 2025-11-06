/**
 * OfflineMapDownloadProgress Component
 * 오프라인 지도 다운로드 진행률 표시
 */

import { View, Text, ActivityIndicator } from 'react-native';
import { Card } from '@repo/ui';

interface OfflineMapDownloadProgressProps {
  cityName: string;
  percentage?: number;
  isDownloading: boolean;
}

/**
 * 오프라인 지도 다운로드 진행률 UI
 *
 * 사용:
 * - Schedule 추가 시 자동 다운로드 진행 표시
 * - 간단한 프로그레스 바 + 텍스트
 */
export function OfflineMapDownloadProgress({
  cityName,
  percentage = 0,
  isDownloading,
}: OfflineMapDownloadProgressProps) {
  if (!isDownloading) return null;

  return (
    <Card className='mb-md'>
      <View className='flex-row items-center gap-md'>
        <ActivityIndicator size='small' color='#6366f1' />
        <View className='flex-1'>
          <Text className='text-sm font-medium text-foreground mb-xs'>{cityName} 오프라인 지도 다운로드 중...</Text>
          <View className='h-2 bg-secondary rounded-full overflow-hidden'>
            <View className='h-full bg-primary rounded-full' style={{ width: `${Math.min(percentage, 100)}%` }} />
          </View>
          <Text className='text-xs text-muted-foreground mt-xs'>{Math.round(percentage)}% 완료</Text>
        </View>
      </View>
    </Card>
  );
}
