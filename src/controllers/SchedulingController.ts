import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { prisma } from '../config';
import {
  DataAlreadyExistsError,
  DataInsufficientError,
  NotFoundError,
} from '../errors/ApiErrors';
import { converToIso } from '../utils';

const secret = process.env.SECRET as string;

export class SchedulingController {
  async create(req: Request, res: Response) {
    const { data, barbeariaId, barbeiroId, clienteId } = req.body;

    if (!data) {
      throw new DataInsufficientError({
        message: 'Insert a date to schedule the service.',
      });
    }

    if (!barbeariaId) {
      throw new DataInsufficientError({
        message: 'Insert a barbeshop for the service.',
      });
    }

    if (!barbeiroId) {
      throw new DataInsufficientError({
        message: 'Insert a barber for the service.',
      });
    }

    if (!clienteId) {
      throw new DataInsufficientError({
        message: 'Insert a client for the service.',
      });
    }

    const barbeiroIdVerify = await prisma.barbeiro.findUnique({
      where: {
        id: barbeiroId,
      },
    });

    if (!barbeiroIdVerify) {
      throw new NotFoundError({
        message: 'Barber not found',
      });
    }

    const clientVerify = await prisma.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!clientVerify) {
      throw new NotFoundError({
        message: 'Client not found',
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

    const scheduleVerify = await prisma.agenda.findMany({
      where: {
        barbeiro: {
          id: barbeiroId,
          barbeariaId: barbeariaId,
        },
        data: converToIso(data),
      },
    });

    if (scheduleVerify.length > 0) {
      throw new DataAlreadyExistsError({
        message:
          'There is already a schedule for that date, insert a different date.',
      });
    }

    const createSchedule = await prisma.agenda.create({
      data: {
        barbeariaId: barbeariaId,
        barbeiroId: barbeiroId,
        clienteId: clienteId,
        data: new Date(data).toISOString(),
      },
    });

    res.status(200).json({
      message: `Scheduling for ${createSchedule.data} created successfully`,
    });
  }

  async update(req: Request, res: Response) {
    const { id, barbeiroId, data, clienteId } = req.body;

    if (!id) {
      throw new DataInsufficientError({ message: 'Insert id' });
    }

    const updateShedule = await prisma.agenda.update({
      where: {
        id: id,
      },
      data: {
        barbeiroId: barbeiroId,
        data: new Date(data).toISOString(),
        clienteId: clienteId,
      },
    });

    const agendamentos = await prisma.agenda.findMany({
      where: {
        barbeariaId: updateShedule.barbeariaId,
      },
      select: {
        barbeiro: {
          select: {
            nome: true,
            id: true,
          },
        },
        cliente: {
          select: {
            nome: true,
            id: true,
          },
        },
        data: true,
        id: true,
      },
    });

    res.status(200).json({
      message: `Scheduling for ${updateShedule.data} changed successfully`,
      agendamentos: agendamentos,
    });
  }

  async delete(req: Request, res: Response) {
    const { id } = req.body;

    if (!id) {
      throw new DataInsufficientError({ message: 'Insert id' });
    }

    const deleteShedule = await prisma.agenda.delete({
      where: {
        id: id,
      },
    });

    res.status(204).json({
      message: `Scheduling for ${deleteShedule.data} was deleted`,
    });
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

      const scheduleForbarbershop = await prisma.agenda.findMany({
        where: {
          barbeariaId: barbershopId,
        },
        include: { barbeiro: true, cliente: true },
      });

      res.status(200).json(scheduleForbarbershop);

      next();
    } catch (error) {
      throw new NotFoundError({
        message: 'Invalid token.',
      });
    }
  }
}
