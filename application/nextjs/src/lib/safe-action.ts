import { safeTry, ClientError } from '@acme/utils';
import { globalPOSTRateLimit } from '@acme/backend';
import type { z } from 'zod';

type ErrorMessage = { message: string };
type ActionFunction<S extends z.ZodType, R> = (props: z.infer<S>) => Promise<R>;

export function simpleAction<R>(actionFn: () => Promise<R>) {
  return async function (): Promise<R | ErrorMessage> {
    if (!(await globalPOSTRateLimit())) return { message: 'Too many requests' };

    const [result, error] = await safeTry(actionFn());
    if (error) {
      if (error instanceof ClientError) return { message: error.message };
      return { message: 'Unknown error' };
    }

    return result;
  };
}

export function schemaAction<S extends z.ZodType, R>(schema: S, actionFn: ActionFunction<S, R>) {
  return async function (props: z.infer<S>): Promise<R | ErrorMessage> {
    return runAction(schema, props, actionFn);
  };
}

export function formAction<S extends z.ZodType, R>(schema: S, actionFn: ActionFunction<S, R>) {
  return async function (_prev: R | ErrorMessage, formData: FormData): Promise<R | ErrorMessage> {
    return runAction(schema, formData, actionFn);
  };
}

async function runAction<S extends z.ZodType, P, R>(schema: S, props: P, actionFn: ActionFunction<S, R>) {
  if (!(await globalPOSTRateLimit())) return { message: 'Too many requests' };

  const [data] = await safeTry(schema.parseAsync(props));
  if (!data) return { message: 'Invalid or missing fields' };

  const [result, error] = await safeTry(actionFn(data as z.infer<S>));
  if (error) {
    if (error instanceof ClientError) return { message: error.message };
    return { message: 'Unknown error' };
  }

  return result;
}
