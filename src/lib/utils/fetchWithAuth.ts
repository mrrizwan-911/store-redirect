import { store } from '@/store';
import { setToken, logout } from '@/store/slices/authSlice';

/**
 * fetchWithAuth is a custom fetch wrapper for client-side API calls.
 *
 * WHY: Access tokens expire in 15 minutes to minimize security risk.
 * This utility automatically handles token expiry by intercepting 401 Unauthorized responses,
 * attempting to refresh the tokens via the refresh token, and retrying the original request.
 *
 * If the refresh fails (meaning the refresh token itself is expired or invalid),
 * it logs the user out from Redux and redirects them to the login page.
 *
 * @param url - The URL to fetch
 * @param options - Standard fetch options
 * @returns - A promise that resolves to the fetch Response
 */
export async function fetchWithAuth(url: string, options?: RequestInit): Promise<Response> {
  // Make the initial fetch call
  let response = await fetch(url, options);

  // If the response is 401 Unauthorized, attempt to refresh the token
  if (response.status === 401) {
    try {
      // Attempt to refresh the token
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
      });

      if (refreshResponse.ok) {
        const result = await refreshResponse.json();
        const newAccessToken = result.data?.access_token;

        if (newAccessToken) {
          // Update the token in the Redux store
          store.dispatch(setToken(newAccessToken));

          // Retry the original request
          // Note: Browser automatically sends the new httpOnly cookies
          response = await fetch(url, options);
        }
      } else {
        // Refresh failed (invalid or expired refresh token)
        store.dispatch(logout());

        // Redirect to login only if we're in a browser environment
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          const searchParams = window.location.search;
          const fullPath = encodeURIComponent(`${currentPath}${searchParams}`);
          window.location.href = `/login?from=${fullPath}`;
        }
      }
    } catch (error) {
      // Network error during refresh or other unexpected failure
      console.error('fetchWithAuth: Token refresh failed', error);
      store.dispatch(logout());

      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  return response;
}
