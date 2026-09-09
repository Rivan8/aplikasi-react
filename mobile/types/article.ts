export interface MobileArticle {
  id: number;
  title: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface MobileArticlePage {
  data: MobileArticle[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
