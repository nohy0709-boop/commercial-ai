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

export interface RegionInfo {
  /**
   * 행정동
   */
  administrativeDongName: string;
  administrativeDongCode: string;

  /**
   * 법정동
   */
  legalDongName: string;
  legalDongCode: string;
}

export interface PlaceSearchResult {
  name: string;
  address: string;
  roadAddress: string;
  lat: number;
  lng: number;
}

export interface AddressInfo {
  /**
   * 지번주소
   */
  address: string;

  /**
   * 도로명주소
   */
  roadAddress: string;

  /**
   * 건물명
   */
  buildingName: string;

  /**
   * 우편번호
   */
  zoneNo: string;

  /**
   * 산 여부
   */
  mountainYn: 'Y' | 'N';

  /**
   * 지번 본번
   */
  mainAddressNo: string;

  /**
   * 지번 부번
   */
  subAddressNo: string;
}

/**
 * 건축물대장 조회에 필요한 필지 정보
 */
export interface BuildingLotInfo {
  sigunguCd: string;
  bjdongCd: string;
  platGbCd: string;
  bun: string;
  ji: string;
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
 * 지번을 건축물대장 형식인
 * 4자리 문자열로 변환
 *
 * 12 -> 0012
 * '' -> 0000
 */
function normalizeLotNumber(
  value: string,
): string {
  if (!value) {
    return '0000';
  }

  return value.padStart(
    4,
    '0',
  );
}

/**
 * =====================================================
 * 주소 검색
 * =====================================================
 */
export async function searchAddress(
  query: string,
): Promise<Coordinates | null> {
  const apiKey =
    getApiKey();

  const url =
    `https://dapi.kakao.com/v2/local/search/address.json` +
    `?query=${encodeURIComponent(query)}`;

  const response =
    await fetch(url, {
      headers: {
        Authorization:
          `KakaoAK ${apiKey}`,
      },
    });

  if (!response.ok) {
    throw new Error(
      `주소 검색 요청 실패: ${response.status}`,
    );
  }

  const data =
    await response.json();

  const first =
    data.documents?.[0];

  if (!first) {
    return null;
  }

  return {
    lat: Number(first.y),
    lng: Number(first.x),
  };
}

/**
 * =====================================================
 * 키워드 / 장소 검색
 * =====================================================
 */
export async function searchKeyword(
  query: string,
): Promise<PlaceSearchResult | null> {
  const apiKey =
    getApiKey();

  const url =
    `https://dapi.kakao.com/v2/local/search/keyword.json` +
    `?query=${encodeURIComponent(query)}`;

  const response =
    await fetch(url, {
      headers: {
        Authorization:
          `KakaoAK ${apiKey}`,
      },
    });

  if (!response.ok) {
    throw new Error(
      `키워드 검색 요청 실패: ${response.status}`,
    );
  }

  const data =
    await response.json();

  const first =
    data.documents?.[0];

  if (!first) {
    return null;
  }

  return {
    name:
      first.place_name,

    address:
      first.address_name,

    roadAddress:
      first.road_address_name,

    lat:
      Number(first.y),

    lng:
      Number(first.x),
  };
}

/**
 * =====================================================
 * 주소 검색 → 실패하면 키워드 검색
 * =====================================================
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
    lat:
      keywordResult.lat,

    lng:
      keywordResult.lng,
  };
}

/**
 * =====================================================
 * 좌표 → 행정동 + 법정동
 * =====================================================
 */
export async function getRegionFromCoords(
  lat: number,
  lng: number,
): Promise<RegionInfo | null> {
  const apiKey =
    getApiKey();

  const url =
    `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json` +
    `?x=${lng}&y=${lat}`;

  const response =
    await fetch(url, {
      headers: {
        Authorization:
          `KakaoAK ${apiKey}`,
      },
    });

  if (!response.ok) {
    throw new Error(
      `행정구역 조회 요청 실패: ${response.status}`,
    );
  }

  const data =
    await response.json();

  /**
   * H = 행정동
   */
  const administrative =
    data.documents?.find(
      (
        item: {
          region_type: string;
        },
      ) =>
        item.region_type ===
        'H',
    );

  /**
   * B = 법정동
   */
  const legal =
    data.documents?.find(
      (
        item: {
          region_type: string;
        },
      ) =>
        item.region_type ===
        'B',
    );

  if (
    !administrative &&
    !legal
  ) {
    return null;
  }

  return {
    administrativeDongName:
      administrative
        ?.region_3depth_name ??
      legal?.region_3depth_name ??
      '',

    administrativeDongCode:
      administrative?.code ??
      '',

    legalDongName:
      legal?.region_3depth_name ??
      '',

    legalDongCode:
      legal?.code ??
      '',
  };
}

/**
 * 기존 코드 호환용
 *
 * 좌표 → 행정동만 반환
 */
export async function getDongFromCoords(
  lat: number,
  lng: number,
): Promise<DongInfo | null> {
  const region =
    await getRegionFromCoords(
      lat,
      lng,
    );

  if (
    !region ||
    !region.administrativeDongName
  ) {
    return null;
  }

  return {
    dongName:
      region.administrativeDongName,

    dongCode:
      region.administrativeDongCode,
  };
}

/**
 * =====================================================
 * 좌표 → 주소
 * =====================================================
 */
export async function getAddressFromCoords(
  lat: number,
  lng: number,
): Promise<AddressInfo | null> {
  const apiKey =
    getApiKey();

  const url =
    `https://dapi.kakao.com/v2/local/geo/coord2address.json` +
    `?x=${lng}&y=${lat}`;

  const response =
    await fetch(url, {
      headers: {
        Authorization:
          `KakaoAK ${apiKey}`,
      },
    });

  if (!response.ok) {
    throw new Error(
      `주소 조회 요청 실패: ${response.status}`,
    );
  }

  const data =
    await response.json();

  const first =
    data.documents?.[0];

  if (!first) {
    return null;
  }

  const address =
    first.address;

  const roadAddress =
    first.road_address;

  return {
    address:
      address?.address_name ??
      '',

    roadAddress:
      roadAddress
        ?.address_name ??
      '',

    buildingName:
      roadAddress
        ?.building_name ??
      '',

    zoneNo:
      roadAddress?.zone_no ??
      '',

    mountainYn:
      address?.mountain_yn ===
      'Y'
        ? 'Y'
        : 'N',

    mainAddressNo:
      address
        ?.main_address_no ??
      '',

    subAddressNo:
      address
        ?.sub_address_no ??
      '',
  };
}

/**
 * =====================================================
 * 법정동 코드 + 주소정보
 * → 건축물대장 API 필지 파라미터 생성
 * =====================================================
 */
export function createBuildingLotInfo(
  regionInfo: RegionInfo,
  addressInfo: AddressInfo,
): BuildingLotInfo | null {
  const legalCode =
    regionInfo.legalDongCode;

  /**
   * 법정동 코드는 10자리
   */
  if (
    !legalCode ||
    legalCode.length !== 10 ||
    !addressInfo.mainAddressNo
  ) {
    return null;
  }

  return {
    /**
     * 앞 5자리
     */
    sigunguCd:
      legalCode.slice(
        0,
        5,
      ),

    /**
     * 뒤 5자리
     */
    bjdongCd:
      legalCode.slice(
        5,
        10,
      ),

    /**
     * 일반 = 0
     * 산 = 1
     */
    platGbCd:
      addressInfo.mountainYn ===
      'Y'
        ? '1'
        : '0',

    /**
     * 본번
     */
    bun:
      normalizeLotNumber(
        addressInfo.mainAddressNo,
      ),

    /**
     * 부번
     */
    ji:
      normalizeLotNumber(
        addressInfo.subAddressNo,
      ),
  };
}