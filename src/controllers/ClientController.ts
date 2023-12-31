import { prisma } from '../config';
import {
  DataAlreadyExistsError,
  DataInsufficientError,
  NotFoundError,
} from '../errors/ApiErrors';
import { converToIso, getFormattedDate, toCompareDates } from '../utils';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const secret = process.env.SECRET as string;

export class ClientController {
  async create(req: Request, res: Response) {
    const { nome, birthdate, telefone, email, barbeariaId } = req.body;

    if (!nome) {
      throw new DataInsufficientError({
        message: 'Insert a date to schedule the service.',
      });
    }

    if (!telefone) {
      throw new DataInsufficientError({
        message: 'Insert a date to schedule the service.',
      });
    }

    if (!barbeariaId) {
      throw new DataInsufficientError({
        message: 'Insert a date to schedule the service.',
      });
    }

    const barbershopVerify = await prisma.barbearia.findUnique({
      where: { id: barbeariaId },
    });

    if (!barbershopVerify) {
      throw new NotFoundError({
        message: 'Barbershop not found',
      });
    }

    const clientVerify = await prisma.cliente.findMany({
      where: {
        nome: nome,
        telefone: telefone,
      },
    });

    if (clientVerify.length > 0) {
      throw new DataAlreadyExistsError({
        message:
          'There is already a customer with the same name and telephone number.',
      });
    }

    const createClient = await prisma.cliente.create({
      data: {
        nome,
        telefone,
        barbeariaId,
        birthdate: converToIso(birthdate),
        email,
      },
    });

    const clientes = await prisma.cliente.findMany({
      where: {
        barbeariaId: barbeariaId,
      },
    });

    res.status(201).json({
      clientes: clientes,
      message: `Client ${createClient.nome} created successfully`,
    });
  }

  async update(req: Request, res: Response) {
    const { id, nome, birthdate, telefone, email } = req.body;

    if (!id) {
      throw new DataInsufficientError({ message: 'Insert id' });
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

  async delete(req: Request, res: Response) {
    const { id } = req.body;

    if (!id) {
      throw new DataInsufficientError({ message: 'Insert id' });
    }

    const deleteClient = await prisma.cliente.delete({
      where: {
        id: id,
      },
    });

    res.status(204).json({
      message: `Client ${deleteClient.nome} was deleted`,
    });
  }

  async find(_req: Request, res: Response) {
    const client = await prisma.cliente.findMany();
    res.status(200).json(client);
  }

  async findByBarbershopID(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new NotFoundError({
        message: "Token don't match.",
      });
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
      throw new NotFoundError({
        message: 'Invalid token.',
      });
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
      throw new NotFoundError({
        message: "Token don't match.",
      });
    }

    if (!dataInicial) {
      throw new DataInsufficientError({
        message: 'Insert a dataInicial of the period.',
      });
    }

    if (!dataFinal) {
      throw new DataInsufficientError({
        message: 'Insert a dataFinal of the period.',
      });
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
      throw new NotFoundError({
        message: 'Invalid token.',
      });
    }
  }

  async listBirthdatesForMonth(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new NotFoundError({
        message: "Token don't match.",
      });
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
      throw new NotFoundError({
        message: 'Invalid token.',
      });
    }
  }
}
