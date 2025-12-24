# Abel Wellness - Dental Website with Blog Integration

A modern Next.js dental website with integrated blog functionality powered by Supabase.

## Features

- 🦷 Professional dental website layout
- 📝 Full blog management system with admin dashboard
- 🔒 Admin authentication and authorization
- 📱 Responsive design with smooth animations
- 🎨 Modern UI with Tailwind CSS and Framer Motion
- ☁️ Cloud-powered backend with Supabase

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Animations**: Framer Motion
- **Icons**: React Icons
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Supabase Setup

Please refer to [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed setup instructions.

Quick start:

1. Create a new project at [supabase.com](https://supabase.com)
2. The database tables are created automatically via migrations
3. Copy your project credentials to `.env.local`

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd abel-wellness
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Update `.env.local` with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Creating Your First Admin User

1. Go to your Supabase Dashboard
2. Navigate to Authentication → Users
3. Click "Add user" → "Create new user"
4. Enter email and password
5. The user can now log in at `/admin/login`
6. Go to your database → admins collection
7. Create a new document with:
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
│   ├── supabase.config.js     # Server-side Supabase config
│   ├── supabase.client.js     # Client-side Supabase config
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
