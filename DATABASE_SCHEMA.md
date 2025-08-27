# Updated Database Schema for Appwrite

Since you're using Appwrite's built-in `$createdAt` and `$updatedAt` attributes, here's the corrected database schema:

## Collection: `blogs`

**Collection ID**: `blogs`

### Attributes to Create:

- `title` (String, 255, required)
- `description` (String, 500, required)
- `content` (String, 10000, required)
- `author` (String, 100, required)
- `imageUrl` (String, 500, optional)
- `slug` (String, 255, required)
- `published` (Boolean, required, default: false)
- `featured` (Boolean, required, default: false)

### Built-in Attributes (Automatic):

- `$id` (Document ID - automatic)
- `$createdAt` (DateTime - automatic)
- `$updatedAt` (DateTime - automatic)
- `$permissions` (Array - automatic)

### Indexes to Create:

- `slug` (Unique index on slug attribute)
- `published` (Key index on published attribute)

## Collection: `appointments`

**Collection ID**: `appointments`

### Attributes to Create:

- `name` (String, 255, required)
- `email` (String, 255, required)
- `phone` (String, 20, required)
- `date` (DateTime, required)
- `service` (String, 100, required)
- `message` (String, 1000, optional)

### Built-in Attributes (Automatic):

- `$id`, `$createdAt`, `$updatedAt`, `$permissions`

## Collection: `admins` (Optional)

**Collection ID**: `admins`

### Attributes to Create:

- `email` (String, 255, required)
- `name` (String, 100, required)
- `role` (String, 50, required, default: "admin")

### Built-in Attributes (Automatic):

- `$id`, `$createdAt`, `$updatedAt`, `$permissions`

### Index to Create:

- `email` (Unique index on email attribute)

---

## Important Notes:

1. **Do NOT create custom `createdAt` or `updatedAt` attributes** - Appwrite provides these automatically as `$createdAt` and `$updatedAt`

2. **Permissions**: Set the following permissions for each collection:

   - **blogs**: Read (Any), Create/Update/Delete (Users)
   - **appointments**: Read/Create/Update/Delete (Users)
   - **admins**: Read/Create/Update/Delete (Users)

3. **Authentication**: Make sure Email/Password authentication is enabled in your Appwrite project settings.

---

The code has been updated to use `$createdAt` instead of `createdAt` for all queries and display operations.
