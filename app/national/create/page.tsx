'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function CreateNationalAsset() {
  const supabase = createClient()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [caption, setCaption] = useState('')
  const [sourceLink, setSourceLink] = useState('') // <--- NEW
  const [suggestedDate, setSuggestedDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  const [platforms, setPlatforms] = useState({
    facebook: true,
    instagram: false,
    linkedin: false
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setPreviewUrl(URL.createObjectURL(selected))
    }
  }

  const handlePublish = async () => {
    if (!file || !caption) return alert('Please add an image and caption')
    setLoading(true)

    try {
      // 1. Upload Image
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('media').upload(fileName, file)
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName)

      // 2. Get User
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')
      
      const { data: profile } = await supabase.from('profiles').select('workspace_id').eq('id', user.id).single()

      // 3. Save to DB
      const { error: dbError } = await supabase.from('assets').insert({
        workspace_id: profile?.workspace_id,
        media_url: urlData.publicUrl,
        caption: caption,
        source_link: sourceLink, // <--- SAVING THE CANVA LINK
        scheduled_for: suggestedDate ? new Date(suggestedDate).toISOString() : null,
        platform_settings: platforms,
        is_national_template: true,
        status: 'PUBLISHED'
      })

      if (dbError) throw dbError

      alert('National Template Published!')
      router.refresh()
      setCaption('')
      setSourceLink('')
      setFile(null)
      setPreviewUrl(null)

    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto flex gap-8">
      <div className="flex-1 space-y-6">
        <h1 className="text-3xl font-bold">Create National Asset</h1>
        
        {/* Platforms */}
        <div>
          <label className="block text-sm font-medium mb-2">Target Platforms</label>
          <div className="flex gap-4">
            {['facebook', 'instagram', 'linkedin'].map((p) => (
              <button
                key={p}
                onClick={() => setPlatforms(prev => ({ ...prev, [p]: !prev[p as keyof typeof platforms] }))}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize border ${platforms[p as keyof typeof platforms] ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Image Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition">
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="file-upload" />
          <label htmlFor="file-upload" className="cursor-pointer">
            {file ? <span className="text-green-600 font-medium">Selected: {file.name}</span> : <span className="text-gray-500">Click to upload PREVIEW graphic</span>}
          </label>
        </div>

        {/* Source Link (Canva) */}
        <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
          <label className="block text-sm font-bold text-yellow-800 mb-2">Graphic Source Link (Canva/Drive)</label>
          <input 
            type="text"
            value={sourceLink}
            onChange={(e) => setSourceLink(e.target.value)}
            className="w-full p-3 border rounded focus:ring-2 focus:ring-yellow-500 outline-none"
            placeholder="https://www.canva.com/design/..."
          />
          <p className="text-xs text-yellow-700 mt-1">Franchisees can click this to edit the graphic themselves.</p>
        </div>

        {/* Caption */}
        <div>
          <label className="block text-sm font-medium mb-2">Base Caption</label>
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} className="w-full p-4 border rounded-lg h-32 focus:ring-2 focus:ring-purple-500 outline-none" />
        </div>

        {/* Suggested Date */}
        <div>
          <label className="block text-sm font-medium mb-2">Suggested Date</label>
          <input type="datetime-local" value={suggestedDate} onChange={(e) => setSuggestedDate(e.target.value)} className="w-full p-3 border rounded focus:ring-2 focus:ring-purple-500 outline-none" />
        </div>

        <button onClick={handlePublish} disabled={loading} className="w-full bg-purple-600 text-white font-bold py-3 rounded hover:bg-purple-700 disabled:opacity-50">
          {loading ? 'Publishing...' : 'Publish Template'}
        </button>
      </div>

      {/* Preview */}
      <div className="w-[350px] flex-shrink-0">
        <div className="border rounded-xl shadow-lg overflow-hidden bg-white">
          <div className="bg-gray-100 aspect-square relative flex items-center justify-center">
             {previewUrl ? <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" /> : <span className="text-gray-400 text-sm">No Image</span>}
          </div>
          <div className="p-3">
             <p className="text-sm text-gray-800"><span className="font-bold mr-1">national_hq</span>{caption}</p>
          </div>
        </div>
      </div>
    </div>
  )
}