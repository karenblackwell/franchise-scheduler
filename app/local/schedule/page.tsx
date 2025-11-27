'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, getDay } from 'date-fns'
import { useRouter } from 'next/navigation'

type Post = {
  id: string
  caption: string
  scheduled_for: string
  media_url: string
  status: string
}

export default function CalendarPage() {
  const supabase = createClient()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())

  // Calendar Math
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Add empty days for padding at the start (so the 1st starts on the correct day of week)
  const startingDayIndex = getDay(monthStart) // 0 = Sunday, 1 = Monday...
  const emptyDays = Array.from({ length: startingDayIndex })

  useEffect(() => {
    const fetchSchedule = async () => {
      // 1. Get User
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 2. Get Workspace
      const { data: profile } = await supabase
        .from('profiles')
        .select('workspace_id')
        .eq('id', user.id)
        .single()

      if (!profile) return

      // 3. Get Scheduled Posts
      const { data } = await supabase
        .from('assets')
        .select('*')
        .eq('workspace_id', profile.workspace_id)
        .neq('status', 'DRAFT') // Only show Scheduled or Published
        .not('scheduled_for', 'is', null)

      if (data) setPosts(data)
    }

    fetchSchedule()
  }, [])

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {format(currentDate, 'MMMM yyyy')}
        </h1>
        <div className="text-sm text-gray-500">
          Showing Scheduled & Published content
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 border rounded-lg shadow-sm bg-white overflow-hidden flex flex-col">
        
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-4 text-center font-semibold text-gray-600 text-sm uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
          
          {/* Empty Slots for previous month */}
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="bg-gray-50 border-b border-r" />
          ))}

          {/* Actual Days */}
          {daysInMonth.map((day) => {
            const daysPosts = posts.filter(post => 
              isSameDay(new Date(post.scheduled_for), day)
            )

            return (
              <div key={day.toISOString()} className="border-b border-r p-2 min-h-[100px] relative group hover:bg-gray-50 transition">
                <div className="text-sm font-medium text-gray-500 mb-1">
                  {format(day, 'd')}
                </div>

                <div className="space-y-1">
                  {daysPosts.map(post => (
                    <div 
                      key={post.id}
                      onClick={() => router.push(`/local/post/${post.id}`)}
                      className={`text-xs p-1 rounded truncate cursor-pointer ${
                        post.status === 'PUBLISHED' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {format(new Date(post.scheduled_for), 'h:mm a')} - {post.caption.substring(0, 10)}...
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}