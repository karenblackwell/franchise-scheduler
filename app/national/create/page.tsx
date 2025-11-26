'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function CreateAsset() {
  const supabase = createClient()
  const router = useRouter()
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !caption) return alert('Please select a file and write a caption')
    
    try {
      setLoading(true)
      
      // 1. Get Current User (National Admin)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      // 2. Fetch their Workspace ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('workspace_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('No profile found')

      // 3. Upload Image to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // 4. Get the Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName)

      // 5. Insert into Database as a "National Template"
      const { error: dbError } = await supabase.from('assets').insert({
        workspace_id: profile.workspace_id,
        media_url: publicUrl,
        caption: caption,
        is_national_template: true, // <--- THIS IS KEY
        status: 'PUBLISHED' // Templates are ready to view immediately
      })

      if (dbError) throw dbError

      alert('National Asset Created!')
      router.refresh()
      setCaption('')
      setFile(null)

    } catch (error) {
      console.error(error)
      alert('Error uploading asset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create National Asset</h1>
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block mb-2">Image</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="border p-2 w-full" 
          />
        </div>
        <div>
          <label className="block mb-2">Suggested Caption</label>
          <textarea 
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="border p-2 w-full h-32"
            placeholder="Write a caption for the franchisees..."
          />
        </div>
        <button 
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Publish to Network'}
        </button>
      </form>
    </div>
  )
}