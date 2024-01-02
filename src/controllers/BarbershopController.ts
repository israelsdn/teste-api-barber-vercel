import { Request, Response } from 'express';
import bcrypt from 'bcrypt';

import { prisma } from '../config';

export class BarbershopController {
  async create(req: Request, res: Response) {
    const { name, login, password, status } = req.body;

    if (!name) {
      return res.status(422).json({ message: 'Insira o nome da barbearia!' });
    }

    if (!login) {
      return res.status(422).json({ message: 'Insira o login da barbearia!' });
    }

    if (!password) {
      return res.status(422).json({ message: 'Insira a senha da barbearia!' });
    }

    const loginVerify = await prisma.barbearia.findUnique({
      where: { login },
    });
    if (loginVerify) {
      return res.status(409).json({
        message: 'Já existe um login igual cadastrado, tente um diferente!',
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
      message: `Barbearia ${createBarbershop.name}, criada com sucesso!`,
    });
  }

  async update(req: Request, res: Response) {
    const { login, password, newPassword } = req.body;

    if (!login) {
      return res.status(422).json({ message: 'Insira o login da barbearia!' });
    }

    if (!password) {
      return res.status(422).json({ message: 'Insira a senha da barbearia!' });
    }

    if (!newPassword) {
      return res
        .status(422)
        .json({ message: 'Insira a nova senha da barbearia!' });
    }

    const barbershop = await prisma.barbearia.findUnique({
      where: { login },
    });

    const passwordVerify = await bcrypt.compare(
      password,
      barbershop?.senha_hash as string,
    );

    if (!passwordVerify) {
      return res.status(400).json({ message: 'A senha atual não coincidem!' });
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
