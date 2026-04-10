'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AndroidScanPage() {
  const [status, setStatus] = useState<string>('Ready to start')
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [lastScanned, setLastScanned] = useState<string | null>(null)

  // 1. Logic to handle the Database logging
  const saveCheckin = async (locationId: string) => {
    setStatus(`Checking database for: ${locationId}...`)

    // Check if location exists
    const { data: locData, error: locError } = await supabase
      .from('locations')
      .select('display_name')
      .eq('id', locationId)
      .single()

    if (locError || !locData) {
      setStatus(`❌ Error: '${locationId}' not found in database.`)
      return
    }

    // Insert the checkin
    const { error: checkinError } = await supabase
      .from('checkins')
      .insert([{ 
        location_id: locationId, 
        manager_name: 'Shift Manager' 
      }])

    if (checkinError) {
      setStatus(`❌ Database Error: ${checkinError.message}`)
    } else {
      setLastScanned(locData.display_name)
      setStatus(`✅ Logged: ${locData.display_name}`)
      
      // Optional: Vibrate the phone on success
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
      setStatus("Scanning... Tap a tag.")
      
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
              setStatus("❌ Tag detected, but no '?loc=' parameter found.")
            }
          }
        }
      })

    } catch (error) {
      setIsScanning(false)
      setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

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
      <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Shift Round</h1>
      
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
            Last scan: <strong>{lastScanned}</strong>
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
          START SCANNING SESSION
        </button>
      ) : (
        <div style={{ color: '#666' }}>
          The app is now listening...<br/>
          You can walk around and tap tags.
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
        View Dashboard
      </button>
    </div>
  )
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