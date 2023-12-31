import { prisma } from '../config';
import { DataInsufficientError, NotFoundError } from '../errors/ApiErrors';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const secret = process.env.SECRET as string;

export class ProductController {
  async create(req: Request, res: Response) {
    const { nome, valor, estoque, barbeariaId, servico } = req.body;

    if (!nome) {
      throw new DataInsufficientError({ message: 'Insert nome' });
    }

    if (!valor) {
      throw new DataInsufficientError({ message: 'Insert valor' });
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

    const createProduct = await prisma.produto.create({
      data: {
        nome,
        valor,
        estoque,
        barbeariaId,
        servico,
      },
    });

    res.status(201).json({
      message: `Product ${createProduct.nome} created successfully`,
    });
  }

  async update(req: Request, res: Response) {
    const { id, nome, valor, estoque } = req.body;
    let estoqueResponse;

    if (!id) {
      throw new DataInsufficientError({ message: 'Insert id' });
    }

    estoque === null
      ? (estoqueResponse = null)
      : (estoqueResponse = parseInt(estoque));

    const updateProduct = await prisma.produto.update({
      where: {
        id: id,
      },
      data: {
        nome: nome,
        valor: valor,
        estoque: estoqueResponse,
      },
    });

    const produtos = await prisma.produto.findMany({
      where: {
        barbeariaId: updateProduct.barbeariaId,
      },
    });

    res.status(200).json({
      produtos: produtos,
      message: `${updateProduct.nome} changed successfully`,
    });
  }

  async delete(req: Request, res: Response) {
    const { id } = req.body;

    if (!id) {
      throw new DataInsufficientError({ message: 'Insert id' });
    }

    const deleteProduct = await prisma.produto.delete({
      where: {
        id: id,
      },
    });

    res.status(204).json({
      message: `Product ${deleteProduct.nome} was deleted`,
    });
  }

  async find(_req: Request, res: Response) {
    const products = await prisma.produto.findMany();
    res.status(200).json(products);
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

      const productsForbarbershop = await prisma.produto.findMany({
        where: {
          barbeariaId: barbershopId,
        },
      });

      res.status(200).json(productsForbarbershop);

      next();
    } catch (error) {
      throw new NotFoundError({
        message: 'Invalid token.',
      });
    }
  }
}
