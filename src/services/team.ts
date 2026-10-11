import * as Linking from 'expo-linking';

import { supabase } from '@/lib/supabase';
import type { AnalysisHistoryItem } from '@/services/analysisHistory';
import { getCurrentUser } from '@/services/auth';
import type { AttachedAnalysis } from '@/services/community';

/* ---------- 타입 ---------- */

export type Team = {
  id: string;
  name: string;
  inviteCode: string;
  role: 'owner' | 'member';
  memberCount: number;
};

export type TeamMember = {
  userId: string;
  nickname: string;
  role: 'owner' | 'member';
};

export type TeamDetail = {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  members: TeamMember[];
};

export type Candidate = {
  id: string;
  analysis: AttachedAnalysis;
  addedBy: string;
  addedByNickname: string;
  createdAt: string;
  up: number;
  down: number;
  /** 내가 던진 표: 1(찬성) / -1(반대) / 0(안 함) */
  myVote: 1 | -1 | 0;
  noteCount: number;
};

export type CandidateNote = {
  id: string;
  userId: string;
  nickname: string;
  content: string;
  createdAt: string;
};

/* ---------- 도우미 ---------- */

async function me() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('LOGIN_REQUIRED');
  }
  const nickname =
    (user.user_metadata as { nickname?: string } | undefined)?.nickname ?? '익명';
  return { id: user.id, nickname };
}

/** 에러를 사람이 읽을 수 있는 문장으로 바꿔요 */
export function teamErrorMessage(e: unknown): string {
  const text = String((e as any)?.message ?? e ?? '');
  if (text.includes('LOGIN_REQUIRED')) return '로그인이 필요해요.';
  if (text.includes('INVALID_CODE')) return '초대 코드를 찾을 수 없어요. 코드를 다시 확인해주세요.';
  if (text.includes('TEAM_FULL')) return '이 팀은 정원(10명)이 가득 찼어요.';
  if (text.includes('NAME_REQUIRED')) return '팀 이름을 입력해주세요.';
  return '잠시 후 다시 시도해주세요.';
}

/** 즐겨찾기(분석 기록)를 후보지 한 줄로 바꿔요 (커뮤니티 첨부와 같은 규칙) */
export function favoriteToAttached(item: AnalysisHistoryItem): AttachedAnalysis {
  const r: any = item.resultData ?? {};
  const first: any = Array.isArray(r) ? r[0] : r;
  return {
    businessName: item.businessName,
    areaName: first?.areaName ?? first?.region ?? item.regions?.[0] ?? '',
    rank: first?.rank,
    totalCount: first?.totalCount,
    suitabilityScore: first?.suitabilityScore ?? first?.score,
    floatingPopulation: first?.floatingPopulation,
    storeCount: first?.storeCount,
    competitionDensity: first?.competitionDensity,
    averageSalesPerStore: first?.averageSalesPerStore,
    analysisType: item.type,
    radius: first?.radius,
  };
}

/* ---------- 팀 ---------- */

export async function getMyTeams(): Promise<Team[]> {
  const { id } = await me();

  const { data, error } = await supabase
    .from('team_members')
    .select('role, teams ( id, name, invite_code )')
    .eq('user_id', id);
  if (error) throw error;

  const rows = (data ?? [])
    .map((r: any) => {
      const t = Array.isArray(r.teams) ? r.teams[0] : r.teams;
      return t ? { role: r.role as 'owner' | 'member', team: t } : null;
    })
    .filter(Boolean) as { role: 'owner' | 'member'; team: any }[];

  if (rows.length === 0) return [];

  const { data: all, error: countError } = await supabase
    .from('team_members')
    .select('team_id')
    .in(
      'team_id',
      rows.map(r => r.team.id),
    );
  if (countError) throw countError;

  const counts = new Map<string, number>();
  (all ?? []).forEach((m: any) => {
    counts.set(m.team_id, (counts.get(m.team_id) ?? 0) + 1);
  });

  return rows.map(r => ({
    id: r.team.id,
    name: r.team.name,
    inviteCode: r.team.invite_code,
    role: r.role,
    memberCount: counts.get(r.team.id) ?? 1,
  }));
}

export async function createTeam(name: string): Promise<string> {
  const { nickname } = await me();
  const { data, error } = await supabase.rpc('create_team', {
    p_name: name,
    p_nickname: nickname,
  });
  if (error) throw error;
  return data as string;
}

export async function joinTeam(code: string): Promise<string> {
  const { nickname } = await me();
  const { data, error } = await supabase.rpc('join_team', {
    p_code: code,
    p_nickname: nickname,
  });
  if (error) throw error;
  return data as string;
}

export async function getTeamDetail(teamId: string): Promise<TeamDetail | null> {
  const { data: team, error } = await supabase
    .from('teams')
    .select('id, name, invite_code, owner_id')
    .eq('id', teamId)
    .maybeSingle();
  if (error) throw error;
  if (!team) return null;

  const { data: members, error: memberError } = await supabase
    .from('team_members')
    .select('user_id, nickname, role')
    .eq('team_id', teamId)
    .order('joined_at', { ascending: true });
  if (memberError) throw memberError;

  return {
    id: team.id,
    name: team.name,
    inviteCode: team.invite_code,
    ownerId: team.owner_id,
    members: (members ?? []).map((m: any) => ({
      userId: m.user_id,
      nickname: m.nickname,
      role: m.role,
    })),
  };
}

