# Ticket 01 검사 기준선 (2026-11-18)

Ticket 01에서 Main이 직접 실행한 검사의 핵심 수치와 실패 이름, `expo install --check` 출력, 1.1.4 빌드 확인 결과다. 원래 로그는 세션 scratchpad에만 있어 세션이 끝나면 사라질 수 있으므로, 이후 단계에서 비교할 최소한만 옮겼다. 해석과 선택 과정은 [Ticket 01 진행 기록](../records/2026-11-18-02-ticket01-baseline-node24-and-expo-install.md)이 맡는다.

## 실행 조건

- 코드: main 작업 트리, commit `26c1fecf`(1.1.4 빌드 18의 `d160c7b5` 뒤로 문서 커밋만 있음). 012와 무관한 미커밋 문서 수정이 함께 있었다.
- 도구: pnpm 9.6.0. Node는 아래 각 실행에 적었다.
- 각 경로 가이드의 명령을 그대로 썼다. 단 `pnpm client test --runInBand`는 pnpm 9.6.0에서 `ERROR Unknown option: 'runInBand'`로 테스트 전에 실패해, `pnpm --filter @apps/client run test --runInBand`로 다시 실행했다.

## 변경 전 기준선 (Node 24.16.0)

| 검사 | 명령 | 결과 |
| --- | --- | --- |
| client lint | `pnpm client lint` | 실패. 11 errors, 254 warnings |
| client test | `pnpm --filter @apps/client run test --runInBand` | 통과. 78 suites, 920 tests |
| client typecheck | `pnpm client test:typecheck` | 실패. 6 errors |
| server typecheck | `pnpm run server typecheck` | 통과 |
| server build | `pnpm run server build` | 통과 |
| server test | `pnpm run server test` | 통과. 14 files, 89 tests |
| server integration | `pnpm run server test:integration` (Docker 필요) | 통과. 5 files, 50 tests |
| schema build | `pnpm schema build` | 통과 |
| ui lint | `pnpm --filter @repo/ui lint` | 실패. 25 errors, 7 warnings |

실패 이름(지금 고치지 않고 기준으로 둔다):
- **client lint errors 11:** `tests/shared/services/sync/response-freshness.test.ts`의 `prettier/prettier` 9, `src/shared/components/Map/MyLocationButton.tsx`의 `@typescript-eslint/no-explicit-any` 1·`react-hooks/exhaustive-deps` 1. warning은 `no-restricted-syntax` 213이 대부분이다.
- **client typecheck errors 6:**
  - `packages/ui/src/index.tsx`가 가져오는 `lib/utils.ts`·`components/Select.tsx`에 대해 TS6059(client `rootDir` 밖) 2, TS6307(client tsconfig 파일 목록 밖) 2
  - TS2345 `src/shared/components/Form/TimeField.tsx(41,31)`(`FieldPathValue<T, N>` → `PathValueImpl<T, N>`)
  - TS2345 `src/shared/lib/mapbox.ts(61,26)`(`number[][]` → `[number, number][]`)
- **ui lint errors 25:** `src/components/Pressable.tsx`의 `prettier/prettier` 22, `src/components/Select.tsx`의 `prettier/prettier` 2, `src/components/RadioGroup.tsx`의 `@typescript-eslint/no-explicit-any` 1.

## Node 20.18.1과의 비교 (서버·schema)

같은 commit에서 `nvm exec 20.18.1`로 서버와 schema만 다시 실행했다. server typecheck·build 통과, server test 14 files/89 tests 통과, integration 5 files/50 tests 통과, schema build 통과로 Node 24와 같다. integration 실행에는 `drizzle-kit v0.20.18`의 `push:pg`가 포함돼 있어, drizzle-kit 0.20이 Node 24에서도 동작했다.

## Node 24 설정 변경 뒤 재실행

브랜치 `chore/012-node24`에서 `.nvmrc`·`render.yaml`·`tsup` target·`@types/node`를 바꾸고 `nvm use`(24.16.0)로 전체를 다시 실행했다. 9개 결과가 변경 전 기준선과 수치까지 같다(client lint 11/254, client test 78/920, typecheck 6, server test 89, integration 50, ui lint 25/7). server build 출력에 `CLI Target: node24`가 찍혔다.

## `npx expo install --check` (SDK 51 기준, 2026-11-18)

`apps/client`에서 실행, exit 1. Expo가 기대 버전과 다르다고 낸 9개다. 2026-11-16의 10개에서 `expo-dev-client`가 빠졌다(011에서 정렬).

```text
@react-native-community/netinfo@11.4.1 - expected version: 11.3.1
@sentry/react-native@6.22.0 - expected version: ~5.24.3
expo-splash-screen@31.0.10 - expected version: ~0.27.7
react@18.3.1 - expected version: 18.2.0
react-dom@18.3.1 - expected version: 18.2.0
react-native-safe-area-context@5.6.1 - expected version: 4.10.5
react-native-screens@3.37.0 - expected version: 3.31.1
react-native-svg@15.14.0 - expected version: 15.2.0
@types/react@18.3.26 - expected version: ~18.2.79
```

`--check`는 설치를 하지 않아 `npx`로도 출력이 나온다. 설치를 하는 `expo install <패키지>`의 실패와는 별개다.

## 1.1.4 빌드의 기준 커밋

`apps/client`에서 `eas build:list --platform ios --limit 4 --non-interactive --json`으로 확인했다.

| 빌드 ID | 프로필 | 상태 | 버전 / 빌드 | gitCommitHash | 생성(UTC) |
| --- | --- | --- | --- | --- | --- |
| `7033c2ba-0dc7-46e6-96cf-bfcc7044b881` | production | FINISHED | 1.1.4 / 18 | `d160c7b5` | 2026-11-17 08:20 |
| `f610d9b5-3c04-46d5-b191-e50efac28247` | preview | FINISHED | 1.1.3 / 17 | `3895d44f` | 2026-11-16 16:25 |

`git log d160c7b5..main` 6개 커밋은 모두 `docs(context)`이고, `apps/client`·`packages`·lockfile·`package.json`을 건드린 것은 `c068324e`의 `apps/client/CLAUDE.md` 한 줄뿐이다.
