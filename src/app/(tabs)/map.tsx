import AddressMap, {
    ClusterMarkerData,
    MapViewport,
} from '@/components/address-map';

import {
    businessCategories,
} from '@/constants/businessTypes';

import {
    COLORS,
} from '@/constants/colors';

import {
    sejongAreas,
} from '@/constants/sejongAreas';

import {
    BuildingRegisterInfo,
    formatBuildingDate,
    formatBuildingNumber,
    getBuildingRegister,
} from '@/services/buildingApi';

import {
    AddressInfo,
    BuildingLotInfo,
    Coordinates,
    createBuildingLotInfo,
    getAddressFromCoords,
    getRegionFromCoords,
    searchLocation,
} from '@/services/geocoding';

import {
    getCurrentLocation,
} from '@/services/currentLocation';

import {
    getStoresInRectangle,
    NearbyStore,
} from '@/services/storeApi';

import {
    useRouter,
} from 'expo-router';

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';

/**
 * =====================================================
 * 타입
 * =====================================================
 */

type Radius =
  | 300
  | 500
  | 1000;

type MapLayer =
  | 'commercial'
  | 'rental'
  | 'building';

type SheetMode =
  | 'summary'
  | 'building'
  | 'cluster';

type StoreCategoryKey =
  | 'food'
  | 'cafe'
  | 'convenience'
  | 'beauty'
  | 'medical'
  | 'education'
  | 'retail'
  | 'sports'
  | 'etc';

interface StoreCategory {
  key: StoreCategoryKey;

  label: string;

  icon: string;
}

interface StoreCluster {
  id: string;

  category: StoreCategory;

  stores: NearbyStore[];

  latitude: number;

  longitude: number;
}

/**
 * =====================================================
 * 지도에서 사용할 상권 카테고리
 * =====================================================
 */

const STORE_CATEGORIES: StoreCategory[] = [
  {
    key: 'food',
    label: '음식점',
    icon: '🍚',
  },

  {
    key: 'cafe',
    label: '카페',
    icon: '☕',
  },

  {
    key: 'convenience',
    label: '편의점',
    icon: '🏪',
  },

  {
    key: 'beauty',
    label: '미용',
    icon: '✂️',
  },

  {
    key: 'medical',
    label: '의료',
    icon: '🏥',
  },

  {
    key: 'education',
    label: '교육',
    icon: '🎓',
  },

  {
    key: 'retail',
    label: '소매',
    icon: '🛍️',
  },

  {
    key: 'sports',
    label: '운동',
    icon: '🏋️',
  },

  {
    key: 'etc',
    label: '기타',
    icon: '📍',
  },
];

/**
 * =====================================================
 * 점포 → 지도 카테고리 분류
 * =====================================================
 */

