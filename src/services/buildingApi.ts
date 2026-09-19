import {
  BuildingLotInfo,
} from '@/services/geocoding';

const DATA_GO_KR_SERVICE_KEY =
  process.env.EXPO_PUBLIC_DATA_GO_KR_SERVICE_KEY;

const BASE_URL =
  'https://apis.data.go.kr/1613000/BldRgstHubService';

/**
 * =====================================================
 * 층별 정보
 * =====================================================
 */
export interface BuildingFloorInfo {
  buildingName: string;

  dongName: string;

  floorType: string;

  floorNumber: number | null;

  floorName: string;

  mainPurpose: string;

  etcPurpose: string;

  structure: string;

  etcStructure: string;

  area: number | null;

  managementPk: string;
}

/**
 * =====================================================
 * 건축물 정보
 * =====================================================
 */
export interface BuildingRegisterInfo {
  buildingName: string;

  dongName: string;

  address: string;

  roadAddress: string;

  mainPurpose: string;

  etcPurpose: string;

  structure: string;

  etcStructure: string;

  platArea: number | null;

  archArea: number | null;

  totalArea: number | null;

  vlRatEstmTotArea:
    number | null;

  buildingCoverageRatio:
    number | null;

  floorAreaRatio:
    number | null;

  groundFloorCount:
    number | null;

  undergroundFloorCount:
    number | null;

  height:
    number | null;

  householdCount:
    number | null;

  unitCount:
    number | null;

  useApprovalDate: string;

  constructionStartDate: string;

  permitDate: string;

  mainAttachedType: string;

  managementPk: string;

  sourceType?:
    | 'title'
    | 'floor'
    | 'basic';

  /**
   * 상업 관련 층 수
   */
  commercialFloorCount?: number;

  /**
   * 상업 관련 층 면적 합
   *
   * 건물 전체 연면적이 아님.
   */
  commercialArea?: number;

  /**
   * 상업 관련 용도 목록
   */
  commercialUses?: string[];

  /**
   * 실제 상업 관련 층
   */
  commercialFloors?: BuildingFloorInfo[];
}

interface BuildingBasicInfo {
  buildingName: string;

  address: string;

  roadAddress: string;

  managementPk: string;

  parentManagementPk: string;

  registerType: string;

  registerKind: string;
}

/**
 * API 요청 상태
 */
interface BuildingApiResult {
  items: any[];

  timedOut: boolean;

  failed: boolean;
}

/**
 * =====================================================
 * 공공데이터 API 키
 * =====================================================
 */
function getServiceKey(): string {
  if (
    !DATA_GO_KR_SERVICE_KEY
  ) {
    throw new Error(
      '공공데이터포털 API 키가 없습니다. .env의 EXPO_PUBLIC_DATA_GO_KR_SERVICE_KEY를 확인해주세요.',
    );
  }

  return DATA_GO_KR_SERVICE_KEY.trim();
}

/**
 * =====================================================
 * sleep
 * =====================================================
 */
function sleep(
  milliseconds: number,
) {
  return new Promise<void>(
    resolve => {
      setTimeout(
        resolve,
        milliseconds,
      );
    },
  );
}

/**
 * =====================================================
 * 숫자 변환
 * =====================================================
 */
function toNumber(
  value: unknown,
): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  const number =
    Number(value);

  if (
    Number.isNaN(number)
  ) {
    return null;
  }

  return number;
}

/**
 * =====================================================
 * 날짜 표시
 * =====================================================
 */
export function formatBuildingDate(
  value: string,
): string {
  if (!value) {
    return '정보 없음';
  }

  if (
    value.length !== 8
  ) {
    return value;
  }

  return (
    `${value.slice(0, 4)}.` +
    `${value.slice(4, 6)}.` +
    `${value.slice(6, 8)}`
  );
}

/**
 * =====================================================
 * 숫자 표시
 * =====================================================
 */
export function formatBuildingNumber(
  value: number | null,
  maximumFractionDigits = 1,
): string {
  if (value === null) {
    return '정보 없음';
  }

  return value.toLocaleString(
    'ko-KR',
    {
      maximumFractionDigits,
    },
  );
}

/**
 * =====================================================
 * URL 생성
 * =====================================================
 */
