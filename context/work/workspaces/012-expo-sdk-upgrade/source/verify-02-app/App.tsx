// Work 012 Ticket 02 판정용 화면. 기기 DB와 오프라인 지도를 읽기만 한다(쓰기 없음).
import { useCallback, useEffect, useState } from 'react';
import { Button, SafeAreaView, ScrollView, Share, Text, View } from 'react-native';
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import Mapbox from '@rnmapbox/maps';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_ACCESS_TOKEN ?? '');

const DB_NAME = 'noline.db';

type PackInfo = { api: string; name: string; bounds: string; status: string };

function clip(value: unknown, max = 400): string {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

async function dirSize(uri: string, depth = 0): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) return 0;
  if (!info.isDirectory) return info.size ?? 0;
  if (depth > 12) return 0;
  let total = 0;
  for (const child of await FileSystem.readDirectoryAsync(uri)) {
    total += await dirSize(`${uri.replace(/\/$/, '')}/${encodeURIComponent(child)}`, depth + 1);
  }
  return total;
}

async function listSizes(root: string, label: string): Promise<string[]> {
  const out: string[] = [];
  const info = await FileSystem.getInfoAsync(root);
  if (!info.exists) return [`${label}: 없음`];
  for (const child of await FileSystem.readDirectoryAsync(root)) {
    const uri = `${root.replace(/\/$/, '')}/${encodeURIComponent(child)}`;
    const size = await dirSize(uri);
    out.push(`${label}/${child}: ${(size / 1024 / 1024).toFixed(2)} MB`);
    // .mapbox 같은 지도 저장소는 한 단계 더 펼친다.
    if (/mapbox|com\.noline/i.test(child)) {
      const sub = await FileSystem.getInfoAsync(uri);
      if (sub.exists && sub.isDirectory) {
        for (const grand of await FileSystem.readDirectoryAsync(uri)) {
          const g = `${uri}/${encodeURIComponent(grand)}`;
          out.push(`  ${child}/${grand}: ${((await dirSize(g)) / 1024 / 1024).toFixed(2)} MB`);
        }
      }
    }
  }
  return out;
}

async function readDatabase(): Promise<string[]> {
  const lines: string[] = [];
  const dir = SQLite.defaultDatabaseDirectory as string;
  lines.push(`defaultDatabaseDirectory: ${dir}`);
  const fileUri = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;
  const info = await FileSystem.getInfoAsync(fileUri);
  lines.push(`Documents/SQLite/${DB_NAME}: ${info.exists ? `있음 (${info.size} bytes)` : '없음'}`);
  for (const suffix of ['-wal', '-shm']) {
    const side = await FileSystem.getInfoAsync(`${fileUri}${suffix}`);
    if (side.exists) lines.push(`  ${DB_NAME}${suffix}: ${side.size} bytes`);
  }
  if (!info.exists) {
    lines.push('DB 파일이 없어 열지 않았다(새 파일을 만들지 않기 위해).');
    return lines;
  }
  const db = SQLite.openDatabaseSync(DB_NAME);
  const userVersion = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  lines.push(`user_version: ${userVersion?.user_version}`);
  const tables = db.getAllSync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );
  lines.push(`표 ${tables.length}개`);
  for (const { name } of tables) {
    const row = db.getFirstSync<{ c: number }>(`SELECT COUNT(*) AS c FROM "${name}"`);
    lines.push(`  ${name}: ${row?.c}`);
  }
  if (tables.some((t) => t.name === 'sync_queue')) {
    const queue = db.getAllSync<Record<string, unknown>>('SELECT * FROM sync_queue');
    lines.push(`sync_queue 행 ${queue.length}개`);
    queue.forEach((row, i) => lines.push(`  [${i}] ${clip(row)}`));
  }
  for (const table of ['trips', 'schedules', 'expenses', 'trip_activations', 'offline_cities']) {
    if (!tables.some((t) => t.name === table)) continue;
    const rows = db.getAllSync<Record<string, unknown>>(`SELECT * FROM "${table}" LIMIT 10`);
    lines.push(`${table} (최대 10행)`);
    rows.forEach((row, i) => lines.push(`  [${i}] ${clip(row, 300)}`));
  }
  return lines;
}

