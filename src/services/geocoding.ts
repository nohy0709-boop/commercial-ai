const KAKAO_REST_API_KEY =
  process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DongInfo {
  dongName: string;
  dongCode: string;
}

export interface PlaceSearchResult {
  name: string;
  address: string;
  roadAddress: string;
  lat: number;
  lng: number;
}

function getApiKey(): string {
  if (!KAKAO_REST_API_KEY) {
    throw new Error(
      '카카오 API 키를 불러오지 못했습니다. .env 파일을 확인해주세요.',
    );
  }

  return KAKAO_REST_API_KEY;
}

/**
 * 주소 검색
 */
export async function searchAddress(
  query: string,
): Promise<Coordinates | null> {
  const apiKey = getApiKey();

  const url =
    `https://dapi.kakao.com/v2/local/search/address.json` +
    `?query=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `주소 검색 요청 실패: ${response.status}`,
    );
  }

  const data = await response.json();
  const first = data.documents?.[0];

  if (!first) {
    return null;
  }

  return {
    lat: Number(first.y),
    lng: Number(first.x),
  };
}

/**
 * 키워드/장소명 검색
 *
 * 예)
 * 나성동
 * 정부세종청사
 * 나성동 주민센터
 */
export async function searchKeyword(
  query: string,
): Promise<PlaceSearchResult | null> {
  const apiKey = getApiKey();

  const url =
    `https://dapi.kakao.com/v2/local/search/keyword.json` +
    `?query=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `키워드 검색 요청 실패: ${response.status}`,
    );
  }

  const data = await response.json();
  const first = data.documents?.[0];

  if (!first) {
    return null;
  }

  return {
    name: first.place_name,
    address: first.address_name,
    roadAddress: first.road_address_name,
    lat: Number(first.y),
    lng: Number(first.x),
  };
}

/**
 * 주소 검색 → 실패하면 키워드 검색
 */
export async function searchLocation(
  query: string,
): Promise<Coordinates | null> {
  const addressResult =
    await searchAddress(query);

  if (addressResult) {
    return addressResult;
  }

  const keywordResult =
    await searchKeyword(query);

  if (!keywordResult) {
    return null;
  }

  return {
    lat: keywordResult.lat,
    lng: keywordResult.lng,
  };
}

/**
 * 좌표 → 행정동
 */
export async function getDongFromCoords(
  lat: number,
  lng: number,
): Promise<DongInfo | null> {
  const apiKey = getApiKey();

  const url =
    `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json` +
    `?x=${lng}&y=${lat}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `행정구역 조회 요청 실패: ${response.status}`,
    );
  }

  const data = await response.json();

  const dong = data.documents?.find(
    (item: { region_type: string }) =>
      item.region_type === 'H',
  );

  if (!dong) {
    return null;
  }

  return {
    dongName: dong.region_3depth_name,
    dongCode: dong.code,
  };
}