function createRequestUrl(
  operation: string,
  lotInfo: BuildingLotInfo,
  numOfRows: number,
): string {
  const serviceKey =
    getServiceKey();

  const params =
    new URLSearchParams();

  params.set(
    'sigunguCd',
    lotInfo.sigunguCd,
  );

  params.set(
    'bjdongCd',
    lotInfo.bjdongCd,
  );

  params.set(
    'platGbCd',
    lotInfo.platGbCd,
  );

  params.set(
    'bun',
    lotInfo.bun,
  );

  params.set(
    'ji',
    lotInfo.ji,
  );

  params.set(
    'numOfRows',
    String(numOfRows),
  );

  params.set(
    'pageNo',
    '1',
  );

  params.set(
    '_type',
    'json',
  );

  /**
   * serviceKey는 직접 붙임.
   *
   * 공공데이터포털 일반 인증키가 이미
   * Encoding되어 있는 경우의 이중 인코딩 방지.
   */
  return (
    `${BASE_URL}/${operation}` +
    `?serviceKey=${serviceKey}` +
    `&${params.toString()}`
  );
}

/**
 * =====================================================
 * 한 번 호출
 * =====================================================
 */
async function requestOnce(
  operation: string,
  lotInfo: BuildingLotInfo,
  numOfRows: number,
): Promise<BuildingApiResult> {
  const url =
    createRequestUrl(
      operation,
      lotInfo,
      numOfRows,
    );

  console.log(
    `🏢 건축HUB 요청: ${operation}`,
    {
      sigunguCd:
        lotInfo.sigunguCd,

      bjdongCd:
        lotInfo.bjdongCd,

      platGbCd:
        lotInfo.platGbCd,

      bun:
        lotInfo.bun,

      ji:
        lotInfo.ji,

      numOfRows,
    },
  );

  try {
    const response =
      await fetch(
        url,
        {
          method: 'GET',

          headers: {
            Accept:
              'application/json',
          },
        },
      );

    const rawText =
      await response.text();

    /**
     * =================================================
     * 503 / timeout
     * =================================================
     */
    if (
      response.status === 503 ||
      rawText.includes(
        'SERVICETIMEOUT_ERROR',
      )
    ) {
      console.warn(
        `⏱️ ${operation} 서비스 응답시간 초과`,
      );

      return {
        items: [],
        timedOut: true,
        failed: true,
      };
    }

    /**
     * =================================================
     * 기타 HTTP 오류
     * =================================================
     */
    if (!response.ok) {
      console.error(
        `❌ ${operation} HTTP 오류`,
        {
          status:
            response.status,

          body:
            rawText,
        },
      );

      if (
        rawText.includes(
          'SERVICE_KEY_IS_NOT_REGISTERED_ERROR',
        )
      ) {
        throw new Error(
          '공공데이터포털 인증키가 등록되지 않았습니다.',
        );
      }

      if (
        rawText.includes(
          'SERVICE_ACCESS_DENIED_ERROR',
        )
      ) {
        throw new Error(
          '건축HUB API 접근 권한이 없습니다.',
        );
      }

      return {
        items: [],
        timedOut: false,
        failed: true,
      };
    }

    /**
     * =================================================
     * 빈 응답
     * =================================================
     */
    if (
      !rawText ||
      rawText.trim() === ''
    ) {
      console.warn(
        `⚠️ ${operation} 빈 응답`,
      );

      return {
        items: [],
        timedOut: false,
        failed: false,
      };
    }

    let data: any;

    /**
     * =================================================
     * JSON 변환
     * =================================================
     */
    try {
      data =
        JSON.parse(
          rawText,
        );
    } catch {
      console.warn(
        `⚠️ ${operation} JSON이 아닌 응답`,
        rawText.slice(
          0,
          300,
        ),
      );

      return {
        items: [],
        timedOut: false,
        failed: true,
      };
    }

    /**
     * =================================================
     * OpenAPI 오류
     * =================================================
     */
    const openApiError =
      data
        ?.OpenAPI_ServiceResponse
        ?.cmmMsgHeader;

    if (openApiError) {
      const errorMessage =
        `${openApiError.errMsg ?? ''}`;

      console.warn(
        `⚠️ ${operation} OpenAPI 오류`,
        openApiError,
      );

      if (
        errorMessage.includes(
          'SERVICETIMEOUT_ERROR',
        )
      ) {
        return {
          items: [],
          timedOut: true,
          failed: true,
        };
      }

      return {
        items: [],
        timedOut: false,
        failed: true,
      };
    }

    const header =
      data
        ?.response
        ?.header;

    const resultCode =
      header?.resultCode;

    const resultMsg =
      header?.resultMsg;

    if (
      resultCode &&
      resultCode !== '00'
    ) {
      console.warn(
        `⚠️ ${operation} API 오류`,
        {
          resultCode,
          resultMsg,
        },
      );

      return {
        items: [],
        timedOut: false,
        failed: true,
      };
    }

    const rawItem =
      data
        ?.response
        ?.body
        ?.items
        ?.item;

    /**
     * =================================================
     * 정상 0건
     * =================================================
     */
    if (!rawItem) {
      console.log(
        `ℹ️ ${operation} 정상 조회 / 결과 0건`,
      );

      return {
        items: [],
        timedOut: false,
        failed: false,
      };
    }

    const items =
      Array.isArray(
        rawItem,
      )
        ? rawItem
        : [rawItem];

    console.log(
      `✅ ${operation} 조회 성공`,
      {
        count:
          items.length,
      },
    );

    return {
      items,
      timedOut: false,
      failed: false,
    };
  } catch (error) {
    /**
     * 인증/권한 오류는 그대로 전달
     */
    if (
      error instanceof Error &&
      (
        error.message.includes(
          '인증키',
        ) ||
        error.message.includes(
          '접근 권한',
        )
      )
    ) {
      throw error;
    }

    console.warn(
      `⚠️ ${operation} 요청 중 예외`,
      error,
    );

    return {
      items: [],
      timedOut: false,
      failed: true,
    };
  }
}

