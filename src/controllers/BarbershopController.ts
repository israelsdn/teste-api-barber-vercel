import { Request, Response } from 'express';
import bcrypt from 'bcrypt';

import { prisma } from '../config';
import {
  DataAlreadyExistsError,
  DataInsufficientError,
  DataNotMatchError,
} from '../errors/ApiErrors';

export class BarbershopController {
  async create(req: Request, res: Response) {
    const { name, login, password, status } = req.body;

    if (!name) {
      throw new DataInsufficientError({ message: 'Insert name' });
    }

    if (!login) {
      throw new DataInsufficientError({ message: 'Insert login' });
    }

    if (!password) {
      throw new DataInsufficientError({ message: 'Insert password' });
    }

    const loginVerify = await prisma.barbearia.findUnique({
      where: { login },
    });
    if (loginVerify) {
      throw new DataAlreadyExistsError({
        message:
          'The same login already exists, check or enter a different one.',
      });
    }

    const senha_hash = await bcrypt.hash(password, await bcrypt.genSalt(2));

    const createBarbershop = await prisma.barbearia.create({
      data: {
        name,
        login,
        senha_hash,
        status,
      },
    });

    res.status(201).json({
      message: `Barbershop ${createBarbershop.name} created successfully`,
    });
  }

  async update(req: Request, res: Response) {
    const { login, password, newPassword } = req.body;

    if (!login) {
      throw new DataInsufficientError({ message: 'Insert login' });
    }

    if (!password) {
      throw new DataInsufficientError({ message: 'Insert password' });
    }

    if (!newPassword) {
      throw new DataInsufficientError({ message: 'Insert newPassword' });
    }

    const barbershop = await prisma.barbearia.findUnique({
      where: { login },
    });

    const passwordVerify = await bcrypt.compare(
      password,
      barbershop?.senha_hash as string,
    );

    if (!passwordVerify) {
      throw new DataNotMatchError({ message: "Passwords don't match!" });
    }

    const senha_hash = await bcrypt.hash(newPassword, await bcrypt.genSalt(2));

    const updateBarbershop = await prisma.barbearia.update({
      where: {
        login: login,
      },
      data: {
        senha_hash: senha_hash,
      },
    });

    res.status(200).json({
      message: `${updateBarbershop.name} password changed successfully`,
    });
  }

  async delete(req: Request, res: Response) {
    const { id } = req.body;

    await prisma.barbearia.delete({
      where: {
        id: id,
      },
    });

    res.status(204).json({ message: ` barbershop id: ${id} was deleted` });
  }

  async find(_req: Request, res: Response) {
    const barbershop = await prisma.barbearia.findMany({
      include: { barbeiros: true, produtos: true, clientes: true },
    });
    res.status(200).json(barbershop);
  }
}
