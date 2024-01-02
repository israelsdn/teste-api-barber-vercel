import { NextFunction, Request, Response } from 'express';
import moment from 'moment';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import { prisma } from '../config';
import { getFormattedDate } from '../utils';

const secret = process.env.SECRET as string;

export class BarberController {
  async create(req: Request, res: Response) {
    const { nome, birthdate, telefone, email, barbeariaId } = req.body;

    if (!nome) {
      return res.status(422).json({ message: 'Insira o nome do barbeiro!' });
    }

    if (!birthdate) {
      return res
        .status(422)
        .json({ message: 'Insira o aniversário do barbeiro!' });
    }

    if (!telefone) {
      return res
        .status(422)
        .json({ message: 'Insira o telefone do barbeiro!' });
    }

    if (!email) {
      return res.status(422).json({ message: 'Insira o email do barbeiro!' });
    }

    if (!barbeariaId) {
      return res.status(422).json({ message: 'Insira o id da barbearia!' });
    }

    const barbershopIdVerify = await prisma.barbearia.findMany({
      where: { id: barbeariaId },
    });

    if (barbershopIdVerify.length <= 0) {
      return res.status(404).json({ message: 'Barbearia não encontrada!' });
    }

    const nameVerify = await prisma.barbeiro.findMany({
      where: {
        barbeariaId: barbeariaId,
        nome,
        telefone,
      },
    });

    if (nameVerify.length > 0) {
      return res.status(409).json({
        message: 'Barbeiro já cadastrado com esse nome e telefone!',
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
      message: `Barbeiro ${createBarber.nome}, criado com sucesso!`,
    });
  }

  async update(req: Request, res: Response) {
    const { id, nome, birthdate, telefone, email } = req.body;

    if (!id) {
      return res.status(422).json({ message: 'Insira o id do barbeiro!' });
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
      return res.status(422).json({ message: 'Insira o id do barbeiro!' });
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
      return res.status(404).json({ message: 'Token não encontrado!' });
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
      return res.status(401).json({ message: 'Token invalido!' });
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
