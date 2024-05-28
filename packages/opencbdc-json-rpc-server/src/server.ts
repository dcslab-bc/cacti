import express, { Request, Response } from 'express';

const app = express();
const port = 8760;

// JSON 파싱 미들웨어 설정
app.use(express.json());

// 간단한 GET 엔드포인트
app.get('/api/opencbdc', (req: Request, res: Response) => {
  // console.log(req);
  res.json({ message: 'Hello from the server! (GET)' });
});

// POST 엔드포인트
app.post('/api/opencbdc/initialize', (req: Request, res: Response) => {
  const data = req.body;
  console.log(req);
  res.json({ message: `[/api/opencbdc/initialize] Hello, ${data}!` });
});
app.post('/api/opencbdc/newContract', (req: Request, res: Response) => {
  const { name } = req.body;
  res.json({ message: `[/api/opencbdc/newContract] Hello, ${name}!` });
});
app.post('/api/opencbdc/getSingleStatus', (req: Request, res: Response) => {
  const { name } = req.body;
  res.json({ message: `[/api/opencbdc/getSingleStatus] Hello, ${name}!` });
});
app.post('/api/opencbdc/withdraw', (req: Request, res: Response) => {
  const { name } = req.body;
  res.json({ message: `[/api/opencbdc/withdraw] Hello, ${name}!` });
});
app.post('/api/opencbdc/refund', (req: Request, res: Response) => {
  const { name } = req.body;
  res.json({ message: `[/api/opencbdc/refund] Hello, ${name}!` });
});
app.post('/api/opencbdc/getBalance', (req: Request, res: Response) => {
  const { name } = req.body;
  res.json({ message: `[/api/opencbdc/getBalance] Hello, ${name}!` });
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
