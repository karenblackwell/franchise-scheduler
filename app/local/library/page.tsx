'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

// Define the shape of an Asset (including new fields)
type Asset = {
  id: string
  media_url: string
  caption: string
  is_national_template: boolean
  source_link?: string       // Canva/Drive link
  scheduled_for?: string     // Suggested date
  link_url?: string          // External link for the post
  platform_settings?: any    // JSON of selected platforms
}

export default function AssetLibrary() {
  const supabase = createClient()
  const router = useRouter()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch Assets on Page Load
  useEffect(() => {
    const fetchAssets = async () => {
      // The RLS policy in Supabase handles the filtering.
      // It returns: 1. My Local Posts AND 2. National Templates
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) setAssets(data)
      if (error) console.error(error)
      setLoading(false)
    }

    fetchAssets()
  }, [])

  const handleImport = async (asset: Asset) => {
    if (!confirm("Do you want to use this template?")) return

    try {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return alert('You must be logged in')

      // 2. Get their Workspace ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('workspace_id')
        .eq('id', user.id)
        .single()

      if (!profile) return alert('No profile found')

      // 3. CLONE: Insert a NEW row for the Local Workspace
      // We copy ALL the data from the National Asset to the new Local Post
      const { data: newPost, error } = await supabase
        .from('assets')
        .insert({
          workspace_id: profile.workspace_id,  // Local Workspace ID
          media_url: asset.media_url,          // Copy the preview image
          caption: asset.caption,              // Copy the caption
          
          // --- NEW FIELDS ---
          source_link: asset.source_link,      // Copy Canva/Drive link
          link_url: asset.link_url,            // Copy the promo link
          scheduled_for: asset.scheduled_for,  // Copy suggested date
          platform_settings: asset.platform_settings, // Copy platform choices
          
          is_national_template: false,         // It is now a Local Post!
          status: 'DRAFT'                      // Start as Draft
        })
        .select() // Returns the new row data so we can get the ID
        .single()

      if (error) throw error
      
      // 4. Redirect to the Editor for this new post
      router.push(`/local/post/${newPost.id}`)

    } catch (error: any) {
      alert('Error importing asset: ' + error.message)
    }
  }

  if (loading) return <div className="p-8">Loading Library...</div>

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Asset Library</h1>
        <button 
          onClick={() => window.location.reload()}
          className="text-sm text-blue-600 hover:underline"
        >
          Refresh List
        </button>
      </div>
      
      {assets.length === 0 && (
        <div className="text-center text-gray-500 py-10">
          No assets found. Ask National to create some templates!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map((asset) => (
          <div key={asset.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition flex flex-col">
            
            {/* Header Badge */}
            <div className="p-3 border-b flex justify-between items-center bg-gray-50">
              {asset.is_national_template ? (
                <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                  National Template
                </span>
              ) : (
                <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                  My Local Post
                </span>
              )}
              {asset.source_link && (
                 <span title="Editable Graphic Available" className="text-xs">🎨</span>
              )}
            </div>

            {/* Image */}
            <div className="relative h-56 bg-gray-200">
               <img 
                 src={asset.media_url} 
                 alt="Social Post" 
                 className="w-full h-full object-cover"
               />
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col">
              <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
                {asset.caption || "No caption provided."}
              </p>

              {/* The Action Button */}
              {asset.is_national_template ? (
                <button 
                  onClick={() => handleImport(asset)}
                  className="w-full bg-indigo-600 text-white py-2 rounded font-medium hover:bg-indigo-700 transition shadow-sm"
                >
                  Use Template
                </button>
              ) : (
                <button 
                  onClick={() => router.push(`/local/post/${asset.id}`)}
                  className="w-full bg-white text-gray-700 border border-gray-300 py-2 rounded font-medium hover:bg-gray-50 transition"
                >
                  Edit My Post
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}