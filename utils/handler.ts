import type { FastifyRequest, FastifyReply } from "fastify";

type AsyncHandler = (request: FastifyRequest, reply: FastifyReply) => Promise<any>;

export const asyncHandle = (handler: AsyncHandler) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await handler(request, reply);
    } catch (error) {
      console.error('Error in async handler:', error);
      const err: any = error;
      let status: number | undefined = err?.statusCode;
      if (!status) {
        // Map Fastify validation errors to 400
        if (err?.validation || (typeof err?.code === 'string' && err.code.startsWith('FST_ERR_'))) {
          status = 400;
        }
      }
      const message = err?.message || 'Internal Server Error';
      reply.status(status ?? 500).send({ error: message });
    }
  };
};

export const successHandle = (data: any, reply: FastifyReply, code:number) => {
  reply.status(code).send(data);
}

export const errorHandle = (errorMessage: string, reply: FastifyReply, code:number) => {
  reply.status(code).send({ message: errorMessage || 'An error occurred' });
}