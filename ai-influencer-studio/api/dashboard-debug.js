export default function handler(req,res){
  const phase=String(req.query?.phase||'unknown').slice(0,40);
  const detail=String(req.query?.detail||'').slice(0,160);
  console.log(`[dashboard-debug] phase=${phase}${detail?` detail=${detail}`:''}`);
  res.setHeader('Cache-Control','no-store');
  res.status(204).end();
}
