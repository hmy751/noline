import { APIError } from '@/shared/api/errors';

/** 서버 결과는 확인했지만 기기의 후속 편집 순서를 아직 보관하지 못했다. */
export class ConfirmedUpdateError extends Error {
  constructor(public readonly cause: unknown) {
    super('서버가 수정 요청을 처리했지만 이 기기의 동기화 준비를 마치지 못했어요. 현재 값을 다시 확인해주세요.');
    this.name = 'ConfirmedUpdateError';
  }
}

/** 삭제 확인의 귀속 검사와 기기 반영이 끝난 뒤에만 전달한다. */
export class ConfirmedDeletionError extends APIError {
  constructor(code: 'ENTITY_DELETED' | 'TRIP_DELETED') {
    super('다른 기기에서 삭제된 기록이에요. 수정은 반영되지 않았어요.', 410, code);
    this.name = 'ConfirmedDeletionError';
  }
}
