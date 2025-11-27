'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

export default function NationalDashboard() {
  const supabase = createClient()
  const [stats, setStats] = useState({ totalFranchisePosts: 0, totalTemplates: 0 })
  const [recentTemplates, setRecentTemplates] = useState<any[]>([])

  useEffect(() => {
    const fetchStats = async () => {
      // 1. Count Total Local Posts (Network Wide)
      const { count: franchiseCount } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('is_national_template', false)

      // 2. Count Total Templates
      const { count: templateCount } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('is_national_template', true)

      setStats({ 
        totalFranchisePosts: franchiseCount || 0, 
        totalTemplates: templateCount || 0 
      })

      // 3. Fetch Recent Templates
      const { data } = await supabase
        .from('assets')
        .select('*')
        .eq('is_national_template', true)
        .order('created_at', { ascending: false })
        .limit(5)

      if (data) setRecentTemplates(data)
    }

    fetchStats()
  }, [])

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">National HQ Dashboard</h1>
        <Link href="/national/create" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
          + Create New Asset
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-lg shadow border-l-4 border-purple-600">
          <h3 className="text-gray-500 uppercase text-sm font-bold">Network Activity</h3>
          <p className="text-4xl font-bold mt-2">{stats.totalFranchisePosts}</p>
          <p className="text-gray-400 text-sm">Total posts created by franchisees</p>
        </div>
        <div className="bg-white p-8 rounded-lg shadow border-l-4 border-blue-600">
          <h3 className="text-gray-500 uppercase text-sm font-bold">Asset Library</h3>
          <p className="text-4xl font-bold mt-2">{stats.totalTemplates}</p>
          <p className="text-gray-400 text-sm">Total templates available</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-bold">Recent National Assets</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="p-4">Asset</th>
              <th className="p-4">Caption</th>
              <th className="p-4">Date Created</th>
              <th className="p-4">Platform Settings</th>
            </tr>
          </thead>
          <tbody>
            {recentTemplates.map(t => (
              <tr key={t.id} className="border-t hover:bg-gray-50">
                <td className="p-4">
                  <div className="h-10 w-10 bg-gray-200 rounded overflow-hidden">
                    <img src={t.media_url} className="h-full w-full object-cover" />
                  </div>
                </td>
                <td className="p-4 truncate max-w-xs">{t.caption}</td>
                <td className="p-4">{new Date(t.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <div className="flex gap-1">
                    {t.platform_settings?.facebook && <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-1 rounded">FB</span>}
                    {t.platform_settings?.instagram && <span className="text-[10px] bg-pink-100 text-pink-800 px-2 py-1 rounded">IG</span>}
                    {t.platform_settings?.linkedin && <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-1 rounded">LI</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}