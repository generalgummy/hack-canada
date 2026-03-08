/**
 * Seed script — populates the database with realistic demo data
 * Run: node scripts/seed-data.js
 *
 * Creates:
 *  - 3 hunters, 3 community orgs, 2 suppliers (+ keeps existing admin)
 *  - ~15 listings with real Unsplash images
 *  - ~10 orders between users
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const Message = require('../models/Message');

// ──────────────────────────────────────────
// Unsplash image URLs (free, no API key)
// ──────────────────────────────────────────
const IMAGES = {
  meat: [
    'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80', // raw steaks
    'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=800&q=80', // butcher cuts
    'https://images.unsplash.com/photo-1588347818036-558601350947?w=800&q=80', // ground meat
  ],
  grains: [
    'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=80', // wheat grains
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80', // oats
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80', // bread / flour
  ],
  rice: [
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80', // rice bowl
    'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=800&q=80', // rice grain
  ],
  vegetables: [
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80', // mixed veg
    'https://images.unsplash.com/photo-1518977676601-b53f82ber6f?w=800&q=80', // fresh produce
    'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=800&q=80', // green veg
  ],
  dry_rations: [
    'https://images.unsplash.com/photo-1604846887565-640d2f52d564?w=800&q=80', // canned goods
    'https://images.unsplash.com/photo-1612187209234-a0be8dcea405?w=800&q=80', // dry goods
  ],
  other: [
    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80', // pantry items
  ],
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ──────────────────────────────────────────
// Seed Users
// ──────────────────────────────────────────
const SEED_USERS = [
  // Hunters
  {
    name: 'John Tulugak',
    email: 'john.tulugak@demo.ca',
    password: 'Demo@2026',
    phone: '+18671001001',
    userType: 'hunter',
    location: 'Yellowknife, NT',
    isPhoneVerified: true,
    isVerified: true,
    isActive: true,
    hunterLicenseNumber: 'NT-HNT-4421',
  },
  {
    name: 'Sarah Tootoo',
    email: 'sarah.tootoo@demo.ca',
    password: 'Demo@2026',
    phone: '+18671001002',
    userType: 'hunter',
    location: 'Hay River, NT',
    isPhoneVerified: true,
    isVerified: true,
    isActive: true,
    hunterLicenseNumber: 'NT-HNT-5589',
  },
  {
    name: 'Mike Nitsiza',
    email: 'mike.nitsiza@demo.ca',
    password: 'Demo@2026',
    phone: '+18671001003',
    userType: 'hunter',
    location: 'Fort Providence, NT',
    isPhoneVerified: true,
    isVerified: true,
    isActive: true,
    hunterLicenseNumber: 'NT-HNT-7734',
  },
  // Communities
  {
    name: 'Yellowknife Community Center',
    email: 'yk.community@demo.ca',
    password: 'Demo@2026',
    phone: '+18671002001',
    userType: 'community',
    location: 'Yellowknife, NT',
    isPhoneVerified: true,
    isVerified: true,
    isActive: true,
    organizationType: 'community',
    communitySize: 350,
    address: '4920 52 St, Yellowknife, NT X1A 3T1',
  },
  {
    name: 'Hay River School District',
    email: 'hayriver.school@demo.ca',
    password: 'Demo@2026',
    phone: '+18671002002',
    userType: 'community',
    location: 'Hay River, NT',
    isPhoneVerified: true,
    isVerified: true,
    isActive: true,
    organizationType: 'school',
    communitySize: 120,
    address: '10 Woodland Dr, Hay River, NT X0E 1G1',
  },
  {
    name: 'Fort Providence Shelter',
    email: 'fp.shelter@demo.ca',
    password: 'Demo@2026',
    phone: '+18671002003',
    userType: 'community',
    location: 'Fort Providence, NT',
    isPhoneVerified: true,
    isVerified: true,
    isActive: true,
    organizationType: 'shelter',
    communitySize: 60,
    address: '1 Main St, Fort Providence, NT X0E 0L0',
  },
  // Suppliers
  {
    name: 'Northern Foods Inc.',
    email: 'info@northernfoods.demo.ca',
    password: 'Demo@2026',
    phone: '+18671003001',
    userType: 'supplier',
    location: 'Yellowknife, NT',
    isPhoneVerified: true,
    isVerified: true,
    isActive: true,
    businessName: 'Northern Foods Inc.',
    businessRegistrationNumber: 'NT-BRN-100234',
    supplyCategories: ['rice', 'grains', 'dry_rations', 'vegetables'],
  },
  {
    name: 'Arctic Supply Co.',
    email: 'orders@arcticsupply.demo.ca',
    password: 'Demo@2026',
    phone: '+18671003002',
    userType: 'supplier',
    location: 'Inuvik, NT',
    isPhoneVerified: true,
    isVerified: true,
    isActive: true,
    businessName: 'Arctic Supply Co.',
    businessRegistrationNumber: 'NT-BRN-200456',
    supplyCategories: ['meat', 'vegetables', 'other'],
  },
];

// ──────────────────────────────────────────
// Seed Listings
// ──────────────────────────────────────────
const LISTING_TEMPLATES = [
  // Hunter listings
  {
    _sellerEmail: 'john.tulugak@demo.ca',
    sellerType: 'hunter',
    title: 'Fresh Caribou Meat — 50 kg',
    category: 'meat',
    description: 'Premium quality caribou harvested this week near Yellowknife. Properly field-dressed, stored at -18°C. Available for community centres and schools.',
    quantity: 50,
    unit: 'kg',
    pricePerUnit: 12,
    isFree: false,
    location: 'Yellowknife, NT',
    tags: ['caribou', 'wild game', 'fresh'],
    status: 'available',
  },
  {
    _sellerEmail: 'john.tulugak@demo.ca',
    sellerType: 'hunter',
    title: 'Smoked Arctic Char — Limited Batch',
    category: 'meat',
    description: 'Traditional cold-smoked Arctic char. Vacuum-packed in 2 kg portions. Rich flavour, perfect for community feasts.',
    quantity: 20,
    unit: 'kg',
    pricePerUnit: 18,
    isFree: false,
    location: 'Yellowknife, NT',
    tags: ['fish', 'smoked', 'arctic char'],
    status: 'available',
  },
  {
    _sellerEmail: 'sarah.tootoo@demo.ca',
    sellerType: 'hunter',
    title: 'Moose Meat — Bulk Available',
    category: 'meat',
    description: 'Freshly harvested moose, cut and packaged. Free delivery within 50 km of Hay River. Ideal for meal programs.',
    quantity: 80,
    unit: 'kg',
    pricePerUnit: 10,
    isFree: false,
    location: 'Hay River, NT',
    tags: ['moose', 'bulk', 'free delivery'],
    status: 'available',
  },
  {
    _sellerEmail: 'sarah.tootoo@demo.ca',
    sellerType: 'hunter',
    title: 'Lake Whitefish — 30 kg (FREE)',
    category: 'meat',
    description: 'Donating 30 kg of lake whitefish to communities in need. First come, first served. Pickup in Hay River.',
    quantity: 30,
    unit: 'kg',
    pricePerUnit: 0,
    isFree: true,
    location: 'Hay River, NT',
    tags: ['fish', 'donation', 'free'],
    status: 'available',
  },
  {
    _sellerEmail: 'mike.nitsiza@demo.ca',
    sellerType: 'hunter',
    title: 'Wild Bison Steaks',
    category: 'meat',
    description: 'Heritage bison, ethically harvested. 5 kg packs of premium steaks. Perfect protein source for northern communities.',
    quantity: 40,
    unit: 'kg',
    pricePerUnit: 22,
    isFree: false,
    location: 'Fort Providence, NT',
    tags: ['bison', 'steaks', 'premium'],
    status: 'available',
  },
  // Supplier listings
  {
    _sellerEmail: 'info@northernfoods.demo.ca',
    sellerType: 'supplier',
    title: 'Long-Grain Basmati Rice — 25 kg bags',
    category: 'rice',
    description: 'Premium long-grain basmati rice in 25 kg bags. Ideal for large-scale meal preparation. Bulk discount for 10+ bags.',
    quantity: 200,
    unit: 'kg',
    pricePerUnit: 3.5,
    isFree: false,
    location: 'Yellowknife, NT',
    tags: ['rice', 'basmati', 'bulk'],
    status: 'available',
  },
  {
    _sellerEmail: 'info@northernfoods.demo.ca',
    sellerType: 'supplier',
    title: 'Rolled Oats — Breakfast Packs',
    category: 'grains',
    description: 'Whole grain rolled oats in 10 kg packs. High fibre, great for school breakfast programs.',
    quantity: 150,
    unit: 'kg',
    pricePerUnit: 4,
    isFree: false,
    location: 'Yellowknife, NT',
    tags: ['oats', 'grains', 'breakfast'],
    status: 'available',
  },
  {
    _sellerEmail: 'info@northernfoods.demo.ca',
    sellerType: 'supplier',
    title: 'Canned Beans & Lentils — Mixed Case',
    category: 'dry_rations',
    description: '24-can cases of assorted beans and lentils. 12-month shelf life. Essential pantry staples for remote communities.',
    quantity: 50,
    unit: 'cases',
    pricePerUnit: 42,
    isFree: false,
    location: 'Yellowknife, NT',
    tags: ['canned', 'beans', 'lentils', 'shelf-stable'],
    status: 'available',
  },
  {
    _sellerEmail: 'orders@arcticsupply.demo.ca',
    sellerType: 'supplier',
    title: 'Frozen Vegetable Medley — 10 kg',
    category: 'vegetables',
    description: 'Flash-frozen mixed vegetables (peas, corn, carrots, green beans). Perfect for community kitchens and school cafeterias.',
    quantity: 100,
    unit: 'kg',
    pricePerUnit: 6,
    isFree: false,
    location: 'Inuvik, NT',
    tags: ['frozen', 'vegetables', 'mixed'],
    status: 'available',
  },
  {
    _sellerEmail: 'orders@arcticsupply.demo.ca',
    sellerType: 'supplier',
    title: 'Root Vegetables — Potatoes & Carrots',
    category: 'vegetables',
    description: 'Locally sourced potatoes and carrots in 20 kg bags. Hardy varieties suitable for northern storage. Fresh harvest.',
    quantity: 120,
    unit: 'kg',
    pricePerUnit: 4,
    isFree: false,
    location: 'Inuvik, NT',
    tags: ['potatoes', 'carrots', 'root vegetables'],
    status: 'available',
  },
  {
    _sellerEmail: 'orders@arcticsupply.demo.ca',
    sellerType: 'supplier',
    title: 'Emergency Ration Kits (FREE for shelters)',
    category: 'dry_rations',
    description: 'Donating 30 emergency ration kits to shelters. Each kit feeds a family of 4 for one week. Rice, canned protein, dried fruit.',
    quantity: 30,
    unit: 'units',
    pricePerUnit: 0,
    isFree: true,
    location: 'Inuvik, NT',
    tags: ['emergency', 'ration', 'donation', 'free'],
    status: 'available',
  },
  {
    _sellerEmail: 'mike.nitsiza@demo.ca',
    sellerType: 'hunter',
    title: 'Dried Fish — Traditional Preparation',
    category: 'meat',
    description: 'Air-dried lake fish prepared using traditional methods. Long shelf life, lightweight for transport. 5 kg bundles.',
    quantity: 25,
    unit: 'kg',
    pricePerUnit: 15,
    isFree: false,
    location: 'Fort Providence, NT',
    tags: ['dried fish', 'traditional', 'preserved'],
    status: 'available',
  },
  {
    _sellerEmail: 'info@northernfoods.demo.ca',
    sellerType: 'supplier',
    title: 'Whole Wheat Flour — 10 kg bags',
    category: 'grains',
    description: 'Stone-ground whole wheat flour. Ideal for bannock, bread, and community baking programs. 10 kg bags.',
    quantity: 80,
    unit: 'kg',
    pricePerUnit: 5,
    isFree: false,
    location: 'Yellowknife, NT',
    tags: ['flour', 'wheat', 'baking'],
    status: 'available',
  },
  {
    _sellerEmail: 'john.tulugak@demo.ca',
    sellerType: 'hunter',
    title: 'Mixed Wild Game Bundle (FREE)',
    category: 'meat',
    description: 'Community donation — 15 kg mixed wild game (caribou, moose). For families in need. Contact to arrange pickup.',
    quantity: 15,
    unit: 'kg',
    pricePerUnit: 0,
    isFree: true,
    location: 'Yellowknife, NT',
    tags: ['donation', 'mixed', 'free', 'wild game'],
    status: 'available',
  },
  {
    _sellerEmail: 'orders@arcticsupply.demo.ca',
    sellerType: 'supplier',
    title: 'Cooking Oil & Seasoning Kit',
    category: 'other',
    description: 'Combo kit: 5 L canola oil, salt, pepper, and assorted spices. Essential for any community kitchen.',
    quantity: 40,
    unit: 'units',
    pricePerUnit: 28,
    isFree: false,
    location: 'Inuvik, NT',
    tags: ['cooking oil', 'seasoning', 'kitchen essentials'],
    status: 'available',
  },
];

// ──────────────────────────────────────────
// Main seed function
// ──────────────────────────────────────────
async function seed() {
  await connectDB();
  console.log('🌱 Starting seed…\n');

  // ── 1. Clean old demo data (preserve admin) ──
  console.log('🗑  Removing previous demo data…');
  const demoEmails = SEED_USERS.map((u) => u.email);
  const existingDemoUsers = await User.find({ email: { $in: demoEmails } });
  const demoUserIds = existingDemoUsers.map((u) => u._id);
  if (demoUserIds.length) {
    await Listing.deleteMany({ seller: { $in: demoUserIds } });
    await Order.deleteMany({ $or: [{ buyer: { $in: demoUserIds } }, { seller: { $in: demoUserIds } }] });
    await Message.deleteMany({ sender: { $in: demoUserIds } });
    await User.deleteMany({ _id: { $in: demoUserIds } });
  }

  // ── 2. Create users ──
  console.log('👤 Creating demo users…');
  const salt = await bcrypt.genSalt(12);
  const createdUsers = [];
  for (const u of SEED_USERS) {
    const hashedPw = await bcrypt.hash(u.password, salt);
    const user = await User.create({ ...u, password: hashedPw });
    createdUsers.push(user);
    console.log(`   ✓ ${user.name} (${user.userType})`);
  }

  // Build lookup by email
  const userByEmail = {};
  createdUsers.forEach((u) => (userByEmail[u.email] = u));

  // ── 3. Create listings with images ──
  console.log('\n📦 Creating listings…');
  const createdListings = [];
  for (const tpl of LISTING_TEMPLATES) {
    const seller = userByEmail[tpl._sellerEmail];
    if (!seller) {
      console.log(`   ⚠  Seller not found for ${tpl.title}, skipping`);
      continue;
    }

    // Pick 1-2 images for the listing
    const categoryImages = IMAGES[tpl.category] || IMAGES.other;
    const numImages = Math.min(categoryImages.length, rand(1, 2));
    const images = [];
    const shuffled = [...categoryImages].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numImages; i++) {
      images.push({ url: shuffled[i], publicId: `seed_${tpl.category}_${i}` });
    }

    const listing = await Listing.create({
      seller: seller._id,
      sellerType: tpl.sellerType,
      title: tpl.title,
      category: tpl.category,
      description: tpl.description,
      quantity: tpl.quantity,
      unit: tpl.unit,
      pricePerUnit: tpl.pricePerUnit,
      isFree: tpl.isFree,
      location: tpl.location,
      tags: tpl.tags,
      status: tpl.status,
      images,
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
      availableFrom: new Date(Date.now() - rand(0, 7) * 24 * 60 * 60 * 1000),
    });

    createdListings.push(listing);
    console.log(`   ✓ ${listing.title}  (${images.length} img)`);
  }

  // ── 4. Create orders ──
  console.log('\n🛒 Creating demo orders…');

  // Communities as buyers
  const communities = createdUsers.filter((u) => u.userType === 'community');

  const ORDER_DATA = [
    { buyerIdx: 0, listingIdx: 0, qty: 20, status: 'confirmed' },
    { buyerIdx: 1, listingIdx: 2, qty: 30, status: 'pending' },
    { buyerIdx: 2, listingIdx: 3, qty: 15, status: 'confirmed' },
    { buyerIdx: 0, listingIdx: 5, qty: 50, status: 'delivered' },
    { buyerIdx: 1, listingIdx: 6, qty: 30, status: 'in_transit' },
    { buyerIdx: 2, listingIdx: 10, qty: 10, status: 'pending' },
    { buyerIdx: 0, listingIdx: 8, qty: 20, status: 'confirmed' },
    { buyerIdx: 1, listingIdx: 9, qty: 40, status: 'pending' },
    { buyerIdx: 2, listingIdx: 4, qty: 10, status: 'confirmed' },
    { buyerIdx: 0, listingIdx: 12, qty: 20, status: 'delivered' },
  ];

  for (const od of ORDER_DATA) {
    const buyer = communities[od.buyerIdx % communities.length];
    const listing = createdListings[od.listingIdx % createdListings.length];
    if (!buyer || !listing) continue;

    const totalPrice = listing.isFree ? 0 : listing.pricePerUnit * od.qty;

    const order = new Order({
      listing: listing._id,
      buyer: buyer._id,
      seller: listing.seller,
      quantityRequested: od.qty,
      unit: listing.unit,
      totalPrice,
      status: od.status,
      deliveryAddress: buyer.address || buyer.location,
      notes: `Demo order — ${listing.title}`,
      estimatedDelivery: new Date(Date.now() + rand(3, 14) * 24 * 60 * 60 * 1000),
      deliveredAt: od.status === 'delivered' ? new Date(Date.now() - rand(1, 5) * 24 * 60 * 60 * 1000) : undefined,
    });
    order._statusNote = 'Seeded by demo script';
    await order.save();
    console.log(`   ✓ ${buyer.name} ← ${listing.title} [${od.status}]`);
  }

  // ── 5. Create a few messages ──
  console.log('\n💬 Creating demo messages…');
  const msgPairs = [
    { from: communities[0], to: createdUsers.find((u) => u.email === 'john.tulugak@demo.ca'), msgs: [
      'Hi John, we need 20 kg caribou for the spring feast. Is that available?',
      'Absolutely! I can have it ready by this weekend. Want me to deliver?',
      'Yes please, deliver to the community centre. Thanks!',
    ]},
    { from: communities[1], to: createdUsers.find((u) => u.email === 'sarah.tootoo@demo.ca'), msgs: [
      'Hello Sarah, interested in your moose meat for our school lunch program.',
      'Great! How much do you need per week?',
      'About 30 kg per week if possible.',
      'I can do that. Let me set up a recurring order for you.',
    ]},
    { from: communities[2], to: createdUsers.find((u) => u.email === 'orders@arcticsupply.demo.ca'), msgs: [
      'We saw your emergency ration kits posting. Our shelter needs 10 kits urgently.',
      'We have those ready! When do you need delivery?',
      'As soon as possible, please. We are running low.',
    ]},
  ];

  for (const pair of msgPairs) {
    if (!pair.from || !pair.to) continue;
    const ids = [pair.from._id.toString(), pair.to._id.toString()].sort();
    const roomId = `${ids[0]}_${ids[1]}`;

    for (let i = 0; i < pair.msgs.length; i++) {
      const sender = i % 2 === 0 ? pair.from : pair.to;
      await Message.create({
        roomId,
        sender: sender._id,
        content: pair.msgs[i],
        messageType: 'text',
        readBy: [sender._id],
        createdAt: new Date(Date.now() - (pair.msgs.length - i) * 10 * 60 * 1000), // spaced 10 min apart
      });
    }
    console.log(`   ✓ Conversation: ${pair.from.name} ↔ ${pair.to.name} (${pair.msgs.length} msgs)`);
  }

  // ── Done ──
  console.log('\n✅ Seed complete!');
  console.log(`   Users:    ${createdUsers.length}`);
  console.log(`   Listings: ${createdListings.length}`);
  console.log(`   Orders:   ${ORDER_DATA.length}`);
  console.log(`   Chats:    ${msgPairs.length}`);
  console.log('\n   All demo accounts use password: Demo@2026');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
