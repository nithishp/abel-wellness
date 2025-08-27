# Abel Wellness - Dental Website with Blog Integration

A modern Next.js dental website with integrated blog functionality powered by Appwrite.

## Features

- 🦷 Professional dental website layout
- 📝 Full blog management system with admin dashboard
- 🔒 Admin authentication and authorization
- 📱 Responsive design with smooth animations
- 🎨 Modern UI with Tailwind CSS and Framer Motion
- ☁️ Cloud-powered backend with Appwrite

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Appwrite (BaaS)
- **Animations**: Framer Motion
- **Icons**: React Icons
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Appwrite account

### Appwrite Setup

1. Create a new project in [Appwrite Console](https://cloud.appwrite.io/)

2. Create a database with the following collections:

#### Collection 1: `appointments`

```json
{
  "name": "appointments",
  "attributes": [
    { "key": "name", "type": "string", "size": 255, "required": true },
    { "key": "email", "type": "string", "size": 255, "required": true },
    { "key": "phone", "type": "string", "size": 20, "required": true },
    { "key": "date", "type": "datetime", "required": true },
    { "key": "service", "type": "string", "size": 100, "required": true },
    { "key": "message", "type": "string", "size": 1000, "required": false }
  ]
}
```

#### Collection 2: `blogs`

```json
{
  "name": "blogs",
  "attributes": [
    { "key": "title", "type": "string", "size": 255, "required": true },
    { "key": "description", "type": "string", "size": 500, "required": true },
    { "key": "content", "type": "string", "size": 10000, "required": true },
    { "key": "author", "type": "string", "size": 100, "required": true },
    { "key": "imageUrl", "type": "string", "size": 500, "required": false },
    {
      "key": "slug",
      "type": "string",
      "size": 255,
      "required": true,
      "array": false
    },
    {
      "key": "published",
      "type": "boolean",
      "required": true,
      "default": false
    },
    {
      "key": "featured",
      "type": "boolean",
      "required": true,
      "default": false
    },
    { "key": "createdAt", "type": "datetime", "required": true },
    { "key": "updatedAt", "type": "datetime", "required": true }
  ],
  "indexes": [
    { "key": "slug", "type": "unique", "attributes": ["slug"] },
    { "key": "published", "type": "key", "attributes": ["published"] }
  ]
}
```

#### Collection 3: `admins`

```json
{
  "name": "admins",
  "attributes": [
    { "key": "email", "type": "string", "size": 255, "required": true },
    { "key": "name", "type": "string", "size": 100, "required": true },
    {
      "key": "role",
      "type": "string",
      "size": 50,
      "required": true,
      "default": "admin"
    }
  ],
  "indexes": [{ "key": "email", "type": "unique", "attributes": ["email"] }]
}
```

3. Set up permissions for each collection:

   - **appointments**: Create, Read (for authenticated users only)
   - **blogs**: Read (for any), Create/Update/Delete (for authenticated users only)
   - **admins**: Create/Read/Update/Delete (for authenticated users only)

4. Enable Email/Password authentication in your Appwrite project

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd abel-wellness
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

```bash
cp .env.local.example .env.local
```

4. Update `.env.local` with your Appwrite credentials:

```env
# Appwrite Configuration
NEXT_PUBLIC_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_DATABASE_ID=your_database_id_here
NEXT_PUBLIC_BLOGS_ID=your_blogs_collection_id_here

# Server-side configuration
PROJECT_ID=your_project_id_here
DATABASE_ID=your_database_id_here
APPOINTMENTS_ID=your_appointments_collection_id_here
BLOGS_ID=your_blogs_collection_id_here
ADMINS_ID=your_admins_collection_id_here
API_KEY=your_api_key_here

# Admin credentials (for initial setup)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password_here
```

5. Start the development server:

```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Creating Your First Admin User

1. Go to your Appwrite Console
2. Navigate to Auth → Users
3. Create a new user with your admin email and password
4. Note the User ID
5. Go to your database → admins collection
6. Create a new document with:
   - Document ID: (use the User ID from step 4)
   - email: your admin email
   - name: your name
   - role: "admin"

## Usage

### Admin Dashboard

1. Navigate to `/admin`
2. Login with your admin credentials
3. Create, edit, and manage blog posts
4. Toggle published status for posts

### Blog Features

- **Public Blog**: View all published posts at `/blog`
- **Individual Posts**: Each post has its own URL `/blog/[slug]`
- **Blog Carousel**: Featured on the homepage
- **SEO Friendly**: Automatic slug generation from titles

### Adding Blog Posts

1. Login to admin dashboard at `/admin`
2. Click "Create New Blog"
3. Fill in the form:
   - Title (required)
   - Description (required)
   - Content (required)
   - Author (optional, defaults to admin name)
   - Image URL (optional)
   - Published status
   - Featured status
4. Click "Create Blog"

## File Structure

```
abel-wellness/
├── app/
│   ├── admin/
│   │   └── page.jsx           # Admin dashboard
│   ├── blog/
│   │   ├── page.jsx           # Blog listing page
│   │   └── [slug]/
│   │       └── page.jsx       # Individual blog post
│   ├── components/
│   │   ├── BlogPostCarousel.jsx
│   │   └── ... (other components)
│   ├── globals.css
│   ├── layout.js
│   └── page.js                # Homepage
├── lib/
│   ├── actions/
│   │   ├── admin.actions.js   # Admin authentication
│   │   ├── appointment.actions.js
│   │   └── blog.actions.js    # Blog CRUD operations
│   ├── appwrite.config.js     # Server-side config
│   ├── appwrite.client.js     # Client-side config
│   └── utils.js
└── .env.local                 # Environment variables
```

## API Routes

### Blog Actions

- `getPublishedBlogs(limit)` - Get published blog posts
- `getBlogBySlug(slug)` - Get single blog post by slug
- `createBlog(data)` - Create new blog post (admin only)
- `updateBlog(id, data)` - Update blog post (admin only)
- `deleteBlog(id)` - Delete blog post (admin only)
- `toggleBlogPublished(id, status)` - Toggle published status (admin only)

### Admin Actions

- `adminLogin(email, password)` - Admin login
- `adminLogout()` - Admin logout
- `getCurrentAdmin()` - Get current admin session
- `isAdmin()` - Check if user is admin

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@abelwellness.com or create an issue in this repository.
