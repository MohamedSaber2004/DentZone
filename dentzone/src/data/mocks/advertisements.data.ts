import type { Advertisement } from '../../domain/models/advertisement'
import type { Locale } from '../../i18n'

export const advertisements: Record<Locale, { hero: Advertisement; secondary: Advertisement[] }> = {
  en: {
    hero: {
      id: 'ad-whitening-hero',
      eyebrow: 'Limited offer',
      title: 'Whitening systems — 25% off bulk orders',
      description:
        'Stock your clinic with professional LED whitening systems at volume pricing. Clinically tested kits, delivered in 24–48h.',
      image: '/products/p-002.svg',
      ctaLabel: 'View the offer',
      ctaTo: '/catalog?category=cat-whitening',
      theme: 'dark',
    },
    secondary: [
      {
        id: 'ad-free-shipping',
        eyebrow: 'Free shipping',
        title: 'Free shipping on orders over $50',
        description: 'Plus a 30-day guarantee on every order for your practice. No questions asked, ever.',
        image: '/products/p-014.svg',
        ctaLabel: 'Start ordering',
        ctaTo: '/catalog',
        theme: 'gold',
      },
      {
        id: 'ad-clinic-essentials',
        eyebrow: 'Clinic essentials',
        title: 'Bestsellers your clinic reorders',
        description: 'Sonic brushes, pastes and rinses chosen by 2,000+ dental practices across the region.',
        image: '/products/p-001.svg',
        ctaLabel: 'Shop bestsellers',
        ctaTo: '/catalog?sort=rating',
        theme: 'light',
      },
    ],
  },
  ar: {
    hero: {
      id: 'ad-whitening-hero',
      eyebrow: 'عرض لفترة محدودة',
      title: 'أنظمة التبييض — خصم 25% على الطلبات بالجملة',
      description:
        'جهّز عيادتك بأنظمة تبييض LED احترافية بأسعار الجملة. مجموعات مختبَرة سريريًا، تُوصَّل خلال 24–48 ساعة.',
      image: '/products/p-002.svg',
      ctaLabel: 'اطّلع على العرض',
      ctaTo: '/catalog?category=cat-whitening',
      theme: 'dark',
    },
    secondary: [
      {
        id: 'ad-free-shipping',
        eyebrow: 'شحن مجاني',
        title: 'شحن مجاني للطلبات فوق $50',
        description: 'بالإضافة إلى ضمان 30 يومًا على كل طلب لممارستك. دون أي أسئلة، أبدًا.',
        image: '/products/p-014.svg',
        ctaLabel: 'ابدأ الطلب',
        ctaTo: '/catalog',
        theme: 'gold',
      },
      {
        id: 'ad-clinic-essentials',
        eyebrow: 'أساسيات العيادة',
        title: 'الأكثر مبيعًا التي تعيد عيادتك طلبها',
        description: 'فرش صوتية ومعاجين وغسولات اختارتها أكثر من 2,000 عيادة أسنان في المنطقة.',
        image: '/products/p-001.svg',
        ctaLabel: 'تسوق الأكثر مبيعًا',
        ctaTo: '/catalog?sort=rating',
        theme: 'light',
      },
    ],
  },
}