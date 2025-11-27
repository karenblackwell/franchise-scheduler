'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { format } from 'date-fns'

export default function LocalDashboard() {
  const supabase = createClient()
  const [stats, setStats] = useState({ scheduled: 0, drafts: 0, sent: 0 })
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [newTemplates, setNewTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('profiles').select('workspace_id').eq('id', user.id).single()
      if (!profile) return

      // 1. Get Stats (Drafts vs Scheduled)
      const { data: allAssets } = await supabase
        .from('assets')
        .select('status, scheduled_for')
        .eq('workspace_id', profile.workspace_id)
        .eq('is_national_template', false)

      const scheduled = allAssets?.filter(a => a.status === 'SCHEDULED' || a.status === 'PUBLISHED').length || 0
      const drafts = allAssets?.filter(a => a.status === 'DRAFT').length || 0
      
      setStats({ scheduled, drafts, sent: 0 })

      // 2. Get Next 3 Upcoming Posts
      const { data: up } = await supabase
        .from('assets')
        .select('*')
        .eq('workspace_id', profile.workspace_id)
        .eq('status', 'SCHEDULED')
        .gt('scheduled_for', new Date().toISOString()) // Only future dates
        .order('scheduled_for', { ascending: true })
        .limit(3)
      
      if (up) setUpcoming(up)

      // 3. Get Recent National Templates
      const { data: templates } = await supabase
        .from('assets')
        .select('*')
        .eq('is_national_template', true)
        .order('created_at', { ascending: false })
        .limit(4)

      if (templates) setNewTemplates(templates)
      
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) return <div className="p-8">Loading Dashboard...</div>

  return (
    <div className="p-8 space-y-8">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Overview of your franchise marketing.</p>
        </div>
        <Link 
          href="/local/library" 
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          + Create New Post
        </Link>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-blue-500">
          <div className="text-gray-500 text-sm font-medium uppercase">Scheduled</div>
          <div className="text-3xl font-bold text-gray-800">{stats.scheduled}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-yellow-500">
          <div className="text-gray-500 text-sm font-medium uppercase">Drafts</div>
          <div className="text-3xl font-bold text-gray-800">{stats.drafts}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-green-500">
          <div className="text-gray-500 text-sm font-medium uppercase">Total Posts</div>
          <div className="text-3xl font-bold text-gray-800">{stats.scheduled + stats.drafts}</div>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT: Upcoming Schedule */}
        <div className="bg-white border rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">Up Next</h2>
          {upcoming.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded">
              No upcoming posts scheduled.
            </div>
          ) : (
            <div className="space-y-4">
              {upcoming.map(post => (
                <div key={post.id} className="flex gap-4 items-center border-b pb-4 last:border-0">
                  <div className="h-12 w-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    <img src={post.media_url} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm truncate">{post.caption}</div>
                    <div className="text-xs text-gray-500">
                      Scheduled for: {format(new Date(post.scheduled_for), 'MMM d, h:mm a')}
                    </div>
                  </div>
                  <Link href={`/local/post/${post.id}`} className="text-xs bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-4 border-t text-center">
            <Link href="/local/schedule" className="text-blue-600 text-sm font-medium hover:underline">View Full Calendar →</Link>
          </div>
        </div>

        {/* RIGHT: New Templates */}
        <div className="bg-white border rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">New from National</h2>
          <div className="grid grid-cols-2 gap-4">
            {newTemplates.map(t => (
              <div key={t.id} className="group cursor-pointer relative rounded-lg overflow-hidden border">
                <Link href="/local/library">
                  <div className="aspect-video bg-gray-200 relative">
                    <img src={t.media_url} className="h-full w-full object-cover group-hover:scale-105 transition" />
                  </div>
                  <div className="p-2 text-xs font-medium truncate bg-white">
                    {t.caption}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}