import bcrypt from 'bcryptjs';
import { db } from './prisma.js';

export async function seedDatabase() {
  try {
    const existingAdmin = await db.user.findFirst({
      where: {
        OR: [{ email: 'admin@vibemusic.com' }, { username: 'admin' }],
      },
    });

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('Admin@123456', 10);
      const admin = await db.user.create({
        data: {
          email: 'admin@vibemusic.com',
          username: 'admin',
          passwordHash,
          role: 'ADMIN',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
        },
      });

      await db.userProfile.upsert({
        where: { userId: admin.id },
        create: {
          userId: admin.id,
          bio: 'System Administrator & Head Curator at VIBE MUSIC',
          location: 'Vibe HQ, Mumbai',
          favoriteGenres: 'EDM, Synthwave, Bollywood, Lo-Fi, Hip Hop',
          website: 'https://vibemusic.io',
        },
        update: {},
      });

      console.log('✅ [Database Seed] Seeded default Admin user: admin@vibemusic.com (password: Admin@123456)');
    }

    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ email: 'user@vibemusic.com' }, { username: 'vibedemo' }],
      },
    });

    if (!existingUser) {
      const passwordHash = await bcrypt.hash('User@123456', 10);
      const user = await db.user.create({
        data: {
          email: 'user@vibemusic.com',
          username: 'vibedemo',
          passwordHash,
          role: 'USER',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&q=80',
        },
      });

      await db.userProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          bio: 'Passionate music explorer & audiophile 🎵',
          location: 'Ahmedabad, India',
          favoriteGenres: 'Hindi, Gujarati, Pop, Indie Rock, Ambient',
          website: '',
        },
        update: {},
      });

      // Create a default playlist for the demo user
      const defaultPlaylist = await db.playlist.create({
        data: {
          title: '🔥 Vibe Chill & Midnight Drive',
          description: 'Smooth, atmospheric beats, synthwave vibes and soulful melodies.',
          coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
          userId: user.id,
          isPublic: true,
        },
      });

      console.log('✅ [Database Seed] Seeded default Demo user: user@vibemusic.com (password: User@123456) with starter playlist');
    }
  } catch (error) {
    console.error('Error during database seed:', error);
  }
}

