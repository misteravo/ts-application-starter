import { safeTry } from '@acme/utils';
import { globalPOSTRateLimit } from '@acme/backend';
import type { z } from 'zod/v4';

type ErrorMessage = { message: string };
type ActionFunction<S extends z.ZodType, R> = (props: z.infer<S>) => Promise<R>;

export function simpleAction<R>(actionFn: () => Promise<R>) {
  return async function (): Promise<R | ErrorMessage> {
    try {
      if (!(await globalPOSTRateLimit())) return { message: 'Too many requests' };
      return actionFn();
    } catch (error) {
      if (error instanceof Error) return { message: error.message };
      return { message: 'Unknown error' };
    }
  };
}

export function schemaAction<S extends z.ZodType, R>(schema: S, actionFn: ActionFunction<S, R>) {
  return async function (props: z.infer<S>): Promise<R | ErrorMessage> {
    return runAction(schema, props, actionFn);
  };
}

export function formAction<S extends z.ZodType, R>(schema: S, actionFn: ActionFunction<S, R>) {
  return async function (_prev: R, formData: FormData): Promise<R | ErrorMessage> {
    return runAction(schema, formData, actionFn);
  };
}

async function runAction<S extends z.ZodType, P, R>(schema: S, props: P, actionFn: ActionFunction<S, R>) {
  try {
    if (!(await globalPOSTRateLimit())) return { message: 'Too many requests' };
    const [data] = await safeTry(schema.parseAsync(props));
    if (!data) return { message: 'Invalid or missing fields' };
    return actionFn(data as z.infer<S>);
  } catch (error) {
    if (error instanceof Error) return { message: error.message };
    return { message: 'Unknown error' };
  }
}
