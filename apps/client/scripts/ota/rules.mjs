/**
 * OTA 발행 전 검사의 대상과 규칙. 경로는 모두 저장소 루트 기준이다.
 *
 * CHANGE_RULES는 Work 011 Spec 02의 "불가"·조건부 행을 옮긴 것이다.
 * - block: 플래그로도 넘길 수 없다. 새 스토어 빌드로 내야 한다.
 * - confirm: 지정한 플래그로 사람이 확인해야 통과한다.
 * - warn: 알리기만 한다.
 *
 * paths는 '/'로 끝나면 그 아래 전체, '*'는 경로 한 단계, 나머지는 그 파일 하나다.
 * content는 BUNDLE_SOURCES 안의 바뀐 파일 내용에 적용한다.
 */

// 기기 SQLite 구조를 바꾸는 SQL. 여러 줄에 걸친 문장도 잡는다.
const SQLITE_DDL =
  /\b(CREATE\s+(UNIQUE\s+|TEMP(ORARY)?\s+|VIRTUAL\s+)?(TABLE|INDEX|VIEW|TRIGGER)|ALTER\s+TABLE|DROP\s+(TABLE|INDEX|VIEW|TRIGGER))\b|\bPRAGMA\s+user_version\b/i;

// 서버로 요청을 보내는 클라이언트를 가져오는 import. 오류 타입만 가져오는 파일은 해당하지 않는다.
const AXIOS_CLIENT_IMPORT =
  /import\s+[^;]*\b(authAxios|apiAxios)\b[^;]*from\s+['"][^'"]*shared\/api\/axios-instances['"]/;
const FETCHER_CLIENT_IMPORT =
  /import\s+[A-Za-z_$][\w$]*\s*(,\s*\{[^}]*\})?\s+from\s+['"][^'"]*shared\/api\/fetcher['"]/;

export const CHANGE_RULES = [
  {
    kind: 'block',
    label: '기기 SQLite 구조',
    paths: ['apps/client/src/shared/db/'],
    // 트랜잭션 도우미는 DB 구조와 무관한 JS다.
    except: ['apps/client/src/shared/db/utils.ts'],
    hint: '앱이 시작할 때 바로 적용되고, 업데이트를 롤백해도 기기 DB는 되돌아가지 않습니다. 새 스토어 빌드로 내세요.',
  },
  {
    kind: 'block',
    label: 'SQLite 구조를 바꾸는 SQL',
    content: [SQLITE_DDL],
    hint: 'db/ 밖의 파일이라도 기기 DB 구조를 바꾸면 롤백할 수 없습니다. 새 스토어 빌드로 내세요.',
  },
  {
    kind: 'confirm',
    flag: 'server-checked',
    label: '서버와 맞춰야 하는 계약',
    paths: [
      'packages/schema/',
      'apps/client/src/shared/api/',
      'apps/client/src/shared/services/sync/',
      'apps/client/src/entities/*/api/',
    ],
    content: [AXIOS_CLIENT_IMPORT, FETCHER_CLIENT_IMPORT],
    hint: '앱이 서버보다 먼저 바뀌면 옛 서버와 어긋납니다. 서버를 먼저 배포했거나 서버 변경이 필요 없다면 --server-checked를 붙이세요.',
  },
  {
    kind: 'warn',
    label: '네이티브 설정·의존성',
    paths: [
      'apps/client/app.config.js',
      'apps/client/eas.json',
      'apps/client/package.json',
      'pnpm-lock.yaml',
      'patches/',
    ],
    // 네이티브가 바뀌었다면 runtime이 달라져 4단계에서 막힌다. 같다면 JS 쪽 변경이다.
    hint: 'runtime 대조(4단계)가 네이티브 변경을 막습니다.',
  },
];

// 번들에 들어가는 소스. scripts·tests의 문장은 기기에서 실행되지 않는다.
export const BUNDLE_SOURCES = ['apps/client/src/', 'apps/client/app/', 'packages/'];

// 커밋하지 않은 변경이 있으면 업데이트가 어느 커밋인지 남지 않는 경로.
export const CODE_PATHS = [
  'apps/client',
  'packages',
  'patches',
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  '.npmrc',
];

// 번들을 만들 때 값이 박히는 환경 변수를 읽는 소스 위치. 이 이름이 EAS environment에 없으면 로컬 .env 값이
// 번들에 들어간다. packages는 지금 환경 변수를 읽지 않아 뺐다.
export const ENV_SOURCE_DIRS = ['apps/client/src/', 'apps/client/app/'];
