import { useEffect, useState } from 'react';
import {
    Linking,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';

import type {
    BusinessPermitInput,
} from '@/services/businessPermits';
import {
    getBusinessPermitGuide,
} from '@/services/businessPermits';

export default function BusinessPermitGuide(
  props: BusinessPermitInput,
) {
  const [expanded, setExpanded] = useState(false);
  const [linkError, setLinkError] = useState('');
  const { height } = useWindowDimensions();

  const guide = getBusinessPermitGuide(props);

  useEffect(() => {
    setExpanded(false);
    setLinkError('');
  }, [
    props.businessName,
    props.lclsCode,
    props.mclsCode,
    props.sclsCode,
  ]);

  const close = () => {
    setExpanded(false);
  };

  async function openSource(url: string) {
    setLinkError('');

    try {
      await Linking.openURL(url);
    } catch {
      setLinkError(
        '공식 안내를 열지 못했어요. 잠시 후 다시 시도해주세요.',
      );
    }
  }

  if (!guide) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${
          props.businessName ?? '선택 업종'
        } 인허가·준비사항 확인`}
        accessibilityState={{ expanded }}
        style={styles.compactButton}
        onPress={() => {
          setLinkError('');
          setExpanded(true);
        }}
      >
        <Text style={styles.compactIcon}>📋</Text>

        <Text style={styles.compactText}>
          {props.businessName ?? '선택 업종'} 인허가·준비사항 확인
        </Text>

        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {expanded && (
        <Modal
          transparent
          visible
          animationType="slide"
          onRequestClose={close}
        >
          <View style={styles.modalRoot}>
            <Pressable
              style={styles.backdrop}
              accessibilityRole="button"
              accessibilityLabel="인허가 안내 닫기"
              onPress={close}
            />

            <View
              style={[
                styles.sheet,
                { height: height * 0.85 },
              ]}
              accessibilityViewIsModal
            >
              <View style={styles.handle} />

              <View style={styles.sheetHeader}>
                <Text
                  accessibilityRole="header"
                  style={styles.title}
                >
                  {guide.title}
                </Text>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="인허가 안내 닫기"
                  style={styles.closeButton}
                  onPress={close}
                >
                  <Text style={styles.closeText}>
                    닫기 ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.details}
              >
                <Text style={styles.description}>
                  {guide.summary}
                </Text>

                <View style={styles.summary}>
                  <Text style={styles.summaryText}>
                    {guide.kind === 'retail'
                      ? '품목별 조건 확인'
                      : '영업신고 우선 검토'}
                  </Text>

                  <Text style={styles.summaryCaption}>
                    업종에 맞춘 안내 · 지역별 분석에 공통 적용
                  </Text>
                </View>

                {guide.steps.map(step => (
                  <View
                    key={step.id}
                    style={styles.step}
                  >
                    <View style={styles.heading}>
                      <Text style={styles.stepTitle}>
                        {step.title}
                      </Text>

                      <Text style={styles.type}>
                        {step.type}
                      </Text>
                    </View>

                    <Text style={styles.condition}>
                      {step.condition}
                    </Text>

                    {step.preparations.map(item => (
                      <Text
                        key={item}
                        style={styles.bullet}
                      >
                        • {item}
                      </Text>
                    ))}

                    <Text style={styles.agency}>
                      담당: {step.agency}
                    </Text>

                    <Text style={styles.agency}>
                      신청: {step.method}
                    </Text>

                    <TouchableOpacity
                      accessibilityRole="link"
                      style={styles.link}
                      onPress={() =>
                        openSource(step.source.url)
                      }
                    >
                      <Text style={styles.linkText}>
                        {step.source.title} ↗
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <View style={styles.notice}>
                  <Text style={styles.noticeTitle}>
                    신청 전에 확인해주세요
                  </Text>

                  {guide.notes.map(note => (
                    <Text
                      key={note}
                      style={styles.noticeText}
                    >
                      • {note}
                    </Text>
                  ))}
                </View>

                {linkError ? (
                  <Text
                    accessibilityRole="alert"
                    style={styles.error}
                  >
                    {linkError}
                  </Text>
                ) : null}

                <Text style={styles.date}>
                  공식 자료 검토일 {guide.reviewedAt}
                  {' · '}자동 갱신되지 않아요.
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0E6B8',
    backgroundColor: '#FFFAE6',
  },

  compactIcon: {
    fontSize: 17,
  },

  compactText: {
    flex: 1,
    color: '#222544',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
  },

  chevron: {
    fontSize: 24,
    color: '#7E8BA3',
  },

  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(23,35,59,0.45)',
  },

  sheet: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },

  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D5DCE8',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5ECF8',
  },

  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#222544',
  },

  closeButton: {
    minHeight: 44,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeText: {
    color: '#222544',
    fontSize: 13,
    fontWeight: '700',
  },

  scroll: {
    flex: 1,
  },

  details: {
    padding: 20,
    paddingBottom: 32,
    gap: 12,
  },

  description: {
    color: '#7E8BA3',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 8,
  },

  summary: {
    backgroundColor: '#222544',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },

  summaryText: {
    color: '#FFD84D',
    fontSize: 15,
    fontWeight: '800',
  },

  summaryCaption: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 4,
  },

  step: {
    borderWidth: 1,
    borderColor: '#E5ECF8',
    borderRadius: 12,
    padding: 14,
  },

  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },

  stepTitle: {
    fontSize: 14,
    color: '#222544',
    fontWeight: '800',
    flexShrink: 1,
  },

  type: {
    fontSize: 11,
    fontWeight: '700',
    color: '#222544',
    backgroundColor: '#FFF6C2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  condition: {
    color: '#222544',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 20,
    marginVertical: 8,
  },

  bullet: {
    color: '#17233B',
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 4,
  },

  agency: {
    color: '#65728A',
    fontSize: 12,
    lineHeight: 20,
    marginTop: 4,
  },

  link: {
    paddingVertical: 10,
    marginTop: 6,
  },

  linkText: {
    color: '#222544',
    fontSize: 12,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },

  notice: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
  },

  noticeTitle: {
    color: '#222544',
    fontWeight: '800',
    marginBottom: 8,
    fontSize: 13,
  },

  noticeText: {
    color: '#514526',
    fontSize: 12,
    lineHeight: 21,
    marginBottom: 4,
  },

  date: {
    color: '#7E8BA3',
    fontSize: 11,
    lineHeight: 18,
  },

  error: {
    color: '#C62320',
    fontSize: 12,
    lineHeight: 20,
  },
});