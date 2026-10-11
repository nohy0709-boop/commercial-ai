import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/services/auth';

export type PostCategory = 'question' | 'review' | 'info';

export const CATEGORY_LABELS: Record<PostCategory, string> = {
  question: '질문',
  review: '후기',
  info: '정보공유',
};

export const CATEGORY_COLORS: Record<PostCategory, { fg: string; bg: string }> = {
  question: { fg: '#0EA5E9', bg: '#F0F9FF' },
  review: { fg: '#16A34A', bg: '#ECFDF3' },
  info: { fg: '#F59E0B', bg: '#FFFBEB' },
};

export type AttachedAnalysis = {
  businessName: string;
  areaName: string;
  rank?: number;
  totalCount?: number;
  suitabilityScore?: number;
  floatingPopulation?: number;
  storeCount?: number;
  competitionDensity?: number;
  averageSalesPerStore?: number;
  analysisType?: string;
  radius?: number;
};

export type Post = {
  id: string;
  user_id: string;
  author_nickname: string;
  category: PostCategory;
  title: string;
  content: string;
  business_tag: string | null;
  region_tag: string | null;
  attached_analysis: AttachedAnalysis | null;
  created_at: string;
  commentCount: number;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  author_nickname: string;
  content: string;
  created_at: string;
};

export type PostFilter = {
  category?: PostCategory | 'all';
  region?: string | null;
  business?: string | null;
};

function mapPost(row: any): Post {
  const count = Array.isArray(row.comments) ? row.comments[0]?.count ?? 0 : 0;
  const { comments, ...rest } = row;
  return { ...rest, commentCount: count } as Post;
}

export async function getPosts(filter: PostFilter = {}): Promise<Post[]> {
  let query = supabase
    .from('posts')
    .select('*, comments(count)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (filter.category && filter.category !== 'all') {
    query = query.eq('category', filter.category);
  }
  if (filter.region) query = query.eq('region_tag', filter.region);
  if (filter.business) query = query.eq('business_tag', filter.business);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapPost);
}

export async function getPost(id: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, comments(count)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPost(data) : null;
}

async function requireUserInfo() {
  const user = await getCurrentUser();
  if (!user) throw new Error('LOGIN_REQUIRED');
  const nickname =
    (user.user_metadata as { nickname?: string } | undefined)?.nickname ?? '익명';
  return { userId: user.id, nickname };
}

export async function createPost(input: {
  category: PostCategory;
  title: string;
  content: string;
  businessTag?: string | null;
  regionTag?: string | null;
  attachedAnalysis?: AttachedAnalysis | null;
}): Promise<string> {
  const { userId, nickname } = await requireUserInfo();
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      author_nickname: nickname,
      category: input.category,
      title: input.title.trim(),
      content: input.content.trim(),
      business_tag: input.businessTag ?? null,
      region_tag: input.regionTag ?? null,
      attached_analysis: input.attachedAnalysis ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
}

export async function getComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Comment[];
}

export async function addComment(postId: string, content: string): Promise<void> {
  const { userId, nickname } = await requireUserInfo();
  const { error } = await supabase.from('comments').insert({
    post_id: postId,
    user_id: userId,
    author_nickname: nickname,
    content: content.trim(),
  });
  if (error) throw error;
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw error;
}

export function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}일 전`;
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}