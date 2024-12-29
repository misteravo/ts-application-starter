import { safeTry } from '@acme/utils';
import { globalPOSTRateLimit } from '@acme/backend';
import type { Schema, z } from 'zod';

type ErrorMessage = {
  message: string;
};

export function schemaAction<S extends Schema, R>(schema: S, actionFn: (props: z.infer<S>) => Promise<R>) {
  return async function (props: z.infer<S>): Promise<R | ErrorMessage> {
    try {
      if (!(await globalPOSTRateLimit())) return { message: 'Too many requests' };
      const [data] = await safeTry(schema.parseAsync(props));
      if (!data) return { message: 'Invalid or missing fields' };
      return actionFn(data as z.infer<S>);
    } catch (error) {
      if (error instanceof Error) return { message: error.message };
      return { message: 'Unknown error' };
    }
  };
}

export function formAction<S extends Schema, R>(schema: S, actionFn: (props: z.infer<S>) => Promise<R>) {
  return async function (_prev: R, formData: FormData): Promise<R | ErrorMessage> {
    try {
      if (!(await globalPOSTRateLimit())) return { message: 'Too many requests' };
      const [data] = await safeTry(schema.parseAsync(formData));
      if (!data) return { message: 'Invalid or missing fields' };
      return actionFn(data as z.infer<S>);
    } catch (error) {
      if (error instanceof Error) return { message: error.message };
      return { message: 'Unknown error' };
    }
  };
}
