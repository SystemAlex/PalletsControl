import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { db } from '../db'; // Importar la instancia de la base de datos
import { blockedIps } from '../db/schema'; // Importar el nuevo esquema

const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutos en milisegundos

export const loginRateLimiter = rateLimit({
  windowMs: LOGIN_WINDOW_MS, // 15 minutos
  max: 5, // Limita cada IP a 5 intentos de login por ventana
  message: {
    message:
      'Demasiados intentos de login desde esta IP, por favor intenta de nuevo después de 15 minutos.',
  },
  standardHeaders: true, // Retorna información de límite de tasa en los headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita los headers `X-RateLimit-*`
  skipSuccessfulRequests: true, // Solo cuenta las solicitudes que resultan en un código de estado de error (no 2xx)
  // Clave personalizada basada en la IP real del cliente
  keyGenerator: (req) => {
    const xff = req.headers['x-forwarded-for'];
    const realIp = typeof xff === 'string' ? xff.split(',')[0].trim() : (req.ip ?? 'unknown');

    return ipKeyGenerator(realIp); // ✅ Pasar solo el string de la IP
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async (req, res, _next) => {
    const ipAddress = req.ip!; // Añadido operador de aserción no nula
    const usernameAttempt = req.body.username || null; // Obtener el nombre de usuario del cuerpo de la solicitud
    const unblockAt = new Date(Date.now() + LOGIN_WINDOW_MS); // Calcular el tiempo de desbloqueo

    console.warn(`🚫 IP bloqueada por demasiados intentos de login: ${ipAddress}`);

    try {
      await db
        .insert(blockedIps)
        .values({
          ipAddress,
          usernameAttempt,
          blockedAt: new Date(),
          unblockAt,
          reason: 'Too many login attempts',
        })
        .onConflictDoUpdate({
          target: blockedIps.ipAddress,
          set: {
            usernameAttempt, // Actualizar el último intento de usuario
            blockedAt: new Date(), // Actualizar la hora del último bloqueo
            unblockAt, // Actualizar la hora de desbloqueo
            reason: 'Too many login attempts',
          },
        });
      console.log(`✅ IP ${ipAddress} registrada/actualizada en la tabla blocked_ips.`);
    } catch (error) {
      console.error(`❌ Error al registrar IP bloqueada en la base de datos: ${error}`);
    }

    res.status(429).json({
      message:
        'Demasiados intentos de login desde esta IP, por favor intenta de nuevo después de 15 minutos.',
    });
  },
});
