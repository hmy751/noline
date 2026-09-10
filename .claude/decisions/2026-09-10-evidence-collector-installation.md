# 증거 수집기 실행 세트 설치

2026-09-10. 사용자가 Claude 모델을 Sonnet으로 바꾸고 Noline에 먼저 설치하되 숨김 처리는 하지 말라고 요청했다.

독립 증거 수집기의 실행 세트와 운영 설정(`../../evidence-collector/README.md`)을 일반 폴더에 배치했다. Codex는 Sol medium, Claude는 Sonnet을 사용하도록 구성했다. 연구·모델 비교 자료는 설치하지 않았고 Git 제외 설정도 바꾸지 않았다. 수집 원자료 저장소는 기존 runtime 계약에 따라 Git 작업 트리 밖에 둔다.

기존 `noline-context-collector`는 Main의 작업 맥락을 모아 반환하는 역할이다. 이번 수집기는 이미 전달된 당시 자료를 보존하고 향후 회고·평가를 위한 장면을 기록하는 별도 실행 장치다. 해당 agent나 Context Harness Maintain을 대체하지 않는다.

이번 범위는 패키지와 설정 배치다. 실제 사건 전달·worker 서비스는 아직 연결하지 않았고 Main 지침·기존 hook도 바꾸지 않았다. 설치 시 Claude CLI는 미로그인이므로 인증된 Sonnet 실행은 미검증이다. 설치 상태와 다음 연결 조건은 위 운영 안내에서 관리한다.

## 후속 Workspace 연결 재설치

같은 날 사용자 요청에 따라 독립 연결 어댑터까지 설치했다. 기존 hook과 Workspace 제어 진입점이 어댑터를 거치고, 어댑터만 Maintain과 증거 수집기 양쪽을 안다. Main은 루트 안내에서 목적·존재·운영 접근점을 알며 사건별 호출·대기·승인·오류 처리는 맡지 않는다. Maintain에는 접수된 turn 귀속만 반환하는 일반 조회와 Claude의 연결 해제 뒤 마지막 응답 처리를 보완했다.

Workspace activation 성공 후 다음 요청부터 수집하며 미연결 session을 추정 가입시키지 않는다. 원자료를 먼저 확보하고 응답 종료·중단 및 중간 보존 경계에서 독립 모델 처리로 넘긴다. 기본 실행은 Sol medium 하나이며 Claude Sonnet 설정은 대안이다. 사건 수신 때 별도 처리 프로세스를 시작하고 macOS launchd에는 등록하지 않는다. Git 제외와 숨김은 적용하지 않았다.

원자료와 기록은 프로젝트 밖 `../noline-evidence/`에 보존한다. 설치 전 공유 파일과 직전 패키지 백업·hash는 설치 receipt가 연결한다. 현재 운영·중단·제거와 수집 공백은 설치 안내(`../../evidence-collector/README.md`)를 따른다. 기존 프로젝트 변경은 유지했고 이번 재설치를 커밋하지 않았다.

수집기 관련 검사 63개, Noline 정적 검사, Maintain 관련 검사 70개가 통과했다. 설치본의 Sol medium으로 격리된 임시 사건 한 건도 처리했다. 실제 사용자 Workspace activation·host 작업은 수행하지 않았으며 인증된 Sonnet 호출도 미검증이다. 전체 Harness 122개 중 기존 Verify timeout 사례 한 건은 실패했고 단독 실행은 통과해 별도 한계로 남겼다. 이 설치를 실제 개발 효과나 지연 부재의 증명으로 해석하지 않는다.

## 안내 위치 보완과 실제 CLI 검증

사용자 정정에 따라 수집기 전용 루트 안내를 제거하고 [Work 운영 지침](../../context/work/AGENTS.md#증거-수집-연결)에 목적·활성 조건·Main의 참여 범위·운영 접근점을 뒀다. Work README는 Work와 수집기의 관계를, 수집기 README는 상세 운영을 소유한다. 원천 설치기와 제거 receipt도 같이 갱신했고 루트는 원래 상태로 복원해 제거기의 관리 대상에서 뺐다. 기존 부모 프로세스의 자료 전송·worker 재시작·idle 종료는 유지했다. launchd 등록은 없었으며 Codex 지침 격리용 sandbox-exec는 별개로 유지한다.

임시 프로젝트·Workspace의 실제 Codex CLI에서 요청·도구 실행 전후·최종 응답이 포착되고 Sol medium 기록 두 건이 저장되는 것을 확인했다. 마지막 실행은 실제 read-only/never였고 원래 session·turn·Workspace·generation과 도구 출력이 남았다. 같은 hook 준비 조건의 미연결 세션에서는 원자료가 늘지 않았다. 시험 후 부모·worker 종료와 Maintain 미처리 사건 0개를 확인했다. 실제 Noline 사용자 세션은 연결하지 않았다.

현재 Noline은 Project trust와 hooks feature가 켜져 있으나 이번 hook 7개에 대한 trusted_hash가 없다. Noline에서 Codex CLI의 `/hooks`로 현재 정의를 최초 검토·승인해야 기본 hook 실행이 가능하다. 설치기는 전역 보안 설정을 대신 바꾸지 않는다. CLI 밖 host의 로딩·실제 사용자 작업·인증된 Sonnet은 별도 확인 대상이다. 현재 준비 조건과 수집 경로는 운영 안내(`../../evidence-collector/README.md#언제-연결되는가`)를 따른다.


## 개인 설치와 기록을 한 폴더로 모으기

사용자 요청으로 최종 기록을 `evidence-collector/store/`, 처리 전 원자료를 `evidence-collector/spool/`로 설정하고 `.gitignore`의 `/evidence-collector/`로 설치 전체를 제외했다. 기존 외부 설치 백업과 과거 자료는 보존한다. 이번 전환 당시 외부 store/spool에는 사건 파일이 없었다.

내부 store는 명시 opt-in·Git의 디렉터리 제외·미추적 확인으로 허용하고 자기 기록 재수집은 막는다. 수집 모델의 실행 위치는 Git 밖 임시 디렉터리로 유지하며 지침·사용량·성공 및 실패 원자료는 해당 store/jobs에 보존한다. Work는 로컬 설치의 존재를 확인하고 명시한 운영 경로를 읽는다. 이 개인 폴더가 없는 체크아웃에서는 기존 host wrapper가 Maintain으로 연결되고 수집 전용 hook은 조용히 끝난다. 선택적 개인 파일 경로는 없는 체크아웃의 문서 링크 검사와 충돌하지 않도록 경로 표기로 남겼다.

내부 ignored store의 실제 Codex CLI→Sol 기록 저장, 미연결 제외, 임시 실행 자료 보존을 확인했다. runtime 33개·연결 15개·패키징 3개가 통과했다. Noline의 양쪽 설정·Git 제외·정적 검사·제거 계획도 확인했다. 실제 Noline 사용자 session 수집은 아직 시작하지 않았으며 Codex `/hooks`의 현재 정의 승인이 남아 있다. 전역 신뢰 설정은 변경하지 않았다.


커밋 점검에서 Codex hook의 고정 개인 경로를 기존 Git 프로젝트 root 기준 경로로 보정했고, 공백이 있는 다른 위치로 옮긴 fixture에서 개인 패키지 없이 hook을 실행하는 검사를 통과했다. 연결 검사 15개를 재실행했다. 커밋할 파일만 추출한 정적 검사는 기존 `.claude/README.md`의 개인 `settings.local.json` 링크 누락 한 건을 보고했고, 변경 전 HEAD도 동일했다. 이 별도 문제와 다른 작업의 변경은 이번 수집기 커밋에서 제외한다.
