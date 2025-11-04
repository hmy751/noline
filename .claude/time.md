# Noline - 시간 데이터 처리 완전 가이드

## 📖 목차

1. [시간 아키텍처 개요](#-시간-아키텍처-개요)
2. [계층별 시간 표현](#-계층별-시간-표현)
3. [시간 변환 흐름](#-시간-변환-흐름)
4. [시간 유틸리티 함수](#-시간-유틸리티-함수)
5. [실전 구현 패턴](#-실전-구현-패턴)
6. [시간 관련 이슈와 해결책](#-시간-관련-이슈와-해결책)

---

## 🕐 시간 아키텍처 개요

### 핵심 원칙: ISO 8601 Datetime with Timezone

```
┌─────────────────────────────────────────────────────┐
│  모든 시간 데이터는 ISO 8601 형식으로 통일            │
│  "2024-03-15T14:30:00.000Z"                         │
│                                                     │
│  ✅ 장점:                                           │
│  - 타임존 정보 포함 (UTC 기준)                       │
│  - 문자열로 저장 가능 (SQLite 호환)                  │
│  - JSON 직렬화 안전                                  │
│  - Zod 검증 가능                                    │
│  - 국제 표준                                        │
└─────────────────────────────────────────────────────┘
```

### 시간 데이터 유형

| 유형          | 예시                       | 용도                      | 저장 형식                |
| ------------- | -------------------------- | ------------------------- | ------------------------ |
| **DateTime**  | `2024-03-15T14:30:00.000Z` | 일정 시간, 경비 발생 시각 | `scheduledAt`, `spentAt` |
| **Date**      | `2024-03-15T00:00:00.000Z` | 여행 시작/종료일          | `startDate`, `endDate`   |
| **Timestamp** | `2024-03-15T10:25:33.123Z` | 생성/수정 시각            | `createdAt`, `updatedAt` |

**중요:** 모두 ISO 8601 datetime 형식으로 저장하되, **의미적 차이**만 존재

---

## 📚 계층별 시간 표현

### 1. UI Layer (사용자 입력/표시)

**입력:**

```tsx
// 날짜 선택기
<input type="date" value="2024-03-15" />

// 시간 선택기
<input type="time" value="14:30" />
```

**표시:**

```tsx
// 사용자 로컬 시간대로 변환하여 표시
formatISOToLocalDate('2024-03-15T14:30:00.000Z');
// → "2024-03-15"

formatISOToLocalTime('2024-03-15T14:30:00.000Z');
// → "14:30" (사용자 시간대)

formatISOToLocalDateTime('2024-03-15T14:30:00.000Z');
// → "2024-03-15 14:30" (사용자 시간대)
```

**형식:**

- 날짜: `"YYYY-MM-DD"` (HTML input format)
- 시간: `"HH:mm"` (HTML input format)
- 표시: 사용자 로컬 시간대

---

### 2. Application Layer (비즈니스 로직)

**Feature Layer:**

```typescript
// ✅ 사용자 입력 → ISO 변환
const scheduleData = {
  scheduledAt: combineDateTimeToISO(formData.date, formData.time),
  // "2024-03-15" + "14:30" → "2024-03-15T14:30:00.000Z"
};

const tripData = {
  startDate: dateToISODateTime(formData.startDate),
  // "2024-03-15" → "2024-03-15T00:00:00.000Z"
};
```

**형식:**

- 모든 시간 데이터: ISO 8601 datetime string
- 변환 즉시 수행 (경계에서만)

---

### 3. Schema Layer (타입 계약)

**@repo/schema:**

```typescript
// ✅ 모든 시간 필드는 동일한 검증
import { z } from 'zod';

export const scheduleSchema = z.object({
  // DateTime: 일정 시간
  scheduledAt: z.string().datetime({ offset: true }),

  // Timestamp: 생성/수정 시각
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  deletedAt: z.string().datetime({ offset: true }).nullable(),
});

export const tripSchema = z.object({
  // Date: 날짜만 (시간은 00:00:00)
  startDate: z.string().datetime({ offset: true }),
  endDate: z.string().datetime({ offset: true }),

  // Timestamp
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});
```

**형식:**

- `z.string().datetime({ offset: true })`
- 타임존 정보 필수 (offset: true)
- Runtime 검증

---

### 4. Client DB Layer (SQLite)

**Schema:**

```typescript
// apps/client/src/shared/db/schema.ts
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const schedules = sqliteTable('schedules', {
  // ✅ TEXT 타입으로 ISO string 저장
  scheduledAt: text('scheduled_at').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
});

export const trips = sqliteTable('trips', {
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
```

**저장 예시:**

```sql
INSERT INTO schedules (scheduled_at, created_at)
VALUES ('2024-03-15T14:30:00.000Z', '2024-03-15T10:25:33.123Z');
```

**형식:**

- SQLite 타입: `TEXT`
- 저장 값: ISO 8601 string
- **변환 없음** (그대로 저장)

**이유:**

- SQLite는 네이티브 datetime 타입 없음
- TEXT로 저장하면 정렬/비교 가능
- ISO 형식은 사전순 = 시간순

---

### 5. Server DB Layer (PostgreSQL)

**Schema:**

```typescript
// apps/server/src/db/schema.ts
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const schedules = pgTable('schedules', {
  // ✅ TIMESTAMPTZ 타입
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
```

**PostgreSQL 내부:**

```sql
-- 테이블 정의
scheduled_at TIMESTAMPTZ NOT NULL

-- 저장 (내부적으로 UTC로 변환하여 이진 저장)
INSERT INTO schedules (scheduled_at)
VALUES ('2024-03-15T14:30:00.000Z');

-- 조회 (ISO string으로 반환)
SELECT scheduled_at FROM schedules;
-- → "2024-03-15T14:30:00.000Z"
```

**형식:**

- PostgreSQL 타입: `TIMESTAMPTZ`
- 저장: UTC 이진 데이터
- 조회 시 반환: ISO 8601 string
- **Drizzle이 자동 변환**

---

### 6. API Layer (JSON)

**Request:**

```typescript
// POST /api/schedules
{
  "id": "01ABC123",
  "scheduledAt": "2024-03-15T14:30:00.000Z",  // ISO string
  "createdAt": "2024-03-15T10:25:33.123Z"
}

// Zod 검증
createScheduleRequestSchema.parse(req.body);
// ✅ datetime({ offset: true }) 통과
```

**Response:**

```typescript
// GET /api/schedules
{
  "success": true,
  "data": [
    {
      "id": "01ABC123",
      "scheduledAt": "2024-03-15T14:30:00.000Z",  // ISO string
      "createdAt": "2024-03-15T10:25:33.123Z"
    }
  ]
}

// 서버에서 변환 필요
const response = {
  success: true,
  data: schedules.map(s => ({
    ...s,
    scheduledAt: s.scheduledAt.toISOString(),  // Date → ISO string
    createdAt: s.createdAt.toISOString(),
  })),
};
```

**형식:**

- JSON: ISO 8601 string
- Content-Type: application/json
- **서버에서 Date → ISO string 변환 필수**

---

## 🔄 시간 변환 흐름

### 전체 흐름도

```
┌─────────────────────────────────────────────────────┐
│ 1. UI Input (사용자 입력)                            │
│    date: "2024-03-15"                               │
│    time: "14:30"                                    │
└───────────────────────┬─────────────────────────────┘
                        │
                        ↓ combineDateTimeToISO()
┌─────────────────────────────────────────────────────┐
│ 2. Application Layer (비즈니스 로직)                 │
│    scheduledAt: "2024-03-15T14:30:00.000Z"          │
│    ✅ ISO 8601 datetime with timezone               │
└───────────────────────┬─────────────────────────────┘
                        │
                        ↓ Zod 검증
┌─────────────────────────────────────────────────────┐
│ 3. Schema Validation                                │
│    z.string().datetime({ offset: true })            │
│    ✅ 형식 검증 통과                                 │
└───────────────────────┬─────────────────────────────┘
                        │
                        ↓ 변환 없음 (그대로)
┌─────────────────────────────────────────────────────┐
│ 4. Client DB (SQLite)                               │
│    scheduled_at TEXT                                │
│    "2024-03-15T14:30:00.000Z" ← 문자열 그대로       │
└───────────────────────┬─────────────────────────────┘
                        │
                        ↓ JSON 직렬화 (변환 없음)
┌─────────────────────────────────────────────────────┐
│ 5. API Request (Sync)                               │
│    { "scheduledAt": "2024-03-15T14:30:00.000Z" }    │
└───────────────────────┬─────────────────────────────┘
                        │
                        ↓ Drizzle 자동 변환
┌─────────────────────────────────────────────────────┐
│ 6. Server DB (PostgreSQL)                           │
│    scheduled_at TIMESTAMPTZ                         │
│    내부: UTC 이진 데이터                             │
└───────────────────────┬─────────────────────────────┘
                        │
                        ↓ .toISOString()
┌─────────────────────────────────────────────────────┐
│ 7. API Response (Pull)                              │
│    { "scheduledAt": "2024-03-15T14:30:00.000Z" }    │
└───────────────────────┬─────────────────────────────┘
                        │
                        ↓ Upsert (변환 없음)
┌─────────────────────────────────────────────────────┐
│ 8. Client DB (SQLite)                               │
│    "2024-03-15T14:30:00.000Z" ← 동일한 값           │
└───────────────────────┬─────────────────────────────┘
                        │
                        ↓ formatISOToLocalTime()
┌─────────────────────────────────────────────────────┐
│ 9. UI Display (사용자 표시)                          │
│    "14:30" (사용자 로컬 시간대)                      │
└─────────────────────────────────────────────────────┘
```

### 변환 포인트 (4곳만)

```
1️⃣ UI → Logic: combineDateTimeToISO() / dateToISODateTime()
2️⃣ Server DB → API: .toISOString()
3️⃣ Logic → UI: formatISOToLocal*()
4️⃣ (자동) JSON → PostgreSQL: Drizzle 처리
```

**나머지는 모두 ISO string 그대로!**

---

## 🛠 시간 유틸리티 함수

### 위치

```
apps/client/src/shared/lib/
├── datetime.ts    ← 시간 변환 함수 (UI ↔ Logic)
└── date.ts        ← ISO string 생성 (Logic ↔ DB)
```

---

### datetime.ts (UI ↔ Logic)

```typescript
// apps/client/src/shared/lib/datetime.ts

/**
 * 날짜 + 시간 → ISO datetime
 * @param date "2024-03-15"
 * @param time "14:30"
 * @returns "2024-03-15T14:30:00.000Z"
 */
export function combineDateTimeToISO(date: string, time: string): string {
  const dateTime = `${date}T${time}:00`;
  return new Date(dateTime).toISOString();
}

/**
 * 날짜만 → ISO datetime (시간 00:00:00)
 * @param date "2024-03-15"
 * @returns "2024-03-15T00:00:00.000Z"
 */
export function dateToISODateTime(date: string): string {
  return new Date(`${date}T00:00:00`).toISOString();
}

/**
 * ISO → 로컬 날짜
 * @param isoString "2024-03-15T14:30:00.000Z"
 * @returns "2024-03-15"
 */
export function formatISOToLocalDate(isoString: string): string {
  const date = new Date(isoString);
  return date
    .toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .replace(/\. /g, '-')
    .replace('.', '');
  // "2024-03-15"
}

/**
 * ISO → 로컬 시간
 * @param isoString "2024-03-15T14:30:00.000Z"
 * @returns "14:30"
 */
export function formatISOToLocalTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  // "14:30"
}

/**
 * ISO → 로컬 날짜+시간
 * @param isoString "2024-03-15T14:30:00.000Z"
 * @returns "2024-03-15 14:30"
 */
export function formatISOToLocalDateTime(isoString: string): string {
  return `${formatISOToLocalDate(isoString)} ${formatISOToLocalTime(isoString)}`;
}
```

---

### date.ts (Logic ↔ DB)

```typescript
// apps/client/src/shared/lib/date.ts

/**
 * 현재 시각 → ISO string
 * @returns "2024-03-15T10:25:33.123Z"
 */
export function getCurrentISOString(): string {
  return new Date().toISOString();
}

/**
 * Date 객체 → ISO string
 * @param date Date 객체
 * @returns "2024-03-15T10:25:33.123Z" | null
 */
export function dateToISOString(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toISOString();
}
```

---

## 💡 실전 구현 패턴

### 패턴 1: 일정 생성 (DateTime)

```typescript
// ✅ Feature Layer: useCreateScheduleForm.ts

import { combineDateTimeToISO } from '@/shared/lib/datetime';
import { getCurrentISOString } from '@/shared/lib/date';

export function useCreateSchedule() {
  return useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      const id = ulid();

      // 1️⃣ UI 입력 → ISO 변환
      const scheduledAt = combineDateTimeToISO(data.date, data.time);
      // "2024-03-15" + "14:30" → "2024-03-15T14:30:00.000Z"

      // 2️⃣ Zod 검증
      const validated = insertScheduleSchema.parse({
        id,
        tripId: data.tripId,
        title: data.title,
        scheduledAt, // ISO string
      });

      // 3️⃣ 트랜잭션 저장
      await withTransaction(async () => {
        await db.insert(schedules).values({
          ...validated,
          createdAt: getCurrentISOString(),
          updatedAt: getCurrentISOString(),
        });

        await addToSyncQueue('schedules', id, 'CREATE', validated);
      });

      return { id, ...validated };
    },
  });
}
```

---

### 패턴 2: 여행 생성 (Date)

```typescript
// ✅ Feature Layer: useCreateTrip.ts

import { dateToISODateTime } from '@/shared/lib/datetime';

export function useCreateTrip() {
  return useMutation({
    mutationFn: async (data: TripFormData) => {
      const id = ulid();

      // 1️⃣ 날짜만 → ISO datetime (시간 00:00:00)
      const validated = insertTripSchema.parse({
        id,
        title: data.title,
        destination: data.destination,
        startDate: dateToISODateTime(data.startDate),
        // "2024-03-15" → "2024-03-15T00:00:00.000Z"
        endDate: dateToISODateTime(data.endDate),
        // "2024-03-20" → "2024-03-20T00:00:00.000Z"
      });

      await withTransaction(async () => {
        await db.insert(trips).values({
          ...validated,
          createdAt: getCurrentISOString(),
          updatedAt: getCurrentISOString(),
        });

        await addToSyncQueue('trips', id, 'CREATE', validated);
      });

      return { id, ...validated };
    },
  });
}
```

---

### 패턴 3: 일정 목록 표시 (날짜별 그룹화)

```typescript
// ✅ Screen: ScheduleScreen.tsx

import { formatISOToLocalDate, formatISOToLocalTime } from '@/shared/lib/datetime';

export function ScheduleScreen({ tripId }: Props) {
  const { data: schedules } = useGetSchedules(tripId);

  // 1️⃣ 날짜별 그룹화
  const schedulesByDate = groupBy(schedules, (schedule) =>
    formatISOToLocalDate(schedule.scheduledAt)
    // "2024-03-15T14:30:00.000Z" → "2024-03-15"
  );

  return (
    <View>
      {Object.entries(schedulesByDate).map(([date, items]) => (
        <View key={date}>
          <Text>{date}</Text>  {/* "2024-03-15" */}

          {items.map(schedule => (
            <ScheduleCard
              key={schedule.id}
              title={schedule.title}
              time={formatISOToLocalTime(schedule.scheduledAt)}
              // "2024-03-15T14:30:00.000Z" → "14:30"
            />
          ))}
        </View>
      ))}
    </View>
  );
}
```

---

### 패턴 4: 여행 수정 (날짜만 수정)

```typescript
// ✅ Feature: EditTripDrawer.tsx

import { formatISOToLocalDate, dateToISODateTime } from '@/shared/lib/datetime';

export function EditTripDrawer({ trip }: Props) {
  const form = useForm({
    defaultValues: {
      title: trip.title,
      // 2️⃣ 표시: ISO → 날짜만
      startDate: formatISOToLocalDate(trip.startDate),
      // "2024-03-15T00:00:00.000Z" → "2024-03-15"
      endDate: formatISOToLocalDate(trip.endDate),
    },
  });

  const handleSubmit = (data: FormData) => {
    updateTrip.mutate({
      id: trip.id,
      title: data.title,
      // 3️⃣ 저장: 날짜 → ISO
      startDate: dateToISODateTime(data.startDate),
      // "2024-03-15" → "2024-03-15T00:00:00.000Z"
      endDate: dateToISODateTime(data.endDate),
    });
  };

  return (
    <Form onSubmit={handleSubmit}>
      <input type="date" {...form.register('startDate')} />
      <input type="date" {...form.register('endDate')} />
    </Form>
  );
}
```

---

### 패턴 5: 서버 API (PostgreSQL ↔ JSON)

```typescript
// ✅ Server: routes/schedules.ts

router.post('/', async (req, res, next) => {
  try {
    const validated = createScheduleRequestSchema.parse(req.body);
    // ✅ scheduledAt: "2024-03-15T14:30:00.000Z" (ISO string)

    const { id, ...data } = validated;

    // 1️⃣ PostgreSQL 저장 (Drizzle이 자동 변환)
    const newSchedule = await db
      .insert(schedules)
      .values({
        id,
        ...data,
        // scheduledAt: ISO string → Drizzle → TIMESTAMPTZ
        createdAt: new Date(), // 서버에서는 Date 객체
        updatedAt: new Date(),
      })
      .returning()
      .then((rows) => rows[0]);

    // 2️⃣ 응답: Date → ISO string 변환 필수!
    const response = {
      success: true,
      data: {
        ...newSchedule,
        scheduledAt: newSchedule.scheduledAt.toISOString(),
        // Date 객체 → "2024-03-15T14:30:00.000Z"
        createdAt: newSchedule.createdAt.toISOString(),
        updatedAt: newSchedule.updatedAt.toISOString(),
        deletedAt: newSchedule.deletedAt?.toISOString() || null,
      },
    };

    // 3️⃣ 응답 검증
    const validatedResponse = scheduleResponseSchema.parse(response);
    // ✅ z.string().datetime({ offset: true }) 통과

    res.status(201).json(validatedResponse);
  } catch (error) {
    next(error);
  }
});
```

---

### 패턴 6: Sync Engine (Pull)

```typescript
// ✅ Client: sync/engine.ts

export async function pullChanges(lastSyncedAt: string | null) {
  const response = await syncApiClient.get('/api/sync/pull', {
    params: { lastSyncedAt },
  });

  const { trips, schedules, expenses } = response.data.data;

  // ✅ ISO string 그대로 저장 (변환 없음!)
  for (const schedule of schedules) {
    await db
      .insert(schedulesTable)
      .values({
        ...schedule,
        // scheduledAt: "2024-03-15T14:30:00.000Z" ← 그대로
      })
      .onConflictDoUpdate({
        target: schedulesTable.id,
        set: schedule,
      });
  }

  // ❌ 절대 금지!
  // scheduledAt: new Date(schedule.scheduledAt)  // Date 객체로 변환 ❌
  // SQLite TEXT 컬럼에는 ISO string 그대로!
}
```

---

## 🚨 시간 관련 이슈와 해결책

### 이슈 1: 1970년대 날짜 표시 🔴

**증상:**

```
UI에서 "1970-01-21" 같은 이상한 날짜 표시
```

**원인:**

```typescript
// 구 스키마: INTEGER (Unix timestamp)
createdAt: 1729900800000  // 밀리초

// 신 스키마: TEXT (ISO string)
createdAt: text('created_at')

// 문제: INTEGER를 TEXT로 읽음
"1729900800000" → new Date("1729900800000") → Invalid Date
```

**해결:**

```bash
# 클라이언트 로컬 DB 리셋
rm -rf apps/client/.expo
# 앱 재설치 또는 DB 초기화
```

---

### 이슈 2: Zod Validation 에러 🔴

**증상:**

```
ZodError: Expected string, received date
path: ["scheduledAt"]
```

**원인:**

```typescript
// ❌ Date 객체를 전달
await db.insert(schedules).values({
  scheduledAt: new Date(), // Date 객체
});

// Schema는 string 기대
scheduledAt: z.string().datetime({ offset: true });
```

**해결:**

```typescript
// ✅ ISO string으로 변환
await db.insert(schedules).values({
  scheduledAt: getCurrentISOString(), // "2024-03-15T10:25:33.123Z"
});
```

---

### 이슈 3: 서버 응답 검증 실패 🔴

**증상:**

```
ZodError: Expected string, received date
path: ["data", "createdAt"]
```

**원인:**

```typescript
// ❌ Date 객체를 그대로 응답
res.json({
  success: true,
  data: {
    ...schedule,
    createdAt: schedule.createdAt, // Date 객체
  },
});

// JSON.stringify → "2024-03-15T10:25:33.123Z" (문자열이 됨)
// 하지만 Zod는 Date 타입으로 추론
```

**해결:**

```typescript
// ✅ 명시적으로 ISO string 변환
res.json({
  success: true,
  data: {
    ...schedule,
    createdAt: schedule.createdAt.toISOString(), // 명시적 변환
    updatedAt: schedule.updatedAt.toISOString(),
    deletedAt: schedule.deletedAt?.toISOString() || null,
  },
});
```

---

### 이슈 4: 타임존 문제 🔴

**증상:**

```
서버: 2024-03-15 14:30 저장
클라이언트: 2024-03-15 23:30 표시 (9시간 차이)
```

**원인:**

```typescript
// ❌ 타임존 없는 ISO string
const date = new Date('2024-03-15T14:30:00'); // 로컬 시간으로 해석
// 서울: UTC+9
// → 실제 UTC: 2024-03-15T05:30:00.000Z

// ❌ 타임존 명시 없음
z.string().datetime(); // offset: false (기본값)
```

**해결:**

```typescript
// ✅ 항상 타임존 포함
const date = new Date('2024-03-15T14:30:00.000Z'); // UTC 명시
// 또는
const date = new Date('2024-03-15T14:30:00+09:00'); // KST 명시

// ✅ Zod에서 타임존 필수
z.string().datetime({ offset: true }); // 반드시 타임존 포함
```

---

### 이슈 5: SQLite Date 변환 🔴

**증상:**

```
TypeError: schedule.scheduledAt.toISOString is not a function
```

**원인:**

```typescript
// ❌ SQLite에서 Date 객체로 읽으려 시도
scheduledAt: integer('scheduled_at', { mode: 'timestamp' });

// Drizzle이 자동 변환
const schedule = db.select().from(schedules).get();
schedule.scheduledAt; // Date 객체

// 하지만 실제 저장된 값은 TEXT!
```

**해결:**

```typescript
// ✅ TEXT로 정의 (ISO string 그대로)
scheduledAt: text('scheduled_at').notNull();

// 조회 시
const schedule = db.select().from(schedules).get();
schedule.scheduledAt; // "2024-03-15T14:30:00.000Z" (string)

// UI 표시 시 변환
formatISOToLocalTime(schedule.scheduledAt);
```

---

## ✅ 시간 처리 체크리스트

### Schema 정의 시

```typescript
□ z.string().datetime({ offset: true }) 사용
□ 모든 시간 필드에 일관되게 적용
□ nullable은 .nullable() 체인
□ optional은 사용 금지 (명시적 null)
```

### Client DB (SQLite)

```typescript
□ text('column_name') 타입
□ .notNull() 또는 nullable
□ mode: 'timestamp' 사용 금지
□ integer 타입 사용 금지
```

### Server DB (PostgreSQL)

```typescript
□ timestamp('column_name', { withTimezone: true })
□ .notNull() 또는 nullable
□ defaultNow() 사용 가능
```

### UI 입력 처리

```typescript
□ combineDateTimeToISO() 사용 (날짜 + 시간)
□ dateToISODateTime() 사용 (날짜만)
□ 사용자 입력 직후 즉시 변환
```

### UI 표시 처리

```typescript
□ formatISOToLocalDate() (날짜만)
□ formatISOToLocalTime() (시간만)
□ formatISOToLocalDateTime() (날짜+시간)
□ 표시 직전에만 변환
```

### API 응답 처리

```typescript
□ Date 객체 → .toISOString() 변환
□ { success, data } 구조
□ xxxResponseSchema.parse() 검증
```

### Sync 처리

```typescript
□ ISO string 그대로 전송
□ 변환 없이 저장
□ Pull 시 Upsert
```

---

## 🎯 핵심 원칙 요약

### DO ✅

```typescript
1. ✅ 항상 ISO 8601 datetime with timezone
   "2024-03-15T14:30:00.000Z"

2. ✅ 변환은 경계에서만 (4곳)
   UI → Logic: combineDateTimeToISO()
   Logic → UI: formatISOToLocal*()
   Server DB → API: .toISOString()
   API → Server DB: Drizzle 자동

3. ✅ SQLite는 TEXT, PostgreSQL은 TIMESTAMPTZ
   scheduledAt: text('scheduled_at')
   scheduledAt: timestamp('scheduled_at', { withTimezone: true })

4. ✅ Zod에서 타임존 필수
   z.string().datetime({ offset: true })

5. ✅ 서버 응답은 명시적 변환
   createdAt: schedule.createdAt.toISOString()
```

### DON'T ❌

```typescript
1. ❌ Date 객체를 SQLite에 저장 금지
   scheduledAt: new Date()  // ❌

2. ❌ integer timestamp 사용 금지
   createdAt: integer('created_at', { mode: 'timestamp' })  // ❌

3. ❌ 타임존 없는 ISO string 금지
   "2024-03-15T14:30:00"  // ❌ offset 없음

4. ❌ 중간 레이어에서 변환 금지
   // Logic ↔ DB: 변환 없이 그대로
   // DB ↔ API: 변환 없이 그대로

5. ❌ 로컬 시간을 가정한 연산 금지
   new Date().getHours()  // ❌ 타임존 의존적
```

---

**작성일:** 2025-10-26  
**버전:** 1.0.0  
**작성자:** Cursor AI Assistant
