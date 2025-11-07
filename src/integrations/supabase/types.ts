export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      backup_view_definitions: {
        Row: {
          backup_date: string | null
          notes: string | null
          original_definition: string | null
          view_name: string | null
        }
        Insert: {
          backup_date?: string | null
          notes?: string | null
          original_definition?: string | null
          view_name?: string | null
        }
        Update: {
          backup_date?: string | null
          notes?: string | null
          original_definition?: string | null
          view_name?: string | null
        }
        Relationships: []
      }
      business_info: {
        Row: {
          address: string | null
          business_name: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          logo_url: string | null
          phone: string | null
          primary_color: string | null
          secondary_color: string | null
          social_media: Json | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          social_media?: Json | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          social_media?: Json | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_info_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_products: {
        Row: {
          catalog_id: string
          created_at: string | null
          id: string
          product_id: string
          sort_order: number | null
        }
        Insert: {
          catalog_id: string
          created_at?: string | null
          id?: string
          product_id: string
          sort_order?: number | null
        }
        Update: {
          catalog_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_products_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "digital_catalogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "active_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_variants"
            referencedColumns: ["product_id"]
          },
        ]
      }
      catalog_usage: {
        Row: {
          catalogs_generated: number | null
          created_at: string
          id: string
          subscription_plan_id: string | null
          updated_at: string
          uploads_used: number | null
          usage_month: number
          user_id: string
        }
        Insert: {
          catalogs_generated?: number | null
          created_at?: string
          id?: string
          subscription_plan_id?: string | null
          updated_at?: string
          uploads_used?: number | null
          usage_month: number
          user_id: string
        }
        Update: {
          catalogs_generated?: number | null
          created_at?: string
          id?: string
          subscription_plan_id?: string | null
          updated_at?: string
          uploads_used?: number | null
          usage_month?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_usage_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "credit_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_views: {
        Row: {
          catalog_id: string
          city: string | null
          country: string | null
          id: string
          ip_address: string | null
          referrer: string | null
          user_agent: string | null
          viewed_at: string | null
        }
        Insert: {
          catalog_id: string
          city?: string | null
          country?: string | null
          id?: string
          ip_address?: string | null
          referrer?: string | null
          user_agent?: string | null
          viewed_at?: string | null
        }
        Update: {
          catalog_id?: string
          city?: string | null
          country?: string | null
          id?: string
          ip_address?: string | null
          referrer?: string | null
          user_agent?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_views_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "digital_catalogs"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogs: {
        Row: {
          brand_colors: Json | null
          created_at: string
          credits_used: number
          currency: string | null
          description: string | null
          file_size_bytes: number | null
          generation_metadata: Json | null
          id: string
          logo_url: string | null
          name: string
          pdf_url: string | null
          preview_image_url: string | null
          product_ids: string[]
          show_retail_prices: boolean | null
          show_wholesale_prices: boolean | null
          template_style: string | null
          total_pages: number | null
          total_products: number
          user_id: string
        }
        Insert: {
          brand_colors?: Json | null
          created_at?: string
          credits_used: number
          currency?: string | null
          description?: string | null
          file_size_bytes?: number | null
          generation_metadata?: Json | null
          id?: string
          logo_url?: string | null
          name: string
          pdf_url?: string | null
          preview_image_url?: string | null
          product_ids: string[]
          show_retail_prices?: boolean | null
          show_wholesale_prices?: boolean | null
          template_style?: string | null
          total_pages?: number | null
          total_products: number
          user_id: string
        }
        Update: {
          brand_colors?: Json | null
          created_at?: string
          credits_used?: number
          currency?: string | null
          description?: string | null
          file_size_bytes?: number | null
          generation_metadata?: Json | null
          id?: string
          logo_url?: string | null
          name?: string
          pdf_url?: string | null
          preview_image_url?: string | null
          product_ids?: string[]
          show_retail_prices?: boolean | null
          show_wholesale_prices?: boolean | null
          template_style?: string | null
          total_pages?: number | null
          total_products?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalogs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_packages: {
        Row: {
          analytics_level: string | null
          created_at: string
          credits: number
          description: string | null
          discount_percentage: number | null
          duration_months: number | null
          has_quotation: boolean | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          max_catalogs: number | null
          max_uploads: number | null
          name: string
          package_type: string | null
          price_mxn: number
          price_usd: number
          stripe_price_id: string | null
        }
        Insert: {
          analytics_level?: string | null
          created_at?: string
          credits: number
          description?: string | null
          discount_percentage?: number | null
          duration_months?: number | null
          has_quotation?: boolean | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          max_catalogs?: number | null
          max_uploads?: number | null
          name: string
          package_type?: string | null
          price_mxn: number
          price_usd: number
          stripe_price_id?: string | null
        }
        Update: {
          analytics_level?: string | null
          created_at?: string
          credits?: number
          description?: string | null
          discount_percentage?: number | null
          duration_months?: number | null
          has_quotation?: boolean | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          max_catalogs?: number | null
          max_uploads?: number | null
          name?: string
          package_type?: string | null
          price_mxn?: number
          price_usd?: number
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      credit_packages_backup_20250929: {
        Row: {
          created_at: string | null
          credits: number | null
          description: string | null
          discount_percentage: number | null
          duration_months: number | null
          id: string | null
          is_active: boolean | null
          is_popular: boolean | null
          max_catalogs: number | null
          max_uploads: number | null
          name: string | null
          package_type: string | null
          price_mxn: number | null
          price_usd: number | null
          stripe_price_id: string | null
        }
        Insert: {
          created_at?: string | null
          credits?: number | null
          description?: string | null
          discount_percentage?: number | null
          duration_months?: number | null
          id?: string | null
          is_active?: boolean | null
          is_popular?: boolean | null
          max_catalogs?: number | null
          max_uploads?: number | null
          name?: string | null
          package_type?: string | null
          price_mxn?: number | null
          price_usd?: number | null
          stripe_price_id?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number | null
          description?: string | null
          discount_percentage?: number | null
          duration_months?: number | null
          id?: string | null
          is_active?: boolean | null
          is_popular?: boolean | null
          max_catalogs?: number | null
          max_uploads?: number | null
          name?: string | null
          package_type?: string | null
          price_mxn?: number | null
          price_usd?: number | null
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      credit_packages_backup_20250930: {
        Row: {
          created_at: string | null
          credits: number | null
          description: string | null
          discount_percentage: number | null
          duration_months: number | null
          id: string | null
          is_active: boolean | null
          is_popular: boolean | null
          max_catalogs: number | null
          max_uploads: number | null
          name: string | null
          package_type: string | null
          price_mxn: number | null
          price_usd: number | null
          stripe_price_id: string | null
        }
        Insert: {
          created_at?: string | null
          credits?: number | null
          description?: string | null
          discount_percentage?: number | null
          duration_months?: number | null
          id?: string | null
          is_active?: boolean | null
          is_popular?: boolean | null
          max_catalogs?: number | null
          max_uploads?: number | null
          name?: string | null
          package_type?: string | null
          price_mxn?: number | null
          price_usd?: number | null
          stripe_price_id?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number | null
          description?: string | null
          discount_percentage?: number | null
          duration_months?: number | null
          id?: string | null
          is_active?: boolean | null
          is_popular?: boolean | null
          max_catalogs?: number | null
          max_uploads?: number | null
          name?: string | null
          package_type?: string | null
          price_mxn?: number | null
          price_usd?: number | null
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      credit_usage: {
        Row: {
          amount_paid: number | null
          catalog_id: string | null
          created_at: string
          credits_purchased: number | null
          credits_remaining: number
          credits_used: number
          description: string | null
          expires_at: string | null
          id: string
          package_id: string | null
          product_id: string | null
          source_type: string | null
          transaction_id: string | null
          usage_type: string
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          catalog_id?: string | null
          created_at?: string
          credits_purchased?: number | null
          credits_remaining: number
          credits_used: number
          description?: string | null
          expires_at?: string | null
          id?: string
          package_id?: string | null
          product_id?: string | null
          source_type?: string | null
          transaction_id?: string | null
          usage_type: string
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          catalog_id?: string | null
          created_at?: string
          credits_purchased?: number | null
          credits_remaining?: number
          credits_used?: number
          description?: string | null
          expires_at?: string | null
          id?: string
          package_id?: string | null
          product_id?: string | null
          source_type?: string | null
          transaction_id?: string | null
          usage_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_usage_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "catalogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_usage_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "active_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_usage_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_usage_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_variants"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "credit_usage_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_usage_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "user_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_credit_usage_package"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "credit_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_catalogs: {
        Row: {
          access_password: string | null
          additional_info: string | null
          background_pattern: string | null
          created_at: string | null
          description: string | null
          enable_distribution: boolean | null
          enable_quotation: boolean | null
          enable_variants: boolean | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_private: boolean | null
          name: string
          price_adjustment_mayoreo: number | null
          price_adjustment_menudeo: number | null
          price_display: string | null
          show_description: boolean | null
          show_sku: boolean | null
          show_stock: boolean | null
          show_tags: boolean | null
          slug: string
          template_config: Json | null
          template_id: string | null
          tracking_body_scripts: string | null
          tracking_head_scripts: string | null
          updated_at: string | null
          user_id: string
          view_count: number | null
          web_template_id: string | null
        }
        Insert: {
          access_password?: string | null
          additional_info?: string | null
          background_pattern?: string | null
          created_at?: string | null
          description?: string | null
          enable_distribution?: boolean | null
          enable_quotation?: boolean | null
          enable_variants?: boolean | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_private?: boolean | null
          name: string
          price_adjustment_mayoreo?: number | null
          price_adjustment_menudeo?: number | null
          price_display?: string | null
          show_description?: boolean | null
          show_sku?: boolean | null
          show_stock?: boolean | null
          show_tags?: boolean | null
          slug: string
          template_config?: Json | null
          template_id?: string | null
          tracking_body_scripts?: string | null
          tracking_head_scripts?: string | null
          updated_at?: string | null
          user_id: string
          view_count?: number | null
          web_template_id?: string | null
        }
        Update: {
          access_password?: string | null
          additional_info?: string | null
          background_pattern?: string | null
          created_at?: string | null
          description?: string | null
          enable_distribution?: boolean | null
          enable_quotation?: boolean | null
          enable_variants?: boolean | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_private?: boolean | null
          name?: string
          price_adjustment_mayoreo?: number | null
          price_adjustment_menudeo?: number | null
          price_display?: string | null
          show_description?: boolean | null
          show_sku?: boolean | null
          show_stock?: boolean | null
          show_tags?: boolean | null
          slug?: string
          template_config?: Json | null
          template_id?: string | null
          tracking_body_scripts?: string | null
          tracking_head_scripts?: string | null
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
          web_template_id?: string | null
        }
        Relationships: []
      }
      distribution_network: {
        Row: {
          conversion_rate: number | null
          created_at: string | null
          distributor_id: string
          id: string
          last_quote_at: string | null
          replicated_catalog_id: string
          reseller_id: string | null
          total_quotes_accepted: number | null
          total_quotes_generated: number | null
          updated_at: string | null
        }
        Insert: {
          conversion_rate?: number | null
          created_at?: string | null
          distributor_id: string
          id?: string
          last_quote_at?: string | null
          replicated_catalog_id: string
          reseller_id?: string | null
          total_quotes_accepted?: number | null
          total_quotes_generated?: number | null
          updated_at?: string | null
        }
        Update: {
          conversion_rate?: number | null
          created_at?: string | null
          distributor_id?: string
          id?: string
          last_quote_at?: string | null
          replicated_catalog_id?: string
          reseller_id?: string | null
          total_quotes_accepted?: number | null
          total_quotes_generated?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distribution_network_replicated_catalog_id_fkey"
            columns: ["replicated_catalog_id"]
            isOneToOne: false
            referencedRelation: "replicated_catalogs"
            referencedColumns: ["id"]
          },
        ]
      }
      product_archive: {
        Row: {
          archived_at: string | null
          deleted_at: string
          deletion_reason: string | null
          id: string
          original_product_id: string
          product_data: Json
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          deleted_at: string
          deletion_reason?: string | null
          id?: string
          original_product_id: string
          product_data: Json
          user_id: string
        }
        Update: {
          archived_at?: string | null
          deleted_at?: string
          deletion_reason?: string | null
          id?: string
          original_product_id?: string
          product_data?: Json
          user_id?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          price_retail: number | null
          price_wholesale: number | null
          product_id: string
          sku: string | null
          stock_quantity: number | null
          updated_at: string | null
          user_id: string
          variant_combination: Json
          variant_images: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          price_retail?: number | null
          price_wholesale?: number | null
          product_id: string
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
          user_id: string
          variant_combination: Json
          variant_images?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          price_retail?: number | null
          price_wholesale?: number | null
          product_id?: string
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
          user_id?: string
          variant_combination?: Json
          variant_images?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "active_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_variants"
            referencedColumns: ["product_id"]
          },
        ]
      }
      products: {
        Row: {
          ai_confidence_score: number | null
          ai_description: string | null
          ai_tags: string[] | null
          brand: string | null
          catalog_image_url: string | null
          category: string | null
          cleanup_grace_period: number | null
          cleanup_scheduled_at: string | null
          color: string | null
          created_at: string
          credits_used: number | null
          custom_description: string | null
          deleted_at: string | null
          description: string | null
          error_message: string | null
          estimated_cost_mxn: number | null
          estimated_credits: number | null
          features: string[] | null
          has_variants: boolean | null
          hd_image_url: string | null
          id: string
          image_url: string | null
          is_processed: boolean | null
          luxury_image_url: string | null
          model: string | null
          name: string
          original_image_url: string
          price_retail: number | null
          price_wholesale: number | null
          print_image_url: string | null
          processed_at: string | null
          processed_image_url: string | null
          processed_images: Json | null
          processing_metadata: Json | null
          processing_progress: number | null
          processing_status: string | null
          service_type: string | null
          sku: string | null
          smart_analysis: Json | null
          social_media_urls: Json | null
          tags: string[] | null
          thumbnail_image_url: string | null
          updated_at: string
          user_id: string
          variant_count: number | null
          video_url: string | null
          wholesale_min_qty: number | null
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_description?: string | null
          ai_tags?: string[] | null
          brand?: string | null
          catalog_image_url?: string | null
          category?: string | null
          cleanup_grace_period?: number | null
          cleanup_scheduled_at?: string | null
          color?: string | null
          created_at?: string
          credits_used?: number | null
          custom_description?: string | null
          deleted_at?: string | null
          description?: string | null
          error_message?: string | null
          estimated_cost_mxn?: number | null
          estimated_credits?: number | null
          features?: string[] | null
          has_variants?: boolean | null
          hd_image_url?: string | null
          id?: string
          image_url?: string | null
          is_processed?: boolean | null
          luxury_image_url?: string | null
          model?: string | null
          name: string
          original_image_url: string
          price_retail?: number | null
          price_wholesale?: number | null
          print_image_url?: string | null
          processed_at?: string | null
          processed_image_url?: string | null
          processed_images?: Json | null
          processing_metadata?: Json | null
          processing_progress?: number | null
          processing_status?: string | null
          service_type?: string | null
          sku?: string | null
          smart_analysis?: Json | null
          social_media_urls?: Json | null
          tags?: string[] | null
          thumbnail_image_url?: string | null
          updated_at?: string
          user_id: string
          variant_count?: number | null
          video_url?: string | null
          wholesale_min_qty?: number | null
        }
        Update: {
          ai_confidence_score?: number | null
          ai_description?: string | null
          ai_tags?: string[] | null
          brand?: string | null
          catalog_image_url?: string | null
          category?: string | null
          cleanup_grace_period?: number | null
          cleanup_scheduled_at?: string | null
          color?: string | null
          created_at?: string
          credits_used?: number | null
          custom_description?: string | null
          deleted_at?: string | null
          description?: string | null
          error_message?: string | null
          estimated_cost_mxn?: number | null
          estimated_credits?: number | null
          features?: string[] | null
          has_variants?: boolean | null
          hd_image_url?: string | null
          id?: string
          image_url?: string | null
          is_processed?: boolean | null
          luxury_image_url?: string | null
          model?: string | null
          name?: string
          original_image_url?: string
          price_retail?: number | null
          price_wholesale?: number | null
          print_image_url?: string | null
          processed_at?: string | null
          processed_image_url?: string | null
          processed_images?: Json | null
          processing_metadata?: Json | null
          processing_progress?: number | null
          processing_status?: string | null
          service_type?: string | null
          sku?: string | null
          smart_analysis?: Json | null
          social_media_urls?: Json | null
          tags?: string[] | null
          thumbnail_image_url?: string | null
          updated_at?: string
          user_id?: string
          variant_count?: number | null
          video_url?: string | null
          wholesale_min_qty?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string | null
          id: string
          price_type: string | null
          product_id: string | null
          product_image_url: string | null
          product_name: string
          product_sku: string | null
          quantity: number
          quote_id: string
          subtotal: number
          unit_price: number
          variant_description: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          price_type?: string | null
          product_id?: string | null
          product_image_url?: string | null
          product_name: string
          product_sku?: string | null
          quantity: number
          quote_id: string
          subtotal: number
          unit_price: number
          variant_description?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          price_type?: string | null
          product_id?: string | null
          product_image_url?: string | null
          product_name?: string
          product_sku?: string | null
          quantity?: number
          quote_id?: string
          subtotal?: number
          unit_price?: number
          variant_description?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "active_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_variants"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "products_with_variants"
            referencedColumns: ["variant_id"]
          },
        ]
      }
      quote_tracking_tokens: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          last_accessed_at: string | null
          quote_id: string
          token: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          quote_id: string
          token: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          quote_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_tracking_tokens_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          catalog_id: string | null
          created_at: string | null
          customer_company: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          delivery_method:
            | Database["public"]["Enums"]["delivery_method_enum"]
            | null
          id: string
          notes: string | null
          order_number: string | null
          replicated_catalog_id: string | null
          shipping_address: string | null
          shipping_cost: number | null
          status: string | null
          total_amount: number | null
          tracking_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          catalog_id?: string | null
          created_at?: string | null
          customer_company?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          delivery_method?:
            | Database["public"]["Enums"]["delivery_method_enum"]
            | null
          id?: string
          notes?: string | null
          order_number?: string | null
          replicated_catalog_id?: string | null
          shipping_address?: string | null
          shipping_cost?: number | null
          status?: string | null
          total_amount?: number | null
          tracking_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          catalog_id?: string | null
          created_at?: string | null
          customer_company?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          delivery_method?:
            | Database["public"]["Enums"]["delivery_method_enum"]
            | null
          id?: string
          notes?: string | null
          order_number?: string | null
          replicated_catalog_id?: string | null
          shipping_address?: string | null
          shipping_cost?: number | null
          status?: string | null
          total_amount?: number | null
          tracking_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "digital_catalogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_replicated_catalog_id_fkey"
            columns: ["replicated_catalog_id"]
            isOneToOne: false
            referencedRelation: "replicated_catalogs"
            referencedColumns: ["id"]
          },
        ]
      }
      replicated_catalogs: {
        Row: {
          activated_at: string | null
          activation_paid: boolean | null
          activation_token: string
          created_at: string | null
          distributor_id: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          original_catalog_id: string
          product_limit: number | null
          quote_id: string | null
          reseller_email: string | null
          reseller_id: string | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          activated_at?: string | null
          activation_paid?: boolean | null
          activation_token: string
          created_at?: string | null
          distributor_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          original_catalog_id: string
          product_limit?: number | null
          quote_id?: string | null
          reseller_email?: string | null
          reseller_id?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          activated_at?: string | null
          activation_paid?: boolean | null
          activation_token?: string
          created_at?: string | null
          distributor_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          original_catalog_id?: string
          product_limit?: number | null
          quote_id?: string | null
          reseller_email?: string | null
          reseller_id?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "replicated_catalogs_original_catalog_id_fkey"
            columns: ["original_catalog_id"]
            isOneToOne: false
            referencedRelation: "digital_catalogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replicated_catalogs_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      reseller_product_prices: {
        Row: {
          created_at: string | null
          custom_price_retail: number | null
          custom_price_wholesale: number | null
          id: string
          is_in_stock: boolean | null
          product_id: string
          replicated_catalog_id: string
          stock_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_price_retail?: number | null
          custom_price_wholesale?: number | null
          id?: string
          is_in_stock?: boolean | null
          product_id: string
          replicated_catalog_id: string
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_price_retail?: number | null
          custom_price_wholesale?: number | null
          id?: string
          is_in_stock?: boolean | null
          product_id?: string
          replicated_catalog_id?: string
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reseller_product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "active_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reseller_product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reseller_product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_variants"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "reseller_product_prices_replicated_catalog_id_fkey"
            columns: ["replicated_catalog_id"]
            isOneToOne: false
            referencedRelation: "replicated_catalogs"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes_mercado: {
        Row: {
          cantidad: number
          catalogo_id: string | null
          cliente_final_email: string | null
          cliente_final_nombre: string | null
          creado_el: string
          estatus_fabricante: Database["public"]["Enums"]["status_fabricante"]
          estatus_revendedor: Database["public"]["Enums"]["status_revendedor"]
          fabricante_id: string
          id: string
          producto_descripcion: string | null
          producto_marca: string | null
          producto_nombre: string
          revendedor_id: string | null
        }
        Insert: {
          cantidad?: number
          catalogo_id?: string | null
          cliente_final_email?: string | null
          cliente_final_nombre?: string | null
          creado_el?: string
          estatus_fabricante?: Database["public"]["Enums"]["status_fabricante"]
          estatus_revendedor?: Database["public"]["Enums"]["status_revendedor"]
          fabricante_id: string
          id?: string
          producto_descripcion?: string | null
          producto_marca?: string | null
          producto_nombre: string
          revendedor_id?: string | null
        }
        Update: {
          cantidad?: number
          catalogo_id?: string | null
          cliente_final_email?: string | null
          cliente_final_nombre?: string | null
          creado_el?: string
          estatus_fabricante?: Database["public"]["Enums"]["status_fabricante"]
          estatus_revendedor?: Database["public"]["Enums"]["status_revendedor"]
          fabricante_id?: string
          id?: string
          producto_descripcion?: string | null
          producto_marca?: string | null
          producto_nombre?: string
          revendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_mercado_catalogo_id_fkey"
            columns: ["catalogo_id"]
            isOneToOne: false
            referencedRelation: "digital_catalogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_mercado_fabricante_id_fkey"
            columns: ["fabricante_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_mercado_revendedor_id_fkey"
            columns: ["revendedor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          package_id: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          package_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          package_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "credit_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_mxn: number
          amount_usd: number | null
          charge_id: string | null
          completed_at: string | null
          created_at: string
          credits_purchased: number
          expires_at: string | null
          failure_reason: string | null
          id: string
          oxxo_barcode: string | null
          oxxo_reference: string | null
          package_id: string | null
          payment_intent_id: string | null
          payment_metadata: Json | null
          payment_method: string
          payment_status: string | null
          purchase_type: string | null
          spei_clabe: string | null
          spei_reference: string | null
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          subscription_plan_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_mxn: number
          amount_usd?: number | null
          charge_id?: string | null
          completed_at?: string | null
          created_at?: string
          credits_purchased: number
          expires_at?: string | null
          failure_reason?: string | null
          id?: string
          oxxo_barcode?: string | null
          oxxo_reference?: string | null
          package_id?: string | null
          payment_intent_id?: string | null
          payment_metadata?: Json | null
          payment_method: string
          payment_status?: string | null
          purchase_type?: string | null
          spei_clabe?: string | null
          spei_reference?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_plan_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_mxn?: number
          amount_usd?: number | null
          charge_id?: string | null
          completed_at?: string | null
          created_at?: string
          credits_purchased?: number
          expires_at?: string | null
          failure_reason?: string | null
          id?: string
          oxxo_barcode?: string | null
          oxxo_reference?: string | null
          package_id?: string | null
          payment_intent_id?: string | null
          payment_metadata?: Json | null
          payment_method?: string
          payment_status?: string | null
          purchase_type?: string | null
          spei_clabe?: string | null
          spei_reference?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_plan_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "credit_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "credit_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          brand_colors: Json | null
          brand_logo_url: string | null
          brand_name: string | null
          business_address: Json | null
          created_at: string
          default_currency: string | null
          default_template: string | null
          email_notifications: boolean | null
          id: string
          marketing_emails: boolean | null
          processing_notifications: boolean | null
          show_wholesale_by_default: boolean | null
          tax_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_colors?: Json | null
          brand_logo_url?: string | null
          brand_name?: string | null
          business_address?: Json | null
          created_at?: string
          default_currency?: string | null
          default_template?: string | null
          email_notifications?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          processing_notifications?: boolean | null
          show_wholesale_by_default?: boolean | null
          tax_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_colors?: Json | null
          brand_logo_url?: string | null
          brand_name?: string | null
          business_address?: Json | null
          created_at?: string
          default_currency?: string | null
          default_template?: string | null
          email_notifications?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          processing_notifications?: boolean | null
          show_wholesale_by_default?: boolean | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          business_name: string | null
          business_type: string | null
          catalogs_used_this_month: number | null
          created_at: string
          credits: number | null
          current_plan: string | null
          email: string
          full_name: string | null
          id: string
          monthly_plan_credits: number | null
          monthly_removebg_limit: number | null
          monthly_removebg_used: number | null
          phone: string | null
          plan_credits_used: number | null
          plan_expires_at: string | null
          plan_type: string | null
          total_credits_purchased: number | null
          updated_at: string
          uploads_used_this_month: number | null
        }
        Insert: {
          avatar_url?: string | null
          business_name?: string | null
          business_type?: string | null
          catalogs_used_this_month?: number | null
          created_at?: string
          credits?: number | null
          current_plan?: string | null
          email: string
          full_name?: string | null
          id: string
          monthly_plan_credits?: number | null
          monthly_removebg_limit?: number | null
          monthly_removebg_used?: number | null
          phone?: string | null
          plan_credits_used?: number | null
          plan_expires_at?: string | null
          plan_type?: string | null
          total_credits_purchased?: number | null
          updated_at?: string
          uploads_used_this_month?: number | null
        }
        Update: {
          avatar_url?: string | null
          business_name?: string | null
          business_type?: string | null
          catalogs_used_this_month?: number | null
          created_at?: string
          credits?: number | null
          current_plan?: string | null
          email?: string
          full_name?: string | null
          id?: string
          monthly_plan_credits?: number | null
          monthly_removebg_limit?: number | null
          monthly_removebg_used?: number | null
          phone?: string | null
          plan_credits_used?: number | null
          plan_expires_at?: string | null
          plan_type?: string | null
          total_credits_purchased?: number | null
          updated_at?: string
          uploads_used_this_month?: number | null
        }
        Relationships: []
      }
      variant_types: {
        Row: {
          category: string | null
          created_at: string | null
          display_name: string
          id: string
          input_type: string | null
          is_required: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          display_name: string
          id?: string
          input_type?: string | null
          is_required?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          display_name?: string
          id?: string
          input_type?: string | null
          is_required?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      variant_values: {
        Row: {
          created_at: string | null
          display_value: string | null
          hex_color: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          value: string
          variant_type_id: string
        }
        Insert: {
          created_at?: string | null
          display_value?: string | null
          hex_color?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          value: string
          variant_type_id: string
        }
        Update: {
          created_at?: string | null
          display_value?: string | null
          hex_color?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          value?: string
          variant_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_values_variant_type_id_fkey"
            columns: ["variant_type_id"]
            isOneToOne: false
            referencedRelation: "variant_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_products: {
        Row: {
          ai_confidence_score: number | null
          ai_description: string | null
          ai_tags: string[] | null
          brand: string | null
          category: string | null
          cleanup_grace_period: number | null
          cleanup_scheduled_at: string | null
          color: string | null
          created_at: string | null
          credits_used: number | null
          custom_description: string | null
          deleted_at: string | null
          description: string | null
          error_message: string | null
          estimated_cost_mxn: number | null
          estimated_credits: number | null
          features: string[] | null
          has_variants: boolean | null
          hd_image_url: string | null
          id: string | null
          image_url: string | null
          is_processed: boolean | null
          model: string | null
          name: string | null
          original_image_url: string | null
          price_retail: number | null
          price_wholesale: number | null
          processed_at: string | null
          processed_image_url: string | null
          processed_images: Json | null
          processing_metadata: Json | null
          processing_progress: number | null
          processing_status: string | null
          service_type: string | null
          sku: string | null
          smart_analysis: Json | null
          social_media_urls: Json | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
          variant_count: number | null
          video_url: string | null
          wholesale_min_qty: number | null
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_description?: string | null
          ai_tags?: string[] | null
          brand?: string | null
          category?: string | null
          cleanup_grace_period?: number | null
          cleanup_scheduled_at?: string | null
          color?: string | null
          created_at?: string | null
          credits_used?: number | null
          custom_description?: string | null
          deleted_at?: string | null
          description?: string | null
          error_message?: string | null
          estimated_cost_mxn?: number | null
          estimated_credits?: number | null
          features?: string[] | null
          has_variants?: boolean | null
          hd_image_url?: string | null
          id?: string | null
          image_url?: string | null
          is_processed?: boolean | null
          model?: string | null
          name?: string | null
          original_image_url?: string | null
          price_retail?: number | null
          price_wholesale?: number | null
          processed_at?: string | null
          processed_image_url?: string | null
          processed_images?: Json | null
          processing_metadata?: Json | null
          processing_progress?: number | null
          processing_status?: string | null
          service_type?: string | null
          sku?: string | null
          smart_analysis?: Json | null
          social_media_urls?: Json | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          variant_count?: number | null
          video_url?: string | null
          wholesale_min_qty?: number | null
        }
        Update: {
          ai_confidence_score?: number | null
          ai_description?: string | null
          ai_tags?: string[] | null
          brand?: string | null
          category?: string | null
          cleanup_grace_period?: number | null
          cleanup_scheduled_at?: string | null
          color?: string | null
          created_at?: string | null
          credits_used?: number | null
          custom_description?: string | null
          deleted_at?: string | null
          description?: string | null
          error_message?: string | null
          estimated_cost_mxn?: number | null
          estimated_credits?: number | null
          features?: string[] | null
          has_variants?: boolean | null
          hd_image_url?: string | null
          id?: string | null
          image_url?: string | null
          is_processed?: boolean | null
          model?: string | null
          name?: string | null
          original_image_url?: string | null
          price_retail?: number | null
          price_wholesale?: number | null
          processed_at?: string | null
          processed_image_url?: string | null
          processed_images?: Json | null
          processing_metadata?: Json | null
          processing_progress?: number | null
          processing_status?: string | null
          service_type?: string | null
          sku?: string | null
          smart_analysis?: Json | null
          social_media_urls?: Json | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          variant_count?: number | null
          video_url?: string | null
          wholesale_min_qty?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      products_with_variants: {
        Row: {
          category: string | null
          has_variants: boolean | null
          is_default: boolean | null
          product_created_at: string | null
          product_id: string | null
          product_name: string | null
          stock_quantity: number | null
          user_id: string | null
          variant_active: boolean | null
          variant_combination: Json | null
          variant_count: number | null
          variant_created_at: string | null
          variant_id: string | null
          variant_price_retail: number | null
          variant_price_wholesale: number | null
          variant_sku: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_statistics: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      user_transactions: {
        Row: {
          amount_mxn: number | null
          amount_usd: number | null
          completed_at: string | null
          created_at: string | null
          credits_purchased: number | null
          expires_at: string | null
          id: string | null
          package_id: string | null
          payment_method: string | null
          payment_status: string | null
          user_id: string | null
        }
        Insert: {
          amount_mxn?: number | null
          amount_usd?: number | null
          completed_at?: string | null
          created_at?: string | null
          credits_purchased?: number | null
          expires_at?: string | null
          id?: string | null
          package_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          user_id?: string | null
        }
        Update: {
          amount_mxn?: number | null
          amount_usd?: number | null
          completed_at?: string | null
          created_at?: string | null
          credits_purchased?: number | null
          expires_at?: string | null
          id?: string | null
          package_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "credit_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_variant_statistics: {
        Row: {
          category: string | null
          products_in_category: number | null
          products_with_variants: number | null
          total_products: number | null
          total_variants: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vista_radar_fabricante: {
        Row: {
          cantidad: number | null
          catalogo_id: string | null
          creado_el: string | null
          estatus_fabricante:
            | Database["public"]["Enums"]["status_fabricante"]
            | null
          estatus_revendedor:
            | Database["public"]["Enums"]["status_revendedor"]
            | null
          fabricante_id: string | null
          id: string | null
          producto_descripcion: string | null
          producto_marca: string | null
          producto_nombre: string | null
          revendedor_id: string | null
        }
        Insert: {
          cantidad?: number | null
          catalogo_id?: string | null
          creado_el?: string | null
          estatus_fabricante?:
            | Database["public"]["Enums"]["status_fabricante"]
            | null
          estatus_revendedor?:
            | Database["public"]["Enums"]["status_revendedor"]
            | null
          fabricante_id?: string | null
          id?: string | null
          producto_descripcion?: string | null
          producto_marca?: string | null
          producto_nombre?: string | null
          revendedor_id?: string | null
        }
        Update: {
          cantidad?: number | null
          catalogo_id?: string | null
          creado_el?: string | null
          estatus_fabricante?:
            | Database["public"]["Enums"]["status_fabricante"]
            | null
          estatus_revendedor?:
            | Database["public"]["Enums"]["status_revendedor"]
            | null
          fabricante_id?: string | null
          id?: string | null
          producto_descripcion?: string | null
          producto_marca?: string | null
          producto_nombre?: string | null
          revendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_mercado_catalogo_id_fkey"
            columns: ["catalogo_id"]
            isOneToOne: false
            referencedRelation: "digital_catalogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_mercado_fabricante_id_fkey"
            columns: ["fabricante_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_mercado_revendedor_id_fkey"
            columns: ["revendedor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vista_solicitudes_revendedor: {
        Row: {
          cantidad: number | null
          catalogo_id: string | null
          cliente_final_email: string | null
          cliente_final_nombre: string | null
          creado_el: string | null
          estatus_revendedor:
            | Database["public"]["Enums"]["status_revendedor"]
            | null
          fabricante_id: string | null
          id: string | null
          producto_descripcion: string | null
          producto_marca: string | null
          producto_nombre: string | null
          revendedor_id: string | null
        }
        Insert: {
          cantidad?: number | null
          catalogo_id?: string | null
          cliente_final_email?: string | null
          cliente_final_nombre?: string | null
          creado_el?: string | null
          estatus_revendedor?:
            | Database["public"]["Enums"]["status_revendedor"]
            | null
          fabricante_id?: string | null
          id?: string | null
          producto_descripcion?: string | null
          producto_marca?: string | null
          producto_nombre?: string | null
          revendedor_id?: string | null
        }
        Update: {
          cantidad?: number | null
          catalogo_id?: string | null
          cliente_final_email?: string | null
          cliente_final_nombre?: string | null
          creado_el?: string | null
          estatus_revendedor?:
            | Database["public"]["Enums"]["status_revendedor"]
            | null
          fabricante_id?: string | null
          id?: string | null
          producto_descripcion?: string | null
          producto_marca?: string | null
          producto_nombre?: string | null
          revendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_mercado_catalogo_id_fkey"
            columns: ["catalogo_id"]
            isOneToOne: false
            referencedRelation: "digital_catalogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_mercado_fabricante_id_fkey"
            columns: ["fabricante_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_mercado_revendedor_id_fkey"
            columns: ["revendedor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      activate_replicated_catalog: {
        Args: { p_reseller_id: string; p_token: string }
        Returns: boolean
      }
      archive_old_deleted_products: { Args: never; Returns: number }
      calculate_adjusted_price: {
        Args: { adjustment_percentage: number; base_price: number }
        Returns: number
      }
      can_access_transaction: {
        Args: { transaction_user_id: string }
        Returns: boolean
      }
      can_create_private_catalog: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      can_generate_catalog: { Args: { p_user_id: string }; Returns: Json }
      check_catalog_limit: {
        Args: { p_user_id: string }
        Returns: {
          can_create: boolean
          current_count: number
          max_allowed: number
          message: string
        }[]
      }
      complete_catalog_activation: { Args: { p_token: string }; Returns: Json }
      complete_user_profile: {
        Args: {
          p_business_name?: string
          p_business_type?: string
          p_full_name?: string
          p_phone?: string
          user_id: string
        }
        Returns: boolean
      }
      create_default_variant_for_product: {
        Args: { product_uuid: string }
        Returns: string
      }
      create_payment_intent_handler: {
        Args: never
        Returns: {
          checkout_url: string
        }[]
      }
      create_product_variant: {
        Args: {
          p_is_default?: boolean
          p_price_retail?: number
          p_price_wholesale?: number
          p_product_id: string
          p_sku?: string
          p_stock_quantity?: number
          p_user_id: string
          p_variant_combination: Json
        }
        Returns: string
      }
      create_replicated_catalog: {
        Args: {
          p_distributor_id: string
          p_original_catalog_id: string
          p_quote_id: string
        }
        Returns: string
      }
      detect_product_category: {
        Args: { product_description?: string; product_name: string }
        Returns: string
      }
      generate_activation_token: { Args: never; Returns: string }
      generate_catalog_slug: { Args: never; Returns: string }
      generate_order_number: { Args: never; Returns: string }
      get_catalog_by_token: {
        Args: { p_token: string }
        Returns: {
          catalog_description: string
          catalog_id: string
          catalog_name: string
          distributor_company: string
          distributor_id: string
          distributor_name: string
          expires_at: string
          is_active: boolean
          original_catalog_id: string
          product_count: number
          product_limit: number
        }[]
      }
      get_current_user_stats: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          updated_at: string
        }[]
      }
      get_deleted_products: {
        Args: { requesting_user_id: string }
        Returns: {
          category: string
          deleted_at: string
          id: string
          name: string
          original_image_url: string
          processed_image_url: string
          sku: string
        }[]
      }
      get_distribution_network: {
        Args: { p_distributor_id: string }
        Returns: {
          activated_at: string
          catalog_id: string
          catalog_name: string
          conversion_rate: number
          created_at: string
          is_active: boolean
          network_id: string
          reseller_company: string
          reseller_email: string
          reseller_id: string
          reseller_name: string
          total_quotes: number
        }[]
      }
      get_or_create_monthly_usage: {
        Args: { p_user_id: string }
        Returns: {
          catalogs_generated: number | null
          created_at: string
          id: string
          subscription_plan_id: string | null
          updated_at: string
          uploads_used: number | null
          usage_month: number
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "catalog_usage"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_product_variants: {
        Args: { product_uuid: string }
        Returns: {
          combination: Json
          is_default: boolean
          price_retail: number
          price_wholesale: number
          sku: string
          stock_quantity: number
          variant_id: string
          variant_images: Json
        }[]
      }
      get_products_with_variants_for_table: {
        Args: never
        Returns: {
          brand: string
          category: string
          color: string
          created_at: string
          custom_description: string
          description: string
          features: string[]
          has_variants: boolean
          id: string
          model: string
          name: string
          price_retail: number
          price_wholesale: number
          processing_status: string
          sku: string
          variant_count: number
          variants: Json
          wholesale_min_qty: number
        }[]
      }
      get_radar_agregado: {
        Args: { user_id_param: string }
        Returns: {
          estatus_fabricante: Database["public"]["Enums"]["status_fabricante"]
          producto_marca: string
          producto_nombre: string
          total_cantidad: number
          total_solicitudes: number
        }[]
      }
      get_user_analytics_level: {
        Args: { user_id_param: string }
        Returns: string
      }
      get_user_kpis: {
        Args: { days_param: number; user_id_param: string }
        Returns: Json
      }
      get_variant_types_by_category: {
        Args: { category_name: string }
        Returns: {
          display_name: string
          id: string
          input_type: string
          is_required: boolean
          name: string
          variant_values: Json
        }[]
      }
      increment_catalog_usage: { Args: { p_user_id: string }; Returns: Json }
      increment_catalog_views: {
        Args: { p_catalog_id: string }
        Returns: undefined
      }
      permanently_delete_product: {
        Args: { product_id: string; requesting_user_id: string }
        Returns: boolean
      }
      restore_product: {
        Args: { product_id: string; requesting_user_id: string }
        Returns: boolean
      }
      soft_delete_product: {
        Args: {
          product_id: string
          reason?: string
          requesting_user_id: string
        }
        Returns: boolean
      }
      update_product_field: {
        Args: { field_name: string; field_value: string; product_id: string }
        Returns: boolean
      }
      update_variant_stock: {
        Args: { new_stock: number; variant_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      delivery_method_enum: "pickup" | "shipping"
      status_fabricante:
        | "nuevo"
        | "en_analisis"
        | "agregado_al_catalogo"
        | "ignorado"
      status_revendedor:
        | "nuevo"
        | "revisando"
        | "consultado_proveedor"
        | "conseguido"
        | "rechazado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      delivery_method_enum: ["pickup", "shipping"],
      status_fabricante: [
        "nuevo",
        "en_analisis",
        "agregado_al_catalogo",
        "ignorado",
      ],
      status_revendedor: [
        "nuevo",
        "revisando",
        "consultado_proveedor",
        "conseguido",
        "rechazado",
      ],
    },
  },
} as const
