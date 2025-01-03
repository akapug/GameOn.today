
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(errorData.message || 'An error occurred');
  }
  
  try {
    return await response.json();
  } catch (error) {
    console.error('JSON Parse Error:', error);
    throw new Error('Invalid response format from server');
  }
}

export async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  
  return handleApiResponse<T>(response);
}
