'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Attempt to log in
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert('Error: ' + error.message)
      setLoading(false)
    } else {
      // If successful, we need to know: Are they National or Local?
      // We check the 'profiles' table we made in SQL.
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('workspace_id, workspaces(type)')
        .eq('id', user?.id)
        .single()
        
      // Redirect based on role
      // Note: This relies on the SQL setup. If that failed, this might bug out.
    // Redirect based on role
      
      // FIX: Tell TypeScript to treat this variable loosely ('any') 
      // so it doesn't complain about arrays vs objects.
      const userProfile = profile as any
      
      // Check if it's an array (list) or an object and get the type
      const workspaceType = Array.isArray(userProfile?.workspaces) 
        ? userProfile.workspaces[0]?.type 
        : userProfile?.workspaces?.type

      if (workspaceType === 'NATIONAL') {
        router.push('/national/dashboard')
      } else {
        router.push('/local/dashboard')
      }
    }
  }

  const handleSignUp = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) alert(error.message)
    else alert('Check your email for the confirmation link!')
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold text-center">Franchise Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <div className="flex gap-2">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              {loading ? '...' : 'Log In'}
            </button>
            <button 
              type="button"
              onClick={handleSignUp}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}