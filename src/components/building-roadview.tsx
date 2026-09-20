import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface BuildingRoadviewProps {
  latitude: number;

  longitude: number;

  buildingName?: string;

  address?: string;

  onClose: () => void;
}

export default function BuildingRoadview({
  buildingName,
  onClose,
}: BuildingRoadviewProps) {
  return (
    <View
      style={
        styles.overlay
      }
    >
      <View
        style={
          styles.card
        }
      >
        <Text
          style={
            styles.icon
          }
        >
          🛣️
        </Text>

        <Text
          style={
            styles.title
          }
        >
          {buildingName ||
            '거리뷰'}
        </Text>

        <Text
          style={
            styles.description
          }
        >
          현재 거리뷰 기능은 웹 버전에서 지원합니다.
        </Text>

        <TouchableOpacity
          style={
            styles.button
          }
          onPress={
            onClose
          }
        >
          <Text
            style={
              styles.buttonText
            }
          >
            닫기
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,

      zIndex: 9999,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        'rgba(0,0,0,0.55)',
    },

    card: {
      width: '85%',

      maxWidth: 400,

      padding: 24,

      alignItems:
        'center',

      borderRadius: 20,

      backgroundColor:
        '#FFFFFF',
    },

    icon: {
      fontSize: 38,
    },

    title: {
      marginTop: 12,

      fontSize: 17,

      fontWeight:
        '900',
    },

    description: {
      marginTop: 8,

      textAlign:
        'center',

      fontSize: 11,

      color:
        '#6B7280',
    },

    button: {
      marginTop: 18,

      minWidth: 110,

      paddingVertical: 12,

      alignItems:
        'center',

      borderRadius: 12,

      backgroundColor:
        '#22A447',
    },

    buttonText: {
      color:
        '#FFFFFF',

      fontWeight:
        '900',
    },
  });