export async function leaveTeam(teamId: string): Promise<void> {
  const { id } = await me();
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', id);
  if (error) throw error;
}

export async function deleteTeam(teamId: string): Promise<void> {
  const { error } = await supabase.from('teams').delete().eq('id', teamId);
  if (error) throw error;
}

export async function removeMember(teamId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId);
  if (error) throw error;
}

/* ---------- 후보지 ---------- */

export async function getCandidates(teamId: string): Promise<Candidate[]> {
  const { id: myId } = await me();

  const { data, error } = await supabase
    .from('team_candidates')
    .select('id, added_by, added_by_nickname, analysis, created_at')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const rows = data ?? [];
  if (rows.length === 0) return [];
  const ids = rows.map((r: any) => r.id);

  const [votesResult, notesResult] = await Promise.all([
    supabase.from('candidate_votes').select('candidate_id, user_id, vote').in('candidate_id', ids),
    supabase.from('candidate_notes').select('candidate_id').in('candidate_id', ids),
  ]);
  if (votesResult.error) throw votesResult.error;
  if (notesResult.error) throw notesResult.error;

  return rows.map((r: any) => {
    const votes = (votesResult.data ?? []).filter((v: any) => v.candidate_id === r.id);
    const mine = votes.find((v: any) => v.user_id === myId);
    return {
      id: r.id,
      analysis: r.analysis as AttachedAnalysis,
      addedBy: r.added_by,
      addedByNickname: r.added_by_nickname,
      createdAt: r.created_at,
      up: votes.filter((v: any) => v.vote === 1).length,
      down: votes.filter((v: any) => v.vote === -1).length,
      myVote: (mine?.vote ?? 0) as 1 | -1 | 0,
      noteCount: (notesResult.data ?? []).filter((n: any) => n.candidate_id === r.id).length,
    };
  });
}

export async function addCandidate(teamId: string, analysis: AttachedAnalysis): Promise<void> {
  const { id, nickname } = await me();
  const { error } = await supabase.from('team_candidates').insert({
    team_id: teamId,
    added_by: id,
    added_by_nickname: nickname,
    analysis,
  });
  if (error) throw error;
}

export async function removeCandidate(candidateId: string): Promise<void> {
  const { error } = await supabase.from('team_candidates').delete().eq('id', candidateId);
  if (error) throw error;
}

/** 같은 표를 다시 누르면 취소, 다른 표를 누르면 바꿔요 */
export async function setVote(
  candidateId: string,
  vote: 1 | -1,
  current: 1 | -1 | 0,
): Promise<void> {
  const { id } = await me();
  if (current === vote) {
    const { error } = await supabase
      .from('candidate_votes')
      .delete()
      .eq('candidate_id', candidateId)
      .eq('user_id', id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from('candidate_votes')
    .upsert({ candidate_id: candidateId, user_id: id, vote }, { onConflict: 'candidate_id,user_id' });
  if (error) throw error;
}

/* ---------- 메모 ---------- */

export async function getNotes(candidateId: string): Promise<CandidateNote[]> {
  const { data, error } = await supabase
    .from('candidate_notes')
    .select('id, user_id, nickname, content, created_at')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((n: any) => ({
    id: n.id,
    userId: n.user_id,
    nickname: n.nickname,
    content: n.content,
    createdAt: n.created_at,
  }));
}

export async function addNote(candidateId: string, content: string): Promise<void> {
  const { id, nickname } = await me();
  const { error } = await supabase.from('candidate_notes').insert({
    candidate_id: candidateId,
    user_id: id,
    nickname,
    content: content.trim(),
  });
  if (error) throw error;
}

export async function deleteNote(noteId: string): Promise<void> {
  const { error } = await supabase.from('candidate_notes').delete().eq('id', noteId);
  if (error) throw error;
}

/* ---------- 링크 공유 ---------- */

export async function createShareLink(analysis: AttachedAnalysis): Promise<string> {
  const { data, error } = await supabase.rpc('create_share', { p_analysis: analysis });
  if (error) throw error;
  return Linking.createURL('/shared', { queryParams: { code: String(data) } });
}

export async function getShared(code: string): Promise<AttachedAnalysis | null> {
  const { data, error } = await supabase.rpc('get_shared', { p_code: code });
  if (error) throw error;
  return (data as AttachedAnalysis | null) ?? null;
}

/* ---------- 게시글 좋아요 ---------- */

export async function getLikeInfo(postId: string): Promise<{ count: number; liked: boolean }> {
  const user = await getCurrentUser().catch(() => null);

  const { count, error } = await supabase
    .from('post_likes')
    .select('post_id', { count: 'exact', head: true })
    .eq('post_id', postId);
  if (error) throw error;

  let liked = false;
  if (user) {
    const { data } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();
    liked = !!data;
  }

  return { count: count ?? 0, liked };
}

export async function toggleLike(postId: string, liked: boolean): Promise<void> {
  const { id } = await me();
  if (liked) {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: id });
    if (error) throw error;
  }
}