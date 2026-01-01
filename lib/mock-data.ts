export interface ImageData {
  id: string
  url: string
  aspectRatio?: string
  caption?: string
  location?: string
  timestamp: string
  preset?: string
  category?: string
  user: {
    name: string
    username: string
    avatar: string
    bio?: string
    website?: string
    joinedDate?: string
    postsCount?: string
    followersCount?: string
    followingCount?: string
  }
}

export const categories = [
  { id: "all", label: "All" },
  { id: "portraits", label: "Portraits" },
  { id: "street", label: "Street" },
  { id: "nature", label: "Nature" },
  { id: "architecture", label: "Architecture" },
  { id: "fashion", label: "Fashion" },
  { id: "travel", label: "Travel" },
  { id: "minimal", label: "Minimal" },
]

export const presets = [
  {
    id: "a4",
    name: "A4",
    preview: "/placeholder.svg?height=200&width=200",
    filters: {
      exposure: 5,
      contrast: 10,
      saturation: -15,
      temperature: 15,
      grain: 10,
      fade: 5,
      vignette: 0,
      highlights: 0,
      shadows: 0,
    },
  },
  {
    id: "a6",
    name: "A6",
    preview: "/placeholder.svg?height=200&width=200",
    filters: {
      exposure: 10,
      contrast: 5,
      saturation: -20,
      temperature: 20,
      grain: 15,
      fade: 10,
      vignette: 10,
      highlights: 0,
      shadows: 0,
    },
  },
  {
    id: "c1",
    name: "C1",
    preview: "/placeholder.svg?height=200&width=200",
    filters: {
      exposure: 0,
      contrast: 15,
      saturation: -10,
      temperature: -10,
      grain: 5,
      fade: 0,
      vignette: 0,
      highlights: 0,
      shadows: 0,
    },
  },
  {
    id: "c3",
    name: "C3",
    preview: "/placeholder.svg?height=200&width=200",
    filters: {
      exposure: -5,
      contrast: 20,
      saturation: -25,
      temperature: -20,
      grain: 10,
      fade: 5,
      vignette: 15,
      highlights: 0,
      shadows: 0,
    },
  },
  {
    id: "m5",
    name: "M5",
    preview: "/placeholder.svg?height=200&width=200",
    filters: {
      exposure: -10,
      contrast: 25,
      saturation: -30,
      temperature: 5,
      grain: 20,
      fade: 15,
      vignette: 20,
      highlights: 0,
      shadows: 0,
    },
  },
  {
    id: "hb2",
    name: "HB2",
    preview: "/placeholder.svg?height=200&width=200",
    filters: {
      exposure: 5,
      contrast: 30,
      saturation: 10,
      temperature: 0,
      grain: 5,
      fade: 0,
      vignette: 10,
      highlights: 0,
      shadows: 0,
    },
  },
  {
    id: "kk1",
    name: "KK1",
    preview: "/placeholder.svg?height=200&width=200",
    filters: {
      exposure: 10,
      contrast: 5,
      saturation: 5,
      temperature: 10,
      grain: 25,
      fade: 10,
      vignette: 5,
      highlights: 0,
      shadows: 0,
    },
  },
  {
    id: "e5",
    name: "E5",
    preview: "/placeholder.svg?height=200&width=200",
    filters: {
      exposure: 5,
      contrast: 10,
      saturation: -10,
      temperature: 15,
      grain: 15,
      fade: 5,
      vignette: 0,
      highlights: 0,
      shadows: 0,
    },
  },
  {
    id: "bw1",
    name: "BW1",
    preview: "/placeholder.svg?height=200&width=200",
    filters: {
      exposure: 5,
      contrast: 30,
      saturation: -100,
      temperature: 0,
      grain: 20,
      fade: 5,
      vignette: 15,
      highlights: 0,
      shadows: 0,
    },
  },
]

export const userProfile = {
  name: "Alex Thompson",
  username: "alexthompson",
  avatar: "/placeholder.svg?height=200&width=200",
  bio: "Visual storyteller. Film & digital. Capturing moments that matter. Available for collaborations.",
  location: "Los Angeles, CA",
  website: "https://alexthompson.co",
  joinedDate: "March 2020",
  postsCount: "247",
  followersCount: "12.4K",
  followingCount: "892",
}

