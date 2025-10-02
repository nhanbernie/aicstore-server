import { ROLE } from '@enums/auth.enums';

export const usersData = [
  {
    email: 'admin@wdp.com',
    password: 'Admin123!',
    roles: [ROLE.ADMIN],
  },
  {
    email: 'vendor1@example.com',
    password: 'Vendor123!',
    roles: [ROLE.VENDOR],
  },
  {
    email: 'vendor2@example.com',
    password: 'Vendor123!',
    roles: [ROLE.VENDOR],
  },
  {
    email: 'user1@example.com',
    password: 'User123!',
    roles: [ROLE.USER],
  },
  {
    email: 'user2@example.com',
    password: 'User123!',
    roles: [ROLE.USER],
  },
];
