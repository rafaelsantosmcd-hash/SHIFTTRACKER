'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// 1. Adicionei o "name" aqui para aparecer nas etiquetas
const ZONE_POSITIONS: any = {
  'kitchen': { name: 'Cozinha', top: '68%', left: '40%' },
  'casasdebanho': { name: 'WCs', top: '36%', left: '36%' },
  'salaclientes': { name: 'Sala', top: '44%', left: '73%' },
  'copa': { name: 'Copa', top: '53%', left: '34%' },
  'esplanada': { name: 'Esplanada', top: '50%', left: '91%' },
  'exterior': { name: 'Exterior', top: '88%', left: '65%' }
}

const MIN_LOCAIS_POR_VOLTA = 4; 
const INTERVALO_MAXIMO_MINUTOS = 15;

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

    // 1. Voltamos a pedir por ordem DESCENDENTE (mais recente primeiro)
    const { data: rawData, error } = await supabase
      .from('checkins')
      .select('*')
      .eq('restaurante_id', process.env.NEXT_PUBLIC_RESTAURANT_ID)
      .order('created_at', { ascending: false }); 

    if (error) return;

    if (rawData) {
      // --- LÓGICA PARA AS TAGS (MAPA) ---
      // Como a ordem é descendente, o primeiro que encontrarmos é o MAIS RECENTE
      const latestMap: any = {};
      rawData.forEach((item: any) => {
        if (!latestMap[item.location_id]) {
          latestMap[item.location_id] = item;
        }
      });
      setDataByLocation(latestMap);

      // --- LÓGICA PARA O RANKING (Últimos 7 dias) ---
      // Criamos uma cópia dos dados, filtramos e INVERTEMOS a ordem para o cálculo das voltas
      const rankingData = [...rawData]
        .filter(item => new Date(item.created_at) >= sevenDaysAgo)
        .reverse(); // Invertemos aqui para processar cronologicamente
      
      const porGerente: any = {};
      rankingData.forEach(item => {
        if (!porGerente[item.manager_name]) porGerente[item.manager_name] = [];
        porGerente[item.manager_name].push(item);
      });

      const rankingVoltas: any = {};

      Object.keys(porGerente).forEach(nome => {
        const scans = porGerente[nome];
        let voltasDesteGerente = 0;
        let locaisNaVoltaAtual = new Set();
        let ultimaHora: any = null;

        scans.forEach((scan: any) => {
          const horaAtual = new Date(scan.created_at).getTime();

          if (ultimaHora && (horaAtual - ultimaHora) > (INTERVALO_MAXIMO_MINUTOS * 60 * 1000)) {
            if (locaisNaVoltaAtual.size >= MIN_LOCAIS_POR_VOLTA) {
              voltasDesteGerente++;
            }
            locaisNaVoltaAtual = new Set();
          }

          locaisNaVoltaAtual.add(scan.location_id);
          ultimaHora = horaAtual;
        });

        if (locaisNaVoltaAtual.size >= MIN_LOCAIS_POR_VOLTA) {
          voltasDesteGerente++;
        }
        rankingVoltas[nome] = voltasDesteGerente;
      });

      const sortedRanking = Object.entries(rankingVoltas)
        .map(([name, count]) => ({ name, count: count as number }))
        .sort((a, b) => b.count - a.count);

      setRanking(sortedRanking);
    }
  }

  return (

    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', margin: 0, overflow: 'hidden' }}>

      <div style={{ 
        height: '70px', 
        backgroundColor: '#fff', 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 20px', 
        borderBottom: '2px solid #eee',
        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
        zIndex: 10 // Garante que fica por cima de tudo
      }}>
        <img 
          src="/mcdonalds-logo.png" // Nome do seu ficheiro na pasta public
          alt="Logo" 
          style={{ height: '45px', marginRight: '15px' }}
        />
        <h1 style={{ 
          fontSize: '2rem', 
          margin: 0, 
          color: '#222', 
          fontWeight: 'bold',
          fontFamily: 'arial' 
        }}>
          ShiftTracker
        </h1>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
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
        <div style={{ flex: '0 0 28%', padding: '10px', backgroundColor: 'lightgray', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '1.2rem', borderBottom: '2px solid #0070f3', marginBottom: '15px' }}>Ranking últimos 7 Dias</h2>
          {ranking.length > 0 ? (
            ranking.map((m, idx) => (
              <div key={m.name} style={{ 
                display: 'flex', justifyContent: 'space-between', padding: '10px', 
                backgroundColor: idx === 0 ? '#fff9c4' : '#f8f9fa', marginBottom: '5px', borderRadius: '5px',
                border: idx === 0 ? '1px solid #fbc02d' : '1px solid #eee'
              }}>
                <span>{idx + 1}. {m.name}</span>
                <span style={{ fontWeight: 'bold' }}>{m.count} voltas completas</span>
              </div>
            ))
          ) : (
            <p style={{ fontSize: '0.9rem', color: '#999' }}>A carregar dados...</p>
          )}
          
    

        </div>

      </div>
    </div>
  );
}