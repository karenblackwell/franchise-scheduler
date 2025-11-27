import Link from 'next/link'

export default function NationalDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">National Office Dashboard</h1>
      <div className="grid gap-4">
        <div className="p-6 border rounded shadow-sm bg-white">
          <h2 className="text-xl font-semibold mb-2">Create New Asset</h2>
          <p className="text-gray-600 mb-4">Upload templates for the franchise network.</p>
          <Link 
            href="/national/create" 
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Creator
          </Link>
        </div>
      </div>
    </div>
  )
}