/**
 * =====================================================
 * 공통 요청
 *
 * timeout이면 0.8초 후 1회 재시도
 * =====================================================
 */
async function requestBuildingApi(
  operation: string,
  lotInfo: BuildingLotInfo,
  numOfRows: number,
): Promise<BuildingApiResult> {
  const first =
    await requestOnce(
      operation,
      lotInfo,
      numOfRows,
    );

  if (!first.timedOut) {
    return first;
  }

  console.log(
    `🔄 ${operation} 0.8초 후 1회 재시도`,
  );

  await sleep(
    800,
  );

  const second =
    await requestOnce(
      operation,
      lotInfo,
      numOfRows,
    );

  if (
    second.timedOut
  ) {
    console.warn(
      `⏱️ ${operation} 재시도도 timeout`,
    );
  }

  return second;
}

/**
 * =====================================================
 * 표제부 조회
 * =====================================================
 */
async function getBuildingTitleInfo(
  lotInfo: BuildingLotInfo,
): Promise<{
  buildings:
    BuildingRegisterInfo[];

  timedOut: boolean;

  failed: boolean;
}> {
  const result =
    await requestBuildingApi(
      'getBrTitleInfo',
      lotInfo,
      30,
    );

  const buildings =
    result.items.map(
      (
        item: any,
      ): BuildingRegisterInfo => ({
        buildingName:
          item.bldNm ??
          '',

        dongName:
          item.dongNm ??
          '',

        address:
          item.platPlc ??
          '',

        roadAddress:
          item.newPlatPlc ??
          '',

        mainPurpose:
          item.mainPurpsCdNm ??
          '',

        etcPurpose:
          item.etcPurps ??
          '',

        structure:
          item.strctCdNm ??
          '',

        etcStructure:
          item.etcStrct ??
          '',

        platArea:
          toNumber(
            item.platArea,
          ),

        archArea:
          toNumber(
            item.archArea,
          ),

        totalArea:
          toNumber(
            item.totArea,
          ),

        vlRatEstmTotArea:
          toNumber(
            item.vlRatEstmTotArea,
          ),

        buildingCoverageRatio:
          toNumber(
            item.bcRat,
          ),

        floorAreaRatio:
          toNumber(
            item.vlRat,
          ),

        groundFloorCount:
          toNumber(
            item.grndFlrCnt,
          ),

        undergroundFloorCount:
          toNumber(
            item.ugrndFlrCnt,
          ),

        height:
          toNumber(
            item.heit,
          ),

        householdCount:
          toNumber(
            item.hhldCnt,
          ),

        unitCount:
          toNumber(
            item.hoCnt,
          ),

        useApprovalDate:
          item.useAprDay ??
          '',

        constructionStartDate:
          item.stcnsDay ??
          '',

        permitDate:
          item.pmsDay ??
          '',

        mainAttachedType:
          item.mainAtchGbCdNm ??
          '',

        managementPk:
          item.mgmBldrgstPk ??
          '',

        sourceType:
          'title',
      }),
    );

  buildings.sort(
    (
      a,
      b,
    ) => {
      const aPriority =
        a.mainAttachedType ===
        '주건축물'
          ? 0
          : 1;

      const bPriority =
        b.mainAttachedType ===
        '주건축물'
          ? 0
          : 1;

      return (
        aPriority -
        bPriority
      );
    },
  );

  return {
    buildings,
    timedOut:
      result.timedOut,
    failed:
      result.failed,
  };
}

