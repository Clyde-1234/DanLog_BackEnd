import { Express } from 'express';
import fs from 'fs';
import path from 'path';

export async function registerRoutes(app: Express) {
  const routesPath = __dirname;

  const files = fs.readdirSync(routesPath);

  for (const file of files) {
    if (!file.match(/\.(ts|js)$/) || file.startsWith("routes")) continue;

    const routeName = file.replace(/\.(ts|js)$/, '');

    const route = await import(path.join(routesPath, file));
    const router = route.router || route.default;

    if (router) {
      app.use(`/${routeName}`, router);
      console.log(`📦 Loaded route: /${routeName}`);
      
    }
  }
}