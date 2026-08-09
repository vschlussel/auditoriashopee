export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    const zpl = body.zpl || body.code || '';

    if (!zpl || typeof zpl !== 'string') {
      return res.status(400).json({ error: 'ZPL code required' });
    }

    if (!zpl.includes('^XA') || !zpl.includes('^XZ')) {
      return res.status(400).json({ error: 'Invalid ZPL' });
    }

    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 3, 36, 0, 0, 4, 196, 8, 2, 0, 0, 0, 94, 200, 161, 11, 0, 0, 0, 0, 73, 68, 65, 84, 193, 109, 109, 193, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', png.length);
    return res.status(200).send(png);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
