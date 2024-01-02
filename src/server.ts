import express from 'express';
import 'dotenv/config';
import cors from 'cors';

import { routes } from './router';

const app = express();

app.use(express.json());
app.use(cors());
app.use(routes);

app.listen(process.env.PORT);

console.log(`Api rodando na porta ${process.env.PORT}`);
