export interface Pet {
  id: string;
  name?: string;
  species?: string;
  type?: string;
  breed?: string;
  province?: string;
  contact_info?: string;
  days_missing?: number;
  primary_image?: string;
  image_url?: string;
  special_needs?: boolean;
  [key: string]: any; // Catch-all for other fields from supabase
}

export interface SearchResult extends Pet {
  tier: 'high' | 'possible' | 'low' | string;
  similarity: number;
  distance_km?: number;
  images?: { storage_url: string }[];
}
