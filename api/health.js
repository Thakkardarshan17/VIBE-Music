export default function handler(req, res) {
  res.status(200).json({ status: 'online', v: '1.0.0', time: new Date().toISOString() });
}
