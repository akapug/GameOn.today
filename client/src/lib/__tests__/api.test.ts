
import { describe, it, expect } from 'vitest';
import { handleApiResponse, apiRequest } from '../api';

describe('handleApiResponse', () => {
  it('should parse successful JSON response', async () => {
    const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
      status: 200,
    });
    const result = await handleApiResponse(mockResponse);
    expect(result).toEqual({ data: 'test' });
  });

  it('should throw error for non-OK response', async () => {
    const mockResponse = new Response('Bad Request', { status: 400 });
    await expect(handleApiResponse(mockResponse)).rejects.toThrow();
  });
});

describe('apiRequest', () => {
  it('should make request with correct headers', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: 'test' }), { status: 200 })
    );
    
    await apiRequest('/test');
    
    expect(fetch).toHaveBeenCalledWith('/test', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  });
});
