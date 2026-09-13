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
    'API 요청 URL:',
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

  console.log(
    'API 응답:',
    data,
  );

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
   * 공공데이터 응답 버전에 따라
   * 좌표 필드명이 달라질 가능성을 대비
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

  /**
   * 좌표가 정상 숫자가 아니면 제외
   */
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
      item?.rdnmAdr ||
      item?.lnoAdr ||
      item?.address ||
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

  /**
   * serviceKey는 직접 URL에 붙임.
   *
   * URLSearchParams를 사용할 경우
   * 이미 인코딩된 serviceKey가
   * %252F 등의 형태로 이중 인코딩될 수 있음.
   */
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
    '점포 목록 API 요청:',
    url,
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

  console.log(
    '점포 목록 API 전체 응답:',
    data,
  );

  console.log(
    '점포 목록 body:',
    data?.body,
  );

  console.log(
    '점포 목록 items:',
    data?.body?.items,
  );

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
   *
   * 또는
   *
   * body.items
   *
   * 둘 중 어느 형태여도 처리
   */
  const rawItems =
    data?.body?.items?.item ??
    data?.body?.items ??
    [];

  let list: any[] = [];

  if (
    Array.isArray(rawItems)
  ) {
    list =
      rawItems;
  } else if (
    rawItems &&
    typeof rawItems ===
      'object'
  ) {
    list =
      [rawItems];
  }

  console.log(
    '실제 점포 item 개수:',
    list.length,
  );

  if (
    list.length > 0
  ) {
    console.log(
      '첫 번째 점포 원본:',
      list[0],
    );
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

  console.log(
    '좌표 변환 완료 점포 수:',
    stores.length,
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
 *
 * maxItems를 지정하지 않으면
 * 해당 동의 점포 목록을 페이지네이션해서 전부 가져옴.
 *
 * maxItems = 10
 * → 상세 화면에서 10개만 표시 가능.
 *
 * 반경 분석에서는 maxItems를 전달하지 않음.
 */
export async function getStoreList(
  adongCode: string,
  lclsCode: string,
  mclsCode?: string,
  sclsCode?: string,
  maxItems?: number,
): Promise<NearbyStore[]> {
  /**
   * API 한 페이지 최대 조회량
   */
  const PAGE_SIZE =
    1000;

  /**
   * 상세화면처럼 10개만 필요하면
   * 처음부터 10개만 요청
   */
  const firstPageSize =
    maxItems &&
    maxItems <
      PAGE_SIZE
      ? maxItems
      : PAGE_SIZE;

  const firstPage =
    await getStoreListPage(
      adongCode,
      lclsCode,
      mclsCode,
      sclsCode,
      1,
      firstPageSize,
    );

  /**
   * maxItems가 있으면
   * 첫 페이지 결과만 사용
   */
  if (maxItems) {
    return firstPage.stores.slice(
      0,
      maxItems,
    );
  }

  /**
   * 반경 분석용:
   * 전체 점포 목록 필요
   */
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

  return allStores;
}

/**
 * =====================================================
 * 좌표 두 개 사이 거리
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
 *
 * 예:
 * 300m
 * 500m
 * 1000m
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
  /**
   * 반경 분석에서는
   * 동 전체 목록을 받아야 하므로
   * maxItems를 전달하지 않음
   */
  const stores =
    await getStoreList(
      adongCode,
      lclsCode,
      mclsCode,
      sclsCode,
    );

  const nearbyStores =
    stores.filter(
      store => {
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
    `반경 ${radius}m 내 점포:`,
    nearbyStores.length,
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