import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { generateVariantSKU } from '../src/lib/utils/variants'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set')

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Helper: random item from array
function sample<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Helper: random number between min and max
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Helper: generate random tags
const ALL_TAGS = ['Summer', 'Winter', 'Casual', 'Formal', 'Streetwear', 'Vintage', 'Essential', 'Luxury', 'Minimalist', 'Athleisure', 'Evening', 'Workwear']
function getRandomTags(count: number): string[] {
  const tags = new Set<string>()
  while (tags.size < count) {
    tags.add(sample(ALL_TAGS))
  }
  return Array.from(tags)
}

const REGIONS = [['PK'], ['UK'], ['PK', 'UK']]

const IMAGE_PLACEHOLDERS = [
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1434389678232-02602cb11a51?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1550639525-c97d455acf70?auto=format&fit=crop&q=80&w=1200',
]

const COLORS = ['Black', 'White', 'Navy', 'Olive', 'Beige', 'Grey']
const SIZES = ['S', 'M', 'L', 'XL']

// 50 Product titles divided by categories
const PRODUCTS_DATA = [
  // Men's Wear
  { name: 'Classic Oxford Shirt', cat: 'Men', shortDesc: 'A timeless essential for any wardrobe.' },
  { name: 'Slim Fit Chinos', cat: 'Men', shortDesc: 'Comfortable and versatile trousers.' },
  { name: 'Merino Wool Sweater', cat: 'Men', shortDesc: 'Lightweight warmth for chilly evenings.' },
  { name: 'Denim Jacket', cat: 'Men', shortDesc: 'Rugged and durable denim layer.' },
  { name: 'Casual Linen Shirt', cat: 'Men', shortDesc: 'Breathable linen for hot days.' },
  { name: 'Tailored Blazer', cat: 'Men', shortDesc: 'Sharp look for formal events.' },
  { name: 'Graphic Print Tee', cat: 'Men', shortDesc: 'Expressive and bold everyday tee.' },
  { name: 'Fleece Joggers', cat: 'Men', shortDesc: 'Ultimate comfort for lounging.' },
  { name: 'Heavyweight Hoodie', cat: 'Men', shortDesc: 'Cozy and relaxed fit hoodie.' },
  { name: 'Polo Shirt', cat: 'Men', shortDesc: 'Smart casual polo with ribbed collar.' },
  { name: 'Corduroy Overshirt', cat: 'Men', shortDesc: 'Textured fabric for a layered look.' },
  { name: 'Cargo Pants', cat: 'Men', shortDesc: 'Utility-inspired cargo trousers.' },
  { name: 'Wool Blend Coat', cat: 'Men', shortDesc: 'Elegant outerwear for winter.' },
  { name: 'Athletic Shorts', cat: 'Men', shortDesc: 'Performance shorts for workouts.' },
  { name: 'Knit Beanie', cat: 'Accessories', shortDesc: 'Warm accessory for colder days.' },

  // Women's Wear
  { name: 'Floral Maxi Dress', cat: 'Women', shortDesc: 'Flowy and elegant floral pattern.' },
  { name: 'High-Waisted Jeans', cat: 'Women', shortDesc: 'Flattering fit denim.' },
  { name: 'Silk Camisole', cat: 'Women', shortDesc: 'Luxurious silk layer.' },
  { name: 'Oversized Cardigan', cat: 'Women', shortDesc: 'Chunky knit for cozy comfort.' },
  { name: 'Pleated Midi Skirt', cat: 'Women', shortDesc: 'Versatile skirt for any occasion.' },
  { name: 'Leather Biker Jacket', cat: 'Women', shortDesc: 'Edgy outerwear piece.' },
  { name: 'Cropped Sweater', cat: 'Women', shortDesc: 'Modern cropped silhouette.' },
  { name: 'Linen Wide-Leg Pants', cat: 'Women', shortDesc: 'Breezy and comfortable trousers.' },
  { name: 'Wrap Dress', cat: 'Women', shortDesc: 'Classic and flattering wrap design.' },
  { name: 'Ribbed Knit Top', cat: 'Women', shortDesc: 'Form-fitting everyday essential.' },
  { name: 'Tailored Trousers', cat: 'Women', shortDesc: 'Professional and sharp look.' },
  { name: 'Puffer Jacket', cat: 'Women', shortDesc: 'Warm and insulated outerwear.' },
  { name: 'Denim Shorts', cat: 'Women', shortDesc: 'Casual staple for summer.' },
  { name: 'Slip Dress', cat: 'Women', shortDesc: 'Minimalist and sleek evening wear.' },
  { name: 'Cashmere Scarf', cat: 'Accessories', shortDesc: 'Soft and luxurious accessory.' },

  // Shoes & Accessories (Mixed)
  { name: 'Leather Chelsea Boots', cat: 'Shoes', shortDesc: 'Classic slip-on boots.' },
  { name: 'Canvas Sneakers', cat: 'Shoes', shortDesc: 'Everyday casual footwear.' },
  { name: 'Running Shoes', cat: 'Shoes', shortDesc: 'High-performance athletic trainers.' },
  { name: 'Suede Loafers', cat: 'Shoes', shortDesc: 'Elegant slip-on shoes.' },
  { name: 'Strappy Heels', cat: 'Shoes', shortDesc: 'Sophisticated evening heels.' },
  { name: 'Minimalist Watch', cat: 'Accessories', shortDesc: 'Timeless wrist accessory.' },
  { name: 'Leather Crossbody Bag', cat: 'Accessories', shortDesc: 'Practical and stylish bag.' },
  { name: 'Polarized Sunglasses', cat: 'Accessories', shortDesc: 'UV protection with style.' },
  { name: 'Canvas Tote Bag', cat: 'Accessories', shortDesc: 'Eco-friendly carryall.' },
  { name: 'Woven Belt', cat: 'Accessories', shortDesc: 'Textured accessory for trousers.' },
  { name: 'Gold Hoop Earrings', cat: 'Accessories', shortDesc: 'Classic jewelry piece.' },
  { name: 'Pendant Necklace', cat: 'Accessories', shortDesc: 'Delicate neck accessory.' },
  { name: 'Silk Tie', cat: 'Accessories', shortDesc: 'Formal neckwear for suits.' },
  { name: 'Leather Wallet', cat: 'Accessories', shortDesc: 'Compact and durable wallet.' },
  { name: 'Fedora Hat', cat: 'Accessories', shortDesc: 'Stylish headwear for sunny days.' },
  { name: 'Travel Duffel Bag', cat: 'Accessories', shortDesc: 'Spacious bag for weekends.' },
  { name: 'Cotton Socks Set', cat: 'Accessories', shortDesc: 'Comfortable everyday socks.' },
]

