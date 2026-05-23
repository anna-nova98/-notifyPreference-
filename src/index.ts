import 'reflect-metadata';
import { NotificationPreferencesApp } from './app';

/**
 * Точка входа приложения
 */
async function main() {
  try {
    const app = new NotificationPreferencesApp();
    await app.start();
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Запуск приложения
main();