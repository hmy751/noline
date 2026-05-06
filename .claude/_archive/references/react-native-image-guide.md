# React Native Image - 현업 베스트 프랙티스

## 📊 이미지 라이브러리 비교

### 1. React Native 기본 Image

```tsx
import { Image } from 'react-native';

<Image source={{ uri: 'https://...' }} style={{ width: 100, height: 100 }} resizeMode='cover' />;
```

**장점:**

- ✅ 추가 설치 불필요
- ✅ 가볍고 간단함
- ✅ 로컬 이미지에 최적화

**단점:**

- ❌ 네트워크 캐싱 약함
- ❌ 로딩 성능 낮음
- ❌ 플레이스홀더 없음
- ❌ 프로그레시브 로딩 없음

**사용 권장:**

- 로컬 assets 이미지 (아이콘, 로고 등)
- 소규모 프로젝트
- 간단한 UI

---

### 2. Expo Image ⭐ **추천**

```bash
pnpm add expo-image
```

```tsx
import { Image } from 'expo-image';

<Image
  source='https://...'
  placeholder={blurhash}
  contentFit='cover'
  transition={200}
  cachePolicy='memory-disk'
  style={{ width: 100, height: 100 }}
/>;
```

**장점:**

- ✅ 강력한 캐싱 (memory + disk)
- ✅ Blurhash 플레이스홀더 지원
- ✅ 부드러운 페이드 전환
- ✅ 우선순위 기반 로딩
- ✅ WebP, AVIF 자동 지원
- ✅ 성능 최적화
- ✅ Expo와 완벽 통합

**단점:**

- ⚠️ Expo 프로젝트 전용
- ⚠️ 번들 크기 약간 증가

**사용 권장:**

- ✅ Expo 프로젝트 (현재 프로젝트)
- ✅ 네트워크 이미지 많은 앱
- ✅ UX 중요한 프로덕션 앱

---

### 3. React Native Fast Image

```bash
pnpm add react-native-fast-image
```

```tsx
import FastImage from 'react-native-fast-image';

<FastImage
  source={{
    uri: 'https://...',
    priority: FastImage.priority.high,
  }}
  style={{ width: 100, height: 100 }}
  resizeMode={FastImage.resizeMode.cover}
/>;
```

**장점:**

- ✅ 매우 빠른 로딩
- ✅ 강력한 캐싱
- ✅ 우선순위 지원
- ✅ 플레이스홀더 지원

**단점:**

- ❌ 네이티브 모듈 설치 필요
- ❌ Expo Go 미지원 (개발 빌드 필요)
- ❌ iOS/Android 별도 설정 필요

**사용 권장:**

- React Native CLI 프로젝트
- 극한의 성능 최적화 필요 시
- Bare workflow

---

## 🎯 현업 베스트 프랙티스

### 1. **이미지 소스별 전략**

#### 로컬 이미지 (Static Assets)

```tsx
// ✅ GOOD: require 사용
<Image source={require('./assets/icon.png')} />

// ❌ BAD: 크기 지정 안 함
<Image source={require('./assets/icon.png')} style={{ flex: 1 }} />

// ✅ BEST: 명시적 크기 + resizeMode
<Image
  source={require('./assets/icon.png')}
  style={{ width: 40, height: 40 }}
  resizeMode="contain"
/>
```

**최적화 팁:**

- 여러 해상도 제공: `icon@2x.png`, `icon@3x.png`
- WebP 포맷 사용 (용량 30-50% 감소)
- 빌드 시 자동 최적화

#### 네트워크 이미지 (Remote URLs)

```tsx
// ❌ BAD: 크기 지정 안 함
<Image source={{ uri: 'https://...' }} />

// ✅ GOOD: 크기 명시
<Image
  source={{ uri: 'https://...' }}
  style={{ width: 200, height: 200 }}
/>

// ✅ BEST: 캐싱 + 플레이스홀더 (Expo Image)
<ExpoImage
  source="https://..."
  placeholder={blurhash}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
  style={{ width: 200, height: 200 }}
/>
```

---

### 2. **ResizeMode 전략**

```tsx
// 프로필 사진, 썸네일 → cover
<Image resizeMode="cover" />

// 아이콘, 로고 → contain
<Image resizeMode="contain" />

// 배경 이미지, 패턴 → repeat
<Image resizeMode="repeat" />

// 정확한 크기의 이미지 → center
<Image resizeMode="center" />
```

