import { prisma } from '../config';
import { converToIso, getFormattedDate, toCompareDates } from '../utils';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const secret = process.env.SECRET as string;

export class ClientController {
  async create(req: Request, res: Response) {
    const { nome, birthdate, telefone, email, barbeariaId } = req.body;

    if (!nome) {
      return res.status(422).json({ message: 'Insira o nome do cliente!' });
    }

    if (!telefone) {
      return res.status(422).json({ message: 'Insira o telefone do cliente!' });
    }

    if (!barbeariaId) {
      return res
        .status(422)
        .json({ message: 'Insira o id da barbearia do cliente!' });
    }

    const barbershopVerify = await prisma.barbearia.findUnique({
      where: { id: barbeariaId },
    });

    if (!barbershopVerify) {
      return res.status(404).json({ message: 'Barbearia não encontrada' });
    }

    const clientVerify = await prisma.cliente.findMany({
      where: {
        birthdate: new Date(birthdate).toISOString(),
        telefone: telefone,
      },
    });

    if (clientVerify.length > 0) {
      return res.status(409).json({
        message: 'Cliente já cadastrado com essas informações!',
      });
    }

    const createClient = await prisma.cliente.create({
      data: {
        nome,
        telefone,
        barbeariaId,
        birthdate: new Date(birthdate).toISOString(),
        email,
      },
    });

    res.status(201).json({
      message: `Cliente ${createClient.nome}, cadastrado com sucesso!`,
    });
  }

  async update(req: Request, res: Response) {
    const { id, nome, birthdate, telefone, email } = req.body;

    if (!id) {
      return res.status(422).json({ message: 'Insira o nome do cliente!' });
    }

    const updateClient = await prisma.cliente.update({
      where: {
        id: id,
      },
      data: {
        nome: nome,
        birthdate: new Date(birthdate).toISOString(),
        telefone: telefone,
        email: email,
      },
    });

    const clientes = await prisma.cliente.findMany({
      where: {
        barbeariaId: updateClient.barbeariaId,
      },
    });

    res.status(200).json({
      clientes: clientes,
      message: `${updateClient.nome} changed successfully`,
    });
  }

  async find(_req: Request, res: Response) {
    const client = await prisma.cliente.findMany();
    res.status(200).json(client);
  }

  async findByBarbershopID(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(404).json({ message: 'Token não encontrado!' });
    }

    try {
      const decoded = jwt.verify(authHeader, secret) as {
        id: number;
      };

      const barbershopId = decoded.id;

      const clientsForbarbershop = await prisma.cliente.findMany({
        where: {
          barbeariaId: barbershopId,
        },
      });

      res.status(200).json(clientsForbarbershop);

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Token invalido!' });
    }
  }

  async clientsPerBarber(req: Request, res: Response) {
    const { barbeariaId } = req.params;

    const formattedDate = getFormattedDate();

    const transactionsToday = await prisma.caixa.findMany({
      where: {
        createdAt: { gte: formattedDate },
        AND: { barbeariaId: +barbeariaId },
      },
    });

    const clientsPerBarber: {
      [barber: string]: { clients: number; barberID: number };
    } = {};

    transactionsToday.forEach((transaction) => {
      if (
        Object.keys(clientsPerBarber).includes(
          transaction.barbeiroId.toString(),
        )
      ) {
        clientsPerBarber[`${transaction.barbeiroId}`] = {
          clients: clientsPerBarber[`${transaction.barbeiroId}`].clients + 1,
          barberID: transaction.barbeiroId,
        };

        return;
      }

      clientsPerBarber[`${transaction.barbeiroId}`] = {
        clients: 1,
        barberID: transaction.barbeiroId,
      };
    });

    const clientsPerBarberArray = Object.values(clientsPerBarber);

    const clientsPerBarberWithBarberName: {
      barberName: string;
      clienntsCount: number;
    }[] = [];

    const clientsPerBarberWithBarberNameChart: Array<
      [string, string | number]
    > = [['Barbeiros', 'Clientes atendidos']];

    for (const clientsBarber of clientsPerBarberArray) {
      const barber = await prisma.barbeiro.findUnique({
        where: { id: clientsBarber.barberID },
      });

      if (barber?.nome) {
        clientsPerBarberWithBarberName.push({
          barberName: barber.nome,
          clienntsCount: clientsBarber?.clients,
        });
        clientsPerBarberWithBarberNameChart.push([
          barber.nome,
          clientsBarber?.clients,
        ]);
      }
    }

    res.status(200).json({
      clientsPerBarberWithBarberName,
      chart: clientsPerBarberWithBarberNameChart,
    });
  }

  async listClients(req: Request, res: Response) {
    const { barbeariaId } = req.params;

    const clients = await prisma.cliente.findMany({
      where: { barbeariaId: +barbeariaId },
    });

    res.status(200).json(clients);
  }

  async getBirthdayPersonOfTheDay(req: Request, res: Response) {
    const { barbeariaId } = req.params;

    const clients = await prisma.cliente.findMany({
      where: { barbeariaId: +barbeariaId },
    });

    const birthdayPersonOfTheDay = clients?.filter((client) => {
      const birthdate = client?.birthdate as Date;
      return toCompareDates(birthdate);
    });

    res.status(200).json(birthdayPersonOfTheDay);
  }

  async getClientsRegisteredOfPeriod(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const { dataInicial, dataFinal } = req.body;
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(404).json({ message: 'Token não encontrado!' });
    }

    if (!dataInicial) {
      return res
        .status(422)
        .json({ message: 'Insira a dataInicial do periodo!' });
    }

    if (!dataFinal) {
      return res
        .status(422)
        .json({ message: 'Insira a dataFinal do periodo!' });
    }

    try {
      const decoded = jwt.verify(authHeader, secret) as {
        id: number;
      };

      const barbershopId = decoded.id;

      const clientsRegisteredOfPeriod = await prisma.cliente.findMany({
        where: {
          createdAt: {
            gte: new Date(dataInicial).toISOString(),
            lte: new Date(dataFinal).toISOString(),
          },
          AND: { barbeariaId: barbershopId },
        },
      });

      res.status(200).json(clientsRegisteredOfPeriod);

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Token invalido!' });
    }
  }

  async listBirthdatesForMonth(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(404).json({ message: 'Token não encontrado!' });
    }

    const { date } = req.body;

    const ISODate = converToIso(date);
    const dateConverted = new Date(ISODate);

    try {
      const decoded = jwt.verify(authHeader, secret) as {
        id: number;
      };

      const barbershopId = decoded.id;

      const clients = await prisma.cliente.findMany({
        where: { barbeariaId: barbershopId },
      });

      const matchMonth = (date: Date | null) => {
        if (date === null) {
          return false;
        }

        return date.getMonth() === dateConverted.getMonth();
      };

      const birthdatesOfMonth = clients.filter((client) => {
        return matchMonth(client?.birthdate);
      });

      res.status(200).json(birthdatesOfMonth);
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Token invalido!' });
    }
  }
}
