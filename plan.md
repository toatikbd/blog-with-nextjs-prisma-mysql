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
| Images | **Local file storage**: static assets in `public/`, user uploads in `uploads/` (resized with **sharp**) | No third-party service and no extra cost |
| Search | MySQL FULLTEXT index (add Meilisearch later if needed) | Easy to start with |
| Deployment | **Hostinger VPS** (Ubuntu 24.04) running **Docker Compose**: Next.js app + MySQL + **Caddy** (reverse proxy, automatic HTTPS), plus a persistent `uploads` volume | Full control and a persistent disk for local uploads, at a fixed monthly price. See section 10 |

### Image storage strategy

- **`public/`** holds static assets that ship with the code: logo, favicon, default avatar, default cover, OG fallback image. Reference them as `/logo.svg`.
- **`uploads/`** sits at the project root, outside `public/`, and holds user uploads (post covers, avatars, images inside posts). Add it to `.gitignore`.
  - Uploads can't go in `public/`: `next start` only serves files that existed at build time, so anything added later returns 404.
- Upload flow: `POST /api/upload` → check auth → validate the type (jpeg/png/webp/gif) and size (≤ 5 MB) → re-encode with sharp to WebP (max width 1600px) → save as `uploads/YYYY/MM/<cuid>.webp` → return the URL `/uploads/YYYY/MM/<cuid>.webp`.
- Serving: in development, the route handler `app/uploads/[...path]/route.ts` streams the file with `Cache-Control: public, max-age=31536000, immutable`. On the Hostinger VPS, Caddy serves the `uploads` volume directly at `/uploads/*`, which is faster and keeps the work off Node.
- Store only the relative URL in the DB (`coverImage`, `image`). When a post's cover is replaced or the post is deleted, remove the old file.
- Back up the `uploads` volume together with the MySQL dump.

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
│  ├─ api/upload/route.ts         # Validates, resizes, and saves to uploads/
│  ├─ uploads/[...path]/route.ts  # Serves uploaded files
│  ├─ sitemap.ts, robots.ts, rss.xml/route.ts
│  └─ layout.tsx
├─ components/  (ui/, post/, editor/, layout/)
├─ lib/         (prisma.ts, auth.ts, utils.ts, storage.ts, validations/)
├─ actions/     (post.ts, comment.ts, like.ts): Server Actions
└─ prisma/      (schema.prisma, seed.ts)
middleware.ts   # Protects /dashboard and /admin
public/         # Static assets: logo.svg, favicon.ico, default-avatar.png, default-cover.jpg, og-default.png
uploads/        # User uploads (gitignored, Docker volume in production)
docker-compose.yml
Dockerfile
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
| **3: Posts CRUD** | Dashboard, Tiptap editor, Zod validation, slug and reading-time helpers, local image upload (sharp → `uploads/`) with the serving route, draft/publish |
| **4: Public site** | Home feed with pagination, post page, category/tag/author pages, ISR/caching with `revalidateTag` |
| **5: Engagement** | Comments, likes, bookmarks with optimistic UI, view counter |
| **6: Search & SEO** | FULLTEXT search, `generateMetadata`, dynamic OG images, sitemap, RSS |
| **7: Admin** | User and role management, post and comment moderation, stats cards |
| **8: Polish & Deploy** | Tests (Vitest + Playwright), Lighthouse performance pass, Dockerfile (Next.js `standalone` output) + `docker-compose.yml` (app, MySQL, Caddy, volumes), set up the Hostinger VPS (section 10), point the domain to it, GitHub Actions auto-deploy, nightly backups of MySQL + `uploads` |

## 7. Key Technical Decisions

