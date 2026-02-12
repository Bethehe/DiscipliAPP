
import { User, Student } from './types';

export const INITIAL_USERS: User[] = [
  { id: '1', name: 'Elizabeth', role: 'Disciplinário', avatar: 'https://picsum.photos/seed/elizabeth/200', password: '123' },
  { id: '2', name: 'Nathan', role: 'Disciplinário', avatar: 'https://picsum.photos/seed/nathan/200', password: '123' },
  { id: '3', name: 'Moises', role: 'Disciplinário', avatar: 'https://picsum.photos/seed/moises/200', password: '123' }
];

export const INITIAL_STUDENTS: Student[] = [
  // 3ª SÉRIE BETA (Nova listagem)
  { id: '0000416496', name: 'ANA CLARA MAZZINI SANTOS', registration: '0000416496', grade: '3ª SÉRIE BETA' },
  { id: '0000387085', name: 'ANITA LUIZA MARÇAL COSTA', registration: '0000387085', grade: '3ª SÉRIE BETA' },
  { id: '0001226173', name: 'CLARA RODRIGUES DE AQUINO', registration: '0001226173', grade: '3ª SÉRIE BETA' },
  { id: '0000959927', name: 'DANICA SHARALIZ DE AZEREDO', registration: '0000959927', grade: '3ª SÉRIE BETA' },
  { id: '0000388362', name: 'DAVI BRAGANÇA RIBEIRO', registration: '0000388362', grade: '3ª SÉRIE BETA' },
  { id: '0001053082', name: 'JÚLIA LOBATO CHEQUER', registration: '0001053082', grade: '3ª SÉRIE BETA' },
  { id: '0001072364', name: 'LUCAS SOUZA ALVES', registration: '0001072364', grade: '3ª SÉRIE BETA' },
  { id: '0001240529', name: 'MANUELLA ARAUJO PINTO', registration: '0001240529', grade: '3ª SÉRIE BETA' },
  { id: '0000717633', name: 'MARCOS JUNIOR FERNANDES DE SOUZA', registration: '0000717633', grade: '3ª SÉRIE BETA' },
  { id: '0000397175', name: 'MARIA EDUARDA FAGUNDES DE MELO', registration: '0000397175', grade: '3ª SÉRIE BETA' },
  { id: '0000783241', name: 'RAFAELA SENA FERREIRA', registration: '0000783241', grade: '3ª SÉRIE BETA' },
  { id: '0000784549', name: 'REBECA ISABELLE LOPES DE SOUZA', registration: '0000784549', grade: '3ª SÉRIE BETA' },
  { id: '0000783750', name: 'REBECA PEREIRA MONTEIRO FERNANDES', registration: '0000783750', grade: '3ª SÉRIE BETA' },
  { id: '0000905502', name: 'RICHARD EDUARDO DA SILVA REZENDE', registration: '0000905502', grade: '3ª SÉRIE BETA' },
  { id: '0000386384', name: 'SOFIA ISOLDA RODRIGUES MEDEIROS', registration: '0000386384', grade: '3ª SÉRIE BETA' },
  { id: '0001050349', name: 'YASMIN FERNANDES ROMAO', registration: '0001050349', grade: '3ª SÉRIE BETA' },

  // EF-6A-T (Exemplos anteriores)
  { id: '0001075658', name: 'BEATRIZ DA SILVA ALVES', registration: '0001075658', grade: 'EF-6A-T' },
  { id: '0001223312', name: 'BERNARD BASTOS HONORATO', registration: '0001223312', grade: 'EF-6A-T' },
  { id: '0000972451', name: 'BERNARDO FÁVERO GUEDES', registration: '0000972451', grade: 'EF-6A-T' },
  
  // EM-1A-A
  { id: '0000899315', name: 'ALICE VERTELO CRISTOVAO', registration: '0000899315', grade: 'EM-1A-A' }
];

export const NOTIFICATION_EMAILS = [
  'diretoria@escola.com',
  'coordenacao@escola.com',
  'psicologia@escola.com',
  'conselho@escola.com',
  'secretaria@escola.com'
];
