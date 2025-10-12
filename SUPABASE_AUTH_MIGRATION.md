# Supabase Authentication Migration

## Overview
The API has been migrated from Firebase Authentication to Supabase Authentication for better integration with the PostgreSQL database and unified auth management.

## Changes Made

### 1. Updated `utils/authGuard.ts`
- **Active**: Supabase authentication using `@supabase/supabase-js`
- **Commented**: Firebase authentication (kept for reference)

### 2. Environment Variables Required

Add these to your `.env` file:

```env
# Supabase Authentication
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
```

### 3. Dependencies
```bash
pnpm add @supabase/supabase-js
```

## How It Works

### Request Flow
1. Client sends request with `Authorization: Bearer <token>` header
2. `authGuard` extracts the token from the header
3. Token is verified using `supabase.auth.getUser(token)`
4. If valid, user data is attached to `request.user`
5. If invalid, returns 401 Unauthorized

### User Object Structure
```typescript
{
  uid: string;              // User ID
  email: string;            // User email
  email_verified: boolean;  // Email verification status
  name: string;             // Display name or email
  phone: string;            // Phone number (if available)
  created_at: string;       // Account creation timestamp
  // ... any custom user_metadata fields
}
```

## Testing

### 1. Get Supabase Access Token
```bash
# Using Supabase CLI or SDK
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
const token = data.session.access_token
```

### 2. Make Authenticated Request
```bash
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <your-supabase-token>"
```

## Migration from Firebase

If you were previously using Firebase authentication:

1. **User Migration**: Export users from Firebase and import to Supabase
2. **Token Update**: All clients must obtain new Supabase tokens
3. **API Routes**: All protected routes continue to use the same `authGuard` middleware

## Reverting to Firebase (If Needed)

1. Open `utils/authGuard.ts`
2. Comment out the Supabase implementation (lines 1-47)
3. Uncomment the Firebase implementation (lines 52-140)
4. Ensure Firebase credentials are in `.env`
5. Install firebase-admin: `pnpm add firebase-admin`

## Benefits of Supabase Auth

✅ **Unified Database**: Auth and data in the same PostgreSQL instance  
✅ **Built-in RLS**: Row Level Security policies  
✅ **Better Integration**: Direct database access for user data  
✅ **Cost Effective**: No separate Firebase costs  
✅ **Developer Experience**: Single dashboard for auth + database  

## Troubleshooting

### Error: "Supabase credentials are not properly configured"
- Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in `.env`
- Ensure values are not wrapped in extra quotes

### Error: "Invalid or expired token"
- Token may be expired (default: 1 hour)
- Client needs to refresh the token using Supabase SDK
- Check that the token is from the correct Supabase project

### Error: "Cannot find module '@supabase/supabase-js'"
- Run: `pnpm install @supabase/supabase-js`
- Restart your dev server

## Security Notes

- **ANON_KEY**: Safe to expose to clients (has limited permissions)
- **SERVICE_ROLE_KEY**: Never expose this (has full database access)
- **JWT Secret**: Used to verify tokens, keep secure
- **RLS Policies**: Ensure proper Row Level Security policies are configured

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/auth-api)
- [Migration Guide](https://supabase.com/docs/guides/migrations)

---

**Last Updated**: October 12, 2025
