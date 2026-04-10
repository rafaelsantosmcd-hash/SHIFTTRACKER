'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AndroidScanPage() {
  const [status, setStatus] = useState<string>('Pronto para começar')
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [lastScanned, setLastScanned] = useState<string | null>(null)


  const saveCheckin = async (locationId: string) => {
    // 1. Ir buscar o nome do gerente que guardámos na página inicial
    const savedManager = localStorage.getItem('manager_name') || 'Gerente Desconhecido';

    // 2. Verificar se a localização existe (mantemos a lógica anterior)
    const { data: locData } = await supabase
      .from('locations')
      .select('display_name')
      .eq('id', locationId)
      .single()

    if (!locData) {
      setStatus(`❌ Localização ${locationId} não existe.`)
      return
    }

    // 3. Inserir o check-in com o nome do gerente dinâmico
    const { error: checkinError } = await supabase
      .from('checkins')
      .insert([{ 
        location_id: locationId, 
        manager_name: savedManager // <--- AQUI USAMOS O NOME GUARDADO
      }])

    if (checkinError) {
      setStatus(`❌ Erro: ${checkinError.message}`)
    } else {
      setLastScanned(locData.display_name)
      setStatus(`✅ Registado por ${savedManager}`)
      if (navigator.vibrate) navigator.vibrate(200)
    }
  }

  // 2. Logic for Web NFC (Android Only)
  const startNfcSession = async () => {
    if (!('NDEFReader' in window)) {
      setStatus("❌ This browser doesn't support Web NFC. Use Chrome on Android.")
      return
    }

    try {
      setIsScanning(true)
      setStatus("Pesquisa ativa.. Toca numa tag.")
      
      // @ts-ignore - NDEFReader is new and might not be in all TS types yet
      const ndef = new NDEFReader()
      await ndef.scan()

      ndef.addEventListener("reading", ({ message }: any) => {
        // Find the URL record in the NFC tag
        for (const record of message.records) {
          if (record.recordType === "url") {
            const decoder = new TextDecoder()
            const urlString = decoder.decode(record.data)
            const url = new URL(urlString)
            const loc = url.searchParams.get("loc")
            
            if (loc) {
              saveCheckin(loc)
            } else {
              setStatus("❌ Tag não reconhecida.")
            }
          }
        }
      })

    } catch (error) {
      setIsScanning(false)
      setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  useEffect(() => {
    // Verificação automática: se o gestor tocou na tag para ABRIR a app
    const queryParams = new URLSearchParams(window.location.search);
    const loc = queryParams.get('loc');
  
    if (loc) {
      saveCheckin(loc); // Regista logo sem precisar clicar em nada
      // Limpa o URL para não registar duplicado se fizer refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'sans-serif', 
      textAlign: 'center', 
      maxWidth: '400px', 
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      height: '90vh',
      justifyContent: 'center'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Volta de Turno</h1>
      
      <div style={{ 
        padding: '30px', 
        borderRadius: '20px', 
        backgroundColor: isScanning ? '#e6f7ff' : '#f5f5f5',
        border: isScanning ? '2px solid #1890ff' : '2px solid #ccc',
        marginBottom: '20px'
      }}>
        <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{status}</p>
        {lastScanned && (
          <p style={{ color: 'green', marginTop: '10px' }}>
            Última Tag: <strong>{lastScanned}</strong>
          </p>
        )}
      </div>

      {!isScanning ? (
        <button 
          onClick={startNfcSession}
          style={{ 
            padding: '20px', 
            fontSize: '1.2rem', 
            borderRadius: '10px', 
            backgroundColor: '#0070f3', 
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Começar Volta.
        </button>
      ) : (
        <div style={{ color: '#666' }}>
          A App está em modo pesquisa..<br/>
          Podes continuar a volta e tocar nas tags!
        </div>
      )}

      <button 
        onClick={() => window.location.href = '/dashboard'}
        style={{ 
          marginTop: '40px',
          padding: '10px', 
          fontSize: '1rem', 
          background: 'none',
          border: '1px solid #ccc',
          borderRadius: '5px'
        }}
      >
        Ver Dashboard
      </button>
    </div>
  )
}
