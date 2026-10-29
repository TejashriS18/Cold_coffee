/**
 * FROST & BEAN Customer Reviews Configuration
 * All sample demonstration data is explicitly labeled in accordance with consumer transparency guidelines.
 */

export interface CustomerReview {
  id: string;
  authorName: string;
  location: string;
  rating: number; // 1 to 5
  date: string;
  favoriteDrink: string;
  comment: string;
  avatarInitials: string;
  tastingTag: string;
  isDemo: boolean; // Explicit flag identifying demonstration content
}

export const SAMPLE_DEMONSTRATION_REVIEWS: CustomerReview[] = [
  {
    id: "demo-rev-1",
    authorName: "Ananya Deshmukh",
    location: "Koramangala, Bengaluru",
    rating: 5,
    date: "2026-10-12",
    favoriteDrink: "Classic Chill (Large, Oat Milk)",
    comment:
      "The cold extraction here is noticeably smoother than standard iced lattes. Zero acidity, rich chocolate undertones, and the oat milk pairing is silky. Hands down my daily work fuel.",
    avatarInitials: "AD",
    tastingTag: "Silky & Low Acid",
    isDemo: true,
  },
  {
    id: "demo-rev-2",
    authorName: "Vikram Malhotra",
    location: "Bandra West, Mumbai",
    rating: 5,
    date: "2026-10-08",
    favoriteDrink: "Choco Mocha (Extra Espresso Shot)",
    comment:
      "Arrived in an insulated ice bag still frosty and cold. Real Belgian cocoa blend instead of sweet syrup makes a massive difference. The extra cold espresso shot gives the perfect kick.",
    avatarInitials: "VM",
    tastingTag: "Dark Cocoa & Robust",
    isDemo: true,
  },
  {
    id: "demo-rev-3",
    authorName: "Priyanka Nair",
    location: "Indiranagar, Bengaluru",
    rating: 5,
    date: "2026-10-02",
    favoriteDrink: "Caramel Bliss (Less Sweet)",
    comment:
      "The balance of salted caramel drizzle with slow-steeped Arabica is exquisite. Being able to dial sweetness down to 'Less' makes it taste like a high-end specialty café cup.",
    avatarInitials: "PN",
    tastingTag: "Artisanal Caramel",
    isDemo: true,
  },
  {
    id: "demo-rev-4",
    authorName: "Kabir Sen",
    location: "Jubilee Hills, Hyderabad",
    rating: 4,
    date: "2026-09-27",
    favoriteDrink: "Hazelnut Heaven (Regular)",
    comment:
      "Roasted hazelnut aroma is intoxicating. The dense cold brew retains its bold profile without getting watery even after 30 minutes on my desk.",
    avatarInitials: "KS",
    tastingTag: "Toasted Hazelnut",
    isDemo: true,
  },
];
