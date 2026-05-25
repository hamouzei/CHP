import { Router } from 'express';
import prisma from '../config/db';

const router = Router();

// GET /reference/domains
router.get('/domains', async (req, res) => {
  try {
    const domains = await prisma.domain.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        components: {
          orderBy: { displayOrder: 'asc' },
          include: {
            criteria: {
              orderBy: { displayOrder: 'asc' },
              include: {
                levels: {
                  orderBy: { level: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    return res.json(domains);
  } catch (error) {
    console.error('Error fetching reference domains:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'An error occurred fetching reference domains' });
  }
});

// GET /reference/maturity-bands
router.get('/maturity-bands', async (req, res) => {
  try {
    const bands = await prisma.maturityBand.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    return res.json(bands);
  } catch (error) {
    console.error('Error fetching reference maturity bands:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'An error occurred fetching maturity bands' });
  }
});

export default router;
