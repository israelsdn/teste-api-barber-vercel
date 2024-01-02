import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { prisma } from '../config';
import { getFormattedDate } from '../utils';

const secret = process.env.SECRET as string;

export class CashBoxControlller {
  async create(req: Request, res: Response) {
    const {
      valor,
      forma_pagamento,
      produtos,
      barbeariaId,
      barbeiroId,
      clienteId,
    } = req.body;

    if (!valor) {
      return res.status(422).json({ message: 'Insira o valor do serviço!' });
    }

    if (!clienteId) {
      return res.status(422).json({ message: 'Insira o cliente do serviço!' });
    }

    if (!barbeariaId) {
      return res
        .status(422)
        .json({ message: 'Insira o barbeshopId do serviço!' });
    }

    if (!barbeiroId) {
      return res.status(422).json({ message: 'Insira o barbeiro do serviço!' });
    }

    if (!forma_pagamento) {
      return res
        .status(422)
        .json({ message: 'Insira a forma de pagemnto do serviço!' });
    }

    if (!produtos) {
      return res.status(422).json({ message: 'Insira o serviço!' });
    }

    const verifyBarberID = await prisma.barbeiro.findUnique({
      where: { id: barbeiroId },
    });

    if (!verifyBarberID) {
      return res.status(404).json({
        message: 'Não foi encontrado um barbeiro com o ID informado!',
      });
    }

    const verifyBarbeshopID = await prisma.barbearia.findUnique({
      where: { id: barbeariaId },
    });

    if (!verifyBarbeshopID) {
      return res.status(404).json({
        message: 'Não foi encontrado uma barbearia com o ID informado!',
      });
    }

    const cashbox = await prisma.caixa.create({
      data: {
        valor,
        forma_pagamento,
        produtos,
        barbeariaId,
        barbeiroId,
        clienteId,
      },
    });

    const timestamp = getFormattedDate();

    const setLastCut = await prisma.cliente.update({
      where: { id: clienteId },
      data: { ultimo_corte: timestamp },
    });

    res.status(201).json({
      setLastCut,
      message: `Caixa no valor de R$: ${cashbox.valor} reais, criado com sucesso!`,
    });
  }

  async update(req: Request, res: Response) {
    const { cashboxID, valor, forma_pagamento, produtos } = req.body;

    if (!cashboxID) {
      return res.status(404).json({
        message: 'Não foi encontrado um caixa com o ID informado!',
      });
    }

    if (!valor && !forma_pagamento && !produtos) {
      return res.status(422).json({
        message: 'Preencha todos os campos',
      });
    }

    const cashbox = await prisma.caixa.update({
      where: { id: +cashboxID },
      data: { valor, forma_pagamento, produtos },
    });

    res.status(201).json({ cashbox });
  }

  async find(req: Request, res: Response) {
    const { barbeariaId } = req.params;

    const result = await prisma.caixa.findMany({
      where: { barbeariaId: +barbeariaId },
      include: { cliente: true },
    });

    res.status(200).json(result);
  }

  async delete(req: Request, res: Response) {
    const { id } = req.body;

    const cashboxDeleted = await prisma.caixa.delete({
      where: {
        id,
      },
    });

    res.status(204).json({ cashboxDeleted });
  }

  async getTotalToday(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(404).json({
        message: 'Token não informado',
      });
    }