export const feedImages: ImageData[] = [
  {
    id: "1",
    url: "/moody-portrait-photography-with-film-grain--person.jpg",
    aspectRatio: "3/4",
    caption: "Golden hour wanderings through the city streets",
    location: "Brooklyn, NY",
    timestamp: "2 hours ago",
    preset: "A6",
    user: {
      name: "Sarah Chen",
      username: "sarahvisuals",
      avatar: "/woman-portrait-photographer-headshot.jpg",
    },
  },
  {
    id: "2",
    url: "/minimalist-architecture-photography--concrete-buil.jpg",
    aspectRatio: "4/3",
    caption: "Lines and light",
    timestamp: "4 hours ago",
    preset: "C1",
    user: {
      name: "Marcus Webb",
      username: "marcuswebb",
      avatar: "/man-portrait-creative-director-headshot.jpg",
    },
  },
  {
    id: "3",
    url: "/street-photography-at-night--neon-lights--cinemati.jpg",
    aspectRatio: "3/5",
    caption: "Neon dreams",
    location: "Tokyo, Japan",
    timestamp: "6 hours ago",
    preset: "HB2",
    user: {
      name: "Yuki Tanaka",
      username: "yukiframes",
      avatar: "/asian-woman-photographer-portrait.jpg",
    },
  },
  {
    id: "4",
    url: "/coffee-shop-interior-photography--warm-ambient-lig.jpg",
    aspectRatio: "1/1",
    caption: "Morning rituals",
    timestamp: "8 hours ago",
    preset: "M5",
    user: {
      name: "Emma Lewis",
      username: "emmalewis",
      avatar: "/woman-lifestyle-blogger-portrait.jpg",
    },
  },
  {
    id: "5",
    url: "/fashion-portrait-photography--model-in-vintage-clo.jpg",
    aspectRatio: "5/7",
    caption: "Vintage vibes",
    location: "Paris, France",
    timestamp: "12 hours ago",
    preset: "A4",
    user: {
      name: "Leo Martinez",
      username: "leomartinez",
      avatar: "/man-fashion-photographer-portrait.jpg",
    },
  },
  {
    id: "6",
    url: "/ocean-waves-landscape-photography--dramatic-sky--m.jpg",
    aspectRatio: "8/5",
    caption: "Where the ocean meets the sky",
    location: "Big Sur, CA",
    timestamp: "1 day ago",
    preset: "KK1",
    user: {
      name: "Alex Rivera",
      username: "alexrivera",
      avatar: "/person-landscape-photographer-portrait.jpg",
    },
  },
  {
    id: "7",
    url: "/film-photography-portrait-of-person-reading-book-i.jpg",
    aspectRatio: "3/4",
    caption: "Lost in pages",
    timestamp: "1 day ago",
    preset: "C3",
    user: {
      name: "Olivia Park",
      username: "oliviapark",
      avatar: "/korean-woman-portrait.png",
    },
  },
  {
    id: "8",
    url: "/desert-landscape-photography--minimalist-compositi.jpg",
    aspectRatio: "3/2",
    caption: "Endless horizons",
    location: "Joshua Tree, CA",
    timestamp: "2 days ago",
    preset: "E5",
    user: {
      name: "David Kim",
      username: "davidkim",
      avatar: "/asian-man-photographer.png",
    },
  },
]

