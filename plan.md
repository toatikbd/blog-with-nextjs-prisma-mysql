# Modern Blog Platform: Next.js + Prisma + MySQL

## 1. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router)** + TypeScript | Server Components, Server Actions, SEO-friendly rendering |
| Database | **MySQL 8** | Run it locally with Docker |
| ORM | **Prisma** | Type-safe queries, migrations |
| Auth | **Auth.js (NextAuth v5)** | Email/password and OAuth (GitHub, Google) |
| Styling | **Tailwind CSS** + **shadcn/ui** | Fast way to get a clean, modern UI |
| Editor | **Tiptap** (rich text), with content stored as JSON/HTML | Editing similar to Notion or Medium |
| Validation | **Zod** | One set of schemas for forms and server actions |
| Images | **Cloudinary** or **UploadThing** | Uploads and image optimization |
| Search | MySQL FULLTEXT index (add Meilisearch later if needed) | Easy to start with |
| Deployment | **Vercel** for the app, plus **PlanetScale / Railway / Aiven** for MySQL | Managed hosting |

## 2. Features

**MVP (Phase 1)**
- Public: home feed, post detail page, category and tag pages, author profile, search
- Auth: sign up, log in, log out, roles (`USER`, `AUTHOR`, `ADMIN`)
- Authors: create, edit, delete, and save drafts of posts; cover image upload; slug generation
- Dark/light mode and a responsive layout
- SEO: metadata, Open Graph images, sitemap.xml, robots.txt, RSS feed

**Phase 2**
- Comments (nested), likes, bookmarks
- Reading time, view counter, "related posts"
- Admin dashboard with users, posts, comment moderation, and basic stats
- Newsletter signup

**Phase 3 (nice to have)**
- Scheduled publishing
- Following authors and a personalized feed
- AI-assisted summaries or tag suggestions
- Analytics charts

## 3. Database Schema (Prisma)

```prisma
datasource db { provider = "mysql"; url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }

enum Role { USER AUTHOR ADMIN }
enum PostStatus { DRAFT PUBLISHED ARCHIVED }

model User {
  id        String    @id @default(cuid())
  name      String?
  email     String    @unique
  password  String?   // null for OAuth users
  image     String?
  bio       String?   @db.Text
  role      Role      @default(USER)
  posts     Post[]
  comments  Comment[]
  likes     Like[]
  bookmarks Bookmark[]
  accounts  Account[]
  sessions  Session[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Post {
  id          String     @id @default(cuid())
  title       String
  slug        String     @unique
  excerpt     String?    @db.VarChar(300)
  content     String     @db.LongText
  coverImage  String?
  status      PostStatus @default(DRAFT)
  readingTime Int        @default(1)
  views       Int        @default(0)
  publishedAt DateTime?
  author      User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId    String
  category    Category?  @relation(fields: [categoryId], references: [id])
  categoryId  String?
  tags        PostTag[]
  comments    Comment[]
  likes       Like[]
  bookmarks   Bookmark[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([status, publishedAt])
  @@index([authorId])
  @@fulltext([title, excerpt])
}

model Category {
  id    String @id @default(cuid())
  name  String @unique
  slug  String @unique
  posts Post[]
}

model Tag {
  id    String    @id @default(cuid())
  name  String    @unique
  slug  String    @unique
  posts PostTag[]
}

model PostTag {
  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId String
  tag    Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)
  tagId  String
  @@id([postId, tagId])
}

model Comment {
  id        String    @id @default(cuid())
  content   String    @db.Text
  post      Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId    String
  author    User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId  String
  parent    Comment?  @relation("Replies", fields: [parentId], references: [id], onDelete: Cascade)
  parentId  String?
  replies   Comment[] @relation("Replies")
  createdAt DateTime  @default(now())
}

model Like {
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId String
  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId String
  @@id([userId, postId])
}

model Bookmark {
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId String
  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId String
  @@id([userId, postId])
}

// Account, Session, VerificationToken: standard Auth.js Prisma adapter models
```