- **Rendering:** fetch data in Server Components; post pages use static generation with on-demand revalidation when a post is published or updated.
- **Mutations:** use Server Actions with `revalidatePath` and `revalidateTag`. API routes are only for uploads and auth.
- **Image storage:** `lib/storage.ts` wraps save and delete for files (`saveImage(file) → url`, `deleteImage(url)`), so moving to S3 or Cloudflare R2 later only means rewriting that one file.
- **Upload safety:** check the real file type from the magic bytes, not the extension. Generate filenames server-side (never use the user's filename). Reject `..` in the serving route to block path traversal. Only `AUTHOR`/`ADMIN` can upload, and uploads are rate-limited.
- **Prisma client:** use a singleton in `lib/prisma.ts` so hot reload doesn't open too many connections.
- **Security:** sanitize HTML output (DOMPurify / `sanitize-html`), check auth and ownership inside every action, rate-limit comments and logins, and keep secrets in `.env`.
- **Pagination:** cursor-based, using `publishedAt` + `id`.

## 8. Environment Variables

```
DATABASE_URL="mysql://user:pass@localhost:3306/blog"
AUTH_SECRET=""
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
UPLOAD_DIR="./uploads"
UPLOAD_MAX_MB="5"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Production (`/opt/blog/.env` on the VPS, never committed):

```
DATABASE_URL="mysql://blog:<strong-password>@mysql:3306/blog"   # "mysql" = the Compose service name
MYSQL_ROOT_PASSWORD="<strong-password>"
MYSQL_PASSWORD="<strong-password>"
AUTH_SECRET="<output of: openssl rand -base64 32>"
AUTH_URL="https://yourdomain.com"
AUTH_TRUST_HOST="true"            # required because the app runs behind Caddy
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""             # GitHub OAuth callback: https://yourdomain.com/api/auth/callback/github
UPLOAD_DIR="/app/uploads"
UPLOAD_MAX_MB="5"
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"
```

## 9. Getting Started Commands

```bash
npx create-next-app@latest . --ts --tailwind --app --src-dir --eslint
npm i prisma @prisma/client next-auth@beta @auth/prisma-adapter zod bcryptjs sharp file-type
mkdir uploads && echo "uploads/" >> .gitignore
npx prisma init --datasource-provider mysql
npx shadcn@latest init
docker run -d --name blog-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=blog -p 3306:3306 mysql:8
npx prisma migrate dev --name init
```

## 10. Deployment on Hostinger VPS

### 10.1 Choose and create the VPS
- **Plan:** KVM 2 (2 vCPU, 8 GB RAM) is a comfortable choice for Next.js + MySQL together. KVM 1 (4 GB) works for a small blog if you build the Docker image in GitHub Actions instead of on the server (see 10.6).
- **OS template:** in hPanel, pick **Ubuntu 24.04 with Docker** (or plain Ubuntu 24.04 and install Docker yourself).
- Add your **SSH public key** during setup and pick the data center closest to your readers.

### 10.2 Domain and DNS
- In your domain's DNS (Hostinger hPanel → Domains → DNS, or wherever the domain is registered), add:
  - `A` record `@` → VPS IPv4
  - `A` record `www` → VPS IPv4 (Caddy will redirect `www` to the bare domain)
- Wait for DNS to propagate before starting Caddy, so it can get the HTTPS certificate.

### 10.3 Secure the server (run once)
```bash
ssh root@<VPS_IP>
apt update && apt upgrade -y
adduser deploy && usermod -aG sudo,docker deploy
# copy your SSH key to deploy, then in /etc/ssh/sshd_config set:
#   PermitRootLogin no
#   PasswordAuthentication no
systemctl restart ssh
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable
apt install -y fail2ban unattended-upgrades
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```
- Also turn on the **hPanel firewall** for the VPS with the same rules (22, 80, 443 only).
- MySQL port 3306 is **never** opened to the internet. Only the app container reaches it over the internal Docker network.

### 10.4 Files on the server (`/opt/blog`)
```
/opt/blog/
├─ docker-compose.yml
├─ Caddyfile
├─ .env               # production secrets (chmod 600)
└─ backups/           # nightly dumps
```

`docker-compose.yml`:
```yaml
services:
  app:
    image: ghcr.io/<github-user>/blog:latest   # or `build: .` if building on the VPS
    env_file: .env
    volumes:
      - uploads:/app/uploads
    depends_on:
      mysql:
        condition: service_healthy
    restart: unless-stopped

  mysql:
    image: mysql:8.4
    environment:
      MYSQL_DATABASE: blog
      MYSQL_USER: blog
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      retries: 5
    restart: unless-stopped

  caddy:
    image: caddy:2
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - uploads:/srv/uploads:ro
      - caddy_data:/data
    depends_on: [app]
    restart: unless-stopped

volumes:
  mysql_data:
  uploads:
  caddy_data:
```

`Caddyfile`:
```
www.yourdomain.com {
  redir https://yourdomain.com{uri} permanent
}

yourdomain.com {
  encode zstd gzip
  request_body max_size 10MB

  handle_path /uploads/* {
    root * /srv/uploads
    header Cache-Control "public, max-age=31536000, immutable"
    file_server
  }

  reverse_proxy app:3000
}
```

### 10.5 Dockerfile notes
- Set `output: "standalone"` in `next.config.ts` so the production image stays small.
- Use a multi-stage build on `node:22-alpine`: install deps → `prisma generate` → `next build` → copy `.next/standalone`, `.next/static`, `public/`, and `prisma/` into the final stage.
- Install `sharp` for `linux-musl` in the image (it is installed automatically when `npm ci` runs inside the Alpine build stage).
- Container start command: `npx prisma migrate deploy && node server.js`, so migrations run on every deploy.
- Run as a non-root user and `chown` `/app/uploads` to that user.

### 10.6 First deploy and auto-deploy
First deploy:
```bash
ssh deploy@<VPS_IP>
sudo mkdir -p /opt/blog && sudo chown deploy /opt/blog && cd /opt/blog
# copy docker-compose.yml, Caddyfile, and .env here
docker compose up -d
docker compose exec app npx prisma db seed   # optional: seed categories and the admin user
```

Auto-deploy with **GitHub Actions** on every push to `main`:
1. Build the Docker image on GitHub's runners (this saves RAM on the VPS) and push it to **GitHub Container Registry** (`ghcr.io`).
2. SSH into the VPS (`appleboy/ssh-action`, with the key stored in GitHub Secrets) and run:
   ```bash
   cd /opt/blog && docker compose pull app && docker compose up -d app && docker image prune -f
   ```

### 10.7 Backups and monitoring
- **Nightly cron** on the VPS (`crontab -e` as `deploy`):
  ```bash
  0 3 * * * cd /opt/blog && docker compose exec -T mysql sh -c 'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" blog' | gzip > backups/db-$(date +\%F).sql.gz
  15 3 * * * docker run --rm -v blog_uploads:/data -v /opt/blog/backups:/backup alpine tar czf /backup/uploads-$(date +\%F).tar.gz -C /data .
  30 3 * * * find /opt/blog/backups -mtime +14 -delete
  ```
- Copy the backups off the server too (for example `rclone` to Google Drive, Backblaze B2, or Cloudflare R2). Hostinger's own VPS backups and snapshots are a useful extra layer, but not a replacement.
- Take a **manual snapshot in hPanel** before any big upgrade.
- Uptime checks: UptimeRobot or Better Stack (free tier) pinging `https://yourdomain.com`.
- Logs: `docker compose logs -f app`. Turn on Docker log rotation in `/etc/docker/daemon.json` (`"log-opts": {"max-size": "10m", "max-file": "3"}`).
