'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase (get these from your Supabase settings)
const supabase = createClient('https://lilvphbsucrabbfdilyr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpbHZwaGJzdWNyYWJiZmRpbHlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MjIxODYsImV4cCI6MjA5MTM5ODE4Nn0.kPQnQLDGlH1v6g80GInzIfJUPjalqraAOAi2ok5VpSY')

export default function ScanPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Processing scan...')

  useEffect(() => {
    const loc = searchParams.get('loc')
    
    if (loc) {
      saveCheckin(loc)
    } else {
      setStatus('Invalid Tag: No location found.')
    }
  }, [searchParams])

  const saveCheckin = async (locationId: string) => {
    const { error } = await supabase
      .from('checkins')
      .insert([
        { 
          location_id: locationId, 
          manager_name: 'John Doe' // Later, we will get this from a login
        }
      ])

    if (error) {
      setStatus('Error logging check-in: ' + error.message)
    } else {
      setStatus(`✅ Checked into ${locationId} successfully!`)
    }
  }

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontSize: '24px' }}>
      <h1>{status}</h1>
      <a href="/dashboard" style={{ color: 'blue', fontSize: '16px' }}>Go to Dashboard</a>
    </div>
  )
}