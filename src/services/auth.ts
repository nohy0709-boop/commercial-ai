import { supabase } from '@/lib/supabase';

export interface SignUpData {
  email: string;
  password: string;
  nickname: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export async function signUp({
  email,
  password,
  nickname,
}: SignUpData) {
  const redirectUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : undefined;

  const {
    data,
    error,
  } = await supabase.auth.signUp({
    email: email.trim(),
    password,

    options: {
      data: {
        nickname:
          nickname.trim(),
      },

      emailRedirectTo:
        redirectUrl,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signIn({
  email,
  password,
}: SignInData) {
  const {
    data,
    error,
  } =
    await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const {
    error,
  } =
    await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getCurrentUser() {
  const {
    data,
    error,
  } =
    await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user ?? null;
}

export async function getCurrentSession() {
  const {
    data,
    error,
  } =
    await supabase.auth.getSession();

  if (error) {
    return null;
  }

  return data.session ?? null;
}

export async function isLoggedIn() {
  const session =
    await getCurrentSession();

  return !!session;
}