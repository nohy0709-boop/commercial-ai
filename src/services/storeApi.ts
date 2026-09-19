const DONG_BASE_URL =
  'https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInDong';

const RADIUS_BASE_URL =
  'https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInRadius';

const RECTANGLE_BASE_URL =
  'https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInRectangle';

export type StoreCountResult = {
  areaName: string;
  storeCount: number;
};

export interface NearbyStore {
  id?: string;

  name: string;

  address: string;

  lat: number;

  lng: number;

  lclsCode?: string;
  lclsName?: string;

  mclsCode?: string;
  mclsName?: string;

  sclsCode?: string;
  sclsName?: string;

  buildingName?: string;

  floorNo?: string;
}

export interface StoreMapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

/**
 * =====================================================
 * 캐시
 * =====================================================
 */
const storeListCache =
  new Map<
    string,
    NearbyStore[]
  >();

const radiusStoreCache =
  new Map<
    string,
    NearbyStore[]
  >();

const rectangleStoreCache =
  new Map<
    string,
    NearbyStore[]
  >();

/**
 * =====================================================
 * API KEY
 * =====================================================
 */
function getServiceKey(): string {
  const serviceKey =
    process.env.EXPO_PUBLIC_STORE_API_KEY;

  if (!serviceKey) {
    throw new Error(
      '상가정보 공공데이터 API 키를 불러오지 못했습니다.',
    );
  }

  return serviceKey.trim();
}

/**
 * =====================================================
 * item → NearbyStore
 * =====================================================
 */
function convertStoreItem(
  item: any,
): NearbyStore | null {
  const lat =
    Number(
      item?.lat ??
        item?.latitude ??
        item?.y,
    );

  const lng =
    Number(
      item?.lon ??
        item?.lng ??
        item?.longitude ??
        item?.x,
    );

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return null;
  }

  return {
    id:
      item?.bizesId ??
      undefined,

    name:
      item?.bizesNm ??
      item?.storeNm ??
      item?.name ??
      '이름 정보 없음',

    address:
      item?.rdnmAdr ??
      item?.lnoAdr ??
      item?.address ??
      '주소 정보 없음',

    lat,
    lng,

    lclsCode:
      item?.indsLclsCd ??
      undefined,

    lclsName:
      item?.indsLclsNm ??
      undefined,

    mclsCode:
      item?.indsMclsCd ??
      undefined,

    mclsName:
      item?.indsMclsNm ??
      undefined,

    sclsCode:
      item?.indsSclsCd ??
      undefined,

    sclsName:
      item?.indsSclsNm ??
      undefined,

    buildingName:
      item?.bldNm ??
      undefined,

    floorNo:
      item?.flrNo ??
      undefined,
  };
}

/**
 * =====================================================
 * API 결과 코드
 * =====================================================
 */
function checkApiResult(
  data: any,
): 'success' | 'nodata' {
  const resultCode =
    String(
      data?.header?.resultCode ??
        '',
    );

  const resultMsg =
    String(
      data?.header?.resultMsg ??
        '',
    );

  if (
    resultCode === '00'
  ) {
    return 'success';
  }

  const upperMessage =
    resultMsg.toUpperCase();

  if (
    upperMessage.includes(
      'NODATA',
    ) ||
    upperMessage.includes(
      'NO DATA',
    )
  ) {
    return 'nodata';
  }

  throw new Error(
    resultMsg ||
      `상가정보 API 오류 (${resultCode})`,
  );
}

/**
 * =====================================================
 * items 파싱
 * =====================================================
 */
function parseStoreItems(
  data: any,
): {
  stores: NearbyStore[];
  totalCount: number;
} {
  const rawItems =
    data?.body?.items?.item ??
    data?.body?.items ??
    [];

  let list: any[] =
    [];

  if (
    Array.isArray(
      rawItems,
    )
  ) {
    list =
      rawItems;
  } else if (
    rawItems &&
    typeof rawItems ===
      'object'
  ) {
    list = [
      rawItems,
    ];
  }

  const stores =
    list
      .map(
        convertStoreItem,
      )
      .filter(
        (
          store,
        ): store is NearbyStore =>
          store !== null,
      );

  return {
    stores,

    totalCount:
      Number(
        data?.body?.totalCount ??
          stores.length,
      ),
  };
}

/**
 * =====================================================
 * 동 단위 API 캐시키
 * =====================================================
 */
function makeStoreCacheKey(
  adongCode: string,
  lclsCode: string,
  mclsCode?: string,
  sclsCode?: string,
) {
  return [
    adongCode,
    lclsCode,
    mclsCode ?? '',
    sclsCode ?? '',
  ].join('|');
}

/**
 * =====================================================
 * 반경 API 캐시키
 * =====================================================
 */
