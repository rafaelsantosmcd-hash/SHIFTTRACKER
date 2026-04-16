'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function ScanPage() {
  const [status, setStatus] = useState('Pronto para ler TAG')
  const [activeLocation, setActiveLocation] = useState<string | null>(null)

  const startNfc = async () => {
    try {
      // @ts-ignore
      const ndef = new NDEFReader()
      await ndef.scan()
      setStatus("TAG detetada! Avalie a zona abaixo:")
      
      ndef.addEventListener("reading", ({ message }: any) => {
        const url = new URL(new TextDecoder().decode(message.records[0].data))
        const loc = url.searchParams.get("loc")
        if (loc) setActiveLocation(loc)
      })
    } catch (e) { setStatus("Erro: Use Chrome no Android") }
  }

  const recordRating = async (rating: string) => {
    const manager = localStorage.getItem('manager_name') || 'Desconhecido'
    const { error } = await supabase.from('checkins').insert([
      { location_id: activeLocation, manager_name: manager, rating: rating }
    ])

    if (!error) {
      alert("Registado com sucesso!")
      setActiveLocation(null)
      setStatus("Pronto para a próxima TAG")
    }
  }

  return (
    <div style={{ textAlign: 'center', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>{status}</h2>
      
      {!activeLocation ? (
        <button onClick={startNfc} style={{ padding: '20px', fontSize: '1.2rem', backgroundColor: '#0070f3', color: 'white', borderRadius: '10px' }}>
          CLIQUE PARA LER TAG
        </button>
      ) : (
        <div style={{ marginTop: '30px' }}>
          <h3>Estado da Zona: {activeLocation}</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <button onClick={() => recordRating('red')} style={{ backgroundColor: '#ff4d4f', padding: '30px', borderRadius: '50%', border: 'none', fontSize: '2rem' }}>🔴</button>
            <button onClick={() => recordRating('yellow')} style={{ backgroundColor: '#ffec3d', padding: '30px', borderRadius: '50%', border: 'none', fontSize: '2rem' }}>🟡</button>
            <button onClick={() => recordRating('green')} style={{ backgroundColor: '#73d13d', padding: '30px', borderRadius: '50%', border: 'none', fontSize: '2rem' }}>🟢</button>
          </div>
          <button onClick={() => setActiveLocation(null)} style={{ marginTop: '40px', background: 'none', border: 'none', color: '#666' }}>Cancelar</button>
        </div>
      )}
    </div>
  )
}