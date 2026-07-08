export default async function handler(req, res) {
  // Use the BACKEND_URL environment variable, defaulting to local flask server
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
  const targetUrl = `${backendUrl}${req.url}`;

  console.log(`Proxying: ${req.method} ${req.url} -> ${targetUrl}`);

  try {
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.body) {
        body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      }
    }

    const headers = { ...req.headers };
    delete headers.host;
    delete headers.connection;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body
    });

    const contentType = response.headers.get('content-type') || '';

    res.status(response.status);
    response.headers.forEach((value, name) => {
      if (name !== 'connection' && name !== 'content-encoding') {
        res.setHeader(name, value);
      }
    });

    if (contentType.includes('application/json')) {
      const json = await response.json();
      res.json(json);
    } else {
      const text = await response.text();
      res.send(text);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy failed', message: error.message });
  }
}
