import { Router } from 'express';

import {
  AuthController,
  BarberController,
  BarbershopController,
  CashBoxControlller,
  ClientController,
  ProductController,
  SchedulingController,
} from './controllers';

export const routes = Router();

routes.post('/create-barbershop', new BarbershopController().create);
routes.get('/find-barbershops', new BarbershopController().find);
routes.put('/alter-password', new BarbershopController().update);
routes.delete('/delete-barbershop', new BarbershopController().delete);

routes.post('/create-barber', new BarberController().create);
routes.get('/find-barber', new BarberController().find);
routes.put('/alter-barber', new BarberController().update);
routes.delete('/delete-barber', new BarberController().delete);
routes.get(
  '/find-barbers-barbershop',
  new BarberController().findByBarbershopID,
);
routes.get(
  '/find-top-barber/:barbeariaId',
  new BarberController().findTopBarber,
);

routes.post('/create-product', new ProductController().create);
routes.get('/find-product', new ProductController().find);
routes.put('/alter-product', new ProductController().update);
routes.delete('/delete-product', new ProductController().delete);
routes.get(
  '/find-products-barbershop',
  new ProductController().findByBarbershopID,
);

routes.post('/create-cashbox', new CashBoxControlller().create);
routes.put('/update-cashbox', new CashBoxControlller().update);
routes.get('/find-cashbox/:barbeariaId', new CashBoxControlller().find);
routes.delete('/delete-cashbox', new CashBoxControlller().delete);
routes.get('/total-cashbox-today', new CashBoxControlller().getTotalToday);
routes.get(
  '/get-middle-ticket/:barbeariaId',
  new CashBoxControlller().getMiddleTicket,
);
routes.get(
  '/sales-per-day/:barbeariaId',
  new CashBoxControlller().getSalesPerDay,
);
routes.post('/get-cashbox-period', new CashBoxControlller().getCashboxOfPeriod);
routes.post(
  '/get-cashbox-barber-period',
  new CashBoxControlller().getCashboxBarberOfPeriod,
);
routes.post(
  '/get-middle-ticket-period',
  new CashBoxControlller().getMiddleTicketOfPeriod,
);
routes.post('/get-amount-period', new CashBoxControlller().getAmountOfPeriod);

routes.post('/create-scheduler', new SchedulingController().create);
routes.put('/update-scheduler', new SchedulingController().update);
routes.get(
  '/find-schedules-barbershop',
  new SchedulingController().findByBarbershopID,
);
routes.delete('/delete-scheduler', new SchedulingController().delete);

routes.post('/create-client', new ClientController().create);
routes.put('/update-client', new ClientController().update);
routes.get('/find-client', new ClientController().find);
routes.delete('/delete-client', new ClientController().delete);
routes.get(
  '/find-clients-barbershop',
  new ClientController().findByBarbershopID,
);
routes.get(
  '/clients-per-barber/:barbeariaId',
  new ClientController().clientsPerBarber,
);
routes.get('/list-clients/:barbeariaId', new ClientController().listClients);
routes.get(
  '/get-birthday-person-of-the-day/:barbeariaId',
  new ClientController().getBirthdayPersonOfTheDay,
);
routes.get(
  '/get-cliente-registered-period/',
  new ClientController().getClientsRegisteredOfPeriod,
);
routes.post(
  '/birthdates-clients-for-month',
  new ClientController().listBirthdatesForMonth,
);

routes.post('/auth', new AuthController().login);
routes.post('/auth-barber', new AuthController().loginBarbers);
routes.post('/tokenVerify', new AuthController().tokenVerify);
routes.post('/tokenVerifyBarber', new AuthController().tokenVerifyBarber);