**성능 영향:**

- `cover`: 가장 많이 사용, 약간의 오버헤드
- `contain`: 가볍고 빠름
- `stretch`: 피해야 함 (왜곡 발생)

---

### 3. **Lazy Loading 구현**

```tsx
import { useState, useEffect } from 'react';
import { View } from 'react-native';

const LazyImage = ({ source, ...props }) => {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // viewport에 들어올 때만 로드
    const timer = setTimeout(() => setShouldLoad(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!shouldLoad) {
    return <View style={props.style} className='bg-muted' />;
  }

  return <Image source={source} {...props} />;
};
```

**FlatList 최적화:**

```tsx
<FlatList
  data={items}
  removeClippedSubviews={true} // 보이지 않는 뷰 제거
  maxToRenderPerBatch={10} // 배치당 렌더링 수
  windowSize={5} // 메모리에 유지할 화면 수
  renderItem={({ item }) => <Image source={{ uri: item.image }} />}
/>
```

---

### 4. **Placeholder 전략**

#### Blurhash (추천)

```tsx
// 1. 서버에서 blurhash 생성 (Node.js)
import { encode } from 'blurhash';

const blurhash = encode(imageData, 4, 3); // "LGF5]+Yk^6#M@-5c,1J5@[or[Q6."

// 2. 클라이언트에서 사용
<ExpoImage source='https://...' placeholder={blurhash} placeholderContentFit='cover' />;
```

#### 저해상도 이미지 (LQIP)

```tsx
<Image
  source={{ uri: 'https://.../image-large.jpg' }}
  defaultSource={require('./image-tiny.jpg')} // 작은 로컬 이미지
/>
```

#### 스켈레톤

```tsx
const [loading, setLoading] = useState(true);

<View>
  {loading && <View className='h-40 w-40 bg-muted animate-pulse' />}
  <Image source={{ uri: '...' }} onLoadEnd={() => setLoading(false)} />
</View>;
```

---

### 5. **캐싱 전략**

#### Expo Image 캐싱

```tsx
import { Image } from 'expo-image';

// 메모리 + 디스크 캐싱 (권장)
<Image cachePolicy="memory-disk" />

// 메모리만
<Image cachePolicy="memory" />

// 캐시 무시
<Image cachePolicy="none" />

// 캐시 초기화
await Image.clearMemoryCache();
await Image.clearDiskCache();
```

#### 프리페칭

```tsx
import { Image } from 'expo-image';

// 미리 캐싱
await Image.prefetch(['url1', 'url2', 'url3']);
```

---

### 6. **성능 최적화 체크리스트**

#### ✅ DO

```tsx
// 1. 명시적 크기 지정
<Image style={{ width: 200, height: 200 }} />

// 2. 적절한 resizeMode
<Image resizeMode="cover" />

// 3. WebP 포맷 사용
source={{ uri: 'https://.../image.webp' }}

// 4. 캐싱 활성화
<ExpoImage cachePolicy="memory-disk" />

// 5. 프리페칭
await Image.prefetch(urls);

// 6. FlatList 최적화
<FlatList removeClippedSubviews windowSize={5} />
```

#### ❌ DON'T

```tsx
// 1. 크기 미지정
<Image source={{ uri: '...' }} />

// 2. 과도한 이미지 크기
// 300x300 보여주는데 2000x2000 로드 ❌

// 3. stretch 사용
<Image resizeMode="stretch" />

// 4. 캐싱 비활성화
<Image cachePolicy="none" />

// 5. onLayout에서 이미지 로드
onLayout={() => setImage(...)}  // 리렌더 폭탄

// 6. 중첩된 Image
<Image>
  <Image>  // ❌ 성능 저하
    <Image />
  </Image>
</Image>
```

---

### 7. **이미지 크기 최적화**

```tsx
// 서버에서 적절한 크기로 제공
const getOptimizedImageUrl = (url: string, width: number) => {
  return `${url}?w=${width}&q=80&fm=webp`;
};

// 디바이스 픽셀 비율 고려
import { PixelRatio } from 'react-native';

const imageWidth = 200;
const pixelRatio = PixelRatio.get();
const optimizedWidth = imageWidth * pixelRatio;

<Image source={{ uri: getOptimizedImageUrl(url, optimizedWidth) }} style={{ width: imageWidth, height: imageWidth }} />;
```

