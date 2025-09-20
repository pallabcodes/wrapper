import * as Joi from 'joi';

export const validatedConfigSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().integer().min(1).max(65535).default(3003),

  // Database / cache (optional in this package but validated when present)
  DATABASE_URL: Joi.string().uri().optional(),
  REDIS_URL: Joi.string().uri().optional(),

  // JWT settings (either HMAC secret or RSA keys)
  JWT_SECRET: Joi.string().min(8).optional(),
  JWT_PRIVATE_KEY_PEM: Joi.string().optional(),
  JWT_PUBLIC_KEY_PEM: Joi.string().optional(),
}).custom((value, helpers) => {
  const hasHmac = !!value.JWT_SECRET;
  const hasRsa = !!value.JWT_PRIVATE_KEY_PEM && !!value.JWT_PUBLIC_KEY_PEM;
  if (!hasHmac && !hasRsa) {
    return helpers.error('any.custom', {
      message: 'Provide either JWT_SECRET or both JWT_PRIVATE_KEY_PEM and JWT_PUBLIC_KEY_PEM',
    });
  }
  return value;
}, 'jwt key selection');


