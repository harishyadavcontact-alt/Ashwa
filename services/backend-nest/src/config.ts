import { Logger } from '@nestjs/common';
import { RuntimeEnv, RuntimeEnvSchema } from '@ashwa/shared';

let cachedEnv: RuntimeEnv | undefined;

export function getRuntimeEnv(): RuntimeEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = RuntimeEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid runtime configuration: ${parsed.error.message}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export function validateRuntimeEnv(): RuntimeEnv {
  const env = getRuntimeEnv();
  const logger = new Logger('RuntimeConfig');

  if (env.NODE_ENV !== 'development' && env.JWT_SECRET === 'dev-secret') {
    throw new Error('JWT_SECRET must be set outside development');
  }

  logger.log(`runtime config validated for ${env.NODE_ENV}`);
  return env;
}
