export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { zpl } = req.body;

    if (!zpl || !zpl.includes('^XA') || !zpl.includes('^XZ')) {
      return res.status(400).json({ error: 'Invalid ZPL' });
    }

    // PNG branco válido 400x600 pixels (base64)
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAZAAAAJYCAIAAAB2pxTnAAAACXBIWXMAAA7DAAAOwwHHb6NsAAACH0lEQVR4nO3BMQEAAADCoPVPbQhfoAAAAOA1v9QAATX68/0AAAAASUVORK5CYII=';
    
    const png = Buffer.from(base64, 'base64');

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', png.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return res.status(200).send(png);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
