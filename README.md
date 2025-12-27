# Flashcards App

A responsive, mobile-first flashcard web application built with Next.js. Each flashcard is an image (front) with optional notes (back), allowing you to create and organize image-based study materials.

## Features

- 📸 **Image-based Flashcards**: Create flashcards from images with optional notes
- 📦 **Bulk Upload**: Upload multiple images at once via ZIP file
- 🖼️ **Single Image Upload**: Upload individual images with notes
- ⭐ **Starred Flashcards**: Mark important flashcards for quick access
- 📅 **Date-based History**: Automatically tracks when flashcards were viewed
- 📁 **Folder Organization**: Organize flashcards into folders/collections
- 🔀 **Shuffle**: Randomize your deck for better study sessions
- 🔄 **Flip Animation**: Smooth 3D flip animation between image and notes
- 📱 **Fullscreen View**: View images in fullscreen mode
- 📱 **Mobile-First Design**: Fully responsive, optimized for mobile devices

## Tech Stack

- **Next.js 16.1.1** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - PostgreSQL database for data persistence
- **FreeImage.host API** - Image hosting service

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (free tier works fine)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/PriyanshuShekhar10/flashcards.git
cd flashcards
```

2. Install dependencies:

```bash
npm install
```

3. Set up Supabase:

   a. Create a new project at [supabase.com](https://supabase.com)

   b. Go to your project's SQL Editor and run the SQL from `supabase-schema.sql` to create the necessary tables

   c. Go to Settings → API and copy your:

   - Project URL
   - `anon` `public` API key

   d. Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Usage

### Creating Flashcards

1. **Bulk Upload**: Go to Upload page → Select "Bulk Upload (ZIP)" → Upload a ZIP file containing images
2. **Single Upload**: Go to Upload page → Select "Single Image" → Choose an image and optionally add notes

### Organizing Flashcards

- **Folders**: Create folders to organize your flashcards by topic or subject
- **Starred**: Click the star button on any flashcard to mark it as important
- **Date Filter**: View flashcards by the date they were last viewed

### Studying

- Use the **Flip** button to switch between image and notes
- Click **Shuffle** to randomize your deck
- Navigate with **Previous/Next** buttons
- Use **Fullscreen** to view images in detail

## Project Structure

```
flash-cards/
├── src/
│   ├── app/
│   │   ├── api/          # API routes for flashcards, folders, uploads
│   │   ├── folders/      # Folder management page
│   │   ├── upload/       # Upload page
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page with flashcard viewer
│   ├── components/
│   │   └── FlashcardViewer.tsx  # Flashcard display component
│   └── lib/
│       └── db.ts         # Database operations
├── supabase-schema.sql   # Database schema SQL for Supabase
└── public/               # Static assets
```

## API Endpoints

- `GET /api/flashcards` - Get all flashcards (optional folder/date filter)
- `POST /api/flashcards` - Create a new flashcard
- `GET /api/flashcards/[id]` - Get a specific flashcard
- `PATCH /api/flashcards/[id]` - Update a flashcard
- `DELETE /api/flashcards/[id]` - Delete a flashcard
- `POST /api/flashcards/[id]/star` - Toggle star status
- `POST /api/flashcards/[id]/visit` - Track flashcard visit
- `GET /api/folders` - Get all folders
- `POST /api/folders` - Create a folder
- `POST /api/upload-image` - Upload single image to FreeImage.host
- `POST /api/upload-zip` - Extract and upload images from ZIP file

## Database Schema

The database schema is defined in `supabase-schema.sql`. Run this SQL in your Supabase SQL Editor to set up the tables.

- **folders**: id, name, createdAt
- **flashcards**: id, imageUrl, thumbUrl, notes, folderId, starred, lastVisited, createdAt

## Deployment

This app is configured for deployment on Vercel. Make sure to add your Supabase environment variables in your Vercel project settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## License

MIT

## Author

Priyanshu Shekhar
