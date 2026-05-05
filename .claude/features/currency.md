# 통화 정책 가이드

## 개요

Noline은 오프라인 우선 여행 앱으로, 사용자가 여러 국가를 여행하며 다양한 통화로 경비를 기록할 수 있습니다. 환율 API에 의존하지 않고, 각 통화를 독립적으로 관리하며 통화별 그룹으로 총액을 표시합니다.

## 핵심 원칙

### 1. 오프라인 우선

- **환율 API 불필요**: 네트워크 연결 없이도 모든 통화 기능 사용 가능
- **통화별 독립 관리**: 각 통화의 금액을 그대로 저장하고 표시
- **환산 없음**: 서로 다른 통화를 하나로 통합하지 않음

### 2. 명확한 표시

- **통화별 그룹핑**: 같은 통화끼리 묶어서 총액 계산
- **주 통화 강조**: 가장 많이 사용된 통화를 우선 표시
- **혼동 방지**: 서로 다른 통화를 합산하지 않음

## 데이터 구조

### Expense 스키마

```typescript
expenses: {
  id: text(ULID);
  userId: text;
  tripId: text;
  scheduleId: text | null;
  title: text;
  amount: numeric(10, 2);
  currency: text; // 경비별 통화 (예: "EUR", "USD", "KRW")
  category: text;
  date: text;
  updatedAt: timestamp;
  deletedAt: timestamp | null;
  version: integer;
}
```

### Trip 스키마 (구현됨)

```typescript
trips: {
  // ... 기존 필드
  baseCurrency: text; // 여행 기본 통화
}
```

## 통화 표시 방식

### 1. 경비 화면 (Expenses.tsx)

**통화별 경비 섹션**

```
총 경비
─────────────────
EUR 367.50
USD 120.00
KRW 50,000
```

**계산 로직:**

```typescript
const expensesByCurrency = useMemo(() => {
  if (!expenses) return [];

  const grouped = expenses.reduce(
    (acc, expense) => {
      const currency = expense.currency || 'EUR';
      acc[currency] = (acc[currency] || 0) + Number(expense.amount);
      return acc;
    },
    {} as Record<string, number>,
  );

  return Object.entries(grouped)
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => b.amount - a.amount); // 내림차순 정렬
}, [expenses]);
```

**특징:**

- 통화별로 그룹핑
- 금액 기준 내림차순 정렬 (주 통화가 맨 위)
- 각 통화별 합계 명시

### 2. 홈 화면 (TripSummaryCard)

**간결한 표시**

```
경비
─────────
EUR 367.50
+2개 통화
```

**로직:**

```typescript
{expensesByCurrency.length > 0 ? (
  <div className="space-y-0.5">
    <p className="text-lg font-semibold">
      {expensesByCurrency[0].currency} {expensesByCurrency[0].amount.toFixed(2)}
    </p>
    {expensesByCurrency.length > 1 && (
      <p className="text-xs text-primary-foreground/70">
        +{expensesByCurrency.length - 1}개 통화
      </p>
    )}
  </div>
) : (
  <p className="text-lg font-semibold">EUR 0.00</p>
)}
```

**특징:**

- 주 통화만 크게 표시
- 추가 통화는 개수로 요약
- 공간 효율적

### 3. 경비 상세 화면

**개별 경비 표시**

```
레스토랑 저녁식사
USD 45.50
```

각 경비는 자신의 통화로 표시됩니다.

## UI/UX 가이드라인

### 혼동 방지 규칙

❌ **하지 말아야 할 것:**

```
총 경비: 537.50 EUR  // 잘못됨: 다른 통화를 EUR로 환산한 것처럼 보임
```

✅ **올바른 표시:**

```
총 경비
EUR 367.50
USD 120.00
KRW 50,000
```

### 통화 표시 순서

1. **금액 기준 내림차순**: 가장 많이 사용된 통화가 상단
2. **일관성 유지**: 같은 데이터는 항상 같은 순서로 표시
3. **주 통화 강조**: 첫 번째 통화를 시각적으로 강조

### 색상 및 강조

- **주 통화**: 기본 텍스트 크기/색상 사용
- **부 통화**: 약간 작은 텍스트, 약간 연한 색상
- **통화 개수**: 더 작고 연한 텍스트로 표시

## 구현 현황

### ✅ 완료된 기능

1. **통화별 경비 계산**
   - 같은 통화끼리 그룹핑
   - 금액 기준 정렬
   - 소수점 2자리 표시

2. **경비 화면 UI**
   - 통화별 섹션 분리
   - 주 통화 강조
   - 명확한 레이블링

