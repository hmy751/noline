import { useLocalSearchParams, router } from 'expo-router';
import ScheduleDetailScreen from '@/screens/ScheduleDetailScreen';

export default function ScheduleDetailRoute() {
  const params = useLocalSearchParams();
  const scheduleId = params.id as string;

  return <ScheduleDetailScreen scheduleId={scheduleId} onBack={() => router.back()} />;
}