async function main() {
  console.log('🌱 Starting database seed...')

  // 1. Clear existing data
  console.log('Clearing existing data...')
  await prisma.orderItem.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.wishlistItem.deleteMany()
  await prisma.review.deleteMany()
  await prisma.outfitItem.deleteMany()
  await prisma.outfit.deleteMany()
  await prisma.productImage.deleteMany()
  await prisma.productVariant.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany({ where: { email: 'seed@example.com' } })

  console.log('Creating dummy user for reviews...')
  const user = await prisma.user.create({
    data: {
      email: 'seed@example.com',
      name: 'Seed User',
    }
  })

  // 2. Create Categories
  console.log('Creating categories...')
  const categoriesToCreate = ['Men', 'Women', 'Shoes', 'Accessories']
  const categories: Record<string, string> = {}
  
  for (const catName of categoriesToCreate) {
    const cat = await prisma.category.create({
      data: {
        name: catName,
        slug: catName.toLowerCase(),
        description: `${catName} collection`,
        isActive: true,
      }
    })
    categories[catName] = cat.id
  }

  // 3. Create 40-50 Products
  console.log('Creating products...')
  const createdProducts = []
  
  for (let i = 0; i < PRODUCTS_DATA.length; i++) {
    const pData = PRODUCTS_DATA[i]
    
    // Generate pricing
    const basePK = randomInt(2000, 15000)
    const baseUK = randomInt(20, 150)
    const isSale = Math.random() > 0.7
    const salePK = isSale ? Math.floor(basePK * 0.8) : null
    const saleUK = isSale ? Math.floor(baseUK * 0.8) : null
    
    const regions = sample(REGIONS)
    
    // Variant config
    const hasVariants = Math.random() > 0.3
    const variantOptions = hasVariants ? [
      { name: 'Size', values: [sample(SIZES), sample(SIZES)] },
      { name: 'Color', values: [sample(COLORS), sample(COLORS)] }
    ] : []

    // Ensure unique values
    if (hasVariants) {
      variantOptions[0].values = Array.from(new Set(variantOptions[0].values))
      variantOptions[1].values = Array.from(new Set(variantOptions[1].values))
    }

    const product = await prisma.product.create({
      data: {
        name: pData.name,
        slug: pData.name.toLowerCase().replace(/ /g, '-') + `-${i}`,
        description: `Experience the ultimate in style and comfort with our ${pData.name}. Designed with meticulous attention to detail, this piece offers a perfect blend of modern aesthetics and timeless appeal. Crafted from premium materials, it ensures durability while maintaining a soft, luxurious feel against the skin. Whether you're dressing up for a special occasion or keeping it casual, its versatile design adapts effortlessly to your lifestyle. Elevate your wardrobe with this essential piece that seamlessly combines functionality with sophisticated fashion, making it a reliable choice for any season.`,
        shortDescription: pData.shortDesc,
        categoryId: categories[pData.cat],
        basePrice: basePK,
        salePrice: salePK,
        pricePK: basePK,
        priceUK: baseUK,
        salePricePK: salePK,
        salePriceUK: saleUK,
        sku: `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        isActive: true,
        isFeatured: Math.random() > 0.8,
        tags: getRandomTags(3),
        regions,
        variantOptions: hasVariants ? variantOptions : [],
        images: {
          create: [
            {
              url: sample(IMAGE_PLACEHOLDERS),
              cloudinaryPublicId: `dummy-${Math.random()}`,
              isPrimary: true,
              sortOrder: 0
            },
            {
              url: sample(IMAGE_PLACEHOLDERS),
              cloudinaryPublicId: `dummy-${Math.random()}`,
              isPrimary: false,
              sortOrder: 1
            }
          ]
        }
      }
    })

    // Create variants
    if (hasVariants) {
      const combos = []
      for (const size of variantOptions[0].values) {
        for (const color of variantOptions[1].values) {
          combos.push({ Size: size, Color: color })
        }
      }

      for (const combo of combos) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            title: `${combo.Size} / ${combo.Color}`,
            optionValues: combo,
            stock: randomInt(0, 50),
            sku: generateVariantSKU(product.name, combo),
            price: null,
            pricePK: null,
            priceUK: null
          }
        })
      }
    } else {
      // Base stock variant
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          title: 'Default',
          optionValues: {},
          stock: randomInt(10, 100),
          sku: product.sku,
        }
      })
    }

    // Create reviews
    const numReviews = randomInt(0, 5)
    for(let r=0; r<numReviews; r++) {
      await prisma.review.create({
        data: {
          product: { connect: { id: product.id } },
          user: { connect: { id: user.id } },
          rating: randomInt(3, 5),
          title: 'Great product!',
          body: 'Really loved this, amazing quality.',
          isVerified: true,
        }
      })
    }

    createdProducts.push(product)
  }

  // 4. Create 10 Lookbooks
  console.log('Creating lookbooks...')
  const LOOKBOOK_NAMES = [
    'Summer Essentials', 'Urban Streetwear', 'Office Elegance', 'Weekend Casual', 
    'Winter Layering', 'Evening Glamour', 'Athleisure Vibe', 'Vacation Ready', 
    'Minimalist Chic', 'Monochrome Magic'
  ]

  for (let i = 0; i < 10; i++) {
    const outfit = await prisma.outfit.create({
      data: {
        title: LOOKBOOK_NAMES[i],
        description: `A curated selection of pieces perfectly matched for the ${LOOKBOOK_NAMES[i]} vibe. Shop the complete look for effortless styling.`,
        imageUrl: sample(IMAGE_PLACEHOLDERS),
        season: sample(['Summer', 'Winter', 'All Season']),
        occasion: sample(['Casual', 'Formal', 'Festive']),
        gender: sample(['Men', 'Women', 'Unisex']),
        isPublished: true,
        country: sample(['ALL', 'PK', 'UK']),
      }
    })

    // Add 3 random products to the outfit
    const outfitProducts = new Set<string>()
    while(outfitProducts.size < 3) {
      outfitProducts.add(sample(createdProducts).id)
    }

    let sortOrder = 0
    for (const pid of Array.from(outfitProducts)) {
      await prisma.outfitItem.create({
        data: {
          outfitId: outfit.id,
          productId: pid,
          sortOrder: sortOrder++
        }
      })
    }
  }

  console.log('✅ Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
