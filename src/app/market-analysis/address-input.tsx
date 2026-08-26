import AddressMap from '@/components/address-map';
import { sejongAreas } from '@/constants/sejongAreas';
import type { Coordinates } from '@/services/geocoding';
import { getDongFromCoords, searchAddress } from '@/services/geocoding';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

export default function AddressInputScreen() {
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [matchedDong, setMatchedDong] = useState<string | null>(null);

  const handleSearch = async () => {
    Keyboard.dismiss();

    if (!address.trim()) {
      setErrorMessage('주소를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      setMatchedDong(null);
      setCoords(null);

      const location = await searchAddress(address.trim());
      if (!location) {
        setErrorMessage('주소를 찾을 수 없습니다. 정확한 주소를 입력해주세요.');
        return;
      }
      setCoords(location);

      const region = await getDongFromCoords(location.lat, location.lng);
      if (!region) {
        setErrorMessage('행정동 정보를 확인할 수 없습니다.');
        return;
      }

      const known = sejongAreas.find(area => area.name === region.dongName);
      if (!known) {
        setErrorMessage(
          `'${region.dongName}'은(는) 아직 데이터가 준비된 지역이 아니에요.`,
        );
        return;
      }

      setMatchedDong(known.name);
    } catch (error) {
      console.error('주소 검색 오류:', error);
      setErrorMessage(
        error instanceof Error ? error.message : '주소 검색 중 오류가 발생했습니다.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUseThisLocation = () => {
    if (!matchedDong) {
      return;
    }
    router.push({
      pathname: '/market-analysis/location-recommend-result',
      params: {region: matchedDong},
    });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.header}>보유하신 장소의 주소를 입력해주세요</Text>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="예: 세종특별자치시 나성동 123-4"
            placeholderTextColor="#8A8A8A"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity
            style={styles.searchButton}
            activeOpacity={0.7}
            onPress={handleSearch}>
            <Text style={styles.searchButtonText}>검색</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator size="large" style={styles.loading} />}

        {!loading && errorMessage !== '' && (
          <Text style={styles.error}>{errorMessage}</Text>
        )}

        {!loading && coords && (
          <AddressMap latitude={coords.lat} longitude={coords.lng} />
        )}

        {!loading && matchedDong && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>{`인식된 지역: ${matchedDong}`}</Text>
            <TouchableOpacity
              style={styles.analyzeButton}
              activeOpacity={0.7}
              onPress={handleUseThisLocation}>
              <Text style={styles.analyzeButtonText}>이 지역으로 분석하기</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 20, backgroundColor: '#FFFFFF'},
  header: {fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 16},
  searchRow: {flexDirection: 'row', gap: 8, marginBottom: 16},
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A1A1A',
  },
  searchButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  searchButtonText: {color: '#FFFFFF', fontWeight: '700', fontSize: 14},
  loading: {marginTop: 20},
  error: {color: '#D14343', fontSize: 13, marginTop: 8},
  resultBox: {
    marginTop: 16,
    backgroundColor: '#EAF2FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  resultText: {fontSize: 15, fontWeight: '700', color: '#1D4ED8', marginBottom: 12},
  analyzeButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  analyzeButtonText: {color: '#FFFFFF', fontWeight: '700', fontSize: 14},
});