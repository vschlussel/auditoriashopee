export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { zpl, format = 'png', dpi = '203' } = req.body;

    if (!zpl || typeof zpl !== 'string') {
      return res.status(400).json({ error: 'ZPL code is required' });
    }

    if (!zpl.trim().startsWith('^XA') || !zpl.trim().endsWith('^XZ')) {
      return res.status(400).json({ error: 'Invalid ZPL format' });
    }

    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0xFF,
      0x7F, 0x00, 0x09, 0xFB, 0x03, 0xFD, 0x05, 0x39,
      0xE7, 0x84, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
      0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="etiqueta-${Date.now()}.png"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    return res.status(200).send(pngBuffer);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Conversion failed', message: error.message });
  }
}
