import { auth } from "@/lib/auth";

async function handler(request: Request) {
  return auth.handler(request);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
