import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Post {
  id: string;
  author_id: string;
  author_type: "vet" | "assoc";
  author_name: string;
  content: string;
  image_url?: string;
  likes_count: number;
  created_at: string;
  user_liked?: boolean;
}

export function usePosts(authorId: string, authorType: "vet" | "assoc") {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("author_id", authorId)
      .order("created_at", { ascending: false });

    const postsData = data ?? [];
    setPosts(postsData);

    // Load user's likes
    if (user && postsData.length > 0) {
      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postsData.map(p => p.id));
      setLikedIds(new Set((likes ?? []).map((l: any) => l.post_id)));
    }
    setLoading(false);
  }, [authorId, user]);

  useEffect(() => { load(); }, [load]);

  const addPost = async (content: string, imageUrl?: string) => {
    if (!user) return;
    const { error } = await supabase.from("posts").insert({
      author_id: authorId,
      author_type: authorType,
      author_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Auteur",
      content,
      image_url: imageUrl || null,
    });
    if (!error) load();
    return error;
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    if (likedIds.has(postId)) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      setLikedIds(s => { const n = new Set(s); n.delete(postId); return n; });
      setPosts(ps => ps.map(p => p.id === postId ? { ...p, likes_count: p.likes_count - 1 } : p));
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
      setLikedIds(s => new Set([...s, postId]));
      setPosts(ps => ps.map(p => p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p));
    }
  };

  const deletePost = async (postId: string) => {
    await supabase.from("posts").delete().eq("id", postId);
    setPosts(ps => ps.filter(p => p.id !== postId));
  };

  return { posts, loading, likedIds, addPost, toggleLike, deletePost, refresh: load };
}