    try {
      const decoded = jwt.verify(authHeader, secret) as {
        id: number;
      };

      const barbershopId = decoded.id;

      const formattedDate = getFormattedDate();

      const transactionsToday = await prisma.caixa.findMany({
        where: {
          createdAt: { gte: formattedDate },
          AND: { barbeariaId: barbershopId },
        },
      });

      let totalToday = 0;

      for (const transaction of transactionsToday) {
        totalToday = totalToday + +transaction.valor;
      }

      res.status(200).json({ totalToday });

      next();
    } catch (error) {
      return res.status(401).json({
        message: 'Token inválido',
      });
    }
  }

  async getSalesPerDay(req: Request, res: Response) {
    const { barbeariaId } = req.params;

    const formattedDate = getFormattedDate();

    const transactionsToday = await prisma.caixa.findMany({
      where: {
        createdAt: { gte: formattedDate },
        AND: { barbeariaId: +barbeariaId },
      },
    });

    const salesPerDay = transactionsToday.length;

    res.status(200).json({ salesPerDay });
  }

  async getMiddleTicket(req: Request, res: Response) {
    const { barbeariaId } = req.params;

    const transactions = await prisma.caixa.findMany({
      where: { barbeariaId: +barbeariaId },
    });

    let totalValue = 0;

    for (const transaction of transactions) {
      totalValue = totalValue + +transaction.valor;
    }

    const middleTicket = totalValue / transactions.length;

    res.status(200).json({ middleTicket: middleTicket.toFixed(2) });
  }

  async getCashboxOfPeriod(req: Request, res: Response, next: NextFunction) {
    const { dataInicial, dataFinal } = req.body;
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(404).json({
        message: 'Token não informado',
      });
    }

    if (!dataInicial) {
      return res.status(422).json({
        message: 'Insira a dataInicial do periodo',
      });
    }

    if (!dataFinal) {
      return res.status(422).json({
        message: 'Insira a dataFinal do periodo',
      });
    }

    try {
      const decoded = jwt.verify(authHeader, secret) as {
        id: number;
      };

      const barbershopId = decoded.id;

      const cashboxOfPeriod = await prisma.caixa.findMany({
        where: {
          data: {
            gte: new Date(dataInicial).toISOString(),
            lte: new Date(dataFinal).toISOString(),
          },
          AND: { barbeariaId: barbershopId },
        },
        include: { cliente: true },
      });

      res.status(200).json(cashboxOfPeriod);

      next();
    } catch (error) {
      return res.status(401).json({
        message: 'Token inválido',
      });
    }
  }

  async getCashboxBarberOfPeriod(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const { dataInicial, dataFinal, barbeiroId } = req.body;
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(404).json({
        message: 'Token não informado!',
      });
    }

    if (!dataInicial) {
      return res.status(422).json({
        message: 'Insira a dataInicial do periodo!',
      });
    }

    if (!dataFinal) {
      return res.status(422).json({
        message: 'Insira a dataFinal do periodo!',
      });
    }

    if (!barbeiroId) {
      return res.status(422).json({
        message: 'Insira o barbeiroId!',
      });
    }

    try {
      const decoded = jwt.verify(authHeader, secret) as {
        id: number;
      };

      const barbershopId = decoded.id;

      const cashboxBarberOfPeriod = await prisma.caixa.findMany({
        where: {
          data: {
            gte: new Date(dataInicial).toISOString(),
            lte: new Date(dataFinal).toISOString(),
          },
          AND: { barbeariaId: barbershopId, barbeiroId: barbeiroId },
        },
      });

      res.status(200).json(cashboxBarberOfPeriod);

      next();
    } catch (error) {
      return res.status(401).json({
        message: 'Token inválido',
      });
    }
  }

  async getMiddleTicketOfPeriod(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const { dataInicial, dataFinal } = req.body;
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(404).json({
        message: 'Token não informado',
      });
    }

    if (!dataInicial) {
      return res.status(422).json({
        message: 'Insira a dataInicial do periodo!',
      });
    }

    if (!dataFinal) {
      return res.status(422).json({
        message: 'Insira a dataFinal do periodo!',
      });
    }

    try {
      const decoded = jwt.verify(authHeader, secret) as {
        id: number;
      };

      const barbershopId = decoded.id;

      const cashboxOfPeriod = await prisma.caixa.findMany({
        where: {
          data: {
            gte: new Date(dataInicial).toISOString(),
            lte: new Date(dataFinal).toISOString(),
          },
          AND: { barbeariaId: barbershopId },
        },
      });

      let totalValue = 0;

      for (const transaction of cashboxOfPeriod) {
        totalValue = totalValue + +transaction.valor;
      }

      const middleTicket = totalValue / cashboxOfPeriod.length;

      res.status(200).json(middleTicket.toFixed(2));

      next();
    } catch (error) {
      return res.status(401).json({
        message: 'Token inválido',
      });
    }
  }

  async getAmountOfPeriod(req: Request, res: Response, next: NextFunction) {
    const { dataInicial, dataFinal } = req.body;
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(404).json({
        message: 'Token não informado',
      });
    }

    if (!dataInicial) {
      return res.status(422).json({
        message: 'Insira a dataInicial do periodo!',
      });
    }

    if (!dataFinal) {
      return res.status(422).json({
        message: 'Insira a dataFinal do periodo!',
      });
    }

    try {
      const decoded = jwt.verify(authHeader, secret) as {
        id: number;
      };

      const barbershopId = decoded.id;

      const cashboxOfPeriod = await prisma.caixa.findMany({
        where: {
          data: {
            gte: new Date(dataInicial).toISOString(),
            lte: new Date(dataFinal).toISOString(),
          },
          AND: { barbeariaId: barbershopId },
        },
      });

      let totalValue = 0;

      for (const transaction of cashboxOfPeriod) {
        totalValue = totalValue + +transaction.valor;
      }

      const amount = totalValue;

      res.status(200).json(amount.toFixed(2));

      next();
    } catch (error) {
      return res.status(401).json({
        message: 'Token inválido',
      });
    }
  }
}
