# Supabase Setup Guide

This project uses Supabase as the backend for database, authentication, and storage.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

### Required Environment Variables

| Variable                        | Description                     | Where to find                                            |
| ------------------------------- | ------------------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL       | Project Settings > API > Project URL                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key            | Project Settings > API > Project API keys > anon public  |
| `SUPABASE_SERVICE_ROLE_KEY`     | Service role key (keep secret!) | Project Settings > API > Project API keys > service_role |

## Database Schema

The following tables are created automatically via migrations:

### Blogs Table

| Column      | Type         | Description                |
| ----------- | ------------ | -------------------------- |
| id          | UUID         | Primary key                |
| title       | VARCHAR(255) | Blog title                 |
| description | VARCHAR(500) | Short description          |
| content     | TEXT         | Full blog content (HTML)   |
| author      | VARCHAR(100) | Author name                |
| image_url   | VARCHAR(500) | Featured image URL         |
| slug        | VARCHAR(255) | URL-friendly slug (unique) |
| published   | BOOLEAN      | Publication status         |
| featured    | BOOLEAN      | Featured flag              |
| created_at  | TIMESTAMPTZ  | Creation timestamp         |
| updated_at  | TIMESTAMPTZ  | Last update timestamp      |

### Appointments Table

| Column     | Type         | Description                          |
| ---------- | ------------ | ------------------------------------ |
| id         | UUID         | Primary key                          |
| name       | VARCHAR(255) | Client full name                     |
| email      | VARCHAR(255) | Client email                         |
| phone      | VARCHAR(20)  | Client phone number                  |
| date       | TIMESTAMPTZ  | Appointment date/time                |
| service    | VARCHAR(100) | Service type                         |
| message    | TEXT         | Additional notes                     |
| status     | VARCHAR(50)  | Status (pending/confirmed/cancelled) |
| created_at | TIMESTAMPTZ  | Creation timestamp                   |
| updated_at | TIMESTAMPTZ  | Last update timestamp                |

### Admins Table

| Column     | Type         | Description             |
| ---------- | ------------ | ----------------------- |
| id         | UUID         | Primary key             |
| user_id    | UUID         | Reference to auth.users |
| email      | VARCHAR(255) | Admin email (unique)    |
| name       | VARCHAR(100) | Admin name              |
| role       | VARCHAR(50)  | Role (default: admin)   |
| created_at | TIMESTAMPTZ  | Creation timestamp      |
| updated_at | TIMESTAMPTZ  | Last update timestamp   |

## Storage

A storage bucket named `blog-images` is created for storing blog featured images.

- **Public read access**: Anyone can view images
- **Authenticated write access**: Only authenticated users can upload/delete

## Authentication

This project uses Supabase Auth with email/password authentication and includes:

- **Login/Logout**: Standard email/password authentication
- **Password Reset**: Email-based password reset flow
- **Session Management**: Automatic session refresh and persistence
- **Protected Routes**: React context-based route protection

### Creating an Admin User

1. Go to your Supabase dashboard
2. Navigate to Authentication > Users
3. Click "Add user"
4. Enter email and password
5. The user can now log in to the admin panel

Alternatively, you can enable email confirmation and use the sign-up flow.

### Configuring Password Reset

For the password reset feature to work correctly:

1. Go to your Supabase dashboard
2. Navigate to Authentication > URL Configuration
3. Set the **Site URL** to your production URL (e.g., `https://yourdomain.com`)
4. Add the password reset redirect URL to **Redirect URLs**:
   - For development: `http://localhost:3000/admin/reset-password`
   - For production: `https://yourdomain.com/admin/reset-password`

### Email Templates (Optional)

Customize the password reset email:

1. Go to Authentication > Email Templates
2. Select "Reset Password"
3. Customize the template and ensure the link points to your reset password page

## Row Level Security (RLS)

RLS policies are configured for all tables:

### Blogs

- Public can read published blogs
- Authenticated users have full CRUD access

### Appointments

- Anyone can create appointments (booking form)
- Only authenticated users can view/update/delete

### Admins

- Only authenticated users can view admin records

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Troubleshooting

### "Missing Supabase environment variables"

Make sure you've created `.env.local` with all required variables.

### "Permission denied" errors

Check that RLS policies are correctly configured in Supabase.

### Image upload fails

Ensure the `blog-images` storage bucket exists and has the correct policies.

## Migration from Appwrite

If you're migrating from Appwrite:

1. The data structure has been maintained for backward compatibility
2. Document IDs (`$id`) are now mapped from UUID `id` fields
3. Timestamps (`$createdAt`, `$updatedAt`) are mapped from `created_at`, `updated_at`
4. The `imageUrl` field is mapped from `image_url` in the database
