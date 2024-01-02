import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { prisma } from '../config';

import { converToIso } from '../utils';

const secret = process.env.SECRET as string;

export class SchedulingController {
  async create(req: Request, res: Response) {
    const { data, barbeariaId, barbeiroId, clienteId } = req.body;

    if (!data) {
      return res.status(422).json({ message: 'Insira a data do agendamento!' });
    }

    if (!barbeariaId) {
      return res.status(422).json({ message: 'Insira o id da barbearia!' });
    }

    if (!barbeiroId) {
      return res
        .status(422)
        .json({ message: 'Insira o barbeiro do agendamento!' });
    }

    if (!clienteId) {
      return res
        .status(422)
        .json({ message: 'Insira o cliente do agendamento!' });
    }

    const barbeiroIdVerify = await prisma.barbeiro.findUnique({
      where: {
        id: barbeiroId,
      },
    });

    if (!barbeiroIdVerify) {
      return res.status(404).json({ message: 'Barbeiro não encontrado' });
    }

    const clientVerify = await prisma.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!clientVerify) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    const barbershopVerify = await prisma.barbearia.findUnique({
      where: { id: barbeariaId },
    });

    if (!barbershopVerify) {
      return res.status(404).json({ message: 'Barbearia não encontrada' });
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
      return res.status(409).json({
        message: 'Esse barbeiro já tem um agendamento para esse horario!',
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
      message: `Agendamento ${createSchedule.data}, criado com sucesso!`,
    });
  }

  async update(req: Request, res: Response) {
    const { id, barbeiroId, data, clienteId } = req.body;

    if (!id) {
      return res.status(422).json({ message: 'Insira o id do agendamento!' });
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
      return res.status(422).json({ message: 'Insira o id do agendamento!' });
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
      return res.status(404).json({ message: 'Token não encontrado!' });
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
      return res.status(401).json({ message: 'Token invalido!' });
    }
  }
}
