import { prisma } from '../config';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const secret = process.env.SECRET as string;

export class ProductController {
  async create(req: Request, res: Response) {
    const { nome, valor, estoque, barbeariaId, servico } = req.body;

    if (!nome) {
      return res.status(422).json({ message: 'Insira o nome do produto!' });
    }

    if (!valor) {
      return res.status(422).json({ message: 'Insira o valor do produto!' });
    }

    if (!barbeariaId) {
      return res.status(422).json({ message: 'Insira o id da barbearia!' });
    }

    const barbershopIdVerify = await prisma.barbearia.findMany({
      where: { id: barbeariaId },
    });

    if (barbershopIdVerify.length <= 0) {
      return res.status(404).json({ message: 'Barbearia não encontrada' });
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
      message: `Produto: ${createProduct.nome}, criado com sucesso!`,
    });
  }

  async update(req: Request, res: Response) {
    const { id, nome, valor, estoque } = req.body;
    let estoqueResponse;

    if (!id) {
      return res.status(422).json({ message: 'Insira o id do produto!' });
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
      return res.status(422).json({ message: 'Insira o id do produto!' });
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
      return res.status(404).json({ message: 'Token não encontrado!' });
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
      return res.status(401).json({ message: 'Token invalido!' });
    }
  }
}
