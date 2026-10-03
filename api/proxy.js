// api/proxy.js - PlayPay API Proxy
export default async function handler(req, res) {
  const PLAYPAY_API = 'https://playpay.uz/api/v1';
  const API_KEY = 'pp_30423aa1e19e3c83031a92f3938f7760822e1f4ce025bc1a';
  
  // CORS headerlari
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const path = req.query.path || req.body?.path || '';
    const method = req.method;
    
    let url = `${PLAYPAY_API}${path}`;
    
    // GET so'rovlar uchun currency parametri
    if (method === 'GET' && !url.includes('currency=')) {
      url += (url.includes('?') ? '&' : '?') + 'currency=UZS';
    }
    
    const options = {
      method: method,
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    };
    
    if (method === 'POST' && req.body?.data) {
      options.body = JSON.stringify(req.body.data);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}
