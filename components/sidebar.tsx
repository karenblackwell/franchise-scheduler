'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()
  const router = useRouter()
  const [role, setRole] = useState<'NATIONAL' | 'LOCAL' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Check the profile to see their role
      const { data: profile } = await supabase
        .from('profiles')
        .select('workspaces(type)')
        .eq('id', user.id)
        .single()

      const userProfile = profile as any
      const type = Array.isArray(userProfile?.workspaces) 
        ? userProfile.workspaces[0]?.type 
        : userProfile?.workspaces?.type

      setRole(type)
      setLoading(false)
    }

    checkUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Don't show sidebar on login page
  if (pathname === '/login') return null
  if (loading) return <div className="w-64 bg-gray-900 text-white p-6">Loading...</div>

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col p-4 fixed left-0 top-0">
      <div className="mb-8 mt-4">
        <h1 className="text-xl font-bold tracking-wider">FRANCHISE<span className="text-blue-500">APP</span></h1>
        <p className="text-xs text-gray-400 mt-1">{role} WORKSPACE</p>
      </div>

      <nav className="flex-1 space-y-2">
        {/* LINKS FOR NATIONAL USERS */}
        {role === 'NATIONAL' && (
          <>
            <NavLink href="/national/dashboard" active={pathname === '/national/dashboard'}>
              Dashboard
            </NavLink>
            <NavLink href="/national/create" active={pathname === '/national/create'}>
              Asset Creator
            </NavLink>
            <NavLink href="/national/analytics" active={pathname === '/national/analytics'}>
              Network Analytics
            </NavLink>
          </>
        )}

        {/* LINKS FOR LOCAL USERS */}
        {role === 'LOCAL' && (
          <>
            <NavLink href="/local/dashboard" active={pathname === '/local/dashboard'}>
              Dashboard
            </NavLink>
            <NavLink href="/local/library" active={pathname === '/local/library'}>
              Asset Library
            </NavLink>
            <NavLink href="/local/schedule" active={pathname === '/local/schedule'}>
              My Schedule
            </NavLink>
            <NavLink href="/local/settings" active={pathname === '/local/settings'}>
              Connections
            </NavLink>
          </>
        )}
      </nav>

      <button 
        onClick={handleLogout}
        className="mt-auto p-3 bg-gray-800 rounded hover:bg-red-900 text-left text-sm transition"
      >
        Sign Out
      </button>
    </div>
  )
}

// Helper component for links
function NavLink({ href, children, active }: { href: string, children: React.ReactNode, active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`block px-4 py-3 rounded transition ${
        active 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
      }`}
    >
      {children}
    </Link>
  )
}