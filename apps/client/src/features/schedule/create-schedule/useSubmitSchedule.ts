import { useCreateSchedule } from '@/entities/schedule';
import { useAutoDownloadRoutes } from '@/entities/route';
import { combineDateTimeInTimeZoneToISO } from '@/shared/lib/datetime';
import { generateId } from '@/shared/services/id/ulid';
import { OfflineError } from '@/shared/services/offline-prep/errors';
import { AuthRequiredError } from '@/shared/store/auth';
import type { CreateScheduleFormData } from './schema';
import type { Location } from './types';

/** 일정 추가 한 건의 제출과 기존 성공 후 처리를 연결한다. 초안·검색·화면 단계는 소유하지 않는다. */
export function useSubmitSchedule({
  tripId,
  timeZone,
  onSuccess,
}: {
  tripId: string;
  timeZone?: string | null;
  onSuccess?: () => void;
}) {
  const mutation = useCreateSchedule();
  const { mutate: autoDownloadRoutes } = useAutoDownloadRoutes();

  const submit = (data: CreateScheduleFormData, place: Location | null) => {
    if (mutation.isPending || !timeZone) {
      return;
    }

    const id = generateId();
    const scheduledAt = combineDateTimeInTimeZoneToISO(data.date, data.time, timeZone);

    mutation.mutate(
      {
        id,
        tripId,
        title: data.title,
        location: data.location,
        address: data.address || null,
        scheduledAt,
        latitude: place?.latitude ?? null,
        longitude: place?.longitude ?? null,
      },
      {
        onSuccess: () => {
          autoDownloadRoutes({ tripId });

          onSuccess?.();
        },
      },
    );
  };

  const error = mutation.error;
  const submitError = !error
    ? null
    : error instanceof OfflineError || error instanceof AuthRequiredError
      ? error.message
      : '일정을 저장하지 못했어요. 입력한 내용은 유지됩니다. 다시 시도해주세요.';

  return { submit, isPending: mutation.isPending, submitError };
}