async function readPacks(): Promise<PackInfo[]> {
  const result: PackInfo[] = [];
  const sources: [string, () => Promise<any[]>][] = [
    ['offlineManager(v11 TileStore)', () => Mapbox.offlineManager.getPacks()],
    ['offlineManagerLegacy(v10 방식)', () => Mapbox.offlineManagerLegacy.getPacks()],
  ];
  for (const [api, load] of sources) {
    try {
      const packs = await load();
      if (!packs.length) result.push({ api, name: '(없음)', bounds: '', status: '' });
      for (const pack of packs) {
        let status = '';
        try {
          status = clip(await pack.status(), 300);
        } catch (error) {
          status = `status 오류: ${String(error)}`;
        }
        result.push({ api, name: String(pack.name), bounds: String(pack.bounds), status });
      }
    } catch (error) {
      result.push({ api, name: '오류', bounds: '', status: String(error) });
    }
  }
  return result;
}

function centerOf(bounds: string): [number, number] | null {
  // v11 pack.bounds는 "neLng,neLat,swLng,swLat" 숫자 목록으로 온다(2026-11-18 기기에서 확인).
  const nums = bounds.split(',').map(Number);
  if (nums.length === 4 && nums.every((n) => Number.isFinite(n))) {
    return [(nums[0] + nums[2]) / 2, (nums[1] + nums[3]) / 2];
  }
  try {
    const parsed = JSON.parse(bounds);
    const coords: number[][] = parsed?.coordinates?.[0] ?? parsed?.geometry?.coordinates?.[0] ?? parsed;
    const flat = (Array.isArray(coords[0]) ? coords : [coords]) as unknown as number[][];
    const lngs = flat.map((c) => Number(c[0]));
    const lats = flat.map((c) => Number(c[1]));
    return [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2];
  } catch {
    return null;
  }
}

export default function App() {
  const [dbLines, setDbLines] = useState<string[]>(['읽는 중…']);
  const [packs, setPacks] = useState<PackInfo[]>([]);
  const [storage, setStorage] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);

  const load = useCallback(async () => {
    setDbLines(await readDatabase().catch((e) => [`DB 오류: ${String(e)}`]));
    setPacks(await readPacks());
    const docs = FileSystem.documentDirectory ?? '';
    const lib = docs.replace(/Documents\/$/, 'Library/');
    const sizes = [
      ...(await listSizes(docs, 'Documents').catch((e) => [`Documents 오류: ${e}`])),
      ...(await listSizes(`${lib}Application%20Support/`, 'AppSupport').catch((e) => [`AppSupport 오류: ${e}`])),
      ...(await listSizes(`${lib}Caches/`, 'Caches').catch((e) => [`Caches 오류: ${e}`])),
    ];
    setStorage(sizes);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const firstBounds = packs.find((p) => p.bounds)?.bounds;
  const center = firstBounds ? centerOf(firstBounds) : null;
  const report = [
    '== DB ==',
    ...dbLines,
    '== 지도 pack ==',
    ...packs.map((p) => `${p.api} | ${p.name} | ${p.bounds} | ${p.status}`),
    '== 저장 공간 ==',
    ...storage,
  ].join('\n');

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 8 }}>
        <Button title='다시 읽기' onPress={load} />
        <Button title='결과 공유' onPress={() => Share.share({ message: report })} />
        <Button title={showMap ? '지도 닫기' : '지도 보기'} onPress={() => setShowMap((v) => !v)} />
      </View>
      {showMap ? (
        <View style={{ flex: 1 }}>
          <Text style={{ padding: 8 }}>{center ? `중심 ${center.map((n) => n.toFixed(4)).join(', ')}` : '받은 pack의 범위를 찾지 못했다'}</Text>
          <Mapbox.MapView style={{ flex: 1 }} styleURL='mapbox://styles/mapbox/streets-v11'>
            {center ? <Mapbox.Camera centerCoordinate={center} zoomLevel={13} animationDuration={0} /> : null}
          </Mapbox.MapView>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 12 }}>
          <Text selectable style={{ fontFamily: 'Menlo', fontSize: 11 }}>
            {report}
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
