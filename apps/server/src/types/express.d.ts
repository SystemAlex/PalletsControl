import 'express'; // Importa 'express' para habilitar la extensión de módulos

declare module 'express' {
  interface Request {
    file?: Express.Multer.File;
    files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
  }
}
