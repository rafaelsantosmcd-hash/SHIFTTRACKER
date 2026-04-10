import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>Restaurant Manager Pro</h1>
      <p>O que deseja fazer hoje?</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', marginTop: '30px' }}>
        
        <Link href="/scanapp" style={{
          padding: '20px 40px',
          backgroundColor: '#0070f3',
          color: 'white',
          borderRadius: '10px',
          textDecoration: 'none',
          fontSize: '1.2rem',
          width: '200px'
        }}>
          Iniciar Ronda (Scan)
        </Link>

        <Link href="/dashboard" style={{
          padding: '20px 40px',
          backgroundColor: '#28a745',
          color: 'white',
          borderRadius: '10px',
          textDecoration: 'none',
          fontSize: '1.2rem',
          width: '200px'
        }}>
          Ver Dashboard
        </Link>
        
      </div>
    </div>
  );
}