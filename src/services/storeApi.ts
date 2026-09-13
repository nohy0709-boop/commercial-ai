const BASE_URL =
  "https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInDong";

export type StoreCountResult = {
  areaName: string;
  storeCount: number;
};

export async function getStoreCount(
  areaName: string,
  adongCode: string,
  lclsCode: string,
  mclsCode?: string,
  sclsCode?: string
): Promise<StoreCountResult> {
  const serviceKey =
    process.env.EXPO_PUBLIC_STORE_API_KEY;

  if (!serviceKey) {
    throw new Error("공공데이터 API 키를 불러오지 못했습니다.");
  }

  let url =
    BASE_URL +
    `?serviceKey=${serviceKey}` +
    "&pageNo=1" +
    "&numOfRows=1" +
    "&divId=adongCd" +
    `&key=${adongCode}` +
    `&indsLclsCd=${lclsCode}` +
    "&type=json";

  if (mclsCode) {
    url += `&indsMclsCd=${mclsCode}`;
  }

  if (sclsCode) {
    url += `&indsSclsCd=${sclsCode}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `${areaName} 상가정보 요청 실패: ${response.status}`
    );
  }
  
  const data = await response.json();
  console.log("API 요청 URL:", url);
  console.log("API 응답:", data);
  if (data.header?.resultCode !== "00") {
    throw new Error(
      `${areaName}: ${
        data.header?.resultMsg ?? "API 오류"
      }`
    );
  }

  return {
    areaName,
    storeCount: Number(
      data.body?.totalCount ?? 0
    ),
  };
}


/**
 * 아래 함수를 기존 src/services/storeApi.ts 파일 맨 아래에 추가하세요.
 * (기존 getStoreCount 함수는 그대로 두고, 이 함수만 새로 붙이는 거예요.)
 *
 * 같은 공공데이터 API(소상공인시장진흥공단 상가업소정보)를 쓰지만,
 * 이번엔 개수(numOfRows=1)가 아니라 실제 점포 목록을 가져옵니다.
 * 응답 안에 실제 상호명(bizesNm), 실제 도로명주소(rdnmAdr), 실제 좌표(lat, lon)가 들어있어요.
 */

export interface NearbyStore {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export async function getStoreList(
  adongCode: string,
  lclsCode: string,
  mclsCode?: string,
  sclsCode?: string,
  numOfRows: number = 10,
): Promise<NearbyStore[]> {
  const apiKey = process.env.EXPO_PUBLIC_STORE_API_KEY;
  if (!apiKey) {
    throw new Error('공공데이터 API 키를 불러오지 못했습니다.');
  }

  const params = new URLSearchParams({
    serviceKey: apiKey,
    pageNo: '1',
    numOfRows: String(numOfRows),
    divId: 'adongCd',
    key: adongCode,
    indsLclsCd: lclsCode,
    type: 'json',
  });
  if (mclsCode) {
    params.append('indsMclsCd', mclsCode);
  }
  if (sclsCode) {
    params.append('indsSclsCd', sclsCode);
  }

  const url = `https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInDong?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`점포 목록 조회 실패: ${response.status}`);
  }

  const data = await response.json();

  // 처음 연동할 때는 실제 필드 이름이 예상과 다를 수 있어서, 콘솔에 원본을 찍어둡니다.
  // (테스트해보고 이상하면 이 로그를 캡처해서 보여주세요, 필드명만 바로 고치면 돼요.)
  console.log('점포 목록 API 원본 응답:', JSON.stringify(data).slice(0, 800));

  const items = data?.body?.items?.item;
  const list = Array.isArray(items) ? items : items ? [items] : [];

  return list
    .map((item: any) => ({
      name: item.bizesNm ?? '이름 정보 없음',
      address: item.rdnmAdr || item.lnoAdr || '주소 정보 없음',
      lat: Number(item.lat),
      lng: Number(item.lon),
    }))
    .filter(
      (store: NearbyStore) =>
        !Number.isNaN(store.lat) && !Number.isNaN(store.lng),
    );
}