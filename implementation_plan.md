# Hybrid Authentication Implementation (Option 2)

This plan details the steps to implement a fallback authentication system that seamlessly migrates users from the external legacy DB (MD5) to the modern local DB (Bcrypt).

## Proposed Changes

### `app/Providers/FortifyServiceProvider.php`
- Override Laravel Fortify's default authentication logic using `Fortify::authenticateUsing()`.
- The custom logic will:
  1. **Check Local DB (First pass)**: Attempt to find the user in the `users` table by their `email` and verify the password using modern `Bcrypt`. If successful, log them in.
  2. **Fallback to External DB (Second pass)**: If local login fails, search the `jemaat` external database (via `ExternalMember`) using the provided `email`.
  3. **Verify MD5**: Hash the input password using `md5()` and compare it with the external `password` column.
  4. **Auto-Migration/Sync**: If the MD5 passwords match:
     - *Scenario A*: The user exists locally but their password was wrong (they changed it in the old app). We automatically update their local password using `Bcrypt(new_password)`.
     - *Scenario B*: The user doesn't exist locally at all. We automatically create a new record in the `users` table with their `name`, `email`, a new `Bcrypt` password, and link their `member_id`.
  5. Finally, return the local `User` instance to log them in smoothly.

## User Review Required

> [!WARNING]
> This approach assumes that users log in using their **`email`**. I checked your `jemaat` table and noticed it has both `email` and `username`. My plan uses **Email** since that is the default for Laravel Fortify.
> 
> Is it correct to use `email` for login, or do your jemaat members prefer logging in using their `username`? Please confirm before I proceed!

## Verification Plan
1. Attempt to login with an existing local account (should succeed).
2. Attempt to login with an email/password combination that only exists in the external DB (should succeed and auto-create the local user).
3. Verify that the newly created local user has their `member_id` correctly linked and password hashed with Bcrypt.