## 4. Folder Structure

```
src/
├─ app/
│  ├─ (public)/
│  │  ├─ page.tsx                 # Home feed
│  │  ├─ blog/[slug]/page.tsx     # Post detail
│  │  ├─ category/[slug]/page.tsx
│  │  ├─ tag/[slug]/page.tsx
│  │  ├─ author/[id]/page.tsx
│  │  └─ search/page.tsx
│  ├─ (auth)/login/ & register/
│  ├─ dashboard/                  # Author area (protected)
│  │  ├─ posts/ (list, new, [id]/edit)
│  │  └─ settings/
│  ├─ admin/                      # Admin only
│  ├─ api/auth/[...nextauth]/route.ts
│  ├─ api/upload/route.ts
│  ├─ sitemap.ts, robots.ts, rss.xml/route.ts
│  └─ layout.tsx
├─ components/  (ui/, post/, editor/, layout/)
├─ lib/         (prisma.ts, auth.ts, utils.ts, validations/)
├─ actions/     (post.ts, comment.ts, like.ts): Server Actions
└─ prisma/      (schema.prisma, seed.ts)
middleware.ts   # Protects /dashboard and /admin
```

## 5. Modern UI/UX Direction

- Clean, typography-first layout: Inter or Geist for the UI, a serif for article body text, and `@tailwindcss/typography` for post content
- Home page with a large hero for the featured post, a grid of post cards, and a category filter bar
- Sticky header with a blurred background, a ⌘K search dialog, and a theme toggle
- Article page with a reading progress bar, a sticky table of contents, code highlighting (Shiki), and share buttons
- Subtle motion with Framer Motion, skeleton loaders, and an image blur placeholder
- Accessibility: semantic HTML, focus states, and WCAG AA contrast

## 6. Implementation Roadmap

| Week | Tasks |
|---|---|
| **1: Setup** | `create-next-app`, Tailwind, shadcn/ui, MySQL in Docker, Prisma schema, first migration, seed script, ESLint/Prettier |
| **2: Auth** | Auth.js with the Prisma adapter, credentials (bcrypt) and GitHub OAuth, role-based middleware |
| **3: Posts CRUD** | Dashboard, Tiptap editor, Zod validation, slug and reading-time helpers, image upload, draft/publish |
| **4: Public site** | Home feed with pagination, post page, category/tag/author pages, ISR/caching with `revalidateTag` |
| **5: Engagement** | Comments, likes, bookmarks with optimistic UI, view counter |
| **6: Search & SEO** | FULLTEXT search, `generateMetadata`, dynamic OG images, sitemap, RSS |
| **7: Admin** | User and role management, post and comment moderation, stats cards |
| **8: Polish & Deploy** | Tests (Vitest + Playwright), Lighthouse performance pass, deploy to Vercel with managed MySQL, environment variables, backups |

## 7. Key Technical Decisions

- **Rendering:** fetch data in Server Components; post pages use static generation with on-demand revalidation when a post is published or updated.
- **Mutations:** use Server Actions with `revalidatePath` and `revalidateTag`. API routes are only for uploads and auth.
- **Prisma client:** use a singleton in `lib/prisma.ts` so hot reload doesn't open too many connections.
- **Security:** sanitize HTML output (DOMPurify / `sanitize-html`), check auth and ownership inside every action, rate-limit comments and logins, and keep secrets in `.env`.
- **Pagination:** cursor-based, using `publishedAt` + `id`.

## 8. Environment Variables

```
DATABASE_URL="mysql://user:pass@localhost:3306/blog"
AUTH_SECRET=""
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
CLOUDINARY_URL=""
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

## 9. Getting Started Commands

```bash
npx create-next-app@latest . --ts --tailwind --app --src-dir --eslint
npm i prisma @prisma/client next-auth@beta @auth/prisma-adapter zod bcryptjs
npx prisma init --datasource-provider mysql
npx shadcn@latest init
docker run -d --name blog-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=blog -p 3306:3306 mysql:8
npx prisma migrate dev --name init
```
