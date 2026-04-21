import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useAdmin() {
  const { user, role } = useAuth();
  
  const [vets, setVets] = useState<any[]>([]);
  const [assocs, setAssocs] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAll = useCallback(async () => {
    if (!user || role !== "admin") return;
    setLoading(true);
    
    const [vetsRes, assocsRes, postsRes, blogsRes] = await Promise.all([
      supabase.from("veterinarians").select("*").order("created_at", { ascending: false }),
      supabase.from("associations").select("*").order("created_at", { ascending: false }),
      supabase.from("posts").select("*").order("created_at", { ascending: false }),
      supabase.from("blog_articles").select("*, profiles(full_name)").order("created_at", { ascending: false }),
    ]);

    setVets(vetsRes.data ?? []);
    setAssocs(assocsRes.data ?? []);
    setPosts(postsRes.data ?? []);
    setBlogs(blogsRes.data ?? []);
    
    setLoading(false);
  }, [user, role]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const verifyVet = async (id: string, is_verified: boolean) => {
    await supabase.from("veterinarians").update({ is_verified }).eq("id", id);
    loadAll();
  };

  const verifyAssoc = async (id: string, is_verified: boolean) => {
    await supabase.from("associations").update({ is_verified }).eq("id", id);
    loadAll();
  };

  const deletePost = async (id: string) => {
    await supabase.from("posts").delete().eq("id", id);
    loadAll();
  };

  const toggleBlogStatus = async (id: string, is_published: boolean) => {
    await supabase.from("blog_articles").update({ 
      is_published,
      published_at: is_published ? new Date().toISOString() : null
    }).eq("id", id);
    loadAll();
  };

  const deleteBlog = async (id: string) => {
    await supabase.from("blog_articles").delete().eq("id", id);
    loadAll();
  };

  const addBlogArticle = async (fields: {
    title: string;
    content: string;
    category: string;
    excerpt?: string;
    image_url?: string;
  }) => {
    if (!user) return;
    const { error } = await supabase.from("blog_articles").insert({
      author_id: user.id,
      title: fields.title,
      content: fields.content,
      category: fields.category as any,
      excerpt: fields.excerpt || null,
      image_url: fields.image_url || null,
      is_published: true,
      published_at: new Date().toISOString(),
    });
    if (!error) loadAll();
    return error;
  };

  const updateBlogArticle = async (id: string, fields: {
    title?: string;
    content?: string;
    category?: string;
    excerpt?: string;
    image_url?: string;
  }) => {
    const updateData: Record<string, any> = {};
    if (fields.title !== undefined) updateData.title = fields.title;
    if (fields.content !== undefined) updateData.content = fields.content;
    if (fields.category !== undefined) updateData.category = fields.category;
    if (fields.excerpt !== undefined) updateData.excerpt = fields.excerpt;
    if (fields.image_url !== undefined) updateData.image_url = fields.image_url;
    
    const { error } = await supabase.from("blog_articles").update(updateData).eq("id", id);
    if (!error) loadAll();
    return error;
  };

  return {
    vets, assocs, posts, blogs, loading,
    verifyVet, verifyAssoc, deletePost, toggleBlogStatus, deleteBlog,
    addBlogArticle, updateBlogArticle,
    refresh: loadAll
  };
}
