import { COLORS } from '@/constants/colors';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  steps: string[];
  currentStep: number;
};

export default function AnalysisStepper({
  steps,
  currentStep,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const active = stepNumber === currentStep;

          return (
            <View key={step} style={styles.itemRow}>
              <Text
                style={[
                  styles.stepText,
                  active && styles.stepTextActive,
                ]}
              >
                {stepNumber} {step}
              </Text>

              {index < steps.length - 1 && (
                <Text style={styles.arrow}>›</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepTextActive: {
    fontWeight: '800',
    color: COLORS.primary,
  },
  arrow: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