3. **홈 화면 요약**
   - 주 통화 표시
   - 추가 통화 개수 표시
   - 공간 효율적 디자인

4. **여행 기본 통화 설정**
   - Trip 스키마, client/server DB schema, create/update request에 `baseCurrency` 포함
   - 여행 생성 시 국가 코드 기반 기본 통화 설정
   - 경비 생성 시 여행의 `baseCurrency`를 기본값으로 사용

5. **통화 포맷 유틸**
   - `formatCurrencyDisplay`
   - `groupExpensesByCurrency`
   - `getPrimaryCurrency`

### 남은 개선 후보

아래 항목은 구현 예정으로 확정된 체크리스트가 아니라, 이후 UX/표시 품질을 높일 때 검토할 후보다. 상세는 [향후 개선 사항](#향후-개선-사항)을 기준으로 본다.

## 향후 개선 사항

### 1. 통화 선택 UX 개선

**드롭다운 구성:**

```
최근 사용
─────────
EUR
USD
KRW

일반 통화
─────────
USD - 미국 달러
EUR - 유로
JPY - 일본 엔
...
```

### 2. 통화 표시 포맷

**지역별 포맷:**

- EUR: 1,234.56
- USD: 1,234.56
- KRW: 1,234,567 (소수점 없음)
- JPY: 1,234 (소수점 없음)

### 3. 통화 아이콘/심볼

**표시 옵션:**

- 통화 코드: EUR, USD, KRW
- 통화 심볼: €, $, ₩
- 통화 플래그: 🇪🇺, 🇺🇸, 🇰🇷 (선택적)

### 4. 환율 참고 정보 (선택적)

**오프라인 우선 원칙 유지하며:**

- 사용자가 수동으로 환율 입력 (선택)
- 참고용 환산 금액 표시 (실제 금액은 변경 안 됨)
- 온라인 시 환율 정보 캐싱 (선택적 기능)

## 기술적 고려사항

### 1. 데이터 정합성

- **필수 필드**: 모든 경비는 currency 필드 필수
- **기본값**: currency가 없으면 "EUR" 사용
- **검증**: ISO 4217 통화 코드만 허용

### 2. 정렬 및 집계

```typescript
// 통화별 그룹핑 및 정렬
const groupByCurrency = (expenses: Expense[]) => {
  const grouped = expenses.reduce(
    (acc, expense) => {
      const currency = expense.currency || 'EUR';
      acc[currency] = (acc[currency] || 0) + Number(expense.amount);
      return acc;
    },
    {} as Record<string, number>,
  );

  return Object.entries(grouped)
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => b.amount - a.amount);
};
```

### 3. Client-Side ID / sync_queue 동기화

- 통화 정보는 모든 기기에서 동일하게 유지
- currency 필드는 Soft Delete 시에도 보존
- 동기화 충돌 시 LWW(Last-Write-Wins) 전략 사용

## 예시 시나리오

### 시나리오 1: 유럽 여행

```
여행: 파리, 프랑스
기본 통화: EUR

경비:
- 호텔: EUR 150.00
- 식사: EUR 45.50
- 관광: EUR 25.00

총 경비: EUR 220.50
```

### 시나리오 2: 다국가 여행

```
여행: 동남아 배낭여행
기본 통화: USD

경비:
- 태국 호텔: THB 1,500
- 베트남 식사: VND 250,000
- 항공권: USD 450.00

총 경비:
USD 450.00
THB 1,500
VND 250,000
```

### 시나리오 3: 혼합 통화

```
여행: 뉴욕, 미국
기본 통화: USD

경비:
- 호텔: USD 280.00 (주 통화)
- 쇼핑: USD 150.00
- 한식당: KRW 35,000 (카드 원화 결제)
- 면세점: EUR 80.00 (유로 현금 사용)

총 경비:
USD 430.00
EUR 80.00
KRW 35,000
```

## 참고 자료

### ISO 4217 통화 코드

- **EUR**: 유로
- **USD**: 미국 달러
- **KRW**: 대한민국 원
- **JPY**: 일본 엔
- **GBP**: 영국 파운드
- **CNY**: 중국 위안
- **THB**: 태국 바트
- **VND**: 베트남 동

### 관련 문서

- [selective-activation-architecture.md](../core/selective-activation-architecture.md): Selective Activation 아키텍처 (v2.0)
- [local-first-impl-v1.md](../_archive/local-first-impl-v1.md): Echo Architecture 구현 가이드 (v1.0 아카이브)
- [architecture.md](../core/architecture.md): FSD 아키텍처

---

**마지막 업데이트**: 2025-10-26
**작성자**: Replit Agent
**버전**: 1.0.0