---

### 8. **에러 처리**

```tsx
const [error, setError] = useState(false);

<Image
  source={{ uri: imageUrl }}
  onError={() => setError(true)}
  defaultSource={require('./fallback.png')}
/>

// 또는 Expo Image
<ExpoImage
  source={error ? fallbackImage : imageUrl}
  onError={() => setError(true)}
/>
```

---

## 🎨 실전 예제

### 프로필 아바타

```tsx
<ExpoImage
  source={user.avatar || require('./default-avatar.png')}
  placeholder={user.avatarBlurhash}
  contentFit='cover'
  transition={200}
  cachePolicy='memory-disk'
  style={{ width: 40, height: 40, borderRadius: 20 }}
/>
```

### 피드 이미지

```tsx
<ExpoImage
  source={post.image}
  placeholder={post.blurhash}
  contentFit='cover'
  transition={300}
  cachePolicy='memory-disk'
  priority='high'
  style={{ width: '100%', aspectRatio: 1 }}
/>
```

### 백그라운드 이미지

```tsx
import { ImageBackground } from 'react-native';

<ImageBackground source={require('./background.jpg')} style={{ flex: 1 }} resizeMode='cover'>
  <View>{children}</View>
</ImageBackground>;
```

---

## 🚀 추천 구현 전략 (현재 프로젝트)

### Phase 1: 기본 Image 래퍼 (현재)

```tsx
// packages/ui/src/components/Image.tsx
import { Image as RNImage } from 'react-native';

export const Image = forwardRef((props, ref) => {
  return <RNImage ref={ref} resizeMode='cover' {...props} />;
});
```

### Phase 2: Expo Image로 업그레이드 (권장)

```bash
cd packages/ui
pnpm add expo-image
```

```tsx
// packages/ui/src/components/Image.tsx
import { Image as ExpoImage } from 'expo-image';

export const Image = forwardRef(
  ({ source, placeholder, cachePolicy = 'memory-disk', transition = 200, ...props }, ref) => {
    return (
      <ExpoImage
        ref={ref}
        source={source}
        placeholder={placeholder}
        contentFit='cover'
        transition={transition}
        cachePolicy={cachePolicy}
        {...props}
      />
    );
  },
);
```

### Phase 3: 고급 기능 추가

```tsx
// 자동 blurhash, lazy loading, 에러 처리
export const Image = ({ source, blurhash, lazy = false, fallback, onError, ...props }) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(!lazy);

  useEffect(() => {
    if (lazy) {
      const timer = setTimeout(() => setLoaded(true), 100);
      return () => clearTimeout(timer);
    }
  }, [lazy]);

  if (!loaded) {
    return <View style={props.style} className='bg-muted' />;
  }

  return (
    <ExpoImage
      source={error && fallback ? fallback : source}
      placeholder={blurhash}
      onError={(e) => {
        setError(true);
        onError?.(e);
      }}
      {...props}
    />
  );
};
```

---

## 📈 성능 측정

```tsx
import { InteractionManager } from 'react-native';

const ImageWithMetrics = ({ source, ...props }) => {
  const [loadTime, setLoadTime] = useState(0);
  const startTime = useRef(Date.now());

  return (
    <Image
      source={source}
      onLoadEnd={() => {
        const time = Date.now() - startTime.current;
        setLoadTime(time);
        console.log(`Image loaded in ${time}ms`);
      }}
      {...props}
    />
  );
};
```

---

## 🔍 디버깅 팁

```tsx
// 개발 모드에서 이미지 로딩 상태 표시
<Image
  source={{ uri }}
  onLoadStart={() => console.log('Loading started')}
  onLoad={() => console.log('Loaded')}
  onLoadEnd={() => console.log('Load ended')}
  onError={(e) => console.error('Error:', e.nativeEvent.error)}
/>
```

---

## 결론

**현재 프로젝트 권장 사항:**

1. ✅ **단기:** 기본 RN Image 사용 (현재 상태 유지)
2. ✅ **중기:** Expo Image로 업그레이드 (성능 향상)
3. ✅ **장기:** Blurhash + 프리페칭 추가 (최고의 UX)

**핵심 원칙:**

- 항상 width/height 명시
- 네트워크 이미지는 캐싱 활용
- Placeholder로 UX 개선
- WebP 포맷 사용
- Lazy loading 적용
