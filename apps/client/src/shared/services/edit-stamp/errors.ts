/** 서버 결과는 확인했지만 기기의 후속 편집 순서를 아직 보관하지 못했다. */
export class ConfirmedUpdateError extends Error {
  constructor(public readonly cause: unknown) {
    super('서버가 수정 요청을 처리했지만 이 기기의 동기화 준비를 마치지 못했어요. 현재 값을 다시 확인해주세요.');
    this.name = 'ConfirmedUpdateError';
  }
}
