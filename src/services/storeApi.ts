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