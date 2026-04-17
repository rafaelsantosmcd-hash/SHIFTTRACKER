'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const [gerentes, setGerentes] = useState<any[]>([])
  const [gerenteSelecionado, setGerenteSelecionado] = useState<string>('')

  useEffect(() => {
    // 1. Ir buscar a lista de gerentes à base de dados
    async function fetchGerentes() {
      const { data } = await supabase
      .from('gerentes')
      .select('*')
      .eq('restaurante_id', process.env.NEXT_PUBLIC_RESTAURANT_ID)
      .order('nome')
      if (data) setGerentes(data)
    }
    fetchGerentes()

    // 2. Verificar se já existe um gerente guardado localmente
    const saved = localStorage.getItem('manager_name')
    if (saved) setGerenteSelecionado(saved)
  }, [])

  const handleSelect = (nome: string) => {
    setGerenteSelecionado(nome)
    localStorage.setItem('manager_name', nome) // Guarda no telemóvel
  }

  return (
    <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Controlo de Rondas</h1>
      
      {!gerenteSelecionado ? (
        <div style={{ marginTop: '30px' }}>
          <h3>Quem está de serviço?</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            {gerentes.map(g => (
              <button 
                key={g.id}
                onClick={() => handleSelect(g.nome)}
                style={{
                  padding: '15px', width: '250px', fontSize: '1.1rem',
                  borderRadius: '10px', border: '1px solid #ccc', backgroundColor: 'white'
                }}
              >
                {g.nome}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: '30px' }}>
          <p style={{ fontSize: '1.2rem' }}>Olá, <strong>{gerenteSelecionado}</strong>!</p>
          <button 
            onClick={() => { localStorage.removeItem('manager_name'); setGerenteSelecionado(''); }}
            style={{ fontSize: '0.8rem', color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            (Trocar Gerente)
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', marginTop: '40px' }}>
            <Link href="/scanapp" style={{
              padding: '20px', width: '250px', backgroundColor: '#0070f3', color: 'white',
              borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold'
            }}>
              INICIAR RONDA
            </Link>

            <Link href="/dashboard" style={{
              padding: '15px', width: '250px', backgroundColor: '#eee', color: '#333',
              borderRadius: '10px', textDecoration: 'none'
            }}>
              VER DASHBOARD
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}