'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

type HashtagGroup = {
  id: string
  name: string
  content: string
}

export default function hashtagpicker({ onInsert }: { onInsert: (text: string) => void }) {
  const supabase = createClient()
  const [groups, setGroups] = useState<HashtagGroup[]>([])
  const [isOpen, setIsOpen] = useState(false)
  
  // New Group Form
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newContent, setNewContent] = useState('')

  useEffect(() => {
    if (isOpen) fetchGroups()
  }, [isOpen])

  const fetchGroups = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from('profiles').select('workspace_id').eq('id', user.id).single()
    
    // SAFETY CHECK: If no profile, stop here.
    if (!profile) return 

    const { data } = await supabase
      .from('hashtag_groups')
      .select('*')
      .eq('workspace_id', profile.workspace_id)
      .order('created_at', { ascending: false })
    
    if (data) setGroups(data)
  }

  const handleCreate = async () => {
    if (!newName || !newContent) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from('profiles').select('workspace_id').eq('id', user.id).single()

    // SAFETY CHECK: Fixes the 'possibly null' error
    if (!profile) return 

    const { error } = await supabase.from('hashtag_groups').insert({
      workspace_id: profile.workspace_id,
      name: newName,
      content: newContent
    })

    if (!error) {
      setIsCreating(false)
      setNewName('')
      setNewContent('')
      fetchGroups()
    }
  }

  return (
    <div className="relative inline-block text-left mt-2">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded hover:bg-gray-200 border"
      >
        # Insert Hashtags
      </button>

      {isOpen && (
        <div className="absolute z-10 bottom-full mb-2 w-72 bg-white border rounded shadow-xl p-4 left-0">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm">Saved Groups</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 text-xs hover:text-gray-600">Close</button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
            {groups.length === 0 && <p className="text-xs text-gray-400">No groups yet.</p>}
            {groups.map(g => (
              <div key={g.id} className="border p-2 rounded hover:bg-gray-50 flex justify-between items-center bg-gray-50">
                <div className="overflow-hidden">
                  <div className="font-bold text-xs">{g.name}</div>
                  <div className="text-[10px] text-gray-500 truncate w-40">{g.content}</div>
                </div>
                <button 
                  onClick={() => { onInsert(g.content); setIsOpen(false); }}
                  className="text-blue-600 text-xs font-bold px-2 hover:underline"
                >
                  Insert
                </button>
              </div>
            ))}
          </div>

          {isCreating ? (
            <div className="bg-blue-50 p-2 rounded border border-blue-100">
              <input 
                className="w-full text-xs p-1 border mb-2 rounded" 
                placeholder="Group Name (e.g. Summer)"
                value={newName} onChange={e => setNewName(e.target.value)}
              />
              <textarea 
                className="w-full text-xs p-1 border mb-2 rounded" 
                placeholder="#tag1 #tag2"
                value={newContent} onChange={e => setNewContent(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={handleCreate} className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700">Save</button>
                <button onClick={() => setIsCreating(false)} className="text-gray-500 text-xs px-2 py-1 hover:text-gray-700">Cancel</button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsCreating(true)}
              className="w-full text-center text-xs text-blue-600 border border-blue-200 py-2 rounded hover:bg-blue-50 font-medium"
            >
              + Create New Group
            </button>
          )}
        </div>
      )}
    </div>
  )
}