import { NextFunction, Request, Response } from 'express';
import moment from 'moment';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import { prisma } from '../config';
import {
  DataAlreadyExistsError,
  DataInsufficientError,
  NotFoundError,
} from '../errors/ApiErrors';
import { getFormattedDate } from '../utils';

const secret = process.env.SECRET as string;

export class BarberController {
  async create(req: Request, res: Response) {
    const { nome, birthdate, telefone, email, barbeariaId } = req.body;

    if (!nome) {
      throw new DataInsufficientError({ message: 'Insert name' });
    }

    if (!birthdate) {
      throw new DataInsufficientError({ message: 'Insert birthdate' });
    }

    if (!telefone) {
      throw new DataInsufficientError({ message: 'Insert telefone' });
    }

    if (!email) {
      throw new DataInsufficientError({ message: 'Insert email' });
    }

    if (!barbeariaId) {
      throw new DataInsufficientError({ message: 'Insert barbeariaId' });
    }

    const barbershopIdVerify = await prisma.barbearia.findMany({
      where: { id: barbeariaId },
    });

    if (barbershopIdVerify.length <= 0) {
      throw new NotFoundError({ message: 'barbeariaId not found' });
    }

    const nameVerify = await prisma.barbeiro.findMany({
      where: {
        barbeariaId: barbeariaId,
        nome,
      },
    });

    if (nameVerify.length > 0) {
      throw new DataAlreadyExistsError({
        message:
          'There is already a barber with that name, check or enter a different one.',
      });
    }

    const timestamp = moment(birthdate, 'DD/MM/YYYY').toISOString();
    const barberNames: string[] = nome.split(' ');
    const senha_hash = await bcrypt.hash(
      barberNames[0],
      await bcrypt.genSalt(2),
    );

    const createBarber = await prisma.barbeiro.create({
      data: {
        nome,
        birthdate: timestamp,
        email,
        telefone,
        barbeariaId,
        login: barberNames[0] + barbeariaId,
        senha_hash: senha_hash,
      },
    });

    const updateLogin = await prisma.barbeiro.update({
      where: {
        id: createBarber.id,
      },
      data: {
        login: barberNames[0] + createBarber.id,
      },
    });
    updateLogin;

    res.status(201).json({
      message: `Barber ${createBarber.nome} created successfully`,
    });
  }

  async update(req: Request, res: Response) {
    const { id, nome, birthdate, telefone, email } = req.body;

    if (!id) {
      throw new DataInsufficientError({ message: 'Insert id' });
    }

    const updateBarber = await prisma.barbeiro.update({
      where: {
        id,
      },
      data: {
        nome: nome,
        birthdate: new Date(birthdate).toISOString(),
        telefone: telefone,
        email: email,
      },
    });

    const barbeiros = await prisma.barbeiro.findMany({
      where: {
        barbeariaId: updateBarber.barbeariaId,
      },
    });

    res.status(200).json({
      barbeiros: barbeiros,
      message: `${updateBarber.nome} changed successfully`,
    });
  }

  async delete(req: Request, res: Response) {
    const { id } = req.body;

    if (!id) {
      throw new DataInsufficientError({ message: 'Insert id' });
    }

    await prisma.barbeiro.delete({
      where: {
        id: id,
      },
    });

    res.status(204).json({ message: ` barber id: ${id} was deleted` });
  }

  async find(_req: Request, res: Response) {
    const barbershop = await prisma.barbeiro.findMany();
    res.status(200).json(barbershop);
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

      const barbersForbarbershop = await prisma.barbeiro.findMany({
        where: {
          barbeariaId: barbershopId,
        },
      });

      res.status(200).json(barbersForbarbershop);

      next();
    } catch (error) {
      throw new NotFoundError({
        message: 'Invalid token.',
      });
    }
  }

  async findTopBarber(req: Request, res: Response) {
    const { barbeariaId } = req.params;

    const formattedDate = getFormattedDate();

    console.log({ formattedDate });

    const transactionsToday = await prisma.caixa.findMany({
      where: {
        createdAt: { gte: formattedDate },
        AND: { barbeariaId: +barbeariaId },
      },
    });

    const barbersID = transactionsToday.map(
      (transactions) => transactions.barbeiroId,
    );

    const countBarbers: { [id: number]: { count: number } } = {};

    barbersID.forEach((barberID) => {
      if (Object.keys(countBarbers).includes(barberID.toString())) {
        countBarbers[`${barberID}`] = {
          count: countBarbers[`${barberID}`].count + 1,
        };
        return;
      }
      countBarbers[`${barberID}`] = { count: 1 };
      return;
    });

    function findGreaterCount(
      object: Record<string, { count: number }>,
    ): number {
      let greaterCount = 0;
      let elementWithGreaterCount = '';

      for (const key in object) {
        // eslint-disable-next-line no-prototype-builtins
        if (object.hasOwnProperty(key)) {
          const countAtual = object[key].count;

          if (countAtual > greaterCount) {
            greaterCount = countAtual;
            elementWithGreaterCount = key;
          }
        }
      }

      return +elementWithGreaterCount;
    }

    const barberID = findGreaterCount(countBarbers);

    const barberTop = await prisma.barbeiro.findUnique({
      where: { id: barberID },
    });

    res.status(200).json(barberTop);
  }
}
