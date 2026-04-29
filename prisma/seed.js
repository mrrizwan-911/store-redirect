// @ts-nocheck
/* eslint-disable @typescript-eslint/no-var-requires */
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const bcrypt = require('bcryptjs')
const path = require('path')
const { loadEnvConfig } = require('@next/env')

// Load .env.local
loadEnvConfig(path.resolve(__dirname, '..'))

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! })
const db = new PrismaClient({ adapter })

async function main() {
  console.log('Starting seed...')

  // 0. Cleanup test categories
  console.log('Cleaning up test data...')

  // First, unprotect everything that's not a core root category to allow deletion
  await db.category.updateMany({
    where: {
      slug: { notIn: ['clothes', 'shoes', 'apparel', 'accessories'] },
    },
    data: { isProtected: false },
  })

  // Delete identified test root categories
  const categoriesToDelete = await db.category.findMany({
    where: {
      parentId: null,
      slug: {
        notIn: ['clothes', 'shoes', 'apparel', 'accessories'],
      },
    },
    select: { id: true },
  })
  const categoryIdsToDelete = categoriesToDelete.map((c) => c.id)

  if (categoryIdsToDelete.length > 0) {
    const productsToDelete = await db.product.findMany({
      where: { categoryId: { in: categoryIdsToDelete } },
      select: { id: true },
    })
    const productIdsToDelete = productsToDelete.map((p) => p.id)

    if (productIdsToDelete.length > 0) {
      // Delete dependent items first to avoid FK constraint issues
      await db.wishlistItem.deleteMany({ where: { productId: { in: productIdsToDelete } } })
      await db.cartItem.deleteMany({ where: { productId: { in: productIdsToDelete } } })
      await db.outfitItem.deleteMany({ where: { productId: { in: productIdsToDelete } } })
      await db.product.deleteMany({ where: { id: { in: productIdsToDelete } } })
    }

    await db.category.deleteMany({
      where: { id: { in: categoryIdsToDelete } },
    })
  }

  // Cleanup old 'casual' and 'formal' subcategories from Clothes if they exist
  // This prevents duplicates after slug renaming
  const clothesRoot = await db.category.findUnique({ where: { slug: 'clothes' } })
  if (clothesRoot) {
    await db.category.deleteMany({
      where: {
        parentId: clothesRoot.id,
        slug: { in: ['casual', 'formal'] },
      },
    })
  }

  // 1. Create Users
  const adminPassword = await bcrypt.hash('Admin@123', 12)
  await db.user.upsert({
    where: { email: 'admin@store.com' },
    update: {},
    create: {
      email: 'admin@store.com',
      name: 'Store Admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isVerified: true,
    },
  })

  const testPassword = await bcrypt.hash('Test@123456', 12)
  await db.user.upsert({
    where: { email: 'testuser@example.com' },
    update: { isVerified: true, passwordHash: testPassword },
    create: {
      email: 'testuser@example.com',
      name: 'Test User',
      passwordHash: testPassword,
      role: 'CUSTOMER',
      isVerified: true,
    },
  })

  // 2. Create Categories & Subcategories (Synced with Navbar)
  const categories = [
    {
      name: 'Clothes',
      slug: 'clothes',
      subcategories: [
        { name: 'Tops', slug: 'tops' },
        { name: 'Bottoms', slug: 'bottoms' },
        { name: 'Outerwear', slug: 'outerwear' },
        { name: 'Formal Wear', slug: 'clothes-formal' },
        { name: 'Casual Wear', slug: 'clothes-casual' },
      ],
    },
    {
      name: 'Shoes',
      slug: 'shoes',
      subcategories: [
        { name: 'Sneakers', slug: 'sneakers' },
        { name: 'Formal', slug: 'formal' },
        { name: 'Sandals', slug: 'sandals' },
        { name: 'Boots', slug: 'boots' },
        { name: 'Sports', slug: 'sports' },
      ],
    },
    {
      name: 'Apparel',
      slug: 'apparel',
      subcategories: [
        { name: 'Kurtas', slug: 'kurtas' },
        { name: 'Shalwar Kameez', slug: 'shalwar-kameez' },
        { name: 'Abayas', slug: 'abayas' },
        { name: 'Sportswear', slug: 'sportswear' },
      ],
    },
    {
      name: 'Accessories',
      slug: 'accessories',
      subcategories: [
        { name: 'Bags', slug: 'bags' },
        { name: 'Belts', slug: 'belts' },
        { name: 'Wallets', slug: 'wallets' },
        { name: 'Sunglasses', slug: 'sunglasses' },
        { name: 'Watches', slug: 'watches' },
      ],
    },
  ]

  for (const catData of categories) {
    const root = await db.category.upsert({
      where: { slug: catData.slug },
      update: { name: catData.name, isActive: true },
      create: {
        name: catData.name,
        slug: catData.slug,
        isActive: true,
      },
    })

    for (const sub of catData.subcategories) {
      await db.category.upsert({
        where: { slug: sub.slug },
        update: { name: sub.name, parentId: root.id, isActive: true },
        create: {
          name: sub.name,
          slug: sub.slug,
          parentId: root.id,
          isActive: true,
        },
      })
    }
  }

  // 3. Set Protected Status for the 4 known root categories only
  console.log('Protecting root categories...')
  await db.category.updateMany({
    where: { slug: { in: ['clothes', 'shoes', 'apparel', 'accessories'] } },
    data: { isProtected: true },
  })

  // 4. Create Sample Products
  const products = [
    // Clothes
    { name: 'Linen Dress Shirt', slug: 'linen-dress-shirt', price: 4500, cat: 'tops', sku: 'CL-TOP-001' },
    { name: 'Cotton Crewneck T-Shirt', slug: 'cotton-tshirt', price: 1800, cat: 'tops', sku: 'CL-TOP-002' },
    { name: 'Slim Fit Denim', slug: 'slim-denim', price: 3500, cat: 'bottoms', sku: 'CL-BOT-001' },
    { name: 'Chino Trousers', slug: 'chino-trousers', price: 3200, cat: 'bottoms', sku: 'CL-BOT-002' },
    { name: 'Lightweight Trench Coat', slug: 'trench-coat', price: 12000, cat: 'outerwear', sku: 'CL-OUT-001' },
    { name: 'Classic Navy Suit', slug: 'navy-suit', price: 25000, cat: 'clothes-formal', sku: 'CL-FOR-001' },

    // Shoes
    { name: 'Classic White Sneakers', slug: 'classic-white-sneakers', price: 5500, cat: 'sneakers', sku: 'SH-SNE-001' },
    { name: 'Leather Oxford Shoes', slug: 'leather-oxfords', price: 9500, cat: 'formal', sku: 'SH-FOR-001' },
    { name: 'Brown Suede Loafers', slug: 'suede-loafers', price: 8200, cat: 'formal', sku: 'SH-FOR-002' },
    { name: 'Strappy Leather Sandals', slug: 'leather-sandals', price: 3500, cat: 'sandals', sku: 'SH-SAN-001' },

    // Apparel
    { name: 'Embroidered Cotton Kurta', slug: 'cotton-kurta', price: 4500, cat: 'kurtas', sku: 'AP-KUR-001' },
    { name: 'Designer Shalwar Kameez', slug: 'designer-sk', price: 8500, cat: 'shalwar-kameez', sku: 'AP-SK-001' },
    { name: 'Classic Black Abaya', slug: 'black-abaya', price: 5500, cat: 'abayas', sku: 'AP-ABA-001' },

    // Accessories
    { name: 'Leather Laptop Bag', slug: 'leather-laptop-bag', price: 12500, cat: 'bags', sku: 'AC-BAG-001' },
    { name: 'Minimalist Silver Watch', slug: 'minimal-silver-watch', price: 15000, cat: 'watches', sku: 'AC-WAT-001' },
    { name: 'Aviator Sunglasses', slug: 'aviator-sunglasses', price: 4500, cat: 'sunglasses', sku: 'AC-SUN-001' },
  ]

  const seededProducts: any[] = []

  for (const p of products) {
    const category = await db.category.findUnique({ where: { slug: p.cat } })
    if (!category) {
        console.warn(`Category ${p.cat} not found for product ${p.name}`)
        continue
    }

    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: { categoryId: category.id, basePrice: p.price },
      create: {
        name: p.name,
        slug: p.slug,
        description: `Premium ${p.name} designed for comfort and style. Made with high-quality materials.`,
        shortDescription: `Elegant ${p.name} for everyday wear.`,
        basePrice: p.price,
        sku: p.sku,
        categoryId: category.id,
        isActive: true,
        isFeatured: Math.random() > 0.7,
        images: {
          create: [
            { url: `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1521572163474-6864f9cf17ab' : '1539109136881-3be0616acf4b'}?auto=format&fit=crop&q=80&w=800`, isPrimary: true },
            { url: `https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800`, isPrimary: false },
          ]
        },
        variantOptions: [
          { name: 'Color', values: ['Default'] },
          { name: 'Size', values: ['S', 'M', 'L'] }
        ],
        variants: {
          create: [
            { title: 'Default / S', optionValues: { Color: 'Default', Size: 'S' }, stock: 10, sku: `${p.sku}-S` },
            { title: 'Default / M', optionValues: { Color: 'Default', Size: 'M' }, stock: 15, sku: `${p.sku}-M` },
            { title: 'Default / L', optionValues: { Color: 'Default', Size: 'L' }, stock: 5, sku: `${p.sku}-L` },
          ]
        }
      }
    })
    seededProducts.push(product)
  }

  // 5. Create Sample Outfits
  const outfits = [
    {
      title: 'The Classic Formal',
      description: 'A timeless combination for any formal occasion.',
      season: 'All',
      occasion: 'Formal',
      gender: 'Men',
      imageUrl: 'https://images.unsplash.com/photo-1594932224030-94555f82f23b?auto=format&fit=crop&q=80&w=800',
      items: ['linen-dress-shirt', 'chino-trousers', 'leather-oxfords'],
    },
    {
      title: 'Urban Explorer',
      description: 'Stay comfortable and stylish while exploring the city.',
      season: 'Summer',
      occasion: 'Casual',
      gender: 'Men',
      imageUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=800',
      items: ['cotton-tshirt', 'slim-denim', 'classic-white-sneakers'],
    },
    {
      title: 'Elegant Tradition',
      description: 'Exquisite traditional wear for festive celebrations.',
      season: 'Festive',
      occasion: 'Festive',
      gender: 'Women',
      imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800',
      items: ['designer-sk', 'leather-sandals'],
    },
  ]

  for (const o of outfits) {
    const outfit = await db.outfit.upsert({
      where: { id: `outfit-${o.title.toLowerCase().replace(/\s+/g, '-')}` },
      update: {
        title: o.title,
        description: o.description,
        season: o.season,
        occasion: o.occasion,
        gender: o.gender,
        imageUrl: o.imageUrl,
        isPublished: true,
      },
      create: {
        id: `outfit-${o.title.toLowerCase().replace(/\s+/g, '-')}`,
        title: o.title,
        description: o.description,
        season: o.season,
        occasion: o.occasion,
        gender: o.gender,
        imageUrl: o.imageUrl,
        isPublished: true,
      },
    })

    // Remove existing items first
    await db.outfitItem.deleteMany({ where: { outfitId: outfit.id } })

    for (let i = 0; i < o.items.length; i++) {
      const product = await db.product.findUnique({ where: { slug: o.items[i] } })
      if (product) {
        await db.outfitItem.create({
          data: {
            outfitId: outfit.id,
            productId: product.id,
            sortOrder: i,
          },
        })
      }
    }
  }

  console.log('Seed complete!')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
