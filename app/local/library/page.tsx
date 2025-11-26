'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Image from 'next/image'

// Define the shape of our data
type Asset = {
  id: string
  media_url: string
  caption: string
  is_national_template: boolean
}

export default function AssetLibrary() {
  const supabase = createClient()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch Assets on Page Load
  useEffect(() => {
    const fetchAssets = async () => {
      // RLS Policy automatically filters this!
      // It returns:
      // 1. My Local Posts
      // 2. National Templates
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) setAssets(data)
      setLoading(false)
    }

    fetchAssets()
  }, [])

  const handleImport = async (asset: Asset) => {
    if (!confirm("Import this post to your schedule?")) return

    try {
      // 1. Get Local User Info
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('workspace_id')
        .eq('id', user.id)
        .single()

      // 2. CLONE OPERATION
      // We take the National data, but insert it as a NEW row
      // tied to the LOCAL workspace
      const { error } = await supabase.from('assets').insert({
        workspace_id: profile?.workspace_id, // Local Workspace
        media_url: asset.media_url,          // Same Image
        caption: asset.caption,              // Same Caption
        is_national_template: false,         // It is now a Local Instance
        status: 'DRAFT'                      // Start as Draft
      })

      if (error) throw error
      alert('Asset imported to your Drafts!')
      
    } catch (error) {
      alert('Error importing asset')
    }
  }

  if (loading) return <div>Loading Library...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Asset Library</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {assets.map((asset) => (
          <div key={asset.id} className="border rounded-lg p-4 shadow-sm bg-white">
            
            {/* Badge to show if it is National or Local */}
            <div className="mb-2">
              {asset.is_national_template ? (
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">National Template</span>
              ) : (
                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">My Post</span>
              )}
            </div>

            {/* Image Preview */}
            <div className="relative h-48 w-full mb-4 bg-gray-100 rounded">
               {/* Note: In real app, configure next.config.js for images */}
               <img 
                 src={asset.media_url} 
                 alt="Asset" 
                 className="object-cover w-full h-full rounded"
               />
            </div>

            <p className="text-sm text-gray-600 line-clamp-3 mb-4">{asset.caption}</p>

            {/* The "Clone" Action */}
            {asset.is_national_template && (
              <button 
                onClick={() => handleImport(asset)}
                className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
              >
                Use this Template
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}