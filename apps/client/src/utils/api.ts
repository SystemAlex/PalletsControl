export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// Este tipo ya no es necesario si fetchJson siempre devuelve T en caso de éxito o lanza ApiError
// export type ApiResponse<T> = T | string;

export async function fetchJson<T = unknown>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type');
  let rawData: unknown;

  if (contentType?.includes('application/json')) {
    rawData = await response.json();
  } else {
    rawData = await response.text();
  }

  if (!response.ok) {
    const message =
      typeof rawData === 'object' &&
      rawData !== null &&
      'message' in rawData &&
      typeof (rawData as Record<string, unknown>).message === 'string'
        ? (rawData as Record<string, string>).message
        : String(rawData);
    throw new ApiError(message, response.status);
  }

  // Si la respuesta es OK, asumimos que es el tipo T esperado.
  // Si el servidor puede devolver una cadena de texto simple en caso de éxito, es un problema de diseño de la API.
  return rawData as T;
}
