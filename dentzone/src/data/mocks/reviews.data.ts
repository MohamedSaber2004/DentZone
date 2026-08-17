import type { Review, RatingDistributionItem } from '../../domain/models/review'

const monthsAgo = (months: number): string => {
  const date = new Date()
  date.setMonth(date.getMonth() - months)
  return date.toISOString()
}

const genericReviews: Review[] = [
  {
    id: 'r-001',
    productId: 'generic',
    author: 'Dr. Ahmed Hassan',
    rating: 5,
    content:
      'Excellent product — our clinic has been ordering this for months and it never disappoints. Consistent quality and fast delivery.',
    date: monthsAgo(1),
    verifiedPurchase: true,
    helpfulCount: 42,
  },
  {
    id: 'r-002',
    productId: 'generic',
    author: 'Sarah Mitchell',
    rating: 4,
    content:
      'Really good value for the price. Works exactly as described, packaging was secure. Would have liked a slightly larger size.',
    date: monthsAgo(2),
    verifiedPurchase: true,
    helpfulCount: 17,
  },
  {
    id: 'r-003',
    productId: 'generic',
    author: 'Dr. Youssef Khalil',
    rating: 5,
    content:
      'Our hygienists love it. Reliable supply, always in stock, and the volume pricing makes a real difference for the practice.',
    date: monthsAgo(3),
    verifiedPurchase: true,
    helpfulCount: 29,
  },
  {
    id: 'r-004',
    productId: 'generic',
    author: 'Emma Wilson',
    rating: 4,
    content:
      'Fast shipping and exactly as pictured. Delivery arrived in two days. Happy with the purchase overall.',
    date: monthsAgo(4),
    verifiedPurchase: true,
    helpfulCount: 8,
  },
  {
    id: 'r-005',
    productId: 'generic',
    author: 'Omar Farouk',
    rating: 3,
    content:
      'Decent product, but the box arrived slightly damaged. DentZone support resolved it quickly with a replacement though.',
    date: monthsAgo(5),
    verifiedPurchase: true,
    helpfulCount: 5,
  },
  {
    id: 'r-006',
    productId: 'generic',
    author: 'Layla Mansour',
    rating: 5,
    content:
      'Exactly what our dental lab needed. Great quality, great support, and the free shipping threshold is easy to reach.',
    date: monthsAgo(6),
    verifiedPurchase: false,
    helpfulCount: 12,
  },
]

const sonicareReviews: Review[] = [
  {
    id: 'r-101',
    productId: 'p-001',
    author: 'Dr. Nadia Salem',
    rating: 5,
    content:
      'We recommend the Diamond 9000 to every patient. Quiet, powerful, and the pressure sensor genuinely protects gum health.',
    date: monthsAgo(1),
    verifiedPurchase: true,
    helpfulCount: 61,
  },
  {
    id: 'r-102',
    productId: 'p-001',
    author: 'James Carter',
    rating: 5,
    content:
      'Upgraded from a manual brush two months ago — my dentist noticed the difference at the last check-up. Battery lasts weeks.',
    date: monthsAgo(2),
    verifiedPurchase: true,
    helpfulCount: 38,
  },
  {
    id: 'r-103',
    productId: 'p-001',
    author: 'Dr. Mona Adel',
    rating: 4,
    content:
      'Great brush overall. The travel case is a nice touch for conferences. Only wish the app showed more brushing history.',
    date: monthsAgo(3),
    verifiedPurchase: true,
    helpfulCount: 15,
  },
]

const whiteningReviews: Review[] = [
  {
    id: 'r-201',
    productId: 'p-002',
    author: 'Dr. Karim Abdelrahman',
    rating: 5,
    content:
      'Patients see visible results in the first week. The LED tray is comfortable and the sensitive formula is a thoughtful addition.',
    date: monthsAgo(1),
    verifiedPurchase: true,
    helpfulCount: 55,
  },
  {
    id: 'r-202',
    productId: 'p-002',
    author: 'Hana Mostafa',
    rating: 5,
    content:
      'Four shades brighter in two weeks, exactly as promised. No sensitivity at all thanks to the extra gel. Highly recommend.',
    date: monthsAgo(2),
    verifiedPurchase: true,
    helpfulCount: 33,
  },
  {
    id: 'r-203',
    productId: 'p-002',
    author: 'Robert Blake',
    rating: 4,
    content:
      'Solid kit — trays feel premium and instructions are clear. Took a little longer than 14 days for full results but I am happy.',
    date: monthsAgo(3),
    verifiedPurchase: true,
    helpfulCount: 9,
  },
]

const specificReviews: Record<string, Review[]> = {
  'p-001': sonicareReviews,
  'p-002': whiteningReviews,
}

export const getReviewsByProduct = (productId: string): Review[] =>
  specificReviews[productId] ?? genericReviews

export const distributionFor = (rating: number): RatingDistributionItem[] => {
  const highRated = rating >= 4.4
  const five = highRated ? 78 : 62
  const four = highRated ? 14 : 24
  const three = highRated ? 5 : 9
  const two = highRated ? 2 : 3
  const one = 100 - five - four - three - two
  return [5, 4, 3, 2, 1].map((stars) => {
    const percentage = stars === 5 ? five : stars === 4 ? four : stars === 3 ? three : stars === 2 ? two : one
    return { stars, percentage }
  })
}