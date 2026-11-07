// scripts/importAcademies.mjs
// NEIS 학원교습소정보(세종)를 받아 Supabase academies 테이블에 저장합니다.
// 내 PC 터미널에서만 실행하세요. (키를 앱 코드에 넣지 않습니다)
//
// 실행 전 PowerShell에서 (한 줄씩):
//   $env:NEIS_KEY = "NEIS 인증키"
//   $env:SUPABASE_URL = "https://xxxx.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY = "service_role 키"
//   node scripts/importAcademies.mjs

const NEIS_KEY = process.env.NEIS_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!NEIS_KEY || !SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    'NEIS_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 환경변수를 먼저 설정해주세요.',
  );
  process.exit(1);
}

const SEJONG_CODE = 'I10';
const PAGE_SIZE = 1000;

function clean(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

// "(대평동, 해들마을6단지 ...)", "(산울동,산울마을6단지)" 처럼
// 괄호 안 첫 항목이 동/읍/면이면 그 이름을 뽑습니다.
function extractDong(detail) {
  if (!detail) return null;
  const match = String(detail).match(/\(\s*([가-힣0-9]+(?:동|읍|면))\s*[,)]/);
  return match ? match[1] : null;
}

function toDate(value) {
  const text = clean(value);
  if (!text || !/^\d{8}$/.test(text)) return null;
  return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
}

function toRecord(row) {
  return {
    id: clean(row.ACA_ASNUM),
    name: clean(row.ACA_NM) ?? '(이름 없음)',
    kind: clean(row.ACA_INSTI_SC_NM),
    status: clean(row.REG_STTUS_NM),
    realm: clean(row.REALM_SC_NM),
    course_group: clean(row.LE_ORD_NM),
    course_list: clean(row.LE_CRSE_LIST_NM),
    capacity: Number.isFinite(Number(row.TOFOR_SMTOT))
      ? Number(row.TOFOR_SMTOT)
      : null,
    instant_capacity: Number.isFinite(Number(row.DTM_RCPTN_ABLTY_NMPR_SMTOT))
      ? Number(row.DTM_RCPTN_ABLTY_NMPR_SMTOT)
      : null,
    address: clean(row.FA_RDNMA),
    address_detail: clean(row.FA_RDNDA),
    zipcode: clean(row.FA_RDNZC),
    dong: extractDong(row.FA_RDNDA),
    established_at: toDate(row.ESTBL_YMD),
  };
}

async function fetchPage(pIndex) {
  const url =
    'https://open.neis.go.kr/hub/acaInsTiInfo' +
    `?KEY=${encodeURIComponent(NEIS_KEY)}` +
    `&Type=json&pIndex=${pIndex}&pSize=${PAGE_SIZE}` +
    `&ATPT_OFCDC_SC_CODE=${SEJONG_CODE}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`NEIS 요청 실패 (HTTP ${response.status})`);
  }

  const data = await response.json();
  const block = data.acaInsTiInfo;

  if (!Array.isArray(block)) {
    const message = data?.RESULT?.MESSAGE ?? JSON.stringify(data).slice(0, 200);
    throw new Error(`NEIS 응답 오류: ${message}`);
  }

  const total = block[0]?.head?.[0]?.list_total_count ?? 0;
  const rows = block[1]?.row ?? [];

  return { total, rows };
}

async function upsert(records) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/academies?on_conflict=id`,
    {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(records),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Supabase 저장 실패 (HTTP ${response.status}): ${await response.text()}`,
    );
  }
}

async function main() {
  const first = await fetchPage(1);
  console.log(`세종 학원·교습소 전체 ${first.total}건`);

  const pages = Math.ceil(first.total / PAGE_SIZE);
  const all = [...first.rows];

  for (let page = 2; page <= pages; page++) {
    const next = await fetchPage(page);
    all.push(...next.rows);
    console.log(`${page}/${pages} 페이지 수신`);
  }

  // 같은 id가 중복으로 오면 마지막 것만 남깁니다.
  const byId = new Map();
  for (const row of all) {
    const record = toRecord(row);
    if (record.id) byId.set(record.id, record);
  }
  const records = [...byId.values()];

  const withDong = records.filter(record => record.dong).length;
  console.log(
    `저장 대상 ${records.length}건 (동 추출 성공 ${withDong}건, 실패 ${records.length - withDong}건)`,
  );

  for (let i = 0; i < records.length; i += 500) {
    await upsert(records.slice(i, i + 500));
    console.log(`${Math.min(i + 500, records.length)}/${records.length} 저장`);
  }

  console.log('완료');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
