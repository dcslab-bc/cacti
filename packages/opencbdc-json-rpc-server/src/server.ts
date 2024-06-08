import express, { Request, Response } from 'express';
const app = express();
const port = 8765;
app.use(express.json());

app.get('/api/opencbdc', (req: Request, res: Response) => {
  res.json({ message: `Please send a post message as one of the following URLs.`,
             initialize: `/api/opencbdc/initialize`,
             newContract: `/api/opencbdc/newContract`,
             getSingleStatus: `/api/opencbdc/getSingleStatus`,
             withdraw: `/api/opencbdc/withdraw`,
             refund: `/api/opencbdc/refund`,
             getBalance: `/api/opencbdc/getBalance` });
});

app.post('/api/opencbdc/initialize', (req: Request, res: Response) => {
  console.log(new Date().toLocaleString('en-US', {timeZone: 'Asia/Seoul', hour12: false}), req.ip, req.url);
  console.log(req.body);
});
app.post('/api/opencbdc/newContract', (req: Request, res: Response) => {
  console.log(new Date().toLocaleString('en-US', {timeZone: 'Asia/Seoul', hour12: false}), req.ip, req.url);
  console.log(req.body);
});
app.post('/api/v1/plugins/@hyperledger/cactus-plugin-htlc-eth-besu-erc20/get-single-status', (req: Request, res: Response) => {
  console.log(new Date().toLocaleString('en-US', {timeZone: 'Asia/Seoul', hour12: false}), req.ip, req.url);
  console.log(req.body);
  res.json(77);
});
app.post('/api/opencbdc/getSingleStatus', (req: Request, res: Response) => {
  console.log(new Date().toLocaleString('en-US', {timeZone: 'Asia/Seoul', hour12: false}), req.ip, req.url);
  console.log(req.body);
  res.json(33);//tatus(200).json('3');
  // if (req.url.indexOf("getSingleStatus") > 0) {
  //   console.log("111!");
  //   res.json(3);
  // } else if (req.url.indexOf("refund") > 0) {
  //   console.log("222!");
  //   res.json(3);
  // } else if (req.url.indexOf("withdraw") > 0) {
  //   console.log("333!");
  //   res.json(3);
  // } else {
  //   console.log("444!");
  //   res.json(3);
  // }
});
app.post('/api/opencbdc/withdraw', (req: Request, res: Response) => {
  console.log(new Date().toLocaleString('en-US', {timeZone: 'Asia/Seoul', hour12: false}), req.ip, req.url);
  console.log(req.body);
  res.json(55);  // If res.json is executed, the status always sets 200 (OK).
});
app.post('/api/opencbdc/refund', (req: Request, res: Response) => {
  console.log(new Date().toLocaleString('en-US', {timeZone: 'Asia/Seoul', hour12: false}), req.ip, req.url);
  console.log(req.body);
});
app.post('/api/opencbdc/getBalance', (req: Request, res: Response) => {
  console.log(new Date().toLocaleString('en-US', {timeZone: 'Asia/Seoul', hour12: false}), req.ip, req.url);
  console.log(req.body);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