/**
 * =====================================================
 * 기본개요 조회
 * =====================================================
 */
async function getBuildingBasicInfo(
  lotInfo: BuildingLotInfo,
): Promise<{
  basics:
    BuildingBasicInfo[];

  timedOut: boolean;

  failed: boolean;
}> {
  const result =
    await requestBuildingApi(
      'getBrBasisOulnInfo',
      lotInfo,
      30,
    );

  const basics =
    result.items.map(
      (
        item: any,
      ): BuildingBasicInfo => ({
        buildingName:
          item.bldNm ??
          '',

        address:
          item.platPlc ??
          '',

        roadAddress:
          item.newPlatPlc ??
          '',

        managementPk:
          item.mgmBldrgstPk ??
          '',

        parentManagementPk:
          item.mgmUpBldrgstPk ??
          '',

        registerType:
          item.regstrGbCdNm ??
          '',

        registerKind:
          item.regstrKindCdNm ??
          '',
      }),
    );

  return {
    basics,
    timedOut:
      result.timedOut,
    failed:
      result.failed,
  };
}

/**
 * =====================================================
 * 층별개요 조회
 * =====================================================
 */
export async function getBuildingFloorInfo(
  lotInfo: BuildingLotInfo,
): Promise<{
  floors:
    BuildingFloorInfo[];

  timedOut: boolean;

  failed: boolean;
}> {
  const result =
    await requestBuildingApi(
      'getBrFlrOulnInfo',
      lotInfo,
      100,
    );

  const floors =
    result.items.map(
      (
        item: any,
      ): BuildingFloorInfo => ({
        buildingName:
          item.bldNm ??
          '',

        dongName:
          item.dongNm ??
          '',

        floorType:
          item.flrGbCdNm ??
          '',

        floorNumber:
          toNumber(
            item.flrNo,
          ),

        floorName:
          item.flrNoNm ??
          '',

        mainPurpose:
          item.mainPurpsCdNm ??
          '',

        etcPurpose:
          item.etcPurps ??
          '',

        structure:
          item.strctCdNm ??
          '',

        etcStructure:
          item.etcStrct ??
          '',

        area:
          toNumber(
            item.area,
          ),

        managementPk:
          item.mgmBldrgstPk ??
          '',
      }),
    );

  return {
    floors,
    timedOut:
      result.timedOut,
    failed:
      result.failed,
  };
}

/**
 * =====================================================
 * 상업시설 용도인지 판별
 * =====================================================
 */
function isCommercialFloor(
  floor: BuildingFloorInfo,
): boolean {
  const purpose =
    `${
      floor.mainPurpose
    } ${
      floor.etcPurpose
    }`
      .replace(
        /\s+/g,
        ' ',
      )
      .trim();

  /**
   * 창업 앱에서 우선적으로
   * 확인할 가치가 있는 용도.
   *
   * 실제 입점 가능 여부와는 별개.
   */
  const keywords = [
    '제1종근린생활시설',
    '제2종근린생활시설',
    '근린생활시설',
    '판매시설',
    '영업시설',
    '업무시설',
    '숙박시설',
    '위락시설',
    '문화 및 집회시설',
  ];

  return keywords.some(
    keyword =>
      purpose.includes(
        keyword,
      ),
  );
}

