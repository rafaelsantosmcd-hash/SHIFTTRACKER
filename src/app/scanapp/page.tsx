'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AndroidScanPage() {
  const [status, setStatus] = useState<string>('Pronto para começar')
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  
  // Novos estados para a avaliação
  const [pendingLocation, setPendingLocation] = useState<{id: string, name: string} | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // 1. Função que apenas deteta a tag e prepara a avaliação
  const prepareRating = async (locationId: string) => {
    setStatus("TAG detetada! Procure avaliar...")
    
    const { data: locData } = await supabase
      .from('locations')
      .select('display_name')
      .eq('id', locationId)
      .single()

    if (!locData) {
      setStatus(`❌ Localização ${locationId} não existe.`)
      return
    }

    // Para o modo de pesquisa para focar na avaliação
    setPendingLocation({ id: locationId, name: locData.display_name })
  }

  // 2. Função que grava efetivamente com a cor escolhida
  const saveCheckin = async (rating: string) => {
    if (!pendingLocation) return

    setIsSaving(true)
    setStatus(`A gravar avaliação em ${pendingLocation.name}...`)
    
    const savedManager = localStorage.getItem('manager_name') || 'Gerente Desconhecido';

    const { error: checkinError } = await supabase
      .from('checkins')
      .insert([{ 
        location_id: pendingLocation.id, 
        manager_name: savedManager,
        rating: rating // Grava a cor selecionada
      }])

    setIsSaving(false)

    if (checkinError) {
      setStatus(`❌ Erro: ${checkinError.message}`)
    } else {
      setLastScanned(pendingLocation.name)
      setStatus(`✅ Registado por ${savedManager}`)
      setPendingLocation(null) // Limpa para o próximo scan
      if (navigator.vibrate) navigator.vibrate(200)
    }
  }

  const startNfcSession = async () => {
    if (!('NDEFReader' in window)) {
      setStatus("❌ Browser sem suporte NFC. Usa o Chrome no Android.")
      return
    }

    try {
      setIsScanning(true)
      setStatus("Pesquisa ativa... Toca numa tag.")
      
      // @ts-ignore
      const ndef = new NDEFReader()
      await ndef.scan()

      ndef.addEventListener("reading", ({ message }: any) => {
        for (const record of message.records) {
          if (record.recordType === "url") {
            const url = new URL(new TextDecoder().decode(record.data))
            const loc = url.searchParams.get("loc")
            if (loc) prepareRating(loc)
          }
        }
      })
    } catch (error) {
      setIsScanning(false)
      setStatus(`Erro: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const loc = queryParams.get('loc');
    if (loc) prepareRating(loc);
  }, []);

  return (
    <div style={{ 
      padding: '20px', fontFamily: 'sans-serif', textAlign: 'center', 
      maxWidth: '400px', margin: '0 auto', display: 'flex',
      flexDirection: 'column', height: '90vh', justifyContent: 'center'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Volta de Turno</h1>
      
      {/* Caixa de Status */}
      <div style={{ 
        padding: '30px', borderRadius: '20px', 
        backgroundColor: pendingLocation ? '#fffbe6' : (isScanning ? '#e6f7ff' : '#f5f5f5'),
        border: pendingLocation ? '2px solid #ffe58f' : (isScanning ? '2px solid #1890ff' : '2px solid #ccc'),
        marginBottom: '20px'
      }}>
        <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{status}</p>
        {lastScanned && !pendingLocation && (
          <p style={{ color: 'green', marginTop: '10px' }}>
            Última Tag: <strong>{lastScanned}</strong>
          </p>
        )}
        {pendingLocation && (
          <p style={{ marginTop: '10px', color: '#856404' }}>
            A avaliar: <strong>{pendingLocation.name}</strong>
          </p>
        )}
      </div>

      {/* Área de Ação Dinâmica */}
      <div style={{ minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        
        {/* SE detetou uma tag, mostra as cores */}
        {pendingLocation ? (
          <div style={{ display: 'flex', justifyContent: 'space-around', gap: '10px' }}>
            <button 
              disabled={isSaving}
              onClick={() => saveCheckin('red')} 
              style={{ padding: '25px', fontSize: '2rem', borderRadius: '50%', border: 'none', backgroundColor: '#ff4d4f', cursor: 'pointer', opacity: isSaving ? 0.5 : 1 }}>
              🔴
            </button>
            <button 
              disabled={isSaving}
              onClick={() => saveCheckin('yellow')} 
              style={{ padding: '25px', fontSize: '2rem', borderRadius: '50%', border: 'none', backgroundColor: '#ffec3d', cursor: 'pointer', opacity: isSaving ? 0.5 : 1 }}>
              🟡
            </button>
            <button 
              disabled={isSaving}
              onClick={() => saveCheckin('green')} 
              style={{ padding: '25px', fontSize: '2rem', borderRadius: '50%', border: 'none', backgroundColor: '#73d13d', cursor: 'pointer', opacity: isSaving ? 0.5 : 1 }}>
              🟢
            </button>
          </div>
        ) : (
          /* SE NÃO detetou nada, mostra o botão de Start ou o texto de Pesquisa */
          !isScanning ? (
            <button 
              onClick={startNfcSession}
              style={{ padding: '20px', fontSize: '1.2rem', borderRadius: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none', fontWeight: 'bold' }}>
              Começar Volta.
            </button>
          ) : (
            <div style={{ color: '#666' }}>
              A App está em modo pesquisa...<br/>
              Toca numa tag!
            </div>
          )
        )}
      </div>

      <button 
        onClick={() => window.location.href = '/dashboard'}
        style={{ marginTop: '40px', padding: '10px', fontSize: '1rem', background: 'none', border: '1px solid #ccc', borderRadius: '5px' }}>
        Ver Dashboard
      </button>
    </div>
  )
}