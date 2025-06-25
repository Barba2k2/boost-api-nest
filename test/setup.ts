// Configuração global para testes
import 'reflect-metadata';

// Mock do console para evitar logs desnecessários nos testes
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Configuração de timeout para testes
jest.setTimeout(30000);
