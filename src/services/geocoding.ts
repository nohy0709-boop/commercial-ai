/**
 * 카카오 로컬 API를 사용한 주소 ↔ 좌표 ↔ 행정동 변환 서비스입니다.
 *
 * 사용하려면:
 * 1. https://developers.kakao.com 에서 앱 생성 후 REST API 키 발급
 * 2. 앱 관리 페이지 > [카카오맵] > 사용 설정을 ON으로 변경 (필수)
 * 3. .env 파일에 EXPO_PUBLIC_KAKAO_REST_API_KEY=발급받은키 추가
 */

const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DongInfo {
  dongName: string; // 행정동 이름 (예: "나성동")
  dongCode: string; // 행정동 코드
}

function getApiKey(): string {
  if (!KAKAO_REST_API_KEY) {
    throw new Error('카카오 API 키를 불러오지 못했습니다. .env 파일을 확인해주세요.');
  }
  return KAKAO_REST_API_KEY;
}

/**
 * 주소 문자열을 좌표(위도/경도)로 변환합니다.
 * 검색 결과가 없으면 null을 반환합니다.
 */
export async function searchAddress(query: string): Promise<Coordinates | null> {
  const apiKey = getApiKey();
  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(
    query,
  )}`;

  const response = await fetch(url, {
    headers: {Authorization: `KakaoAK ${apiKey}`},
  });

  if (!response.ok) {
    throw new Error(`주소 검색 요청 실패: ${response.status}`);
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
 * 좌표를 행정동 정보로 변환합니다.
 * region_type이 'H'(행정동)인 결과만 사용합니다. ('B'는 법정동이라 저희 데이터 기준과 다릅니다.)
 */
export async function getDongFromCoords(
  lat: number,
  lng: number,
): Promise<DongInfo | null> {
  const apiKey = getApiKey();
  const url = `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${lng}&y=${lat}`;

  const response = await fetch(url, {
    headers: {Authorization: `KakaoAK ${apiKey}`},
  });

  if (!response.ok) {
    throw new Error(`행정구역 조회 요청 실패: ${response.status}`);
  }

  const data = await response.json();
  const dong = data.documents?.find(
    (item: {region_type: string}) => item.region_type === 'H',
  );

  if (!dong) {
    return null;
  }

  return {
    dongName: dong.region_3depth_name,
    dongCode: dong.code,
  };
}