function getStoreCategory(
  store: NearbyStore,
): StoreCategory {
  const text =
    [
      store.lclsName,
      store.mclsName,
      store.sclsName,
      store.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

  /**
   * 카페
   */
  if (
    text.includes('카페') ||
    text.includes('커피') ||
    text.includes('디저트') ||
    text.includes('제과') ||
    text.includes('베이커리') ||
    text.includes('빙수') ||
    text.includes('차 전문')
  ) {
    return STORE_CATEGORIES.find(
      item =>
        item.key === 'cafe',
    )!;
  }

  /**
   * 편의점
   */
  if (
    text.includes('편의점')
  ) {
    return STORE_CATEGORIES.find(
      item =>
        item.key ===
        'convenience',
    )!;
  }

  /**
   * 음식점
   */
  if (
    text.includes('음식') ||
    text.includes('한식') ||
    text.includes('중식') ||
    text.includes('일식') ||
    text.includes('양식') ||
    text.includes('분식') ||
    text.includes('치킨') ||
    text.includes('피자') ||
    text.includes('주점') ||
    text.includes('식당')
  ) {
    return STORE_CATEGORIES.find(
      item =>
        item.key === 'food',
    )!;
  }

  /**
   * 미용
   */
  if (
    text.includes('미용') ||
    text.includes('헤어') ||
    text.includes('네일') ||
    text.includes('피부') ||
    text.includes('이용원')
  ) {
    return STORE_CATEGORIES.find(
      item =>
        item.key ===
        'beauty',
    )!;
  }

  /**
   * 의료
   */
  if (
    text.includes('병원') ||
    text.includes('의원') ||
    text.includes('약국') ||
    text.includes('치과') ||
    text.includes('한의원') ||
    text.includes('의료')
  ) {
    return STORE_CATEGORIES.find(
      item =>
        item.key ===
        'medical',
    )!;
  }

  /**
   * 교육
   */
  if (
    text.includes('학원') ||
    text.includes('교습') ||
    text.includes('교육') ||
    text.includes('어학')
  ) {
    return STORE_CATEGORIES.find(
      item =>
        item.key ===
        'education',
    )!;
  }

  /**
   * 운동
   */
  if (
    text.includes('헬스') ||
    text.includes('체육') ||
    text.includes('스포츠') ||
    text.includes('필라테스') ||
    text.includes('요가')
  ) {
    return STORE_CATEGORIES.find(
      item =>
        item.key ===
        'sports',
    )!;
  }

  /**
   * 소매
   */
  if (
    text.includes('소매') ||
    text.includes('마트') ||
    text.includes('슈퍼') ||
    text.includes('의류') ||
    text.includes('잡화') ||
    text.includes('화장품')
  ) {
    return STORE_CATEGORIES.find(
      item =>
        item.key ===
        'retail',
    )!;
  }

  return STORE_CATEGORIES.find(
    item =>
      item.key === 'etc',
  )!;
}

/**
 * =====================================================
 * 확대 단계별 클러스터 크기
 * =====================================================
 */

function getClusterCellMeters(
  level: number,
) {
  if (level <= 2) {
    return 40;
  }

  if (level === 3) {
    return 65;
  }

  if (level === 4) {
    return 105;
  }

  if (level === 5) {
    return 170;
  }

  if (level === 6) {
    return 280;
  }

  return 450;
}

/**
 * =====================================================
 * 같은 업종 + 가까운 점포끼리 묶기
 * =====================================================
 */

function createStoreClusters(
  stores: NearbyStore[],
  level: number,
): StoreCluster[] {
  if (
    stores.length === 0
  ) {
    return [];
  }

  const cellMeters =
    getClusterCellMeters(
      level,
    );

  const referenceLat =
    stores.reduce(
      (
        total,
        store,
      ) =>
        total +
        store.lat,
      0,
    ) /
    stores.length;

  const latStep =
    cellMeters /
    111320;

  const lngStep =
    cellMeters /
    (
      111320 *
      Math.cos(
        (
          referenceLat *
          Math.PI
        ) /
          180,
      )
    );

  const groups =
    new Map<
      string,
      {
        category: StoreCategory;

        stores: NearbyStore[];
      }
    >();

  stores.forEach(
    store => {
      const category =
        getStoreCategory(
          store,
        );

      const latCell =
        Math.floor(
          store.lat /
            latStep,
        );

      const lngCell =
        Math.floor(
          store.lng /
            lngStep,
        );

      const key =
        `${category.key}-${latCell}-${lngCell}`;

      const existing =
        groups.get(
          key,
        );

      if (existing) {
        existing.stores.push(
          store,
        );
      } else {
        groups.set(
          key,
          {
            category,

            stores: [
              store,
            ],
          },
        );
      }
    },
  );

  return Array.from(
    groups.entries(),
  ).map(
    (
      [
        id,
        group,
      ],
    ) => {
      const latitude =
        group.stores.reduce(
          (
            total,
            store,
          ) =>
            total +
            store.lat,
          0,
        ) /
        group.stores.length;

      const longitude =
        group.stores.reduce(
          (
            total,
            store,
          ) =>
            total +
            store.lng,
          0,
        ) /
        group.stores.length;

      return {
        id,

        category:
          group.category,

        stores:
          group.stores,

        latitude,

        longitude,
      };
    },
  );
}

/**
 * =====================================================
 * 메인
 * =====================================================
 */

export default function MapScreen() {
  const router =
    useRouter();

  const {
    width,
  } =
    useWindowDimensions();

  const isSmall =
    width < 700;

  const SEJONG_CENTER = {
    latitude: 36.48,

    longitude: 127.289,
  };

  /**
   * =====================================================
   * 분석용 업종 목록
   * =====================================================
   */

  const allBusinesses =
    useMemo(
      () =>
        businessCategories.flatMap(
          category =>
            category.businesses,
        ),
      [],
    );

  const defaultBusiness =
    useMemo(
      () =>
        allBusinesses.find(
          business =>
            business.name ===
            '한식',
        )?.name ??
        allBusinesses[0]?.name ??
        '',
      [
        allBusinesses,
      ],
    );

  /**
   * =====================================================
   * 현재 레이어
   * =====================================================
   */

  const [
    mapLayer,
    setMapLayer,
  ] =
    useState<MapLayer>(
      'commercial',
    );

  /**
   * =====================================================
   * 지도 상태
   * =====================================================
   */

  const [
    mapCenter,
    setMapCenter,
  ] =
    useState(
      SEJONG_CENTER,
    );

  const [
    viewport,
    setViewport,
  ] =
    useState<
      MapViewport | null
    >(null);

  /**
   * =====================================================
   * 현재 지도 상권 점포
   * =====================================================
   */

  const [
    mapStores,
    setMapStores,
  ] =
    useState<
      NearbyStore[]
    >([]);

  const [
    mapStoresLoading,
    setMapStoresLoading,
  ] =
    useState(false);

  const [
    mapStoresError,
    setMapStoresError,
  ] =
    useState('');

  const [
    mapCategoryFilter,
    setMapCategoryFilter,
  ] =
    useState<
      StoreCategoryKey | null
    >(null);

  const [
    selectedCluster,
    setSelectedCluster,
  ] =
    useState<
      StoreCluster | null
    >(null);

  /**
   * =====================================================
   * 선택 위치
   * =====================================================
   */

  const [
    selectedPoint,
    setSelectedPoint,
  ] =
    useState<
      Coordinates | null
    >(null);

  const [
    selectedDong,
    setSelectedDong,
  ] =
    useState('');

  const [
    selectedLabel,
    setSelectedLabel,
  ] =
    useState('');

  const [
    addressInfo,
    setAddressInfo,
  ] =
    useState<
      AddressInfo | null
    >(null);

  const [
    buildingLotInfo,
    setBuildingLotInfo,
  ] =
    useState<
      BuildingLotInfo | null
    >(null);

  /**
   * =====================================================
   * 건물
   * =====================================================
   */

  const [
    buildingInfo,
    setBuildingInfo,
  ] =
    useState<
      BuildingRegisterInfo | null
    >(null);

  const [
    buildingLoading,
    setBuildingLoading,
  ] =
    useState(false);

  const [
    buildingError,
    setBuildingError,
  ] =
    useState('');

  /**
   * =====================================================
   * 분석 조건
   * =====================================================
   */

  const [
    selectedRadius,
    setSelectedRadius,
  ] =
    useState<Radius>(
      500,
    );

  const [
    selectedBusiness,
    setSelectedBusiness,
  ] =
    useState(
      defaultBusiness,
    );

  /**
   * =====================================================
   * 기타 UI
   * =====================================================
   */

  const [
    pointLoading,
    setPointLoading,
  ] =
    useState(false);

  const [
    currentLocationLoading,
    setCurrentLocationLoading,
  ] =
    useState(false);

  const [
    searchLoading,
    setSearchLoading,
  ] =
    useState(false);

  const [
    searchQuery,
    setSearchQuery,
  ] =
    useState('');

  const [
    sheetOpen,
    setSheetOpen,
  ] =
    useState(false);

  const [
    sheetMode,
    setSheetMode,
  ] =
    useState<SheetMode>(
      'summary',
    );

  const mapStoreRequestRef =
    useRef(
      0,
    );

  /**
   * =====================================================
   * 반경
   * =====================================================
   */

  const radiusOptions: {
    value: Radius;

    label: string;
  }[] = [
    {
      value: 300,
      label: '300m',
    },

    {
      value: 500,
      label: '500m',
    },

    {
      value: 1000,
      label: '1km',
    },
  ];

  /**
   * =====================================================
   * 상권 필터
   * =====================================================
   */

  const visibleStores =
    useMemo(
      () => {
        if (
          !mapCategoryFilter
        ) {
          return mapStores;
        }

        return mapStores.filter(
          store =>
            getStoreCategory(
              store,
            ).key ===
            mapCategoryFilter,
        );
      },
      [
        mapStores,
        mapCategoryFilter,
      ],
    );

  /**
   * =====================================================
   * 점포 클러스터
   * =====================================================
   */

  const storeClusters =
    useMemo(
      () =>
        createStoreClusters(
          visibleStores,

          viewport?.level ??
            4,
        ),
      [
        visibleStores,
        viewport?.level,
      ],
    );

  const clusterMarkers =
    useMemo<
      ClusterMarkerData[]
    >(
      () =>
        storeClusters.map(
          cluster => ({
            id:
              cluster.id,

            icon:
              cluster.category.icon,

            label:
              cluster.category.label,

            category:
              cluster.category.key,

            count:
              cluster.stores.length,

            latitude:
              cluster.latitude,

            longitude:
              cluster.longitude,
          }),
        ),
      [
        storeClusters,
      ],
    );

  /**
   * =====================================================
   * 현재 지도 영역 점포 자동 조회
   *
   * 상권 레이어일 때만 조회
   * =====================================================
   */

  useEffect(() => {
    if (
      mapLayer !==
      'commercial'
    ) {
      return;
    }

    if (!viewport) {
      return;
    }

    /**
     * 너무 많이 축소된 경우
     */
    if (
      viewport.level >= 8
    ) {
      setMapStores([]);

      setMapStoresError(
        '지도를 조금 더 확대하면 상권 정보를 확인할 수 있어요.',
      );

      return;
    }

    const timer =
      setTimeout(
        async () => {
          const requestId =
            ++mapStoreRequestRef.current;

          try {
            setMapStoresLoading(
              true,
            );

            setMapStoresError('');

            const stores =
              await getStoresInRectangle(
                viewport.bounds,
              );

            if (
              requestId !==
              mapStoreRequestRef.current
            ) {
              return;
            }

            setMapStores(
              stores,
            );
          } catch (error) {
            if (
              requestId !==
              mapStoreRequestRef.current
            ) {
              return;
            }

            console.error(
              '현재 지도 점포 조회 실패:',
              error,
            );

            setMapStores([]);

            setMapStoresError(
              '현재 지도 영역의 점포 정보를 불러오지 못했습니다.',
            );
          } finally {
            if (
              requestId ===
              mapStoreRequestRef.current
            ) {
              setMapStoresLoading(
                false,
              );
            }
          }
        },
        450,
      );

    return () => {
      clearTimeout(
        timer,
      );
    };
  }, [
    mapLayer,
    viewport?.bounds.south,
    viewport?.bounds.west,
    viewport?.bounds.north,
    viewport?.bounds.east,
    viewport?.level,
  ]);

  /**
   * =====================================================
   * 위치 정보 조회
   * =====================================================
   */

  const loadLocationInfo =
    async (
      latitude: number,
      longitude: number,
    ) => {
      try {
        setPointLoading(
          true,
        );

        const [
          region,
          address,
        ] =
          await Promise.all([
            getRegionFromCoords(
              latitude,
              longitude,
            ),

            getAddressFromCoords(
              latitude,
              longitude,
            ),
          ]);

        if (region) {
          setSelectedDong(
            region.administrativeDongName,
          );

          setSelectedLabel(
            `${region.administrativeDongName} 내 선택 위치`,
          );
        } else {
          setSelectedDong('');
        }

        setAddressInfo(
          address,
        );

        if (
          region &&
          address
        ) {
          setBuildingLotInfo(
            createBuildingLotInfo(
              region,
              address,
            ),
          );
        } else {
          setBuildingLotInfo(
            null,
          );
        }
      } catch (error) {
        console.error(
          '위치 정보 조회 실패:',
          error,
        );
      } finally {
        setPointLoading(
          false,
        );
      }
    };

  /**
   * =====================================================
   * 위치 선택
   * =====================================================
   */

  const selectLocation =
    async (
      latitude: number,
      longitude: number,
      label =
        '선택한 위치',
    ) => {
      setSelectedPoint({
        lat:
          latitude,

        lng:
          longitude,
      });

      setSelectedDong('');

      setSelectedLabel(
        label,
      );

      setAddressInfo(
        null,
      );

      setBuildingLotInfo(
        null,
      );

      setBuildingInfo(
        null,
      );

      setBuildingError('');

      setSelectedCluster(
        null,
      );

      setSheetMode(
        'summary',
      );

      setSheetOpen(
        true,
      );

      setMapCenter({
        latitude,
        longitude,
      });

      await loadLocationInfo(
        latitude,
        longitude,
      );
    };

  /**
   * =====================================================
   * 지도 클릭
   * =====================================================
   */

  const handleMapPress =
    useCallback(
      async (
        latitude: number,
        longitude: number,
      ) => {
        /**
         * 임대상가 모드는
         * 현재 데이터가 없으므로
         * 지도 클릭으로 위치 선택하지 않음
         */
        if (
          mapLayer ===
          'rental'
        ) {
          return;
        }

        await selectLocation(
          latitude,
          longitude,
        );
      },
      [
        mapLayer,
      ],
    );

  /**
   * =====================================================
   * 클러스터 클릭
   * =====================================================
   */

  const handleClusterPress =
    useCallback(
      (
        marker:
          ClusterMarkerData,
      ) => {
        if (
          mapLayer !==
          'commercial'
        ) {
          return;
        }

        const cluster =
          storeClusters.find(
            item =>
              item.id ===
              marker.id,
          );

        if (!cluster) {
          return;
        }

        setSelectedCluster(
          cluster,
        );

        setSheetMode(
          'cluster',
        );

        setSheetOpen(
          true,
        );
      },
      [
        mapLayer,
        storeClusters,
      ],
    );

  /**
   * =====================================================
   * 클러스터 내부 점포 선택
   * =====================================================
   */

  const handleStoreSelect =
    async (
      store: NearbyStore,
    ) => {
      await selectLocation(
        store.lat,
        store.lng,
        store.name,
      );
    };

  /**
   * =====================================================
   * 레이어 변경
   * =====================================================
   */

  const handleLayerChange =
    (
      layer: MapLayer,
    ) => {
      setMapLayer(
        layer,
      );

      setSheetOpen(
        false,
      );

      setSelectedCluster(
        null,
      );

      /**
       * 상권으로 돌아오면
       * 카테고리 필터는 유지
       */

      if (
        layer ===
        'rental'
      ) {
        setSelectedPoint(
          null,
        );
      }
    };

  /**
   * =====================================================
   * 검색
   * =====================================================
   */

  const handleSearch =
    async () => {
      const query =
        searchQuery.trim();

      if (!query) {
        return;
      }

      try {
        setSearchLoading(
          true,
        );

        const result =
          await searchLocation(
            query,
          );

        if (!result) {
          Alert.alert(
            '검색 결과 없음',
            '검색한 위치를 찾지 못했습니다.',
          );

          return;
        }

        setMapCenter({
          latitude:
            result.lat,

          longitude:
            result.lng,
        });

        setSelectedPoint(
          null,
        );

        setSheetOpen(
          false,
        );
      } catch (error) {
        console.error(
          '지도 검색 실패:',
          error,
        );

        Alert.alert(
          '검색 실패',
          '위치를 검색하지 못했습니다.',
        );
      } finally {
        setSearchLoading(
          false,
        );
      }
    };

  /**
   * =====================================================
   * 현재 위치
   * =====================================================
   */

  const handleCurrentLocation =
    async () => {
      try {
        setCurrentLocationLoading(
          true,
        );

        const current =
          await getCurrentLocation();

        setMapCenter({
          latitude:
            current.latitude,

          longitude:
            current.longitude,
        });

        setSelectedPoint(
          null,
        );

        setSheetOpen(
          false,
        );
      } catch {
        Alert.alert(
          '현재 위치 확인 실패',
          '현재 위치를 가져오지 못했습니다.',
        );
      } finally {
        setCurrentLocationLoading(
          false,
        );
      }
    };

  /**
   * =====================================================
   * 건물 정보 조회
   * =====================================================
   */

  const loadBuilding =
    async () => {
      setSheetMode(
        'building',
      );

      if (
        buildingInfo ||
        buildingLoading
      ) {
        return;
      }

      if (!buildingLotInfo) {
        setBuildingError(
          '건축물대장 조회에 필요한 필지정보를 찾지 못했습니다.',
        );

        return;
      }

      try {
        setBuildingLoading(
          true,
        );

        setBuildingError('');

        const buildings =
          await getBuildingRegister(
            buildingLotInfo,
          );

        if (
          buildings.length ===
          0
        ) {
          setBuildingError(
            '이 위치에서 확인 가능한 건축물 정보가 없습니다.',
          );

          return;
        }

        setBuildingInfo(
          buildings[0],
        );
      } catch (error) {
        setBuildingError(
          error instanceof Error
            ? error.message
            : '건물 정보를 불러오지 못했습니다.',
        );
      } finally {
        setBuildingLoading(
          false,
        );
      }
    };

  /**
   * =====================================================
   * 상권 분석
   * =====================================================
   */

  const handleAnalyze =
    () => {
      if (
        !selectedPoint ||
        !selectedDong
      ) {
        Alert.alert(
          '위치 확인',
          '분석할 위치를 먼저 선택해주세요.',
        );

        return;
      }

      if (
        !selectedBusiness
      ) {
        Alert.alert(
          '업종 선택',
          '분석할 업종을 선택해주세요.',
        );

        return;
      }

      const supported =
        sejongAreas.some(
          area =>
            area.name ===
            selectedDong,
        );

      if (!supported) {
        Alert.alert(
          '지원 지역 안내',
          `현재는 지원되는 세종시 지역만 분석할 수 있습니다.\n\n선택 위치: ${selectedDong}`,
        );

        return;
      }

      router.push({
        pathname:
          '/market-analysis/region-result',

        params: {
          businesses:
            selectedBusiness,

          areas: '',

          detailedLocations:
            JSON.stringify([
              {
                label:
                  selectedLabel,

                dongName:
                  selectedDong,

                coordinates: {
                  lat:
                    selectedPoint.lat,

                  lng:
                    selectedPoint.lng,
                },

                radius:
                  selectedRadius,
              },
            ]),
        },
      });
    };

  /**
   * =====================================================
   * 초기화
   * =====================================================
   */

  const handleReset =
    () => {
      mapStoreRequestRef.current++;

      setMapCenter(
        SEJONG_CENTER,
      );

      setSelectedPoint(
        null,
      );

      setSelectedDong('');

      setSelectedLabel('');

      setAddressInfo(
        null,
      );

      setBuildingLotInfo(
        null,
      );

      setBuildingInfo(
        null,
      );

      setBuildingError('');

      setSelectedCluster(
        null,
      );

      setSheetOpen(
        false,
      );

      setMapCategoryFilter(
        null,
      );
    };

  /**
   * =====================================================
   * 면적 포맷
   * =====================================================
   */

  const formatArea =
    (
      value:
        number | null,
    ) =>
      value === null
        ? '-'
        : `${formatBuildingNumber(
            value,
          )}㎡`;

  return (
    <View
      style={
        styles.screen
      }
    >
      {/* =================================================
          MAP
      ================================================= */}

      <View
        style={
          styles.mapWrapper
        }
      >
        <AddressMap
          latitude={
            mapCenter.latitude
          }
          longitude={
            mapCenter.longitude
          }
          clusterMarkers={
            mapLayer ===
            'commercial'
              ? clusterMarkers
              : []
          }
          selectable={
            mapLayer !==
            'rental'
          }
          onMapPress={
            handleMapPress
          }
          onClusterPress={
            handleClusterPress
          }
          onViewportChange={
            setViewport
          }
          selectedPoint={
            selectedPoint
              ? {
                  latitude:
                    selectedPoint.lat,

                  longitude:
                    selectedPoint.lng,
                }
              : null
          }
          selectedPointLabel={
            selectedLabel ||
            undefined
          }
          radius={
            selectedRadius
          }
        />
      </View>

      {/* =================================================
          SEARCH
      ================================================= */}

      <View
        style={[
          styles.searchArea,

          isSmall &&
            styles.searchAreaSmall,
        ]}
      >
        <View
          style={
            styles.searchBar
          }
        >
          <Text
            style={
              styles.searchIcon
            }
          >
            🔍
          </Text>

          <TextInput
            value={
              searchQuery
            }
            onChangeText={
              setSearchQuery
            }
            onSubmitEditing={
              handleSearch
            }
            placeholder="지역, 건물명, 상권 검색"
            placeholderTextColor="#9CA3AF"
            style={
              styles.searchInput
            }
          />

          {searchLoading ? (
            <ActivityIndicator
              size="small"
              color={
                COLORS.primary
              }
            />
          ) : (
            <TouchableOpacity
              onPress={
                handleSearch
              }
            >
              <Text
                style={
                  styles.searchButtonText
                }
              >
                검색
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* =================================================
          MAIN LAYER TABS
      ================================================= */}

      <View
        style={
          styles.layerTabs
        }
      >
        <TouchableOpacity
          style={[
            styles.layerTab,

            mapLayer ===
              'commercial' &&
              styles.layerTabActive,
          ]}
          onPress={() =>
            handleLayerChange(
              'commercial',
            )
          }
        >
          <Text
            style={
              styles.layerIcon
            }
          >
            📊
          </Text>

          <Text
            style={[
              styles.layerText,

              mapLayer ===
                'commercial' &&
                styles.layerTextActive,
            ]}
          >
            상권
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.layerTab,

            mapLayer ===
              'rental' &&
              styles.layerTabActive,
          ]}
          onPress={() =>
            handleLayerChange(
              'rental',
            )
          }
        >
          <Text
            style={
              styles.layerIcon
            }
          >
            🏪
          </Text>

          <Text
            style={[
              styles.layerText,

              mapLayer ===
                'rental' &&
                styles.layerTextActive,
            ]}
          >
            임대 상가
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.layerTab,

            mapLayer ===
              'building' &&
              styles.layerTabActive,
          ]}
          onPress={() =>
            handleLayerChange(
              'building',
            )
          }
        >
          <Text
            style={
              styles.layerIcon
            }
          >
            🏢
          </Text>

          <Text
            style={[
              styles.layerText,

              mapLayer ===
                'building' &&
                styles.layerTextActive,
            ]}
          >
            건물
          </Text>
        </TouchableOpacity>
      </View>

      {/* =================================================
          COMMERCIAL CATEGORY FILTER
      ================================================= */}

      {mapLayer ===
        'commercial' && (
        <View
          style={
            styles.categoryArea
          }
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.categoryContent
            }
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,

                mapCategoryFilter ===
                  null &&
                  styles.categoryChipActive,
              ]}
              onPress={() =>
                setMapCategoryFilter(
                  null,
                )
              }
            >
              <Text
                style={
                  styles.categoryChipText
                }
              >
                전체
              </Text>
            </TouchableOpacity>

            {STORE_CATEGORIES
              .filter(
                category =>
                  category.key !==
                  'etc',
              )
              .map(
                category => (
                  <TouchableOpacity
                    key={
                      category.key
                    }
                    style={[
                      styles.categoryChip,

                      mapCategoryFilter ===
                        category.key &&
                        styles.categoryChipActive,
                    ]}
                    onPress={() =>
                      setMapCategoryFilter(
                        category.key,
                      )
                    }
                  >
                    <Text
                      style={
                        styles.categoryChipText
                      }
                    >
                      {
                        category.icon
                      }{' '}
                      {
                        category.label
                      }
                    </Text>
                  </TouchableOpacity>
                ),
              )}
          </ScrollView>
        </View>
      )}

      {/* =================================================
          COMMERCIAL STATUS
      ================================================= */}

      {mapLayer ===
        'commercial' && (
        <View
          style={
            styles.mapStatus
          }
        >
          {mapStoresLoading ? (
            <>
              <ActivityIndicator
                size="small"
                color={
                  COLORS.primary
                }
              />

              <Text
                style={
                  styles.mapStatusText
                }
              >
                주변 상권 불러오는 중
              </Text>
            </>
          ) : (
            <Text
              style={
                styles.mapStatusText
              }
            >
              현재 화면{' '}
              <Text
                style={
                  styles.mapStatusStrong
                }
              >
                {
                  visibleStores.length
                }
              </Text>
              개 점포
            </Text>
          )}
        </View>
      )}

      {/* =================================================
          COMMERCIAL ERROR
      ================================================= */}

      {mapLayer ===
        'commercial' &&
        !!mapStoresError && (
          <View
            style={
              styles.mapError
            }
          >
            <Text
              style={
                styles.mapErrorText
              }
            >
              {
                mapStoresError
              }
            </Text>
          </View>
        )}

      {/* =================================================
          RENTAL PLACEHOLDER
      ================================================= */}

      {mapLayer ===
        'rental' && (
        <View
          style={[
            styles.rentalNotice,

            isSmall &&
              styles.rentalNoticeSmall,
          ]}
        >
          <View
            style={
              styles.rentalNoticeIconBox
            }
          >
            <Text
              style={
                styles.rentalNoticeIcon
              }
            >
              🏪
            </Text>
          </View>

          <View
            style={{
              flex: 1,
            }}
          >
            <Text
              style={
                styles.rentalNoticeTitle
              }
            >
              임대 상가 찾기
            </Text>

            <Text
              style={
                styles.rentalNoticeText
              }
            >
              실제 임대 매물 데이터 연동을 준비하고 있습니다.
            </Text>

            <Text
              style={
                styles.rentalNoticeSub
              }
            >
              연동 후에는 지도에서 보증금·월세·면적·층수 등을 확인하고 바로 입지 분석까지 연결할 수 있습니다.
            </Text>
          </View>
        </View>
      )}

      {/* =================================================
          BUILDING GUIDE
      ================================================= */}

      {mapLayer ===
        'building' && (
        <View
          style={
            styles.buildingGuide
          }
        >
          <Text
            style={
              styles.buildingGuideIcon
            }
          >
            🏢
          </Text>

          <View>
            <Text
              style={
                styles.buildingGuideTitle
              }
            >
              건물 정보 확인
            </Text>

            <Text
              style={
                styles.buildingGuideText
              }
            >
              지도에서 건물을 선택해보세요
            </Text>
          </View>
        </View>
      )}

      {/* =================================================
          FLOAT BUTTONS
      ================================================= */}

      <View
        style={
          styles.floatingButtons
        }
      >
        <TouchableOpacity
          style={
            styles.floatButton
          }
          onPress={
            handleReset
          }
        >
          <Text
            style={
              styles.floatText
            }
          >
            ↻
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.floatButton,
            styles.currentButton,
          ]}
          onPress={
            handleCurrentLocation
          }
        >
          {currentLocationLoading ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Text
              style={
                styles.currentText
              }
            >
              ◎
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* =================================================
          POINT LOADING
      ================================================= */}

      {pointLoading && (
        <View
          style={
            styles.pointLoading
          }
        >
          <ActivityIndicator
            size="small"
            color={
              COLORS.primary
            }
          />

          <Text
            style={
              styles.pointLoadingText
            }
          >
            위치 확인 중
          </Text>
        </View>
      )}

      {/* =================================================
          BOTTOM SHEET
      ================================================= */}

      {sheetOpen && (
        <View
          style={[
            styles.sheet,

            isSmall &&
              styles.sheetSmall,
          ]}
        >
          <View
            style={
              styles.sheetHandle
            }
          />

          <TouchableOpacity
            style={
              styles.closeButton
            }
            onPress={() =>
              setSheetOpen(
                false,
              )
            }
          >
            <Text
              style={
                styles.closeText
              }
            >
              ×
            </Text>
          </TouchableOpacity>

          {/* =============================================
              CLUSTER DETAIL
          ============================================= */}

          {sheetMode ===
            'cluster' &&
            selectedCluster && (
              <>
                <View
                  style={
                    styles.clusterHeader
                  }
                >
                  <View
                    style={
                      styles.clusterBigIcon
                    }
                  >
                    <Text
                      style={
                        styles.clusterBigEmoji
                      }
                    >
                      {
                        selectedCluster.category.icon
                      }
                    </Text>
                  </View>

                  <View>
                    <Text
                      style={
                        styles.clusterTitle
                      }
                    >
                      {
                        selectedCluster.category.label
                      }{' '}
                      {
                        selectedCluster.stores.length
                      }
                      곳
                    </Text>

                    <Text
                      style={
                        styles.clusterDescription
                      }
                    >
                      이 구역의 점포 목록
                    </Text>
                  </View>
                </View>

                <ScrollView
                  style={
                    styles.storeList
                  }
                  showsVerticalScrollIndicator={
                    false
                  }
                >
                  {selectedCluster.stores
                    .slice(
                      0,
                      15,
                    )
                    .map(
                      (
                        store,
                        index,
                      ) => (
                        <TouchableOpacity
                          key={
                            store.id ??
                            `${store.name}-${index}`
                          }
                          style={
                            styles.storeRow
                          }
                          onPress={() =>
                            handleStoreSelect(
                              store,
                            )
                          }
                        >
                          <View
                            style={{
                              flex: 1,
                            }}
                          >
                            <Text
                              style={
                                styles.storeName
                              }
                            >
                              {
                                store.name
                              }
                            </Text>

                            <Text
                              numberOfLines={
                                1
                              }
                              style={
                                styles.storeAddress
                              }
                            >
                              {
                                store.address
                              }
                            </Text>
                          </View>

                          <Text
                            style={
                              styles.storeArrow
                            }
                          >
                            ›
                          </Text>
                        </TouchableOpacity>
                      ),
                    )}
                </ScrollView>

                {selectedCluster
                  .stores.length >
                  15 && (
                  <Text
                    style={
                      styles.moreText
                    }
                  >
                    외{' '}
                    {selectedCluster
                      .stores.length -
                      15}
                    개 점포
                  </Text>
                )}
              </>
            )}

          {/* =============================================
              LOCATION SUMMARY
          ============================================= */}

          {sheetMode ===
            'summary' &&
            selectedPoint && (
              <>
                <Text
                  style={
                    styles.sheetEyebrow
                  }
                >
                  선택 위치
                </Text>

                <Text
                  style={
                    styles.sheetTitle
                  }
                >
                  📍{' '}
                  {
                    selectedLabel
                  }
                </Text>

                <Text
                  style={
                    styles.sheetAddress
                  }
                >
                  {addressInfo
                    ?.roadAddress ||
                    addressInfo
                      ?.address ||
                    '주소 확인 중'}
                </Text>

                <Text
                  style={
                    styles.sectionLabel
                  }
                >
                  분석 반경
                </Text>

                <View
                  style={
                    styles.radiusRow
                  }
                >
                  {radiusOptions.map(
                    item => (
                      <TouchableOpacity
                        key={
                          item.value
                        }
                        style={[
                          styles.radiusButton,

                          selectedRadius ===
                            item.value &&
                            styles.radiusButtonActive,
                        ]}
                        onPress={() =>
                          setSelectedRadius(
                            item.value,
                          )
                        }
                      >
                        <Text
                          style={
                            styles.radiusButtonText
                          }
                        >
                          {
                            item.label
                          }
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </View>

                <Text
                  style={
                    styles.sectionLabel
                  }
                >
                  분석 업종
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={
                    false
                  }
                  contentContainerStyle={
                    styles.businessList
                  }
                >
                  {allBusinesses.map(
                    business => (
                      <TouchableOpacity
                        key={
                          business.name
                        }
                        style={[
                          styles.businessChip,

                          selectedBusiness ===
                            business.name &&
                            styles.businessChipActive,
                        ]}
                        onPress={() =>
                          setSelectedBusiness(
                            business.name,
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.businessChipText,

                            selectedBusiness ===
                              business.name &&
                              styles.businessChipTextActive,
                          ]}
                        >
                          {
                            business.name
                          }
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </ScrollView>

                <View
                  style={
                    styles.sheetButtons
                  }
                >
                  <TouchableOpacity
                    style={
                      styles.secondaryButton
                    }
                    onPress={
                      loadBuilding
                    }
                  >
                    <Text
                      style={
                        styles.secondaryText
                      }
                    >
                      건물·상가 정보
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={
                      styles.primaryButton
                    }
                    onPress={
                      handleAnalyze
                    }
                  >
                    <Text
                      style={
                        styles.primaryText
                      }
                    >
                      상권 분석하기
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

          {/* =============================================
              BUILDING DETAIL
          ============================================= */}

          {sheetMode ===
            'building' && (
              <ScrollView
                style={
                  styles.buildingScroll
                }
                showsVerticalScrollIndicator={
                  false
                }
              >
                <TouchableOpacity
                  onPress={() =>
                    setSheetMode(
                      'summary',
                    )
                  }
                >
                  <Text
                    style={
                      styles.backText
                    }
                  >
                    ← 위치 요약
                  </Text>
                </TouchableOpacity>

                {buildingLoading ? (
                  <View
                    style={
                      styles.loadingBox
                    }
                  >
                    <ActivityIndicator
                      color={
                        COLORS.primary
                      }
                    />

                    <Text
                      style={
                        styles.loadingText
                      }
                    >
                      건물 정보를 불러오는 중
                    </Text>
                  </View>
                ) : buildingInfo ? (
                  <>
                    <View
                      style={
                        styles.buildingHero
                      }
                    >
                      <Text
                        style={
                          styles.buildingName
                        }
                      >
                        🏢{' '}
                        {buildingInfo.buildingName ||
                          addressInfo
                            ?.buildingName ||
                          '건물명 정보 없음'}
                      </Text>

                      <Text
                        style={
                          styles.buildingPurpose
                        }
                      >
                        {buildingInfo.mainPurpose ||
                          buildingInfo.etcPurpose ||
                          '용도 정보 없음'}
                      </Text>
                    </View>

                    {(buildingInfo
                      .commercialFloorCount ??
                      0) >
                    0 ? (
                      <View
                        style={
                          styles.commercialBox
                        }
                      >
                        <Text
                          style={
                            styles.commercialTitle
                          }
                        >
                          상업시설 확인됨
                        </Text>

                        <Text
                          style={
                            styles.commercialSub
                          }
                        >
                          상업 관련 층{' '}
                          {
                            buildingInfo.commercialFloorCount
                          }
                          개
                        </Text>

                        {buildingInfo.commercialFloors
                          ?.slice(
                            0,
                            6,
                          )
                          .map(
                            (
                              floor,
                              index,
                            ) => (
                              <View
                                key={
                                  index
                                }
                                style={
                                  styles.floorRow
                                }
                              >
                                <Text
                                  style={
                                    styles.floorName
                                  }
                                >
                                  {floor.floorName ||
                                    (floor.floorNumber !==
                                    null
                                      ? `${floor.floorNumber}층`
                                      : '층 정보 없음')}
                                </Text>

                                <Text
                                  style={
                                    styles.floorPurpose
                                  }
                                >
                                  {floor.etcPurpose ||
                                    floor.mainPurpose}
                                </Text>

                                <Text
                                  style={
                                    styles.floorArea
                                  }
                                >
                                  {formatArea(
                                    floor.area,
                                  )}
                                </Text>
                              </View>
                            ),
                          )}
                      </View>
                    ) : (
                      <View
                        style={
                          styles.noCommercial
                        }
                      >
                        <Text
                          style={
                            styles.noCommercialTitle
                          }
                        >
                          상업 관련 시설 미확인
                        </Text>

                        <Text
                          style={
                            styles.noCommercialText
                          }
                        >
                          층별개요에서 상업 관련 용도를 찾지 못했습니다.
                        </Text>
                      </View>
                    )}

                    <View
                      style={
                        styles.buildingInfoRow
                      }
                    >
                      <InfoBox
                        label="연면적"
                        value={formatArea(
                          buildingInfo.totalArea,
                        )}
                      />

                      <InfoBox
                        label="층수"
                        value={`지상 ${
                          buildingInfo.groundFloorCount ??
                          '-'
                        }층`}
                      />

                      <InfoBox
                        label="사용승인"
                        value={formatBuildingDate(
                          buildingInfo.useApprovalDate,
                        )}
                      />
                    </View>
                  </>
                ) : (
                  <View
                    style={
                      styles.errorBox
                    }
                  >
                    <Text
                      style={
                        styles.errorTitle
                      }
                    >
                      건물 정보를 확인하지 못했어요
                    </Text>

                    <Text
                      style={
                        styles.errorText
                      }
                    >
                      {buildingError ||
                        '건축물 정보가 없습니다.'}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
        </View>
      )}
    </View>
  );
}

/**
 * =====================================================
 * 공통 정보 박스
 * =====================================================
 */

function InfoBox({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <View
      style={
        styles.infoBox
      }
    >
      <Text
        style={
          styles.infoLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.infoValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

/**
 * =====================================================
 * 스타일
 * =====================================================
 */

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,

      position:
        'relative',

      backgroundColor:
        '#FFFFFF',
    },

    mapWrapper: {
      ...StyleSheet.absoluteFillObject,
    },

    /**
     * 검색
     */

    searchArea: {
      position:
        'absolute',

      top: 20,

      left: 22,

      right: 145,
    },

    searchAreaSmall: {
      right: 22,
    },

    searchBar: {
      height: 54,

      paddingHorizontal: 16,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 10,

      borderRadius: 18,

      backgroundColor:
        '#FFFFFF',

      boxShadow:
        '0 4px 18px rgba(0,0,0,0.14)',
    },

    searchIcon: {
      fontSize: 16,
    },

    searchInput: {
      flex: 1,

      height:
        '100%',

      fontSize: 13,

      outlineStyle:
        'none',
    } as any,

    searchButtonText: {
      fontSize: 10,

      fontWeight:
        '900',

      color:
        COLORS.primary,
    },

    /**
     * 메인 레이어
     */

    layerTabs: {
      position:
        'absolute',

      top: 86,

      left: 22,

      flexDirection:
        'row',

      padding: 4,

      gap: 2,

      borderRadius: 18,

      backgroundColor:
        '#FFFFFF',

      boxShadow:
        '0 3px 12px rgba(0,0,0,0.12)',
    },

    layerTab: {
      minWidth: 86,

      paddingHorizontal: 13,

      paddingVertical: 9,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 5,

      borderRadius: 14,
    },

    layerTabActive: {
      backgroundColor:
        '#E7F8EB',
    },

    layerIcon: {
      fontSize: 13,
    },

    layerText: {
      fontSize: 10,

      fontWeight:
        '800',

      color:
        '#6B7280',
    },

    layerTextActive: {
      color:
        '#16863B',
    },

    /**
     * 상권 카테고리
     */

    categoryArea: {
      position:
        'absolute',

      top: 136,

      left: 17,

      right: 17,
    },

    categoryContent: {
      gap: 7,

      paddingHorizontal: 5,
    },

    categoryChip: {
      minHeight: 37,

      paddingHorizontal: 13,

      justifyContent:
        'center',

      borderWidth: 1,

      borderColor:
        '#E5E7EB',

      borderRadius: 20,

      backgroundColor:
        '#FFFFFF',

      boxShadow:
        '0 2px 7px rgba(0,0,0,0.08)',
    },

    categoryChipActive: {
      borderColor:
        '#93D3A3',

      backgroundColor:
        '#EAF8ED',
    },

    categoryChipText: {
      fontSize: 10,

      fontWeight:
        '800',

      color:
        '#374151',
    },

    /**
     * 점포 수
     */

    mapStatus: {
      position:
        'absolute',

      top: 182,

      left: 22,

      minHeight: 34,

      paddingHorizontal: 11,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 7,

      borderRadius: 17,

      backgroundColor:
        'rgba(255,255,255,0.95)',
    },

    mapStatusText: {
      fontSize: 9,

      color:
        '#6B7280',
    },

    mapStatusStrong: {
      fontWeight:
        '900',

      color:
        COLORS.primary,
    },

    mapError: {
      position:
        'absolute',

      top: 222,

      left: 22,

      paddingHorizontal: 12,

      paddingVertical: 8,

      borderRadius: 9,

      backgroundColor:
        '#FFF7E8',
    },

    mapErrorText: {
      fontSize: 9,

      color:
        '#8A6D2B',
    },

    /**
     * 임대 상가 안내
     */

    rentalNotice: {
      position:
        'absolute',

      left: 22,

      bottom: 24,

      width: 340,

      padding: 16,

      flexDirection:
        'row',

      gap: 12,

      borderRadius: 18,

      backgroundColor:
        '#FFFFFF',

      boxShadow:
        '0 4px 18px rgba(0,0,0,0.14)',
    },

    rentalNoticeSmall: {
      left: 12,

      right: 12,

      width:
        'auto',

      bottom: 12,
    },

    rentalNoticeIconBox: {
      width: 46,

      height: 46,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 14,

      backgroundColor:
        '#F0FAF2',
    },

    rentalNoticeIcon: {
      fontSize: 22,
    },

    rentalNoticeTitle: {
      fontSize: 14,

      fontWeight:
        '900',

      color:
        COLORS.text,
    },

    rentalNoticeText: {
      marginTop: 4,

      fontSize: 9,

      fontWeight:
        '700',

      color:
        '#374151',
    },

    rentalNoticeSub: {
      marginTop: 5,

      maxWidth: 245,

      fontSize: 8,

      lineHeight: 13,

      color:
        '#6B7280',
    },

    /**
     * 건물 안내
     */

    buildingGuide: {
      position:
        'absolute',

      top: 142,

      left: 22,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 9,

      paddingHorizontal: 13,

      paddingVertical: 10,

      borderRadius: 14,

      backgroundColor:
        '#FFFFFF',

      boxShadow:
        '0 2px 8px rgba(0,0,0,0.10)',
    },

    buildingGuideIcon: {
      fontSize: 18,
    },

    buildingGuideTitle: {
      fontSize: 10,

      fontWeight:
        '900',

      color:
        COLORS.text,
    },

    buildingGuideText: {
      marginTop: 2,

      fontSize: 8,

      color:
        '#6B7280',
    },

    /**
     * 우측 버튼
     */

    floatingButtons: {
      position:
        'absolute',

      right: 20,

      top: 145,

      gap: 9,
    },

    floatButton: {
      width: 48,

      height: 48,

      borderRadius: 24,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#FFFFFF',

      boxShadow:
        '0 3px 10px rgba(0,0,0,0.15)',
    },

    currentButton: {
      backgroundColor:
        COLORS.primary,
    },

    floatText: {
      fontSize: 21,

      fontWeight:
        '900',
    },

    currentText: {
      fontSize: 21,

      fontWeight:
        '900',

      color:
        '#FFFFFF',
    },

    /**
     * 위치 로딩
     */

    pointLoading: {
      position:
        'absolute',

      top: 230,

      left: 22,

      padding: 9,

      borderRadius: 10,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 6,

      backgroundColor:
        '#FFFFFF',
    },

    pointLoadingText: {
      fontSize: 9,

      color:
        COLORS.textSecondary,
    },

    /**
     * Bottom sheet
     */

    sheet: {
      position:
        'absolute',

      left:
        '50%',

      bottom: 18,

      width: 500,

      maxHeight:
        '68%',

      padding: 18,

      borderRadius: 22,

      backgroundColor:
        '#FFFFFF',

      transform: [
        {
          translateX:
            -250,
        },
      ],

      boxShadow:
        '0 0 24px rgba(0,0,0,0.18)',
    },

    sheetSmall: {
      left: 12,

      right: 12,

      width:
        'auto',

      transform: [],

      bottom: 10,
    },

    sheetHandle: {
      width: 42,

      height: 4,

      alignSelf:
        'center',

      marginBottom: 13,

      borderRadius: 3,

      backgroundColor:
        '#D1D5DB',
    },

    closeButton: {
      position:
        'absolute',

      top: 15,

      right: 15,

      width: 32,

      height: 32,

      borderRadius: 16,

      justifyContent:
        'center',

      alignItems:
        'center',

      backgroundColor:
        '#F4F4F4',

      zIndex: 20,
    },

    closeText: {
      fontSize: 20,

      color:
        '#555555',
    },

    /**
     * Cluster
     */

    clusterHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 12,

      paddingRight: 40,
    },

    clusterBigIcon: {
      width: 48,

      height: 48,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 15,

      backgroundColor:
        '#F1FFF4',
    },

    clusterBigEmoji: {
      fontSize: 23,
    },

    clusterTitle: {
      fontSize: 17,

      fontWeight:
        '900',

      color:
        COLORS.text,
    },

    clusterDescription: {
      marginTop: 4,

      fontSize: 9,

      color:
        COLORS.textSecondary,
    },

    storeList: {
      marginTop: 13,

      maxHeight: 300,
    },

    storeRow: {
      minHeight: 54,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingVertical: 9,

      borderBottomWidth: 1,

      borderBottomColor:
        '#EEEEEE',
    },

    storeName: {
      fontSize: 11,

      fontWeight:
        '800',

      color:
        COLORS.text,
    },

    storeAddress: {
      marginTop: 4,

      fontSize: 8,

      color:
        COLORS.textSecondary,
    },

    storeArrow: {
      marginLeft: 10,

      fontSize: 23,

      color:
        '#9CA3AF',
    },

    moreText: {
      marginTop: 8,

      textAlign:
        'center',

      fontSize: 8,

      color:
        COLORS.textSecondary,
    },

    /**
     * 위치 상세
     */

    sheetEyebrow: {
      fontSize: 8,

      fontWeight:
        '800',

      color:
        '#9CA3AF',
    },

    sheetTitle: {
      marginTop: 5,

      paddingRight: 40,

      fontSize: 17,

      fontWeight:
        '900',

      color:
        COLORS.text,
    },

    sheetAddress: {
      marginTop: 6,

      paddingRight: 40,

      fontSize: 9,

      lineHeight: 14,

      color:
        COLORS.textSecondary,
    },

    sectionLabel: {
      marginTop: 14,

      marginBottom: 7,

      fontSize: 9,

      fontWeight:
        '900',

      color:
        '#4B5563',
    },

    radiusRow: {
      flexDirection:
        'row',

      gap: 7,
    },

    radiusButton: {
      flex: 1,

      minHeight: 36,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderWidth: 1,

      borderColor:
        '#E5E7EB',

      borderRadius: 10,
    },

    radiusButtonActive: {
      borderColor:
        COLORS.primary,

      backgroundColor:
        '#EFFBF2',
    },

    radiusButtonText: {
      fontSize: 9,

      fontWeight:
        '700',
    },

    businessList: {
      gap: 6,

      paddingRight: 8,
    },

    businessChip: {
      paddingHorizontal: 11,

      paddingVertical: 7,

      borderRadius: 16,

      borderWidth: 1,

      borderColor:
        '#E5E7EB',

      backgroundColor:
        '#FFFFFF',
    },

    businessChipActive: {
      borderColor:
        COLORS.primary,

      backgroundColor:
        COLORS.primary,
    },

    businessChipText: {
      fontSize: 9,

      fontWeight:
        '700',

      color:
        '#4B5563',
    },

    businessChipTextActive: {
      color:
        '#FFFFFF',
    },

    sheetButtons: {
      marginTop: 14,

      flexDirection:
        'row',

      gap: 8,
    },

    secondaryButton: {
      flex: 1,

      minHeight: 44,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderWidth: 1,

      borderColor:
        '#D1D5DB',

      borderRadius: 11,
    },

    secondaryText: {
      fontSize: 10,

      fontWeight:
        '800',
    },

    primaryButton: {
      flex: 1.2,

      minHeight: 44,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 11,

      backgroundColor:
        COLORS.neonLime,
    },

    primaryText: {
      fontSize: 10,

      fontWeight:
        '900',
    },

    /**
     * 건물 상세
     */

    buildingScroll: {
      maxHeight: 420,
    },

    backText: {
      marginBottom: 11,

      fontSize: 9,

      fontWeight:
        '800',

      color:
        COLORS.primary,
    },

    loadingBox: {
      minHeight: 140,

      justifyContent:
        'center',

      alignItems:
        'center',
    },

    loadingText: {
      marginTop: 8,

      fontSize: 9,

      color:
        COLORS.textSecondary,
    },

    buildingHero: {
      padding: 14,

      borderRadius: 13,

      backgroundColor:
        '#F1FFF4',
    },

    buildingName: {
      fontSize: 14,

      fontWeight:
        '900',
    },

    buildingPurpose: {
      marginTop: 5,

      fontSize: 9,

      color:
        COLORS.primary,
    },

    commercialBox: {
      marginTop: 10,

      padding: 13,

      borderWidth: 1,

      borderColor:
        '#D8EFDD',

      borderRadius: 12,
    },

    commercialTitle: {
      fontSize: 11,

      fontWeight:
        '900',

      color:
        COLORS.primary,
    },

    commercialSub: {
      marginTop: 4,

      fontSize: 8,

      color:
        COLORS.textSecondary,
    },

    floorRow: {
      marginTop: 9,

      paddingTop: 9,

      borderTopWidth: 1,

      borderTopColor:
        '#EEEEEE',
    },

    floorName: {
      fontSize: 9,

      fontWeight:
        '900',
    },

    floorPurpose: {
      marginTop: 3,

      fontSize: 8,

      color:
        COLORS.textSecondary,
    },

    floorArea: {
      marginTop: 3,

      fontSize: 8,

      color:
        COLORS.primary,
    },

    noCommercial: {
      marginTop: 10,

      padding: 13,

      borderRadius: 12,

      backgroundColor:
        '#F7F8F7',
    },

    noCommercialTitle: {
      fontSize: 10,

      fontWeight:
        '900',
    },

    noCommercialText: {
      marginTop: 5,

      fontSize: 8,

      lineHeight: 13,

      color:
        COLORS.textSecondary,
    },

    buildingInfoRow: {
      marginTop: 10,

      flexDirection:
        'row',

      gap: 7,
    },

    infoBox: {
      flex: 1,

      padding: 10,

      borderRadius: 10,

      backgroundColor:
        '#F7F9F7',
    },

    infoLabel: {
      fontSize: 8,

      color:
        COLORS.textSecondary,
    },

    infoValue: {
      marginTop: 4,

      fontSize: 9,

      fontWeight:
        '800',
    },

    errorBox: {
      padding: 13,

      borderRadius: 11,

      backgroundColor:
        '#FFF4F4',
    },

    errorTitle: {
      fontSize: 10,

      fontWeight:
        '900',

      color:
        '#9F3636',
    },

    errorText: {
      marginTop: 5,

      fontSize: 8,

      lineHeight: 13,

      color:
        '#B45353',
    },
  });