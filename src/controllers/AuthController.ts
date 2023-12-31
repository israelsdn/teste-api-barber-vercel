import { prisma } from '../config';
import {
  DataInsufficientError,
  DataNotMatchError,
  NotFoundError,
} from '../errors/ApiErrors';
import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const secret = process.env.SECRET as string;
const secretBarber = process.env.SECRET_BARBER as string;

export class AuthController {
  async login(req: Request, res: Response) {
    const { login, password } = req.body;

    if (!login) {
      throw new DataInsufficientError({
        message: 'Insert your login to enter.',
      });
    }

    if (!password) {
      throw new DataInsufficientError({
        message: 'Insert your password to enter.',
      });
    }

    const barbearia = await prisma.barbearia.findUnique({
      where: {
        login,
      },
    });

    if (!barbearia) {
      throw new NotFoundError({
        message: "Email or password don't match.",
      });
    }

    const passwordVerify = await bcrypt.compare(password, barbearia.senha_hash);

    if (!passwordVerify) {
      throw new DataNotMatchError({
        message: "Email or password don't match.",
      });
    }

    const token = jwt.sign(
      {
        id: barbearia.id,
      },
      secret,
      {
        expiresIn: '16h',
      },
    );

    return res.status(200).json({
      token: token,
      barbeariaData: { id: barbearia.id, name: barbearia.name },
    });
  }

  async loginBarbers(req: Request, res: Response) {
    const { login, password } = req.body;

    if (!login) {
      throw new DataInsufficientError({
        message: 'Insert your login to enter.',
      });
    }

    if (!password) {
      throw new DataInsufficientError({
        message: 'Insert your password to enter.',
      });
    }

    const barbeiro = await prisma.barbeiro.findUnique({
      where: {
        login,
      },
    });

    if (!barbeiro) {
      throw new NotFoundError({
        message: "Email or password don't match.",
      });
    }

    const passwordVerify = await bcrypt.compare(password, barbeiro.senha_hash);

    if (!passwordVerify) {
      throw new DataNotMatchError({
        message: 'Barbeiro.',
      });
    }

    const token = jwt.sign(
      {
        id: barbeiro.id,
      },
      secretBarber,
      {
        expiresIn: '16h',
      },
    );

    return res.status(200).json({
      token: token,
      barbeiroData: { id: barbeiro.id, name: barbeiro.nome },
    });
  }

  async tokenVerify(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      throw new NotFoundError({
        message: "Token don't match.",
      });
    }

    try {
      jwt.verify(authHeader, secret);

      res.status(200).json({ message: 'Token valido' });

      next();
    } catch (error) {
      return res.status(404).json({ message: 'Sessão expirou' });
    }
  }

  async tokenVerifyBarber(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      throw new NotFoundError({
        message: "Token don't match.",
      });
    }

    try {
      jwt.verify(authHeader, secretBarber);

      res.status(200).json({ message: 'Token valido' });

      next();
    } catch (error) {
      return res.status(404).json({ message: 'Sessão expirou' });
    }
  }
}
