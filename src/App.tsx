import React, { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState("Scan a tag to start...");

  useEffect(() => {
    // 1. When the page loads, look at the URL
    const queryParams = new URLSearchParams(window.location.search);
    const locationId = queryParams.get('id'); // looks for "?id=kitchen"

    if (locationId) {
      handleScan(locationId);
    }
  }, []);

  const handleScan = (id: string) => {
    // 2. This is where you would save it to your database
    setMessage(`Logged: You just checked the ${id}!`);
    
    // Example: fetch('https://your-api.com/log', { method: 'POST', body: { id } })
    
    // 3. Clean up the URL so a "Refresh" doesn't log it twice
    window.history.replaceState({}, document.title, "/");
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}>
      <h1>Restaurant Round Tracker</h1>
      <div style={{ padding: '20px', background: '#f0f0f0', borderRadius: '10px', display: 'inline-block' }}>
        {message}
      </div>
      <p>Tap an NFC tag to log your location.</p>
    </div>
  );
}

export default App;