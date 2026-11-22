import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CLIENT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const REPO_ROOT = join(CLIENT_DIR, '..', '..');

// 채널과 EAS environment는 같은 이름을 쓴다. 빌드와 발행이 같은 환경값으로 runtime을 계산해야 한다.
export const CHANNELS = ['preview', 'production'];
export const PLATFORM = 'ios';

// eas build --local로 만든 빌드의 장부. EAS 빌드 목록에 남지 않는 빌드를 발행 점검이 알게 한다.
// fingerprint는 apps/client/scripts 아래 파일을 runtime 계산에 넣지 않는다(2026-11-22 sources 목록으로 확인).
export const LOCAL_BUILDS_FILE = join(CLIENT_DIR, 'scripts', 'ota', 'local-builds.json');

// EAS의 Sentry 토큰은 SECRET이라 로컬에서 읽을 수 없어 소스맵은 이 로컬 파일(apps/client 기준)의 토큰으로 올린다.
export const SENTRY_ENV_FILE = '.env.production';
