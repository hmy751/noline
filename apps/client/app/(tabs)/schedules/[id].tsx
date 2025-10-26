import { useLocalSearchParams, router } from 'expo-router';
import ScheduleDetailScreen from '@/screens/ScheduleDetailScreen';

export default function ScheduleDetailRoute() {
  const params = useLocalSearchParams<{
    id: string;
    tripId: string;
    scheduledAt: string;
  }>();

  const scheduleId = params.id;
  const tripId = params.tripId;
  const scheduledAt = params.scheduledAt;

  if (!scheduleId || !tripId || !scheduledAt) {
    return null;
  }

  return (
    <ScheduleDetailScreen
      scheduleId={scheduleId}
      tripId={tripId}
      scheduledAt={scheduledAt}
      onBack={() => router.back()}
    />
  );
}
