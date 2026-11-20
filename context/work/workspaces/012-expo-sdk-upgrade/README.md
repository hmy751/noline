# 012 — Expo SDK를 올려 2027년 4월 Apple 빌드 요건을 맞추기

Noline 앱은 Expo SDK 51 / React Native 0.74.5로 만들어져 있다. 2027년 4월부터 App Store에 올리는 iOS 앱은 iOS 27 SDK(Xcode 27)로 빌드해야 하는데, 지금 구성으로는 그 빌드를 만들기 어렵다. 이 Work는 SDK와 함께 움직여야 하는 React Native·라이브러리·도구 버전을 올려 그 전에 새 스토어 빌드를 낼 수 있게 하는 독립 Work다. 그동안 버전 문제를 개별로 내리거나 고정해 버텨 온 것도 이 Work에서 정리한다. 2026-11-17부터는 지원이 끝난 Node 20을 앱과 서버 모두에서 올리는 일도 포함한다(서버 라이브러리는 제외).

**2026-11-17 현재 실행 계획을 확정하고 Ticket 문서 5개를 만들었다.** 서버 Node를 범위에 넣었고, 대상 SDK 58, 최소 iOS 16.4, 출시 2번(1.2.0, 1.3.0)과 출시마다 release 브랜치를 정했다. 구현 전에 기기 DB와 오프라인 지도가 남는지 먼저 판정하고, SDK는 한 버전씩 올린다. **2026-11-18 Ticket 01(준비)을 시작했다.** 검사 기준선, `release/1.1`(원격, preview 빌드와 OTA 수신 확인), Node 24 설정 변경과 운영 서버의 Node 24 배포, 설치 절차 확정까지 했다. 운영 앱 확인도 마쳤고, 남은 01의 일은 실기기 점검표와 1.1.4 심사 결과다. **같은 날 Ticket 02 판정을 마쳤다.** 기기 DB와 오프라인 지도가 업데이트 뒤 남아 03으로 갈 수 있고 04의 지도 대응은 필요 없다. **Ticket 03도 시작해 SDK 52·53·54를 작업 브랜치 `feat/012-sdk54`에 커밋했다(main 무변경).** 2026-11-19 EAS preview와 iPad 실기기 확인까지 마치고 main에 병합해(`ae97809e`, 2026-11-19 push, Render 재배포 health 200) 03을 끝냈다. **같은 날 Ticket 04의 코드 작업을 앞당겨 시작해(New Architecture·reanimated 4·Mapbox v11) 작업 브랜치 `feat/012-newarch`에 커밋했고, iPad 실기기 확인과 거기서 찾은 일정 지도 수정을 거쳐 2026-11-20 main에 병합해(`6d34c44b`) push했다.** 04에 남은 것은 일부 실기기 확인과 1.2.0 출시이며, 1.2.0 스토어 빌드는 12월 갱신 뒤다.

이 Work는 [Work 011(expo-updates OTA)](../011-expo-updates-ota/README.md)의 논의 중에 분리됐다. 011은 SDK 51 위에서 OTA를 먼저 넣고, 012가 그 뒤 플랫폼을 올린다. 011은 main에 병합돼 1.1.4가 심사 대기 중이다. 두 Work의 순서와 조건은 [현재 상태](current/state/index.md)에 있다.

[재개 안내](recover.md)에서 시작한다. 각 폴더가 맡는 내용은 다음과 같다.
- current: 목표·마감·지킬 조건·열린 판단과 현재 상태, Ticket 01–05. 버전의 현재와 이후 표는 Spec 05에 있다
- source: 과거 버전 문제 사례의 원문 발췌, 의존성 점검 결과, 외부 요건의 출처, 라이브러리 호환 조사와 Expo의 SDK별 버전 목록, Ticket 01의 검사 기준선, Ticket 02의 판정 원자료
- output: 실제 결과 위치(원격 `release/1.1`과 그 preview 빌드·OTA, worktree, main에 들어간 Node 24 변경과 Render 배포, 03·04 작업 브랜치와 04의 main 병합)
- records: 011에서 분리한 이유와 버전 분석, 버전 전수 조사와 서버 Node를 넣은 이유, Ticket 구성 초안과 출시·브랜치·최소 iOS·기기 결정, 출시를 2번으로 줄인 경위와 채택, 라이브러리 호환 점검, Ticket 5개 재구성과 지도 대응 결정, Ticket 검토에서 드러난 OTA 제한·설치 절차·로컬 도구 처리, release 브랜치 서술 정정과 worktree 분리의 영향, Ticket 01의 기준 커밋·기준선·`expo install` 실패 원인·Node 24 변경, `release/1.1` 빌드·OTA 확인과 production 빌드를 생략한 판단, Render 되돌리기 확인과 서비스가 `render.yaml`을 쓰지 않는다는 발견, Ticket 02 실기기 판정의 과정과 결과, Ticket 03의 SDK 52·53·54 진행과 계획에서 달라진 것, EAS·iPad 실기기 확인, Ticket 04 코드 작업과 독립 검증 결과, `createPack` 완료 시점 문제를 Work 008로 넘긴 결정, Ticket 04 iPad 실기기 확인과 일정 지도 수정, Ticket 04의 main 병합과 병합 뒤 OTA 발행 경로

이 Work를 만들면서 기본 Workspace나 실제 채팅 연결은 바꾸지 않았다.
