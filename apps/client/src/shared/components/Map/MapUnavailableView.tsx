/**
 * MapUnavailableView - 지도를 사용할 수 없을 때 표시되는 뷰
 *
 * 사용 시나리오:
 * - offline_inactive: 오프라인 상태에서 비활성화된 여행
 * - 네트워크 오류 등으로 지도를 로드할 수 없을 때
 */

import { View, Text, StyleSheet } from 'react-native';
import { MapIcon } from 'lucide-react-native';

interface MapUnavailableViewProps {
  message: string;
  hint?: string;
}

export function MapUnavailableView({
  message,
  hint = '네트워크에 연결하거나 여행을 활성화해주세요',
}: MapUnavailableViewProps) {
  return (
    <View style={styles.container}>
      <MapIcon size={48} color='#999' />
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  hint: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
