export interface Review {
  id: string
  productId: string
  author: string
  rating: number
  content: string
  date: string
  verifiedPurchase: boolean
  helpfulCount: number
}

export interface RatingDistributionItem {
  stars: number
  percentage: number
}