'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// 1. Adicionei o "name" aqui para aparecer nas etiquetas
const ZONE_POSITIONS: any = {
  'kitchen': { name: 'Cozinha', top: '66%', left: '48%' },
  'casasdebanho': { name: 'WCs', top: '28%', left: '45%' },
  'salaclientes': { name: 'Sala', top: '37%', left: '87%' },
  'copa': { name: 'Copa', top: '47%', left: '41%' },
  'esplanada': { name: 'Esplanada', top: '50%', left: '95%' },
  'exterior': { name: 'Exterior', top: '87%', left: '80%' }
}

export default function Dashboard() {
  const [dataByLocation, setDataByLocation] = useState<any>({})
  const [ranking, setRanking] = useState<any[]>([]) // 2. FALTA DECLARAR O RANKING

  useEffect(() => {
    fetchAllData() // 3. Chamar a função unificada
    const i = setInterval(fetchAllData, 10000)
    return () => clearInterval(i)
  }, [])

  // Função única para carregar TUDO
  async function fetchAllData() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: rawData, error } = await supabase
      .from('checkins')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    if (rawData) {
      // --- LÓGICA PARA AS TAGS ---
      const latestMap: any = {}
      rawData.forEach((item: any) => {
        if (!latestMap[item.location_id]) {
          latestMap[item.location_id] = item
        }
      })
      setDataByLocation(latestMap)

      // --- LÓGICA PARA O RANKING ---
      const last7DaysData = rawData.filter(item => 
        new Date(item.created_at) >= sevenDaysAgo
      );
      
      const counts = last7DaysData.reduce((acc: any, curr: any) => {
        const name = curr.manager_name || 'Desconhecido';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});

      const sortedRanking = Object.entries(counts)
        .map(([name, count]) => ({ name, count: count as number }))
        .sort((a, b) => b.count - a.count);

      setRanking(sortedRanking);
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', margin: 0, overflow: 'hidden' }}>
      
      {/* LADO ESQUERDO: MAPA (70%) */}
      <div style={{ flex: '0 0 70%', position: 'relative', backgroundColor: '#eee', borderRight: '2px solid #ddd' }}>
        <img src="/planta.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Planta" />

        {Object.keys(ZONE_POSITIONS).map(locId => {
          const pos = ZONE_POSITIONS[locId];
          const lastCheckin = dataByLocation[locId];
          
          let statusColor = '#ccc'; 
          if (lastCheckin?.rating === 'red') statusColor = '#ff4d4f';
          else if (lastCheckin?.rating === 'yellow') statusColor = '#ffec3d';
          else if (lastCheckin?.rating === 'green') statusColor = '#73d13d';

          return (
            <div key={locId} style={{
              position: 'absolute', top: pos.top, left: pos.left,
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white', padding: '8px', borderRadius: '8px',
              boxShadow: '0 1px 10px rgba(0,0,0,0.2)',
              borderTop: `12px solid ${statusColor}`,
              textAlign: 'center', minWidth: '110px'
            }}>
              <strong style={{ fontSize: '16px', display: 'block' }}>{pos.name}</strong>
              {lastCheckin ? (
                <div style={{ fontSize: '14px' }}>
                  {new Date(lastCheckin.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}<br/>
                  {lastCheckin.manager_name}
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: '#999' }}>Sem visitas</div>
              )}
            </div>
          );
        })}
      </div>

      {/* LADO DIREITO: RANKING (30%) */}
      <div style={{ flex: '0 0 30%', padding: '20px', backgroundColor: 'white', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '1.2rem', borderBottom: '2px solid #0070f3', marginBottom: '15px' }}>Ranking 7 Dias</h2>
        {ranking.length > 0 ? (
          ranking.map((m, idx) => (
            <div key={m.name} style={{ 
              display: 'flex', justifyContent: 'space-between', padding: '10px', 
              backgroundColor: idx === 0 ? '#fff9c4' : '#f8f9fa', marginBottom: '5px', borderRadius: '5px',
              border: idx === 0 ? '1px solid #fbc02d' : '1px solid #eee'
            }}>
              <span>{idx + 1}. {m.name}</span>
              <span style={{ fontWeight: 'bold' }}>{m.count} voltas</span>
            </div>
          ))
        ) : (
          <p style={{ fontSize: '0.9rem', color: '#999' }}>A carregar dados...</p>
        )}
        
        <button 
            onClick={() => window.location.href = '/'}
            style={{ marginTop: '20px', width: '100%', padding: '10px', cursor: 'pointer', borderRadius: '5px', border: '1px solid #ccc' }}
        >
            Voltar ao Menu
        </button>
      </div>

    </div>
  );
}