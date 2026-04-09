import { useState } from "react";
import { Heart, Send, Image, X, Trash2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";
import { Link } from "react-router-dom";

interface PostsSectionProps {
  authorId: string;
  authorType: "vet" | "assoc";
  authorName: string;
  canPost?: boolean;
}

const PostCard = ({
  post, liked, onLike, onDelete, isOwner
}: {
  post: any; liked: boolean; onLike: () => void; onDelete: () => void; isOwner: boolean;
}) => {
  const { user } = useAuth();
  const [showAuthHint, setShowAuthHint] = useState(false);

  const handleLike = () => {
    if (!user) {
      setShowAuthHint(true);
      setTimeout(() => setShowAuthHint(false), 2500);
      return;
    }
    onLike();
  };

  return (
    <div className="post-card bg-white rounded-2xl border border-border/40 p-6 space-y-4 card-shadow">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: "linear-gradient(145deg, hsl(158 42% 22%), hsl(36 82% 58%))" }}>
            {post.author_name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">{post.author_name}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(post.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        {isOwner && (
          <button onClick={onDelete}
            className="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors text-muted-foreground">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Content */}
      <p className="text-muted-foreground text-sm leading-relaxed">{post.content}</p>

      {/* Image */}
      {post.image_url && (
        <img src={post.image_url} alt="" className="w-full rounded-xl object-cover max-h-64" />
      )}

      {/* Like */}
      <div className="flex items-center gap-3 pt-2 border-t border-border/30">
        <button onClick={handleLike}
          className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
            liked ? "text-rose-500" : "text-muted-foreground hover:text-rose-400"
          }`}>
          <Heart className={`h-4 w-4 transition-all ${liked ? "fill-rose-500 scale-110" : ""}`} />
          {post.likes_count}
        </button>
        {showAuthHint && (
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full animate-fade-in">
            <Link to="/auth" className="text-primary hover:underline">Connectez-vous</Link> pour liker
          </span>
        )}
      </div>
    </div>
  );
};

const PostsSection = ({ authorId, authorType, authorName, canPost = false }: PostsSectionProps) => {
  const { user } = useAuth();
  const { posts, loading, likedIds, addPost, toggleLike, deletePost } = usePosts(authorId, authorType);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [posting, setPosting] = useState(false);

  // Only the profile owner (whose user_id matches authorId) can post
  const isOwner = canPost && !!user && user.id === authorId;

  const handlePost = async () => {
    if (!content.trim()) return;
    setPosting(true);
    await addPost(content, imageUrl || undefined);
    setContent("");
    setImageUrl("");
    setShowImageInput(false);
    setPosting(false);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-border/40 card-shadow">
      <h2 className="text-xl font-bold text-foreground mb-5">Publications</h2>

      {/* Compose box — only for owner */}
      {isOwner && (
        <div className="mb-6 border border-border/60 rounded-2xl p-4 space-y-3 bg-muted/20">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={`Partagez une information, un conseil, une actualité...`}
            rows={3}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none"
          />
          {showImageInput && (
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="URL de l'image..."
                className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button onClick={() => { setShowImageInput(false); setImageUrl(""); }}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-border/40 pt-3">
            <button onClick={() => setShowImageInput(v => !v)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Image className="h-4 w-4" /> Photo
            </button>
            <Button size="sm" className="btn-gradient btn-ripple font-bold h-8 px-4"
              onClick={handlePost} disabled={!content.trim() || posting}>
              <Send className="h-3.5 w-3.5 mr-1.5" />{posting ? "Envoi..." : "Publier"}
            </Button>
          </div>
        </div>
      )}

      {/* Posts list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="h-24 rounded-2xl shimmer" />)}
        </div>
      ) : posts.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-8">Aucune publication pour le moment.</p>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              liked={likedIds.has(post.id)}
              onLike={() => toggleLike(post.id)}
              onDelete={() => deletePost(post.id)}
              isOwner={isOwner}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PostsSection;