export const discoverImages: ImageData[] = [
  {
    id: "d1",
    url: "/ethereal-portrait-photography-with-flowers--soft-f.jpg",
    aspectRatio: "3/4",
    caption: "Spring awakening",
    timestamp: "3 hours ago",
    category: "portraits",
    user: {
      name: "Nina Rose",
      username: "ninarose",
      avatar: "/placeholder.svg?height=100&width=100",
    },
  },
  {
    id: "d2",
    url: "/placeholder.svg?height=600&width=800",
    aspectRatio: "4/3",
    caption: "Concrete jungle",
    timestamp: "5 hours ago",
    category: "architecture",
    user: {
      name: "Tom Bradley",
      username: "tombradley",
      avatar: "/placeholder.svg?height=100&width=100",
    },
  },
  {
    id: "d3",
    url: "/placeholder.svg?height=700&width=500",
    aspectRatio: "5/7",
    caption: "City in motion",
    timestamp: "7 hours ago",
    category: "street",
    user: {
      name: "Maya Johnson",
      username: "mayajohnson",
      avatar: "/placeholder.svg?height=100&width=100",
    },
  },
  {
    id: "d4",
    url: "/placeholder.svg?height=600&width=600",
    aspectRatio: "1/1",
    caption: "Morning dew",
    timestamp: "10 hours ago",
    category: "nature",
    user: {
      name: "Lucas Green",
      username: "lucasgreen",
      avatar: "/placeholder.svg?height=100&width=100",
    },
  },
  {
    id: "d5",
    url: "/placeholder.svg?height=900&width=600",
    aspectRatio: "2/3",
    caption: "Shadow play",
    timestamp: "14 hours ago",
    category: "fashion",
    user: {
      name: "Sophie Turner",
      username: "sophieturner",
      avatar: "/placeholder.svg?height=100&width=100",
    },
  },
  {
    id: "d6",
    url: "/placeholder.svg?height=500&width=800",
    aspectRatio: "8/5",
    caption: "Into the mist",
    timestamp: "1 day ago",
    category: "travel",
    user: {
      name: "James Wright",
      username: "jameswright",
      avatar: "/placeholder.svg?height=100&width=100",
    },
  },
  {
    id: "d7",
    url: "/placeholder.svg?height=800&width=600",
    aspectRatio: "3/4",
    caption: "Genuine moments",
    timestamp: "1 day ago",
    category: "portraits",
    user: {
      name: "Rachel Adams",
      username: "racheladams",
      avatar: "/placeholder.svg?height=100&width=100",
    },
  },
  {
    id: "d8",
    url: "/placeholder.svg?height=600&width=900",
    aspectRatio: "3/2",
    caption: "City nights",
    timestamp: "2 days ago",
    category: "street",
    user: {
      name: "Chris Evans",
      username: "chrisevans",
      avatar: "/placeholder.svg?height=100&width=100",
    },
  },
  {
    id: "d9",
    url: "/placeholder.svg?height=700&width=700",
    aspectRatio: "1/1",
    caption: "Less is more",
    timestamp: "2 days ago",
    category: "minimal",
    user: {
      name: "Anna White",
      username: "annawhite",
      avatar: "/placeholder.svg?height=100&width=100",
    },
  },
  {
    id: "d10",
    url: "/placeholder.svg?height=600&width=800",
    aspectRatio: "4/3",
    caption: "Stories untold",
    timestamp: "3 days ago",
    category: "street",
    user: {
      name: "Michael Brown",
      username: "michaelbrown",
      avatar: "/placeholder.svg?height=100&width=100",
    },
  },
]

export const userImages: ImageData[] = [
  ...feedImages.slice(0, 4).map((img) => ({
    ...img,
    id: `user-${img.id}`,
    user: {
      ...userProfile,
      name: img.user.name,
      username: img.user.username,
      avatar: img.user.avatar,
    },
  })),
  {
    id: "user-5",
    url: "/placeholder.svg?height=600&width=600",
    aspectRatio: "1/1",
    caption: "Self reflection",
    timestamp: "1 week ago",
    preset: "A6",
    user: userProfile,
  },
  {
    id: "user-6",
    url: "/placeholder.svg?height=600&width=600",
    aspectRatio: "1/1",
    caption: "BTS",
    timestamp: "2 weeks ago",
    user: userProfile,
  },
  {
    id: "user-7",
    url: "/placeholder.svg?height=600&width=600",
    aspectRatio: "1/1",
    caption: "Tools of the trade",
    timestamp: "2 weeks ago",
    preset: "M5",
    user: userProfile,
  },
  {
    id: "user-8",
    url: "/placeholder.svg?height=600&width=600",
    aspectRatio: "1/1",
    caption: "Into the woods",
    timestamp: "3 weeks ago",
    preset: "KK1",
    user: userProfile,
  },
  {
    id: "user-9",
    url: "/placeholder.svg?height=600&width=600",
    aspectRatio: "1/1",
    caption: "Abstract thoughts",
    timestamp: "1 month ago",
    user: userProfile,
  },
]
