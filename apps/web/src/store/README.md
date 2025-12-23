# Zustand Auth Store

This app uses **Zustand** for state management instead of React Context API.

## Why Zustand?

- **Simpler API**: Less boilerplate than Context
- **Better performance**: No unnecessary re-renders
- **Smaller bundle size**: Lightweight (~1KB)
- **No Provider needed**: Direct import and use
- **DevTools support**: Easy debugging

## Store Structure

### State
- `user`: Current user object
- `loading`: Initial loading state
- `isAuthenticated`: Boolean authentication status

### Actions
- `initialize()`: Load user from localStorage on app start
- `signUp(userData)`: Register new user
- `signIn(email, password)`: Sign in with email/password
- `signInWithGoogle()`: Initiate Google OAuth flow
- `signOut()`: Sign out and clear user data
- `refreshUser()`: Manually refresh user data
- `setupStorageListener()`: Listen for auth changes across tabs

## Usage

### Basic Usage

```javascript
import { useAuthStore } from '@/store/authStore';

function MyComponent() {
  // Select only what you need (prevents unnecessary re-renders)
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const signOut = useAuthStore((state) => state.signOut);
  
  // Or get multiple values
  const { user, signOut, isAuthenticated } = useAuthStore();
  
  return (
    <div>
      {isAuthenticated ? (
        <button onClick={signOut}>Sign Out</button>
      ) : (
        <Link href="/login">Login</Link>
      )}
    </div>
  );
}
```

### Sign Up

```javascript
import { useAuthStore } from '@/store/authStore';

function SignUpPage() {
  const signUp = useAuthStore((state) => state.signUp);
  
  const handleSubmit = async (formData) => {
    try {
      await signUp(formData);
      router.push('/');
    } catch (error) {
      console.error(error);
    }
  };
}
```

### Sign In

```javascript
import { useAuthStore } from '@/store/authStore';

function LoginPage() {
  const signIn = useAuthStore((state) => state.signIn);
  
  const handleSubmit = async (email, password) => {
    try {
      await signIn(email, password);
      router.push('/');
    } catch (error) {
      console.error(error);
    }
  };
}
```

### Access User Data

```javascript
import { useAuthStore } from '@/store/authStore';

function Profile() {
  const user = useAuthStore((state) => state.user);
  
  return (
    <div>
      <h1>Welcome, {user?.user_metadata?.first_name}</h1>
      <p>{user?.email}</p>
    </div>
  );
}
```

## Initialization

The `AuthInitializer` component wraps your app in `layout.js`:

```javascript
// app/layout.js
import { AuthInitializer } from "@/components/AuthInitializer";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthInitializer>{children}</AuthInitializer>
      </body>
    </html>
  );
}
```

This component:
- Initializes the auth state on app load
- Sets up storage listeners for cross-tab synchronization
- Handles OAuth callback updates

## Performance Tips

### Select Only What You Need

```javascript
// ❌ Bad: Component re-renders on any store change
const store = useAuthStore();

// ✅ Good: Component only re-renders when user changes
const user = useAuthStore((state) => state.user);
```

### Use Actions Without Re-renders

```javascript
// ✅ Actions don't cause re-renders
const signOut = useAuthStore((state) => state.signOut);
```

## Cross-Tab Synchronization

The store automatically syncs authentication state across browser tabs using:
- `storage` events (for changes in other tabs)
- `auth-storage-change` custom events (for same-tab updates)

When a user signs in/out in one tab, all other tabs update automatically.

## OAuth Flow

1. User clicks "Sign in with Google"
2. `signInWithGoogle()` redirects to Google OAuth
3. Google redirects back to `/auth/callback`
4. Callback page stores tokens and dispatches `auth-storage-change` event
5. Store listener picks up the event and refreshes user data
6. All components using the store update automatically

## Migration from Context

If migrating from React Context:

```javascript
// Before (Context)
import { useAuth } from '@/contexts/AuthContext';
const { user, signOut } = useAuth();

// After (Zustand)
import { useAuthStore } from '@/store/authStore';
const { user, signOut } = useAuthStore();
```

No other changes needed! The API is compatible.