/**
 * =====================================================
 * 상업층 추출
 * =====================================================
 */
function getCommercialFloors(
  floors: BuildingFloorInfo[],
): BuildingFloorInfo[] {
  return floors
    .filter(
      isCommercialFloor,
    )
    .sort(
      (
        a,
        b,
      ) => {
        const aFloor =
          a.floorNumber ??
          9999;

        const bFloor =
          b.floorNumber ??
          9999;

        return (
          aFloor -
          bFloor
        );
      },
    );
}

/**
 * =====================================================
 * 상업시설 데이터 추가
 * =====================================================
 */
function enhanceWithCommercialData(
  building:
    BuildingRegisterInfo,
  floors:
    BuildingFloorInfo[],
): BuildingRegisterInfo {
  /**
   * PK가 있으면 해당 건물 PK와
   * 동일한 층을 우선 사용.
   */
  let matchingFloors =
    floors;

  if (
    building.managementPk
  ) {
    const exact =
      floors.filter(
        floor =>
          floor.managementPk ===
          building.managementPk,
      );

    /**
     * exact 매칭이 한 건이라도 있을 때만
     * 해당 결과를 사용.
     */
    if (
      exact.length > 0
    ) {
      matchingFloors =
        exact;
    }
  }

  const commercialFloors =
    getCommercialFloors(
      matchingFloors,
    );

  const commercialUses =
    Array.from(
      new Set(
        commercialFloors
          .flatMap(
            floor => [
              floor.mainPurpose,
              floor.etcPurpose,
            ],
          )
          .map(
            value =>
              value.trim(),
          )
          .filter(
            Boolean,
          ),
      ),
    );

  const commercialArea =
    commercialFloors.reduce(
      (
        total,
        floor,
      ) =>
        total +
        (
          floor.area ??
          0
        ),
      0,
    );

  return {
    ...building,

    commercialFloorCount:
      commercialFloors.length,

    commercialArea:
      commercialArea > 0
        ? commercialArea
        : undefined,

    commercialUses,

    commercialFloors,
  };
}

/**
 * =====================================================
 * 표제부가 없을 때 fallback
 * =====================================================
 */
function createFallbackBuilding(
  basics:
    BuildingBasicInfo[],
  floors:
    BuildingFloorInfo[],
): BuildingRegisterInfo | null {
  if (
    basics.length === 0 &&
    floors.length === 0
  ) {
    return null;
  }

  const commercialFloors =
    getCommercialFloors(
      floors,
    );

  const baseFloor =
    commercialFloors[0] ??
    floors[0];

  const basic =
    basics[0];

  const commercialUses =
    Array.from(
      new Set(
        commercialFloors
          .flatMap(
            floor => [
              floor.mainPurpose,
              floor.etcPurpose,
            ],
          )
          .map(
            value =>
              value.trim(),
          )
          .filter(
            Boolean,
          ),
      ),
    );

  const commercialArea =
    commercialFloors.reduce(
      (
        total,
        floor,
      ) =>
        total +
        (
          floor.area ??
          0
        ),
      0,
    );

  return {
    buildingName:
      baseFloor
        ?.buildingName ||
      basic
        ?.buildingName ||
      '',

    dongName:
      baseFloor
        ?.dongName ||
      '',

    address:
      basic
        ?.address ||
      '',

    roadAddress:
      basic
        ?.roadAddress ||
      '',

    mainPurpose:
      baseFloor
        ?.mainPurpose ||
      '',

    etcPurpose:
      baseFloor
        ?.etcPurpose ||
      '',

    structure:
      baseFloor
        ?.structure ||
      '',

    etcStructure:
      baseFloor
        ?.etcStructure ||
      '',

    platArea:
      null,

    archArea:
      null,

    totalArea:
      null,

    vlRatEstmTotArea:
      null,

    buildingCoverageRatio:
      null,

    floorAreaRatio:
      null,

    groundFloorCount:
      null,

    undergroundFloorCount:
      null,

    height:
      null,

    householdCount:
      null,

    unitCount:
      null,

    useApprovalDate:
      '',

    constructionStartDate:
      '',

    permitDate:
      '',

    mainAttachedType:
      '',

    managementPk:
      baseFloor
        ?.managementPk ||
      basic
        ?.managementPk ||
      '',

    sourceType:
      floors.length > 0
        ? 'floor'
        : 'basic',

    commercialFloorCount:
      commercialFloors.length,

    commercialArea:
      commercialArea > 0
        ? commercialArea
        : undefined,

    commercialUses,

    commercialFloors,
  };
}

