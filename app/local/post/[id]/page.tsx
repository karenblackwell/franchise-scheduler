'use client'
import { useEffect, useState, use } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import HashtagPicker from '@/components/hashtagpicker' // <--- Import the picker

export default function PostEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [post, setPost] = useState<any>(null)
  const [scheduleTime, setScheduleTime] = useState('')
  const [sourceLink, setSourceLink] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  // Platform State
  type Platform = 'facebook' | 'instagram' | 'linkedin'
  const [activeTab, setActiveTab] = useState<Platform>('facebook')
  
  // Stores captions for EACH platform: { facebook: "...", instagram: "..." }
  const [captions, setCaptions] = useState<Record<string, string>>({
    facebook: '',
    instagram: '',
    linkedin: ''
  })

  // Toggle which platforms are enabled
  const [enabledPlatforms, setEnabledPlatforms] = useState<Record<string, boolean>>({
    facebook: true,
    instagram: false,
    linkedin: false
  })

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase.from('assets').select('*').eq('id', id).single()
      if (error) { router.push('/local/dashboard'); return }

      setPost(data)
      setSourceLink(data.source_link || '')
      
      // Load Schedule
      if (data.scheduled_for) {
        const date = new Date(data.scheduled_for)
        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
        setScheduleTime(localDate.toISOString().slice(0, 16))
      }

      // Load Platforms
      if (data.platform_settings) setEnabledPlatforms(data.platform_settings)

      // Load Captions (Logic: If specific caption exists, use it. Else use base caption)
      const specificContent = data.platform_content || {}
      setCaptions({
        facebook: specificContent.facebook || data.caption || '',
        instagram: specificContent.instagram || data.caption || '',
        linkedin: specificContent.linkedin || data.caption || ''
      })

      setLoading(false)
    }
    fetchPost()
  }, [id, router, supabase])

  // Helper to update specific caption
  const updateCaption = (text: string) => {
    setCaptions(prev => ({ ...prev, [activeTab]: text }))
  }

  const handleImageReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadingImage(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_local.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('media').upload(fileName, file)
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName)
      
      await supabase.from('assets').update({ media_url: urlData.publicUrl }).eq('id', id)
      setPost({ ...post, media_url: urlData.publicUrl })
      alert('Image updated!')
    } catch (error: any) { alert(error.message) } 
    finally { setUploadingImage(false) }
  }

  const handleSave = async (newStatus: 'DRAFT' | 'SCHEDULED') => {
    if (newStatus === 'SCHEDULED' && !scheduleTime) return alert('Please select a date.')

    const { error } = await supabase.from('assets').update({
        caption: captions[activeTab], // Update legacy caption col with active one for safety
        platform_content: captions,   // <--- SAVE ALL CAPTIONS
        platform_settings: enabledPlatforms,
        scheduled_for: scheduleTime ? new Date(scheduleTime).toISOString() : null,
        status: newStatus,
      }).eq('id', id)

    if (error) return alert('Error saving: ' + error.message)
    alert(newStatus === 'SCHEDULED' ? 'Post Scheduled!' : 'Draft Saved')
    router.push('/local/dashboard')
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 max-w-6xl mx-auto flex gap-8">
      <div className="flex-1 space-y-6">
        <h1 className="text-2xl font-bold">Edit Post</h1>

        {/* Platform Toggles (Which ones are ON?) */}
        <div className="flex gap-2 mb-4">
          {['facebook', 'instagram', 'linkedin'].map((p) => (
            <button
              key={p}
              onClick={() => setEnabledPlatforms(prev => ({ ...prev, [p]: !prev[p as keyof typeof enabledPlatforms] }))}
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition border
                ${enabledPlatforms[p] ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-50 text-gray-400 border-gray-200 opacity-60'}`}
            >
              {enabledPlatforms[p] ? '✓' : ''} {p}
            </button>
          ))}
        </div>

        {/* THE TABS (Switching view) */}
        <div className="border-b flex gap-6">
          {['facebook', 'instagram', 'linkedin'].map((p) => (
            <button
              key={p}
              onClick={() => setActiveTab(p as Platform)}
              className={`pb-2 text-sm font-medium capitalize border-b-2 transition ${
                activeTab === p 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Edit for {p}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="bg-gray-50 p-4 rounded-b-lg border border-t-0">
          
          <label className="block text-sm font-medium mb-2 capitalize">{activeTab} Caption</label>
          <textarea 
            value={captions[activeTab]} 
            onChange={(e) => updateCaption(e.target.value)} 
            className="w-full p-4 border rounded-lg h-40 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder={`Write your ${activeTab} caption here...`}
          />
          
          {/* HASHTAG PICKER */}
          <div className="flex justify-between items-start mt-2">
             <div className="text-xs text-gray-400">
                {activeTab === 'instagram' ? 'Tip: Add 30 hashtags for reach.' : 'Tip: Keep it professional for LinkedIn.'}
             </div>
             <HashtagPicker onInsert={(tags) => updateCaption(captions[activeTab] + ' ' + tags)} />
          </div>

        </div>

        {/* Source Link & Image Replacement (Same as before) */}
        {sourceLink && (
          <div className="flex justify-between items-center bg-yellow-50 p-3 rounded border border-yellow-200">
            <span className="text-xs font-bold text-yellow-800">Has Canva Template</span>
            <a href={sourceLink} target="_blank" className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">Open Canva</a>
          </div>
        )}
        
        <div className="flex items-center gap-4 border p-3 rounded">
            <img src={post?.media_url} className="h-12 w-12 object-cover rounded" />
            <input type="file" onChange={handleImageReplace} className="text-xs" />
        </div>

        {/* Scheduling */}
        <div>
          <label className="block text-sm font-medium mb-2">Schedule Time</label>
          <input type="datetime-local" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="w-full p-2 border rounded" />
        </div>

        <div className="flex gap-4 pt-4">
          <button onClick={() => handleSave('DRAFT')} className="px-6 py-2 border rounded">Save Draft</button>
          <button onClick={() => handleSave('SCHEDULED')} className="px-6 py-2 bg-blue-600 text-white rounded">Schedule Post</button>
        </div>
      </div>

      {/* Preview */}
      <div className="w-[320px] flex-shrink-0 mt-12">
        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Preview: {activeTab}</h4>
         <div className="border rounded-xl shadow-lg overflow-hidden bg-white">
          <div className="bg-gray-100 aspect-square relative">
             <img src={post?.media_url} className="w-full h-full object-cover" />
          </div>
          <div className="p-3">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">
              <span className="font-bold mr-1">my_franchise</span>
              {captions[activeTab] || <span className="text-gray-300 italic">Caption...</span>}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}