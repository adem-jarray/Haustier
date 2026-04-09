// In-memory posts store — keyed by profile id (vet id or assoc id)
// In production this would be Supabase

export interface Post {
  id: string;
  authorId: string;      // vet id (number as string) or assoc id
  authorType: "vet" | "assoc";
  authorName: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  likes: number;
}

// Seed posts for existing vets & associations
export const seedPosts: Post[] = [
  {
    id: "p1", authorId: "1", authorType: "vet", authorName: "Dr. Marie Dupont",
    content: "🐾 Rappel important : la saison des tiques commence ! Pensez à protéger vos animaux avec un traitement antiparasitaire adapté. N'hésitez pas à prendre rendez-vous pour un bilan de santé de printemps.",
    createdAt: "2026-03-01T09:00:00Z", likes: 24,
  },
  {
    id: "p2", authorId: "1", authorType: "vet", authorName: "Dr. Marie Dupont",
    content: "🦷 Saviez-vous que 80% des chiens de plus de 3 ans souffrent de maladies dentaires sans que leurs propriétaires le sachent ? Le détartrage annuel est essentiel. Demandez-nous conseil lors de votre prochaine visite.",
    createdAt: "2026-02-20T14:30:00Z", likes: 17,
  },
  {
    id: "p3", authorId: "3", authorType: "vet", authorName: "Dr. Sophie Martin",
    content: "🌿 Allergies printanières : si votre chien se gratte beaucoup en ce moment, c'est peut-être une allergie environnementale (pollen, herbes). La dermatologie vétérinaire peut vraiment améliorer leur qualité de vie. Consultez-nous !",
    createdAt: "2026-02-28T11:00:00Z", likes: 31,
  },
  {
    id: "p4", authorId: "spa-idf", authorType: "assoc", authorName: "SPA Île-de-France",
    content: "🎉 JOURNÉE ADOPTION OUVERTE ce samedi ! Venez rencontrer nos 50+ animaux en attente d'une famille. Entrée libre, familles bienvenues. Toutes les adoptions du week-end bénéficient de frais réduits. 📍 15 rue de la SPA, Paris 11e — 10h à 18h",
    createdAt: "2026-03-01T08:00:00Z", likes: 89,
  },
  {
    id: "p5", authorId: "spa-idf", authorType: "assoc", authorName: "SPA Île-de-France",
    content: "❤️ Rencontrez Caramel ! Ce teckel de 6 ans cherche une famille calme. Il est propre, câlin, et adore les longues siestes ensoleillées. Si vous cherchez un compagnon senior doux et reconnaissant, il est fait pour vous.",
    imageUrl: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600&q=80",
    createdAt: "2026-02-25T10:00:00Z", likes: 56,
  },
  {
    id: "p6", authorId: "paws-lyon", authorType: "assoc", authorName: "PAWS Lyon",
    content: "📢 Campagne de stérilisation collective en avril ! Nous proposons des stérilisations à tarif solidaire pour les familles à revenus modestes. Places limitées — inscrivez-vous via notre site web ou appelez-nous.",
    createdAt: "2026-02-22T09:30:00Z", likes: 42,
  },
];

// Runtime store for new posts created during session
let runtimePosts: Post[] = [];

export const getAllPosts = (): Post[] =>
  [...runtimePosts, ...seedPosts].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

export const getPostsForProfile = (authorId: string): Post[] =>
  getAllPosts().filter(p => p.authorId === authorId);

export const addPost = (post: Omit<Post, "id" | "createdAt" | "likes">): Post => {
  const newPost: Post = {
    ...post,
    id: `p_${Date.now()}`,
    createdAt: new Date().toISOString(),
    likes: 0,
  };
  runtimePosts = [newPost, ...runtimePosts];
  return newPost;
};

export const likePost = (postId: string) => {
  runtimePosts = runtimePosts.map(p =>
    p.id === postId ? { ...p, likes: p.likes + 1 } : p
  );
  // For seed posts we can't mutate the array easily — handled in component state
};

export const formatPostDate = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `Il y a ${diffD}j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
};
