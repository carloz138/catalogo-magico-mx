
// types/business.ts - Types para Business Info
export interface BusinessInfo {
  id: string;
  user_id: string;
  business_name?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  social_media: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
    twitter?: string;
  };
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessInfoForm {
  business_name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  facebook: string;
  whatsapp: string;
  primary_color: string;
  secondary_color: string;
  logo?: File;
}

export interface BusinessInfoUpdate {
  business_name?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  social_media?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
    twitter?: string;
  };
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
}
