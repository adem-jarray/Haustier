import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Shield, CheckCircle, XCircle, Trash2, Check, EyeOff, Eye, Plus, Pencil, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

const BLOG_CATEGORIES = [
  { value: "health", label: "Santé" },
  { value: "nutrition", label: "Nutrition" },
  { value: "training", label: "Conseils" },
  { value: "adoption", label: "Adoption" },
  { value: "vaccination", label: "Vaccination" },
  { value: "general", label: "Général" },
];

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  BLOG_CATEGORIES.map(c => [c.value, c.label])
);

export default function AdminDashboardPage() {
  const { user, role } = useAuth();
  const [tab, setTab] = useState<"validations" | "moderation" | "blog">("validations");
  const {
    vets, assocs, posts, blogs, loading,
    verifyVet, verifyAssoc, deletePost, toggleBlogStatus, deleteBlog,
    addBlogArticle, updateBlogArticle
  } = useAdmin();

  // Blog article form state
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [blogForm, setBlogForm] = useState({
    title: "", content: "", category: "general", excerpt: "", image_url: ""
  });
  const [blogSaving, setBlogSaving] = useState(false);

  if (!user || role !== "admin") return null;

  const resetBlogForm = () => {
    setBlogForm({ title: "", content: "", category: "general", excerpt: "", image_url: "" });
    setShowBlogForm(false);
    setEditingBlogId(null);
  };

  const handleBlogSubmit = async () => {
    if (!blogForm.title.trim() || !blogForm.content.trim()) return;
    setBlogSaving(true);
    if (editingBlogId) {
      await updateBlogArticle(editingBlogId, blogForm);
    } else {
      await addBlogArticle(blogForm);
    }
    setBlogSaving(false);
    resetBlogForm();
  };

  const startEditBlog = (b: any) => {
    setBlogForm({
      title: b.title || "",
      content: b.content || "",
      category: b.category || "general",
      excerpt: b.excerpt || "",
      image_url: b.image_url || "",
    });
    setEditingBlogId(b.id);
    setShowBlogForm(true);
  };

  return (
    <div className="min-h-screen bg-muted/30 pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard Administrateur</h1>
            <p className="text-muted-foreground mt-1">Gérez la plateforme, modérez le contenu et validez les comptes professionnels.</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-border/40 p-1.5 flex gap-1">
            <button onClick={() => setTab("validations")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "validations" ? "bg-primary text-white" : "hover:bg-muted"}`}>
              Validations
            </button>
            <button onClick={() => setTab("moderation")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "moderation" ? "bg-primary text-white" : "hover:bg-muted"}`}>
              Modération (Posts)
            </button>
            <button onClick={() => setTab("blog")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "blog" ? "bg-primary text-white" : "hover:bg-muted"}`}>
              Gestion Blog
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : (
          <div className="space-y-8">
            
            {/* TAB: VALIDATIONS */}
            {tab === "validations" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Vétérinaires */}
                <div className="bg-white rounded-2xl border border-border/40 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                      <Shield className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Vétérinaires</h2>
                  </div>
                  <div className="space-y-4">
                    {vets.length === 0 ? <p className="text-sm text-muted-foreground">Aucun vétérinaire inscrit.</p> : null}
                    {vets.map(v => (
                      <div key={v.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl gap-4">
                        <div>
                          <p className="font-bold text-foreground">{v.name}</p>
                          <p className="text-sm text-muted-foreground">{v.city} - {v.specialty}</p>
                          <div className="mt-2">
                            {v.is_verified ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                                <CheckCircle className="h-3 w-3" /> Vérifié
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                                En attente
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!v.is_verified ? (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => verifyVet(v.id, true)}>
                              <Check className="h-4 w-4 mr-1" /> Valider
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => verifyVet(v.id, false)}>
                              <XCircle className="h-4 w-4 mr-1" /> Révoquer
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Associations */}
                <div className="bg-white rounded-2xl border border-border/40 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Shield className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Associations</h2>
                  </div>
                  <div className="space-y-4">
                    {assocs.length === 0 ? <p className="text-sm text-muted-foreground">Aucune association inscrite.</p> : null}
                    {assocs.map(a => (
                      <div key={a.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl gap-4">
                        <div>
                          <p className="font-bold text-foreground">{a.name}</p>
                          <p className="text-sm text-muted-foreground">{a.city} - {a.email}</p>
                          <div className="mt-2">
                            {a.is_verified ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                                <CheckCircle className="h-3 w-3" /> Vérifié
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                                En attente
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!a.is_verified ? (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => verifyAssoc(a.id, true)}>
                              <Check className="h-4 w-4 mr-1" /> Valider
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => verifyAssoc(a.id, false)}>
                              <XCircle className="h-4 w-4 mr-1" /> Révoquer
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MODERATION */}
            {tab === "moderation" && (
              <div className="bg-white rounded-2xl border border-border/40 shadow-sm p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Publications de la communauté</h2>
                {posts.length === 0 ? <p className="text-sm text-muted-foreground">Aucune publication à modérer.</p> : null}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map(p => (
                    <div key={p.id} className="border rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-bold text-sm">{p.author_name} <span className="text-muted-foreground font-normal text-xs">({p.author_type})</span></p>
                          <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-foreground mb-4 line-clamp-4">{p.content}</p>
                        {p.image_url && <img src={p.image_url} alt="" className="w-full h-32 object-cover rounded-lg mb-4" />}
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <span className="text-xs font-semibold text-rose-500">{p.likes_count} likes</span>
                        <Button size="sm" variant="destructive" onClick={() => deletePost(p.id)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: BLOG */}
            {tab === "blog" && (
              <div className="space-y-6">
                {/* Add / Edit Article Form */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">Articles du Blog</h2>
                  {!showBlogForm && (
                    <Button onClick={() => { resetBlogForm(); setShowBlogForm(true); }} className="bg-primary hover:bg-primary/90 font-bold">
                      <Plus className="h-4 w-4 mr-1.5" /> Ajouter un article
                    </Button>
                  )}
                </div>

                {showBlogForm && (
                  <div className="bg-white rounded-2xl border border-primary/20 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-bold text-foreground">
                        {editingBlogId ? "Modifier l'article" : "Nouvel article"}
                      </h3>
                      <button onClick={resetBlogForm} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-1.5">Titre *</label>
                          <input type="text" placeholder="Titre de l'article"
                            value={blogForm.title}
                            onChange={e => setBlogForm(f => ({ ...f, title: e.target.value }))}
                            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-1.5">Catégorie</label>
                          <select value={blogForm.category}
                            onChange={e => setBlogForm(f => ({ ...f, category: e.target.value }))}
                            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                          >
                            {BLOG_CATEGORIES.map(c => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1.5">Résumé (excerpt)</label>
                        <input type="text" placeholder="Court résumé de l'article..."
                          value={blogForm.excerpt}
                          onChange={e => setBlogForm(f => ({ ...f, excerpt: e.target.value }))}
                          className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1.5">Image URL (optionnel)</label>
                        <input type="url" placeholder="https://example.com/image.jpg"
                          value={blogForm.image_url}
                          onChange={e => setBlogForm(f => ({ ...f, image_url: e.target.value }))}
                          className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1.5">Contenu *</label>
                        <textarea rows={6} placeholder="Contenu complet de l'article..."
                          value={blogForm.content}
                          onChange={e => setBlogForm(f => ({ ...f, content: e.target.value }))}
                          className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button onClick={handleBlogSubmit}
                          disabled={blogSaving || !blogForm.title.trim() || !blogForm.content.trim()}
                          className="bg-primary hover:bg-primary/90 font-bold h-10 flex-1 sm:flex-none sm:px-8"
                        >
                          {blogSaving ? "Enregistrement..." : (
                            <><Save className="h-4 w-4 mr-1.5" />{editingBlogId ? "Mettre à jour" : "Publier l'article"}</>
                          )}
                        </Button>
                        <Button variant="outline" onClick={resetBlogForm} className="h-10">Annuler</Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Blog Articles Table */}
                <div className="bg-white rounded-2xl border border-border/40 shadow-sm p-6 overflow-x-auto">
                  {blogs.length === 0 && !showBlogForm ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Aucun article de blog. Cliquez sur "Ajouter un article" pour commencer.</p>
                  ) : blogs.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">Titre</th>
                          <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">Catégorie</th>
                          <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">Auteur</th>
                          <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">Statut</th>
                          <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blogs.map(b => (
                          <tr key={b.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4 text-sm font-medium max-w-[200px] truncate">{b.title}</td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">{CATEGORY_LABEL[b.category] || b.category}</td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">{b.profiles?.full_name || "Inconnu"}</td>
                            <td className="py-3 px-4">
                              {b.is_published ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">Publié</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">Brouillon</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => startEditBlog(b)} className="h-8" title="Modifier">
                                  <Pencil className="h-3.5 w-3.5 mr-1" /> Modifier
                                </Button>
                                {b.is_published ? (
                                  <Button size="sm" variant="outline" onClick={() => toggleBlogStatus(b.id, false)} className="h-8">
                                    <EyeOff className="h-3.5 w-3.5 mr-1" /> Masquer
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline" onClick={() => toggleBlogStatus(b.id, true)} className="h-8 text-primary border-primary hover:bg-primary hover:text-white">
                                    <Eye className="h-3.5 w-3.5 mr-1" /> Publier
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" onClick={() => deleteBlog(b.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : null}
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}