function makeRadiusCacheKey(
  centerLat: number,
  centerLng: number,
  radius: number,
  lclsCode: string,
  mclsCode?: string,
  sclsCode?: string,
) {
  return [
    centerLat.toFixed(5),
    centerLng.toFixed(5),
    radius,
    lclsCode,
    mclsCode ?? '',
    sclsCode ?? '',
  ].join('|');
}

/**
 * =====================================================
 * 지도 영역 API 캐시키
 *
 * 너무 세밀하게 저장하면 지도를 조금 움직일 때마다
 * 새 캐시가 만들어지므로 4자리까지만 사용
 * =====================================================
 */
function makeRectangleCacheKey(
  bounds: StoreMapBounds,
) {
  return [
    bounds.south.toFixed(4),
    bounds.west.toFixed(4),
    bounds.north.toFixed(4),
    bounds.east.toFixed(4),
  ].join('|');
}

/**
 * =====================================================
 * 동 단위 점포 수
 * 기존 상권분석 코드 호환용
 * =====================================================
 */
export async function getStoreCount(
  areaName: string,
  adongCode: string,
  lclsCode: string,
  mclsCode?: string,
  sclsCode?: string,
): Promise<StoreCountResult> {
  const serviceKey =
    getServiceKey();

  const params =
    new URLSearchParams();

  params.set(
    'pageNo',
    '1',
  );

  params.set(
    'numOfRows',
    '1',
  );

  params.set(
    'divId',
    'adongCd',
  );

  params.set(
    'key',
    adongCode,
  );

  params.set(
    'indsLclsCd',
    lclsCode,
  );

  params.set(
    'type',
    'json',
  );

  if (mclsCode) {
    params.set(
      'indsMclsCd',
      mclsCode,
    );
  }

  if (sclsCode) {
    params.set(
      'indsSclsCd',
      sclsCode,
    );
  }

  const url =
    `${DONG_BASE_URL}` +
    `?serviceKey=${serviceKey}` +
    `&${params.toString()}`;

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `${areaName} 상가정보 요청 실패: ${response.status}`,
    );
  }

  const data =
    await response.json();

  const status =
    checkApiResult(
      data,
    );

  if (
    status === 'nodata'
  ) {
    return {
      areaName,
      storeCount: 0,
    };
  }

  return {
    areaName,

    storeCount:
      Number(
        data?.body?.totalCount ??
          0,
      ),
  };
}

/**
 * =====================================================
 * 동 목록 한 페이지
 * =====================================================
 */
async function getStoreListPage(
  adongCode: string,
  lclsCode: string,
  mclsCode: string | undefined,
  sclsCode: string | undefined,
  pageNo: number,
  numOfRows: number,
): Promise<{
  stores: NearbyStore[];
  totalCount: number;
}> {
  const serviceKey =
    getServiceKey();

  const params =
    new URLSearchParams();

  params.set(
    'pageNo',
    String(pageNo),
  );

  params.set(
    'numOfRows',
    String(numOfRows),
  );

  params.set(
    'divId',
    'adongCd',
  );

  params.set(
    'key',
    adongCode,
  );

  params.set(
    'indsLclsCd',
    lclsCode,
  );

  params.set(
    'type',
    'json',
  );

  if (mclsCode) {
    params.set(
      'indsMclsCd',
      mclsCode,
    );
  }

  if (sclsCode) {
    params.set(
      'indsSclsCd',
      sclsCode,
    );
  }

  const url =
    `${DONG_BASE_URL}` +
    `?serviceKey=${serviceKey}` +
    `&${params.toString()}`;

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `점포 목록 조회 실패: ${response.status}`,
    );
  }

  const data =
    await response.json();

  const status =
    checkApiResult(
      data,
    );

  if (
    status === 'nodata'
  ) {
    return {
      stores: [],
      totalCount: 0,
    };
  }

  return parseStoreItems(
    data,
  );
}

/**
 * =====================================================
 * 기존 동 전체 점포 목록
 * =====================================================
 */
export async function getStoreList(
  adongCode: string,
  lclsCode: string,
  mclsCode?: string,
  sclsCode?: string,
  maxItems?: number,
): Promise<NearbyStore[]> {
  if (maxItems) {
    const result =
      await getStoreListPage(
        adongCode,
        lclsCode,
        mclsCode,
        sclsCode,
        1,
        maxItems,
      );

    return result.stores.slice(
      0,
      maxItems,
    );
  }

  const cacheKey =
    makeStoreCacheKey(
      adongCode,
      lclsCode,
      mclsCode,
      sclsCode,
    );

  const cached =
    storeListCache.get(
      cacheKey,
    );

  if (cached) {
    return cached;
  }

  const PAGE_SIZE =
    500;

  const firstPage =
    await getStoreListPage(
      adongCode,
      lclsCode,
      mclsCode,
      sclsCode,
      1,
      PAGE_SIZE,
    );

  const allStores = [
    ...firstPage.stores,
  ];

  const totalPages =
    Math.ceil(
      firstPage.totalCount /
        PAGE_SIZE,
    );

  for (
    let page = 2;
    page <= totalPages;
    page++
  ) {
    const result =
      await getStoreListPage(
        adongCode,
        lclsCode,
        mclsCode,
        sclsCode,
        page,
        PAGE_SIZE,
      );

    allStores.push(
      ...result.stores,
    );
  }

  storeListCache.set(
    cacheKey,
    allStores,
  );

  return allStores;
}

