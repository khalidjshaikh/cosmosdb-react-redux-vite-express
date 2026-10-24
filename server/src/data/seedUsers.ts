import type { CreateUserInput } from '../models/user.js';

/** Demo people used by `npm run seed` and by the in-memory data store. */
export const SEED_USERS: CreateUserInput[] = [
  { firstName: 'Amara', lastName: 'Okafor', email: 'amara.okafor@example.com', phone: '+1 415 555 0132', department: 'Platform Engineering', location: 'San Francisco, US', role: 'admin', status: 'active', notes: 'Owns the identity platform.' },
  { firstName: 'Liam', lastName: 'Bennett', email: 'liam.bennett@example.com', phone: '+44 20 7946 0812', department: 'Product', location: 'London, UK', role: 'manager', status: 'active', notes: '' },
  { firstName: 'Sofia', lastName: 'Marino', email: 'sofia.marino@example.com', phone: '+39 06 6982 3411', department: 'Design', location: 'Milan, IT', role: 'member', status: 'active', notes: 'Design systems lead.' },
  { firstName: 'Noah', lastName: 'Kim', email: 'noah.kim@example.com', phone: '+82 2 3701 1188', department: 'Security', location: 'Seoul, KR', role: 'admin', status: 'active', notes: '' },
  { firstName: 'Priya', lastName: 'Raman', email: 'priya.raman@example.com', phone: '+91 80 4123 9900', department: 'Data', location: 'Bengaluru, IN', role: 'manager', status: 'active', notes: '' },
  { firstName: 'Elias', lastName: 'Haddad', email: 'elias.haddad@example.com', phone: '+971 4 305 2200', department: 'Operations', location: 'Dubai, AE', role: 'member', status: 'invited', notes: 'Starts next Monday.' },
  { firstName: 'Mia', lastName: 'Andersen', email: 'mia.andersen@example.com', phone: '+45 33 41 8500', department: 'Customer Success', location: 'Copenhagen, DK', role: 'member', status: 'active', notes: '' },
  { firstName: 'Diego', lastName: 'Fuentes', email: 'diego.fuentes@example.com', phone: '+52 55 5128 4400', department: 'Engineering', location: 'Mexico City, MX', role: 'member', status: 'active', notes: '' },
  { firstName: 'Hana', lastName: 'Sato', email: 'hana.sato@example.com', phone: '+81 3 6205 7700', department: 'Finance', location: 'Tokyo, JP', role: 'viewer', status: 'active', notes: '' },
  { firstName: 'Oliver', lastName: 'Grant', email: 'oliver.grant@example.com', phone: '+61 2 8014 5500', department: 'Sales', location: 'Sydney, AU', role: 'manager', status: 'suspended', notes: 'Access paused during leave.' },
  { firstName: 'Fatima', lastName: 'Zahra', email: 'fatima.zahra@example.com', phone: '+212 5 22 48 9000', department: 'Legal', location: 'Casablanca, MA', role: 'viewer', status: 'active', notes: '' },
  { firstName: 'Lucas', lastName: 'Moreau', email: 'lucas.moreau@example.com', phone: '+33 1 42 68 53 00', department: 'Platform Engineering', location: 'Paris, FR', role: 'member', status: 'invited', notes: '' },
  { firstName: 'Zoe', lastName: 'Nguyen', email: 'zoe.nguyen@example.com', phone: '+84 28 3822 6600', department: 'Marketing', location: 'Ho Chi Minh City, VN', role: 'member', status: 'active', notes: '' },
  { firstName: 'Samuel', lastName: 'Adeyemi', email: 'samuel.adeyemi@example.com', phone: '+234 1 271 1100', department: 'Data', location: 'Lagos, NG', role: 'member', status: 'active', notes: '' },
  { firstName: 'Clara', lastName: 'Schmidt', email: 'clara.schmidt@example.com', phone: '+49 30 901820', department: 'Design', location: 'Berlin, DE', role: 'manager', status: 'active', notes: '' },
  { firstName: 'Mateo', lastName: 'Rossi', email: 'mateo.rossi@example.com', phone: '+34 91 123 4500', department: 'Engineering', location: 'Madrid, ES', role: 'member', status: 'active', notes: '' },
];