/**
 * =====================================================
 * 메인 조회
 *
 * 반환값:
 *
 * 실제 데이터 없음
 * → []
 *
 * 서버가 계속 timeout
 * → throw Error
 * =====================================================
 */
export async function getBuildingRegister(
  lotInfo: BuildingLotInfo,
): Promise<BuildingRegisterInfo[]> {
  console.log(
    '🔎 건축물 조회 시작',
    lotInfo,
  );

  let hadTimeout =
    false;

  let hadSuccessfulRequest =
    false;

  /**
   * ===================================================
   * 1. 표제부
   * ===================================================
   */
  const titleResult =
    await getBuildingTitleInfo(
      lotInfo,
    );

  hadTimeout =
    hadTimeout ||
    titleResult.timedOut;

  if (
    !titleResult.failed
  ) {
    hadSuccessfulRequest =
      true;
  }

  console.log(
    '📊 표제부 결과:',
    titleResult.buildings.length,
  );

  /**
   * ===================================================
   * 표제부가 있으면 층별개요 추가 조회
   * ===================================================
   */
  if (
    titleResult.buildings.length >
    0
  ) {
    const floorResult =
      await getBuildingFloorInfo(
        lotInfo,
      );

    hadTimeout =
      hadTimeout ||
      floorResult.timedOut;

    if (
      !floorResult.failed
    ) {
      hadSuccessfulRequest =
        true;
    }

    console.log(
      '📊 층별개요 결과:',
      floorResult.floors.length,
    );

    const buildings =
      titleResult.buildings.map(
        building =>
          enhanceWithCommercialData(
            building,
            floorResult.floors,
          ),
      );

    console.log(
      '✅ 건축물 반환',
      {
        buildingCount:
          buildings.length,

        commercialFloorCount:
          buildings[0]
            ?.commercialFloorCount ??
          0,
      },
    );

    return buildings;
  }

  /**
   * ===================================================
   * 2. 기본개요 fallback
   * ===================================================
   */
  const basicResult =
    await getBuildingBasicInfo(
      lotInfo,
    );

  hadTimeout =
    hadTimeout ||
    basicResult.timedOut;

  if (
    !basicResult.failed
  ) {
    hadSuccessfulRequest =
      true;
  }

  console.log(
    '📊 기본개요 결과:',
    basicResult.basics.length,
  );

  /**
   * ===================================================
   * 3. 층별개요
   * ===================================================
   */
  const floorResult =
    await getBuildingFloorInfo(
      lotInfo,
    );

  hadTimeout =
    hadTimeout ||
    floorResult.timedOut;

  if (
    !floorResult.failed
  ) {
    hadSuccessfulRequest =
      true;
  }

  console.log(
    '📊 층별개요 fallback 결과:',
    floorResult.floors.length,
  );

  const fallback =
    createFallbackBuilding(
      basicResult.basics,
      floorResult.floors,
    );

  if (fallback) {
    console.log(
      '✅ fallback 건축물 반환',
      {
        source:
          fallback.sourceType,

        buildingName:
          fallback.buildingName,

        commercialFloorCount:
          fallback.commercialFloorCount,

        commercialUses:
          fallback.commercialUses,
      },
    );

    return [
      fallback,
    ];
  }

  /**
   * ===================================================
   * 모든 요청이 실패했고
   * timeout도 있었다면
   *
   * "데이터 없음"으로 표시하면 안 됨.
   * ===================================================
   */
  if (
    hadTimeout &&
    !hadSuccessfulRequest
  ) {
    throw new Error(
      '공공 건축물 데이터 서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 조회해주세요.',
    );
  }

  /**
   * 일부 요청은 정상적으로 완료됐지만
   * 실제로 결과가 하나도 없는 경우.
   */
  console.log(
    'ℹ️ 정상 조회 완료 / 해당 필지 건축물 정보 없음',
  );

  return [];
}