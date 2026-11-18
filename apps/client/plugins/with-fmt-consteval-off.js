// Work 012 임시 우회: RN 0.76·0.77이 쓰는 fmt 11.0.2를 Xcode 26 clang으로 빌드하면
// "call to consteval function ... is not a constant expression" 오류가 난다(2026-11-18 SDK 52 빌드에서 확인).
// fmt 11.0.2는 바깥에서 정한 FMT_USE_CONSTEVAL을 받지 않으므로, pod 설치 뒤 base.h의 감지 결과만 0으로 바꾼다.
// 출시하지 않는 SDK 52·53 단계용이다. SDK 54 이상에서 이 처리 없이 빌드되면 이 파일과 app.config.js의 등록을 지운다.
const { withPodfile } = require('expo/config-plugins');

const MARKER = '# [noline] fmt consteval off (Work 012)';

const RUBY = `
    ${MARKER}
    fmt_base = File.join(installer.sandbox.pod_dir('fmt'), 'include', 'fmt', 'base.h')
    if File.exist?(fmt_base)
      text = File.read(fmt_base)
      patched = text
        .gsub("#elif defined(__cpp_consteval)\\n#  define FMT_USE_CONSTEVAL 1", "#elif defined(__cpp_consteval)\\n#  define FMT_USE_CONSTEVAL 0")
        .gsub("#elif FMT_GCC_VERSION >= 1002 || FMT_CLANG_VERSION >= 1101\\n#  define FMT_USE_CONSTEVAL 1", "#elif FMT_GCC_VERSION >= 1002 || FMT_CLANG_VERSION >= 1101\\n#  define FMT_USE_CONSTEVAL 0")
      if patched != text
        File.chmod(0644, fmt_base)
        File.write(fmt_base, patched)
      end
    end
`;

module.exports = function withFmtConstevalOff(config) {
  return withPodfile(config, (cfg) => {
    const contents = cfg.modResults.contents;
    if (contents.includes(MARKER)) return cfg;
    cfg.modResults.contents = contents.replace(/post_install do \|installer\|\n/, (m) => `${m}${RUBY}`);
    return cfg;
  });
};
