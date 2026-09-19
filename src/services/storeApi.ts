const BASE_URL =
  'https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInDong';

export type StoreCountResult = {
  areaName: string;
  storeCount: number;
};

export interface NearbyStore {
  name: string;
  address: string;
  lat: number;
  lng: number;
};

/**
 * =====================================================
 * 간단한 메모리 캐시
 * =====================================================
 *
 * 같은 앱 실행 중
 * 같은 동 + 같은 업종 목록을 다시 조회하면
 * API를 재호출하지 않고 저장된 결과 사용
 */
const storeListCache =
  new Map<
    string,
    NearbyStore[]
  >();

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
 * 동 단위 동일 업종 점포 수
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
    process.env.EXPO_PUBLIC_STORE_API_KEY;

  if (!serviceKey) {
    throw new Error(
      '공공데이터 API 키를 불러오지 못했습니다.',
    );
  }

  let url =
    BASE_URL +
    `?serviceKey=${serviceKey}` +
    '&pageNo=1' +
    '&numOfRows=1' +
    '&divId=adongCd' +
    `&key=${adongCode}` +
    `&indsLclsCd=${lclsCode}` +
    '&type=json';

  if (mclsCode) {
    url +=
      `&indsMclsCd=${mclsCode}`;
  }

  if (sclsCode) {
    url +=
      `&indsSclsCd=${sclsCode}`;
  }

  console.log(
    '점포 수 API 요청:',
    url,
  );

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `${areaName} 상가정보 요청 실패: ${response.status}`,
    );
  }

  const data =
    await response.json();

  if (
    data?.header?.resultCode !==
    '00'
  ) {
    throw new Error(
      `${areaName}: ${
        data?.header?.resultMsg ??
        'API 오류'
      }`,
    );
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
 * API item -> NearbyStore 변환
 * =====================================================
 */
function convertStoreItem(
  item: any,
): NearbyStore | null {
  /**
   * API 응답 필드명이 조금 다를 경우를 대비
   */
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
    console.warn(
      '좌표 없는 점포:',
      item,
    );

    return null;
  }

  return {
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
  };
}

/**
 * =====================================================
 * 점포 목록 1페이지 조회
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
    process.env.EXPO_PUBLIC_STORE_API_KEY;

  if (!serviceKey) {
    throw new Error(
      '공공데이터 API 키를 불러오지 못했습니다.',
    );
  }

  let url =
    BASE_URL +
    `?serviceKey=${serviceKey}` +
    `&pageNo=${pageNo}` +
    `&numOfRows=${numOfRows}` +
    '&divId=adongCd' +
    `&key=${adongCode}` +
    `&indsLclsCd=${lclsCode}` +
    '&type=json';

  if (mclsCode) {
    url +=
      `&indsMclsCd=${mclsCode}`;
  }

  if (sclsCode) {
    url +=
      `&indsSclsCd=${sclsCode}`;
  }

  console.log(
    `점포 목록 API 요청 page=${pageNo}`,
  );

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `점포 목록 조회 실패: ${response.status}`,
    );
  }

  const data =
    await response.json();

  if (
    data?.header?.resultCode !==
    '00'
  ) {
    throw new Error(
      data?.header?.resultMsg ??
        '점포 목록 API 오류',
    );
  }

  /**
   * API 응답 형태가
   *
   * body.items.item
   * 또는
   * body.items
   *
   * 둘 다 처리
   */
  const rawItems =
    data?.body?.items?.item ??
    data?.body?.items ??
    [];

  let list: any[] = [];

  if (
    Array.isArray(rawItems)
  ) {
    list = rawItems;
  } else if (
    rawItems &&
    typeof rawItems ===
      'object'
  ) {
    list = [rawItems];
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
        data?.body
          ?.totalCount ??
          list.length,
      ),
  };
}

/**
 * =====================================================
 * 실제 점포 목록 조회
 * =====================================================
 */
export async function getStoreList(
  adongCode: string,
  lclsCode: string,
  mclsCode?: string,
  sclsCode?: string,
  maxItems?: number,
): Promise<NearbyStore[]> {
  /**
   * 상세화면처럼 일부만 필요하면
   * 캐시를 사용하지 않고 필요한 만큼만 조회
   */
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

  /**
   * 반경 분석처럼
   * 동 전체 목록이 필요한 경우 캐시 사용
   */
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
    console.log(
      '점포 목록 캐시 사용:',
      cacheKey,
    );

    return cached;
  }

  const PAGE_SIZE =
    1000;

  const firstPage =
    await getStoreListPage(
      adongCode,
      lclsCode,
      mclsCode,
      sclsCode,
      1,
      PAGE_SIZE,
    );

  const allStores: NearbyStore[] =
    [
      ...firstPage.stores,
    ];

  const totalCount =
    firstPage.totalCount;

  const totalPages =
    Math.ceil(
      totalCount /
        PAGE_SIZE,
    );

  for (
    let page = 2;
    page <=
    totalPages;
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

  console.log(
    '전체 점포 수:',
    allStores.length,
  );

  /**
   * 같은 앱 실행 중
   * 다시 사용할 수 있도록 저장
   */
  storeListCache.set(
    cacheKey,
    allStores,
  );

  return allStores;
}

/**
 * =====================================================
 * 좌표 두 개 사이 거리 계산
 * =====================================================
 *
 * Haversine 공식
 *
 * 반환값:
 * meter
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
    (degree *
      Math.PI) /
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
 * 지정 반경 내 실제 점포 목록
 * =====================================================
 */
export async function getStoresInRadius(
  centerLat: number,
  centerLng: number,
  radius: number,

  adongCode: string,

  lclsCode: string,
  mclsCode?: string,
  sclsCode?: string,
): Promise<NearbyStore[]> {
  const stores =
    await getStoreList(
      adongCode,
      lclsCode,
      mclsCode,
      sclsCode,
    );

  const nearbyStores =
    stores.filter(
      (
        store,
      ) => {
        const distance =
          getDistanceInMeters(
            centerLat,
            centerLng,

            store.lat,
            store.lng,
          );

        return (
          distance <=
          radius
        );
      },
    );

  console.log(
    `전체 점포: ${stores.length}`,
  );

  console.log(
    `반경 ${radius}m 내 점포: ${nearbyStores.length}`,
  );

  return nearbyStores;
}

/**
 * =====================================================
 * 지정 반경 내 점포 수
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
 *
 * 개발 중 데이터가 갱신됐거나
 * 강제로 재조회하고 싶을 때 사용 가능
 */
export function clearStoreListCache() {
  storeListCache.clear();

  console.log(
    '점포 목록 캐시 초기화 완료',
  );
}