/**
 * =====================================================
 * 반경 목록 한 페이지
 * 기존 상권분석 호환용
 * =====================================================
 */
async function getStoreRadiusPage(
  centerLat: number,
  centerLng: number,
  radius: number,

  lclsCode: string,
  mclsCode: string | undefined,
  sclsCode: string | undefined,

  pageNo: number,
  numOfRows: number,
): Promise<{
  stores: NearbyStore[];
  totalCount: number;
}> {
  const serviceKey =
    getServiceKey();

  const params =
    new URLSearchParams();

  params.set(
    'pageNo',
    String(pageNo),
  );

  params.set(
    'numOfRows',
    String(numOfRows),
  );

  params.set(
    'radius',
    String(radius),
  );

  /**
   * cx = 경도
   * cy = 위도
   */
  params.set(
    'cx',
    String(centerLng),
  );

  params.set(
    'cy',
    String(centerLat),
  );

  params.set(
    'indsLclsCd',
    lclsCode,
  );

  params.set(
    'type',
    'json',
  );

  if (mclsCode) {
    params.set(
      'indsMclsCd',
      mclsCode,
    );
  }

  if (sclsCode) {
    params.set(
      'indsSclsCd',
      sclsCode,
    );
  }

  const url =
    `${RADIUS_BASE_URL}` +
    `?serviceKey=${serviceKey}` +
    `&${params.toString()}`;

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `반경 점포 조회 실패: ${response.status}`,
    );
  }

  const data =
    await response.json();

  const status =
    checkApiResult(
      data,
    );

  if (
    status === 'nodata'
  ) {
    return {
      stores: [],
      totalCount: 0,
    };
  }

  return parseStoreItems(
    data,
  );
}

/**
 * =====================================================
 * 반경 점포
 * 기존 상권분석에서 그대로 사용
 * =====================================================
 */
export async function getStoresInRadius(
  centerLat: number,
  centerLng: number,
  radius: number,

  _adongCode: string,

  lclsCode: string,
  mclsCode?: string,
  sclsCode?: string,
): Promise<NearbyStore[]> {
  const cacheKey =
    makeRadiusCacheKey(
      centerLat,
      centerLng,
      radius,
      lclsCode,
      mclsCode,
      sclsCode,
    );

  const cached =
    radiusStoreCache.get(
      cacheKey,
    );

  if (cached) {
    return cached;
  }

  const PAGE_SIZE =
    200;

  const firstPage =
    await getStoreRadiusPage(
      centerLat,
      centerLng,
      radius,
      lclsCode,
      mclsCode,
      sclsCode,
      1,
      PAGE_SIZE,
    );

  const allStores = [
    ...firstPage.stores,
  ];

  const totalPages =
    Math.ceil(
      firstPage.totalCount /
        PAGE_SIZE,
    );

  const maxPages =
    Math.min(
      totalPages,
      5,
    );

  for (
    let page = 2;
    page <= maxPages;
    page++
  ) {
    const result =
      await getStoreRadiusPage(
        centerLat,
        centerLng,
        radius,
        lclsCode,
        mclsCode,
        sclsCode,
        page,
        PAGE_SIZE,
      );

    allStores.push(
      ...result.stores,
    );
  }

  radiusStoreCache.set(
    cacheKey,
    allStores,
  );

  return allStores;
}

/**
 * =====================================================
 * ★ 현재 지도 화면 점포 조회
 *
 * 업종코드를 넣지 않음.
 * 즉 음식점 / 카페 / 편의점 / 미용실 등
 * 화면 안의 전체 점포를 조회.
 * =====================================================
 */
