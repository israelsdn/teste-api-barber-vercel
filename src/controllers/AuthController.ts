import { prisma } from '../config';
import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const secret = process.env.SECRET as string;
const secretBarber = process.env.SECRET_BARBER as string;

export class AuthController {
  async login(req: Request, res: Response) {
    const { login, password } = req.body;

    if (!login) {
      return res.status(422).json({ message: 'Insira o login da barbearia!' });
    }

    if (!password) {
      return res.status(422).json({ message: 'Insira a senha da barbearia!' });
    }

    const barbearia = await prisma.barbearia.findUnique({
      where: {
        login,
      },
    });

    if (!barbearia) {
      return res.status(401).json({ message: 'Login ou senha incorretos!' });
    }

    const passwordVerify = await bcrypt.compare(password, barbearia.senha_hash);

    if (!passwordVerify) {
      return res.status(401).json({ message: 'Login ou senha incorretos!' });
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
      return res.status(422).json({ message: 'Insira o login do barbeiro!' });
    }

    if (!password) {
      return res.status(422).json({ message: 'Insira a senha da barbeiro!' });
    }

    const barbeiro = await prisma.barbeiro.findUnique({
      where: {
        login,
      },
    });

    if (!barbeiro) {
      return res.status(401).json({ message: 'Login ou senha incorretos!' });
    }

    const passwordVerify = await bcrypt.compare(password, barbeiro.senha_hash);

    if (!passwordVerify) {
      return res.status(401).json({ message: 'Login ou senha incorretos!' });
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
      return res.status(404).json({ message: 'Token não encontrado!' });
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
      return res.status(404).json({ message: 'Token não encontrado!' });
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
