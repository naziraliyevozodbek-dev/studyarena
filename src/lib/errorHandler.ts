// Global Error Handler for API routes and UI components
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const handleError = (error: unknown): { message: string; statusCode: number } => {
  if (error instanceof AppError) {
    return { message: error.message, statusCode: error.statusCode };
  }
  
  if (error instanceof Error) {
    console.error('Unhandled System Error:', error.message, error.stack);
    return { message: error.message, statusCode: 500 };
  }

  console.error('Unknown Error:', error);
  return { message: 'Noma\'lum xatolik yuz berdi', statusCode: 500 };
};