export async function getStoresInRectangle(
  bounds: StoreMapBounds,
): Promise<NearbyStore[]> {
  const cacheKey =
    makeRectangleCacheKey(
      bounds,
    );

  const cached =
    rectangleStoreCache.get(
      cacheKey,
    );

  if (cached) {
    console.log(
      '🗺️ 지도 점포 캐시 사용:',
      cached.length,
    );

    return cached;
  }

  const serviceKey =
    getServiceKey();

  const PAGE_SIZE =
    500;

  /**
   * 지도 하나에 수천 개 DOM을 만들 필요는 없어서
   * 최대 1,500개까지만 가져옴.
   */
  const MAX_PAGES =
    3;

  const allStores:
    NearbyStore[] = [];

  let totalCount =
    0;

  for (
    let page = 1;
    page <= MAX_PAGES;
    page++
  ) {
    const params =
      new URLSearchParams();

    params.set(
      'pageNo',
      String(page),
    );

    params.set(
      'numOfRows',
      String(PAGE_SIZE),
    );

    params.set(
      'minx',
      String(bounds.west),
    );

    params.set(
      'miny',
      String(bounds.south),
    );

    params.set(
      'maxx',
      String(bounds.east),
    );

    params.set(
      'maxy',
      String(bounds.north),
    );

    params.set(
      'type',
      'json',
    );

    const url =
      `${RECTANGLE_BASE_URL}` +
      `?serviceKey=${serviceKey}` +
      `&${params.toString()}`;

    console.log(
      '🗺️ 현재 지도 점포 조회:',
      {
        page,
        bounds,
      },
    );

    const response =
      await fetch(url);

    if (!response.ok) {
      const body =
        await response.text();

      console.error(
        '❌ 지도 영역 점포 조회 실패:',
        {
          status:
            response.status,

          body,
        },
      );

      throw new Error(
        `지도 점포 조회 실패: ${response.status}`,
      );
    }

    const rawText =
      await response.text();

    if (
      !rawText.trim()
    ) {
      break;
    }

    let data: any;

    try {
      data =
        JSON.parse(
          rawText,
        );
    } catch {
      console.error(
        '❌ 지도 점포 JSON 변환 실패',
        rawText.slice(
          0,
          300,
        ),
      );

      throw new Error(
        '지도 점포 데이터를 읽지 못했습니다.',
      );
    }

    const status =
      checkApiResult(
        data,
      );

    if (
      status === 'nodata'
    ) {
      break;
    }

    const parsed =
      parseStoreItems(
        data,
      );

    if (
      page === 1
    ) {
      totalCount =
        parsed.totalCount;
    }

    allStores.push(
      ...parsed.stores,
    );

    if (
      allStores.length >=
        totalCount ||
      parsed.stores.length <
        PAGE_SIZE
    ) {
      break;
    }
  }

  /**
   * 같은 업소가 중복될 가능성 대비
   */
  const uniqueMap =
    new Map<
      string,
      NearbyStore
    >();

  allStores.forEach(
    (
      store,
      index,
    ) => {
      const key =
        store.id ??
        `${store.name}-${store.lat}-${store.lng}-${index}`;

      if (
        !uniqueMap.has(
          key,
        )
      ) {
        uniqueMap.set(
          key,
          store,
        );
      }
    },
  );

  const uniqueStores =
    Array.from(
      uniqueMap.values(),
    );

  console.log(
    '✅ 현재 화면 점포:',
    {
      apiTotal:
        totalCount,

      loaded:
        uniqueStores.length,
    },
  );

  rectangleStoreCache.set(
    cacheKey,
    uniqueStores,
  );

  return uniqueStores;
}

/**
 * =====================================================
 * 거리 계산
 * =====================================================
 */
export function getDistanceInMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const EARTH_RADIUS =
    6371000;

  const toRad = (
    degree: number,
  ) =>
    (
      degree *
      Math.PI
    ) /
    180;

  const dLat =
    toRad(
      lat2 - lat1,
    );

  const dLng =
    toRad(
      lng2 - lng1,
    );

  const a =
    Math.sin(
      dLat / 2,
    ) *
      Math.sin(
        dLat / 2,
      ) +
    Math.cos(
      toRad(lat1),
    ) *
      Math.cos(
        toRad(lat2),
      ) *
      Math.sin(
        dLng / 2,
      ) *
      Math.sin(
        dLng / 2,
      );

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(
        1 - a,
      ),
    );

  return (
    EARTH_RADIUS *
    c
  );
}

/**
 * =====================================================
 * 반경 점포 수
 * =====================================================
 */
export async function getStoreCountInRadius(
  centerLat: number,
  centerLng: number,
  radius: number,

  adongCode: string,

  lclsCode: string,
  mclsCode?: string,
  sclsCode?: string,
): Promise<number> {
  const stores =
    await getStoresInRadius(
      centerLat,
      centerLng,
      radius,

      adongCode,

      lclsCode,
      mclsCode,
      sclsCode,
    );

  return stores.length;
}

/**
 * =====================================================
 * 캐시 초기화
 * =====================================================
 */
export function clearStoreListCache() {
  storeListCache.clear();

  radiusStoreCache.clear();

  rectangleStoreCache.clear();

  console.log(
    '✅ 점포 캐시 초기화 완료',
  );
}