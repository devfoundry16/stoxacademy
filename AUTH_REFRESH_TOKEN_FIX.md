# Authentication Refresh Token Issue - Analysis & Fix

## Problem Summary

The application was experiencing session expiration issues where users were being logged out unexpectedly, even though Supabase's `autoRefreshToken` was enabled. The refresh token mechanism was not being invoked properly when access tokens expired.

## Root Cause Analysis

### Primary Issue: Missing Response Interceptor

The main problem was in `/apps/web/src/lib/api.js`:

1. **No Response Interceptor**: The `apiClient` only had a request interceptor but **no response interceptor** to handle 401 (Unauthorized) errors.

2. **No Retry Logic**: When an API request returned a 401 error (expired token), there was no mechanism to:
   - Detect the 401 error
   - Trigger a token refresh
   - Retry the original request with the new token

3. **Supabase Auto-Refresh Limitations**: While Supabase's `autoRefreshToken: true` was configured, it has limitations:
   - It only refreshes tokens when `getSession()` is called AND the token is close to expiration
   - If a request is made with an already-expired token, Supabase might not have refreshed it yet
   - The refresh happens asynchronously, so there's a timing window where expired tokens can be sent

4. **No Proactive Refresh**: The request interceptor didn't check if tokens were close to expiration before making requests.

## The Fix

### Changes Made to `/apps/web/src/lib/api.js`

1. **Added Response Interceptor**:
   - Catches 401 errors from API responses
   - Forces Supabase to refresh the session using `refreshSession()`
   - Retries the original request with the new token
   - Handles refresh failures by clearing session and redirecting to login

2. **Request Queue Management**:
   - Prevents multiple simultaneous refresh attempts
   - Queues failed requests during refresh
   - Processes all queued requests once refresh completes

3. **Proactive Token Refresh**:
   - Enhanced request interceptor to check token expiration
   - Proactively refreshes tokens that expire within 60 seconds
   - Prevents sending expired tokens in the first place

### Key Features of the Fix

- **Automatic Retry**: Failed requests due to expired tokens are automatically retried after refresh
- **Queue Management**: Multiple simultaneous requests wait for a single refresh operation
- **Graceful Degradation**: If refresh fails (e.g., refresh token expired), user is redirected to login
- **Proactive Prevention**: Tokens are refreshed before expiration when possible

## How It Works Now

1. **Request Flow**:
   - Request interceptor checks session and token expiration
   - If token expires within 60 seconds, proactively refreshes it
   - Adds fresh token to request headers

2. **Response Flow (401 Handling)**:
   - Response interceptor catches 401 errors
   - Triggers `supabase.auth.refreshSession()` to get new tokens
   - Updates request headers with new token
   - Retries the original request
   - If refresh fails, clears session and redirects to login

3. **Concurrent Request Handling**:
   - If multiple requests fail with 401 simultaneously, only one refresh is triggered
   - Other requests are queued and processed once refresh completes
   - All queued requests are retried with the new token

## Testing Recommendations

1. **Token Expiration Test**:
   - Wait for access token to expire (typically 1 hour)
   - Make an API request
   - Verify request succeeds after automatic refresh

2. **Concurrent Requests Test**:
   - Make multiple API requests simultaneously when token is expired
   - Verify all requests succeed after single refresh

3. **Refresh Token Expiration Test**:
   - Wait for refresh token to expire (typically 7-30 days)
   - Make an API request
   - Verify user is redirected to login page

4. **Network Failure Test**:
   - Simulate network failure during token refresh
   - Verify graceful error handling

## Additional Notes

- The fix maintains backward compatibility with existing code
- No changes required to other parts of the application
- The solution works with Supabase's built-in session management
- Both `apiClient` and `adminApi` will benefit from this fix (adminApi uses the same pattern)

## Files Modified

- `/apps/web/src/lib/api.js` - Added response interceptor and enhanced request interceptor
