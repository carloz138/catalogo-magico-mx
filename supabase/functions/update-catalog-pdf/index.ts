import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface UpdateRequest {
  catalog_id: string
  pdf_url?: string
  preview_image_url?: string
  file_size_bytes?: number
  total_pages?: number
  generation_status: 'processing' | 'completed' | 'failed'
  error_message?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }), 
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const body: UpdateRequest = await req.json()
    console.log('📥 Received catalog update request:', {
      catalog_id: body.catalog_id,
      generation_status: body.generation_status,
      has_pdf_url: !!body.pdf_url,
      file_size: body.file_size_bytes
    })

    // Validate required fields
    if (!body.catalog_id || !body.generation_status) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'catalog_id and generation_status are required' 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (body.generation_status === 'completed') {
      if (body.pdf_url) {
        updateData.pdf_url = body.pdf_url
      }
      if (body.preview_image_url) {
        updateData.preview_image_url = body.preview_image_url
      }
      if (body.file_size_bytes) {
        updateData.file_size_bytes = body.file_size_bytes
      }
      if (body.total_pages) {
        updateData.total_pages = body.total_pages
      }
    }

    if (body.generation_status === 'failed' && body.error_message) {
      // Store error in generation_metadata
      const { data: currentCatalog } = await supabase
        .from('catalogs')
        .select('generation_metadata')
        .eq('id', body.catalog_id)
        .single()

      const currentMetadata = currentCatalog?.generation_metadata || {}
      updateData.generation_metadata = {
        ...currentMetadata,
        generation_status: 'failed',
        error_message: body.error_message,
        failed_at: new Date().toISOString()
      }
    }

    // Update catalog in database
    const { data, error } = await supabase
      .from('catalogs')
      .update(updateData)
      .eq('id', body.catalog_id)
      .select()

    if (error) {
      console.error('❌ Database error updating catalog:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Database error: ${error.message}` 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!data || data.length === 0) {
      console.error('❌ Catalog not found:', body.catalog_id)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Catalog not found' 
        }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Catalog updated successfully:', {
      catalog_id: body.catalog_id,
      pdf_url: body.pdf_url,
      status: body.generation_status
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        catalog: data[0],
        message: `Catalog ${body.generation_status === 'completed' ? 'completed' : 'updated'} successfully`
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})