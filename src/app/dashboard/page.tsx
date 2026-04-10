'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://lilvphbsucrabbfdilyr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpbHZwaGJzdWNyYWJiZmRpbHlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MjIxODYsImV4cCI6MjA5MTM5ODE4Nn0.kPQnQLDGlH1v6g80GInzIfJUPjalqraAOAi2ok5VpSY')

export default function Dashboard() {
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    // Fetch logs and refresh every 30 seconds
    fetchLogs()
    const interval = setInterval(fetchLogs, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('checkins')
      .select('*, locations(display_name)')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (data) setLogs(data)
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Manager Dashboard</h1>
      <h3>Recent Rounds</h3>
      <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th>Time</th>
            <th>Location</th>
            <th>Manager</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{new Date(log.created_at).toLocaleTimeString()}</td>
              <td>{log.locations.display_name}</td>
              <td>{log.manager_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}