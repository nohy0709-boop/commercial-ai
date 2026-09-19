import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface CurrentLocationResult {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

/**
 * =====================================================
 * 웹 현재 위치
 * =====================================================
 */
function getWebCurrentLocation():
  Promise<CurrentLocationResult> {
  return new Promise(
    (
      resolve,
      reject,
    ) => {
      if (
        typeof navigator ===
          'undefined' ||
        !navigator.geolocation
      ) {
        reject(
          new Error(
            'GEOLOCATION_NOT_SUPPORTED',
          ),
        );

        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude:
              position.coords
                .latitude,

            longitude:
              position.coords
                .longitude,

            accuracy:
              position.coords
                .accuracy ??
              null,
          });
        },

        error => {
          console.error(
            '웹 위치 확인 실패:',
            error,
          );

          if (
            error.code ===
            error.PERMISSION_DENIED
          ) {
            reject(
              new Error(
                'LOCATION_PERMISSION_DENIED',
              ),
            );

            return;
          }

          reject(
            new Error(
              'LOCATION_FAILED',
            ),
          );
        },

        {
          /**
           * 가능한 정확한 GPS 위치 요청
           */
          enableHighAccuracy:
            true,

          /**
           * 최대 10초 기다림
           */
          timeout:
            10000,

          /**
           * 과거 캐시 위치를 사용하지 않음
           */
          maximumAge:
            0,
        },
      );
    },
  );
}

/**
 * =====================================================
 * 현재 위치 가져오기
 * =====================================================
 *
 * Web:
 * 브라우저 Geolocation API
 *
 * Android / iOS:
 * expo-location
 *
 * 결과는 동일하게
 * latitude / longitude 형태로 반환
 */
export async function getCurrentLocation():
  Promise<CurrentLocationResult> {
  /**
   * 웹
   */
  if (
    Platform.OS ===
    'web'
  ) {
    return getWebCurrentLocation();
  }

  /**
   * Android / iOS
   */
  const {
    status,
  } =
    await Location.requestForegroundPermissionsAsync();

  if (
    status !==
    'granted'
  ) {
    throw new Error(
      'LOCATION_PERMISSION_DENIED',
    );
  }

  const location =
    await Location.getCurrentPositionAsync(
      {
        accuracy:
          Location.Accuracy.High,
      },
    );

  return {
    latitude:
      location.coords
        .latitude,

    longitude:
      location.coords
        .longitude,

    accuracy:
      location.coords
        .accuracy,
  };
}