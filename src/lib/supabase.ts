import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.',
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다.',
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage:
        Platform.OS === 'web'
          ? undefined
          : AsyncStorage,

      autoRefreshToken: true,

      persistSession: true,

      detectSessionInUrl:
        Platform.OS === 'web',
    },
  },
);