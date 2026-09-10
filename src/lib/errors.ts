export class AppError extends Error {
  code: string;
  userMessage: string;

  constructor(code: string, userMessage: string, technicalMessage?: string) {
    super(technicalMessage ?? userMessage);
    this.name = "AppError";
    this.code = code;
    this.userMessage = userMessage;
  }
}

export function toUserMessage(error: unknown): string {
  if (error instanceof AppError) return error.userMessage;
  if (error instanceof Error) {
    if (error.message.includes("Transicion")) return error.message;
    return "No pudimos completar esta accion. Intenta nuevamente.";
  }
  return "Ocurrio un error inesperado.";
}

export function fail(code: string, userMessage: string): never {
  throw new AppError(code, userMessage);
}
