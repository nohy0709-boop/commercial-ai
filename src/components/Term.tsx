import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useState } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextStyle,
    View,
} from 'react-native';

import { COLORS } from '@/constants/colors';
import { findTerm } from '@/constants/glossary';

/**
 * 사용법
 *  1) 용어 설명을 쓰는 화면의 맨 바깥을 <GlossaryProvider> 로 감싸요.
 *  2) 글 속 용어를 <Term k="openRate">개업률</Term> 처럼 써요.
 *     (글자를 안 넣으면 사전에 등록된 용어 이름이 그대로 나와요)
 */

type Ctx = { open: (key: string) => void };
const GlossaryContext = createContext<Ctx | null>(null);

export function GlossaryProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const open = useCallback((key: string) => setActiveKey(key), []);
  const close = useCallback(() => setActiveKey(null), []);

  const entry = activeKey ? findTerm(activeKey) : undefined;

  return (
    <GlossaryContext.Provider value={{ open }}>
      {children}

      <Modal
        visible={!!entry}
        transparent
        animationType="slide"
        onRequestClose={close}
      >
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            {entry ? (
              <>
                <Text style={styles.category}>{entry.category}</Text>
                <Text style={styles.title}>{entry.term}</Text>
                <Text style={styles.short}>{entry.short}</Text>

                {entry.appNote ? (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteLabel}>이 앱에서는</Text>
                    <Text style={styles.noteText}>{entry.appNote}</Text>
                  </View>
                ) : null}

                <View style={styles.buttonRow}>
                  <Pressable
                    style={styles.moreButton}
                    onPress={() => {
                      const key = entry.key;
                      close();
                      router.push({
                        pathname: '/glossary',
                        params: { term: key },
                      } as any);
                    }}
                  >
                    <Text style={styles.moreText}>용어사전에서 더 보기</Text>
                  </Pressable>
                  <Pressable style={styles.closeButton} onPress={close}>
                    <Text style={styles.closeText}>닫기</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </GlossaryContext.Provider>
  );
}

type TermProps = {
  /** glossary.ts 의 key */
  k: string;
  children?: React.ReactNode;
  style?: TextStyle;
};

export function Term({ k, children, style }: TermProps) {
  const ctx = useContext(GlossaryContext);
  const entry = findTerm(k);

  // 사전에 없는 키면 그냥 글자만 보여줌 (화면이 깨지지 않게)
  if (!entry) {
    return <Text style={style}>{children}</Text>;
  }

  return (
    <Text
      style={[styles.term, style]}
      onPress={ctx ? () => ctx.open(k) : undefined}
      suppressHighlighting
    >
      {children ?? entry.term}
    </Text>
  );
}

const styles = StyleSheet.create({
  term: {
    color: COLORS.primaryDark,
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationColor: COLORS.primary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 30,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    marginBottom: 16,
  },
  category: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
  },
  short: {
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.text,
  },
  noteBox: {
    marginTop: 14,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: 14,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.text,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  moreButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  closeButton: {
    width: 80,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});