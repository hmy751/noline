# UI의 표현·상태·작업 책임을 나눈다

**언제 쓰나:** 공용 컴포넌트나 화면·폼 조합을 추가·수정할 때 읽는다. 공통 시작은 [개발 기준](INDEX.md)이다.

**핵심 기준:** domain을 모르는 primitive, 앱 공용 조합, entity 표시와 사용자 workflow를 구별한다. React Native/Expo·NativeWind의 현재 코드를 사용하고 web element·CSS module·Next.js 예제를 그대로 적용하지 않는다.

| 변경할 UI | 배치와 적용 |
| --- | --- |
| 버튼 역할·input·select·card shell | `@repo/ui`의 공개 export를 먼저 확인한다. 현재 버튼 역할은 `Pressable`이며 `Button` export는 없다. 내부 시각 variant와 기본 interaction을 맡긴다. |
| header·field·picker·policy 안내 같은 앱 공용 조합 | `shared/components`. 특정 Trip/Schedule/Expense의 업무 규칙을 새 공용 UI에 넣지 않는다. |
| TripCard·TripSelector 같은 domain 표시 | `entities/*/ui`. 어떤 entity를 표시하는지 아는 책임을 둔다. |
| 사용자 작업과 form submit | owning `features/*`. 저장·후속 처리를 feature hook과 entity data hook으로 연결한다. |
| 여러 기능의 배치·화면 단계 | `screens/*`. route는 해당 화면을 연결한다. |

재사용 컴포넌트의 외부 margin·화면 위치는 부모가 정하고 내부 padding·배치는 컴포넌트가 소유할 수 있다. 같은 primitive의 className·props를 확장할 때도 호출자의 위치 결정권을 보존한다. [UI 공개 export](../../../../packages/ui/src/index.tsx)와 [Pressable](../../../../packages/ui/src/components/Pressable.tsx)에서 실제 props·disabled·children 처리 범위를 확인한다. 현재 UI props에 interface가 있다는 사실과 [타입 작성 기본 기준](schema-and-types.md)은 구별한다.

## UI가 소유할 상태는 그 interaction과 함께 둔다

일반 React Native input은 기존 React Hook Form의 `Controller` 연결을 사용하고 label·설명·오류는 `Field` 조합을 우선한다. 시간 입력은 [TimeField](../../../../apps/client/src/shared/components/Form/TimeField.tsx)가 RHF 값·오류와 선택창 열기·확인 반영을 연결한다. `TimePicker`는 RHF를 모르는 임시 선택, `DatePicker`는 달력 표시와 날짜 선택을 맡는다. 모든 picker 상태를 feature hook으로 옮기지 않는다.

임시 선택을 바꾸는 것과 저장할 폼 값을 확정하는 것은 다르다. 현재 TimeField는 확인 때 값을 쓰고 닫을 때 picker 초안을 버린다. 이 UI 책임 설명은 생성·수정 폼의 전체 reset·초안 수명까지 같다는 보장이 아니다. 그 변경은 [작성·입력의 선택창](../writing-and-input/pickers.md)과 [초안 수명](../writing-and-input/drafts.md)을 함께 확인한다.

## 정책 안내와 지도는 기존 경계를 사용한다

사용 제한은 `useAppPolicy`, `PolicyErrorDisplay`, `NetworkStatusIndicator`로 연결한다. 버튼마다 네트워크·활성 조건을 다시 계산하거나 새로운 blocked UI를 만들기 전에 [여행 접근](../travel-access/INDEX.md)의 실제 실행·표시 조건을 확인한다.

`PolicyBasedMapView`, `PolicyBasedScheduleMapView`, `MapUnavailableView`는 앱의 지도 service UI다. Activation Router를 넣어 sync-owned 데이터처럼 다루지 않는다. 현재 일부 shared 지도 컴포넌트가 entity hook에 의존하는 것은 [계층의 현재 예외](layers.md#기존-의존-예외는-현재-범위로-읽는다)이며 새 domain UI의 기본 배치가 아니다. Mapbox 선택·준비 flag·실제 pack 완료는 [지도·경로 가이드](../offline-maps-and-routes/INDEX.md)의 별도 조건이다.
