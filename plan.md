# Modern Blog Platform: Next.js + Prisma + MySQL

## 1. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router)** + TypeScript | Server Components, Server Actions, SEO-friendly rendering |
| Database | **MySQL 8** | Installed directly: MySQL Community Server on Windows for development, `mysql-server` on the VPS |
| ORM | **Prisma** | Type-safe queries, migrations |
| Auth | **Auth.js (NextAuth v5)** | Email/password and OAuth (GitHub, Google) |
| Styling | **Tailwind CSS** + **shadcn/ui** | Fast way to get a clean, modern UI |
| Editor | **Tiptap** (rich text), with content stored as JSON/HTML | Editing similar to Notion or Medium |
| Validation | **Zod** | One set of schemas for forms and server actions |
| Images | **Local file storage**: static assets in `public/`, user uploads in an `uploads/` folder (resized with **sharp**) | No third-party service and no extra cost |
| Search | MySQL FULLTEXT index (add Meilisearch later if needed) | Easy to start with |
| Deployment | **Hostinger VPS** (Ubuntu 24.04): Node.js 22 + **PM2** (keeps the app running), **Nginx** (reverse proxy), **Certbot** (free HTTPS from Let's Encrypt), MySQL on the same server | No Docker needed. Full control and a persistent disk for uploads, at a fixed monthly price. See section 10 |

### Image storage strategy

- **`public/`** holds static assets that ship with the code: logo, favicon, default avatar, default cover, OG fallback image. Reference them as `/logo.svg`.
- **`uploads/`** holds user uploads (post covers, avatars, images inside posts). Its location comes from `UPLOAD_DIR`:
  - Development: `./uploads` in the project root (gitignored).
  - VPS: `/var/www/blog/uploads`, **outside** the app folder, so deploys never delete uploaded files.
  - Uploads can't go in `public/`: `next start` only serves files that existed at build time, so anything added later returns 404.
- Upload flow: `POST /api/upload` → check auth → validate the type (jpeg/png/webp/gif) and size (≤ 5 MB) → re-encode with sharp to WebP (max width 1600px) → save as `<UPLOAD_DIR>/YYYY/MM/<cuid>.webp` → return the URL `/uploads/YYYY/MM/<cuid>.webp`.
- Serving: in development, the route handler `app/uploads/[...path]/route.ts` streams the file with `Cache-Control: public, max-age=31536000, immutable`. On the VPS, Nginx serves `/uploads/*` directly from disk, which is faster and keeps the work off Node.
- Store only the relative URL in the DB (`coverImage`, `image`). When a post's cover is replaced or the post is deleted, remove the old file.
- Back up the uploads folder together with the MySQL dump.

## 2. Features

**MVP (Phase 1)**
- Public: home feed, post detail page, category and tag pages, author profile, search
- Auth: sign up, log in, log out, roles (`USER`, `AUTHOR`, `ADMIN`)
- Authors: create, edit, delete, and save drafts of posts; cover image upload; slug generation
- Responsive layout (single light theme)
- SEO: metadata, Open Graph images, sitemap.xml, robots.txt, RSS feed

**Phase 2**
- Comments (nested), likes
- Reading time, view counter, "related posts"
- Admin dashboard with users, posts, comment moderation, and basic stats

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
│  ├─ api/upload/route.ts         # Validates, resizes, and saves to UPLOAD_DIR
│  ├─ uploads/[...path]/route.ts  # Serves uploaded files in development
│  ├─ sitemap.ts, robots.ts, rss.xml/route.ts
│  └─ layout.tsx
├─ components/  (ui/, post/, editor/, layout/)
├─ lib/         (prisma.ts, auth.ts, utils.ts, storage.ts, validations/)
├─ actions/     (post.ts, comment.ts, like.ts): Server Actions
└─ prisma/      (schema.prisma, seed.ts)
middleware.ts         # Protects /dashboard and /admin
public/               # Static assets: logo.svg, favicon.ico, default-avatar.png, default-cover.jpg, og-default.png
uploads/              # User uploads in development (gitignored)
ecosystem.config.js   # PM2 config for the VPS
deploy/
├─ nginx-blog.conf    # Nginx site config (copied to the server)
└─ deploy.sh          # Pull, install, migrate, build, reload
```

## 5. Modern UI/UX Direction

- Clean, typography-first layout: Inter or Geist for the UI, a serif for article body text, and `@tailwindcss/typography` for post content
- Home page with a large hero for the featured post, a grid of post cards, and a category filter bar
- Sticky header with a blurred background, and a ⌘K search dialog
- Article page with a reading progress bar, a sticky table of contents, code highlighting (Shiki), and share buttons
- Subtle motion with Framer Motion, skeleton loaders, and an image blur placeholder
- Accessibility: semantic HTML, focus states, and WCAG AA contrast

## 6. Implementation Roadmap

| Week | Tasks |
|---|---|
| **1: Setup** | `create-next-app`, Tailwind, shadcn/ui, install MySQL 8 locally, Prisma schema, first migration, seed script, ESLint/Prettier |
| **2: Auth** | Auth.js with the Prisma adapter, credentials (bcrypt) and GitHub OAuth, role-based middleware |
| **3: Posts CRUD** | Dashboard, Tiptap editor, Zod validation, slug and reading-time helpers, local image upload (sharp → `UPLOAD_DIR`) with the serving route, draft/publish |
| **4: Public site** | Home feed with pagination, post page, category/tag/author pages, ISR/caching with `revalidateTag` |
| **5: Engagement** | Comments, likes with optimistic UI, view counter |
| **6: Search & SEO** | FULLTEXT search, `generateMetadata`, dynamic OG images, sitemap, RSS |
| **7: Admin** | User and role management, post and comment moderation, stats cards |
| **8: Polish & Deploy** | Tests (Vitest + Playwright), Lighthouse performance pass, set up the Hostinger VPS (section 10): Node + PM2, MySQL, Nginx + Certbot HTTPS, point the domain to it, `deploy.sh` + GitHub Actions auto-deploy, nightly backups of MySQL + uploads |

## 7. Key Technical Decisions

- **Rendering:** fetch data in Server Components; post pages use static generation with on-demand revalidation when a post is published or updated.
- **Mutations:** use Server Actions with `revalidatePath` and `revalidateTag`. API routes are only for uploads and auth.
- **Image storage:** `lib/storage.ts` wraps save and delete for files (`saveImage(file) → url`, `deleteImage(url)`), so moving to S3 or Cloudflare R2 later only means rewriting that one file.
- **Upload safety:** check the real file type from the magic bytes, not the extension. Generate filenames server-side (never use the user's filename). Reject `..` in the serving route to block path traversal. Only `AUTHOR`/`ADMIN` can upload, and uploads are rate-limited.
- **Prisma client:** use a singleton in `lib/prisma.ts` so hot reload doesn't open too many connections.
- **Security:** sanitize HTML output (DOMPurify / `sanitize-html`), check auth and ownership inside every action, rate-limit comments and logins, and keep secrets in `.env`.
- **Pagination:** cursor-based, using `publishedAt` + `id`.

## 8. Environment Variables

Development (`.env` in the project, never committed):

```
DATABASE_URL="mysql://root:<your-local-password>@localhost:3306/blog"
AUTH_SECRET=""
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
UPLOAD_DIR="./uploads"
UPLOAD_MAX_MB="5"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Production (`/var/www/blog/app/.env` on the VPS, `chmod 600`, never committed):

```
DATABASE_URL="mysql://blog:<strong-password>@localhost:3306/blog"
AUTH_SECRET="<output of: openssl rand -base64 32>"
AUTH_URL="https://yourdomain.com"
AUTH_TRUST_HOST="true"            # required because the app runs behind Nginx
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""             # GitHub OAuth callback: https://yourdomain.com/api/auth/callback/github
UPLOAD_DIR="/var/www/blog/uploads"
UPLOAD_MAX_MB="5"
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"
```

## 9. Getting Started Commands (local, Windows)

1. Install **Node.js 22 LTS** and **MySQL 8 Community Server** (MySQL Installer for Windows; set a root password and keep port 3306).
2. Create the database:
   ```bash
   mysql -u root -p -e "CREATE DATABASE blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```
3. Create the project:
   ```bash
   npx create-next-app@latest . --ts --tailwind --app --src-dir --eslint
   npm i prisma @prisma/client next-auth@beta @auth/prisma-adapter zod bcryptjs sharp file-type
   mkdir uploads && echo "uploads/" >> .gitignore
   npx prisma init --datasource-provider mysql
   npx shadcn@latest init
   npx prisma migrate dev --name init
   npm run dev
   ```

## 10. Deployment on Hostinger VPS (no Docker)

### 10.1 Choose and create the VPS
- **Plan:** KVM 2 (2 vCPU, 8 GB RAM) is comfortable for Next.js + MySQL on one server. KVM 1 (4 GB) is enough for a small blog; the 2 GB swap file below helps `next build` finish.
- **OS template:** in hPanel, pick plain **Ubuntu 24.04**.
- Add your **SSH public key** during setup and pick the data center closest to your readers.

### 10.2 Domain and DNS
- In your domain's DNS (Hostinger hPanel → Domains → DNS, or wherever the domain is registered), add:
  - `A` record `@` → VPS IPv4
  - `A` record `www` → VPS IPv4
- Wait for DNS to propagate before running Certbot (10.6), so it can get the HTTPS certificate.

### 10.3 Secure the server (run once, as root)
```bash
ssh root@<VPS_IP>
apt update && apt upgrade -y
adduser deploy && usermod -aG sudo deploy
# copy your SSH key to deploy (ssh-copy-id deploy@<VPS_IP>), then in /etc/ssh/sshd_config set:
#   PermitRootLogin no
#   PasswordAuthentication no
systemctl restart ssh
ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw enable   # run after installing Nginx (10.4)
apt install -y fail2ban unattended-upgrades git
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```
- Also turn on the **hPanel firewall** for the VPS with the same rules (22, 80, 443 only).

### 10.4 Install the software
```bash
# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# Nginx + Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# MySQL 8
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

Create the database and its user. MySQL listens only on `127.0.0.1` by default; keep it that way and **never** open port 3306.
```sql
-- sudo mysql
CREATE DATABASE blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'blog'@'localhost' IDENTIFIED BY '<strong-password>';
GRANT ALL PRIVILEGES ON blog.* TO 'blog'@'localhost';
FLUSH PRIVILEGES;
```

### 10.5 Folders on the server
```
/var/www/blog/
├─ app/        # git clone of the repo (.env lives here)
├─ uploads/    # user uploads, never touched by deploys
└─ backups/    # nightly dumps
```
```bash
sudo mkdir -p /var/www/blog/{uploads,backups} && sudo chown -R deploy:deploy /var/www/blog
cd /var/www/blog && git clone https://github.com/<github-user>/<repo>.git app
```

### 10.6 Nginx + HTTPS
`deploy/nginx-blog.conf` → copy to `/etc/nginx/sites-available/blog`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 10M;

    # Uploaded images straight from disk
    location /uploads/ {
        alias /var/www/blog/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Next.js build assets
    location /_next/static/ {
        alias /var/www/blog/app/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com --redirect
```
Certbot adds the HTTPS block and the HTTP → HTTPS redirect, and renews the certificate automatically.

### 10.7 PM2 (keeps the app running)
`ecosystem.config.js` in the repo:
```js
module.exports = {
  apps: [{
    name: "blog",
    cwd: "/var/www/blog/app",
    script: "node_modules/next/dist/bin/next",
    args: "start -p 3000",
    env: { NODE_ENV: "production" },
    max_memory_restart: "1G",
  }],
};
```

### 10.8 First deploy
```bash
ssh deploy@<VPS_IP>
cd /var/www/blog/app
nano .env                      # paste the production variables (section 8), then: chmod 600 .env
npm ci
npx prisma migrate deploy
npx prisma db seed             # optional: categories and the admin user
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup                    # run the command it prints, so the app starts after a reboot
pm2 install pm2-logrotate      # keeps log files small
```

### 10.9 Updates and auto-deploy
`deploy/deploy.sh` in the repo:
```bash
#!/usr/bin/env bash
set -e
cd /var/www/blog/app
git pull origin main
npm ci
npx prisma migrate deploy
npm run build
pm2 reload blog
```
- Manual update: `ssh deploy@<VPS_IP> 'bash /var/www/blog/app/deploy/deploy.sh'`
- Auto-deploy: a **GitHub Actions** workflow on every push to `main` uses `appleboy/ssh-action` (SSH key stored in GitHub Secrets) to run the same script.
- The build runs on the live server, so the site can be briefly slow during a deploy. That's fine for a blog.

### 10.10 Backups and monitoring
- Put the MySQL credentials in `~/.my.cnf` (`chmod 600`) so cron can run `mysqldump` without a password in the command:
  ```
  [mysqldump]
  user=blog
  password=<strong-password>
  ```
- **Nightly cron** (`crontab -e` as `deploy`):
  ```bash
  0 3 * * * mysqldump --single-transaction blog | gzip > /var/www/blog/backups/db-$(date +\%F).sql.gz
  15 3 * * * tar czf /var/www/blog/backups/uploads-$(date +\%F).tar.gz -C /var/www/blog uploads
  30 3 * * * find /var/www/blog/backups -mtime +14 -delete
  ```
- Copy the backups off the server too (for example `rclone` to Google Drive, Backblaze B2, or Cloudflare R2). Hostinger's own VPS backups and snapshots are a useful extra layer, but not a replacement.
- Take a **manual snapshot in hPanel** before any big upgrade.
- Uptime checks: UptimeRobot or Better Stack (free tier) pinging `https://yourdomain.com`.
- Logs: `pm2 logs blog`, `pm2 monit`, and `/var/log/nginx/error.log`.
