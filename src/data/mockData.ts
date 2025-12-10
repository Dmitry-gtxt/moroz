import { PerformerProfile, District, Review, AvailabilitySlot } from '@/types';

// District groups for UI filtering
export const districtGroups = {
  samara: {
    label: 'Самара',
    districts: [
      { id: '1', name: 'Ленинский', slug: 'samara-leninsky' },
      { id: '2', name: 'Самарский', slug: 'samara-samarsky' },
      { id: '3', name: 'Октябрьский', slug: 'samara-oktyabrsky' },
      { id: '4', name: 'Железнодорожный', slug: 'samara-zheleznodorozhny' },
      { id: '5', name: 'Промышленный', slug: 'samara-promyshlenny' },
      { id: '6', name: 'Советский', slug: 'samara-sovetsky' },
      { id: '7', name: 'Кировский', slug: 'samara-kirovsky' },
      { id: '8', name: 'Красноглинский', slug: 'samara-krasnoglinsky' },
      { id: '9', name: 'Куйбышевский', slug: 'samara-kuibyshevsky' },
    ],
  },
  tolyatti: {
    label: 'Тольятти',
    districts: [
      { id: '10', name: 'Автозаводский', slug: 'tolyatti-avtozavodsky' },
      { id: '11', name: 'Центральный', slug: 'tolyatti-centralny' },
      { id: '12', name: 'Комсомольский', slug: 'tolyatti-komsomolsky' },
    ],
  },
  cities: {
    label: 'Другие города',
    districts: [
      { id: '13', name: 'Сызрань', slug: 'syzran' },
      { id: '14', name: 'Новокуйбышевск', slug: 'novokuybyshevsk' },
      { id: '15', name: 'Чапаевск', slug: 'chapaevsk' },
      { id: '16', name: 'Жигулёвск', slug: 'zhigulyovsk' },
      { id: '17', name: 'Отрадный', slug: 'otradny' },
      { id: '18', name: 'Кинель', slug: 'kinel' },
      { id: '19', name: 'Похвистнево', slug: 'pohvistnevo' },
      { id: '20', name: 'Октябрьск', slug: 'oktyabrsk' },
    ],
  },
  oblastRayons: {
    label: 'Районы области',
    districts: [
      { id: '21', name: 'Волжский район', slug: 'rayon-volzhsky' },
      { id: '22', name: 'Красноярский район', slug: 'rayon-krasnoyarsky' },
      { id: '23', name: 'Ставропольский район', slug: 'rayon-stavropolsky' },
      { id: '24', name: 'Кинельский район', slug: 'rayon-kinelsky' },
      { id: '25', name: 'Безенчукский район', slug: 'rayon-bezenchuksky' },
      { id: '26', name: 'Борский район', slug: 'rayon-borsky' },
      { id: '27', name: 'Богатовский район', slug: 'rayon-bogatovsky' },
      { id: '28', name: 'Большеглушицкий район', slug: 'rayon-bolsheglushitsky' },
      { id: '29', name: 'Большечерниговский район', slug: 'rayon-bolshechernigovsky' },
      { id: '30', name: 'Исаклинский район', slug: 'rayon-isaklinsky' },
      { id: '31', name: 'Камышлинский район', slug: 'rayon-kamyshlinsky' },
      { id: '32', name: 'Клявлинский район', slug: 'rayon-klyavlinsky' },
      { id: '33', name: 'Кошкинский район', slug: 'rayon-koshkinsky' },
      { id: '34', name: 'Нефтегорский район', slug: 'rayon-neftegorsky' },
      { id: '35', name: 'Пестравский район', slug: 'rayon-pestravsky' },
      { id: '36', name: 'Приволжский район', slug: 'rayon-privolzhsky' },
      { id: '37', name: 'Сергиевский район', slug: 'rayon-sergievsky' },
      { id: '38', name: 'Хворостянский район', slug: 'rayon-hvorostyansky' },
      { id: '39', name: 'Шенталинский район', slug: 'rayon-shentalinsky' },
      { id: '40', name: 'Шигонский район', slug: 'rayon-shigonsky' },
      { id: '41', name: 'Алексеевский район', slug: 'rayon-alekseevsky' },
    ],
  },
};

// Flat array for backward compatibility
export const districts: District[] = [
  ...districtGroups.samara.districts,
  ...districtGroups.tolyatti.districts,
  ...districtGroups.cities.districts,
  ...districtGroups.oblastRayons.districts,
];

export const mockPerformers: PerformerProfile[] = [
  {
    id: '1',
    userId: 'u1',
    displayName: 'Дед Мороз Николай',
    type: ['ded_moroz'],
    photoUrls: ['https://images.unsplash.com/photo-1576919228236-a097c32a5cd4?w=400&h=400&fit=crop'],
    basePrice: 3000,
    priceFrom: 3000,
    priceTo: 5000,
    experienceYears: 8,
    age: 45,
    description: 'Профессиональный Дед Мороз с 8-летним опытом. Классический образ, богатый костюм, настоящая борода. Работаю с детьми всех возрастов. Привожу подарки, провожу игры и конкурсы.',
    costumeStyle: 'Классический русский',
    formats: ['home', 'kindergarten', 'school', 'corporate'],
    districts: ['samara-leninsky', 'samara-oktyabrsky'],
    videoGreetingUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    verificationStatus: 'verified',
    ratingAverage: 4.9,
    ratingCount: 127,
    isActive: true,
    commissionRate: 0.15,
    createdAt: '2024-01-15',
    updatedAt: '2024-12-01',
  },
  {
    id: '2',
    userId: 'u2',
    displayName: 'Снегурочка Алина',
    type: ['snegurochka'],
    photoUrls: ['https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop'],
    basePrice: 2500,
    priceFrom: 2500,
    priceTo: 4000,
    experienceYears: 5,
    age: 28,
    description: 'Добрая и весёлая Снегурочка! Люблю детей и праздники. Пою песни, танцую, провожу новогодние игры. Красивый костюм с блёстками.',
    costumeStyle: 'Сказочный с блёстками',
    formats: ['home', 'kindergarten', 'school'],
    districts: ['samara-promyshlenny', 'samara-sovetsky'],
    verificationStatus: 'verified',
    ratingAverage: 4.8,
    ratingCount: 89,
    isActive: true,
    commissionRate: 0.15,
    createdAt: '2024-02-20',
    updatedAt: '2024-12-01',
  },
  {
    id: '3',
    userId: 'u3',
    displayName: 'Дед Мороз и Снегурочка — Дуэт "Сказка"',
    type: ['duo'],
    photoUrls: ['https://images.unsplash.com/photo-1512389142860-9c449e58a814?w=400&h=400&fit=crop'],
    basePrice: 5000,
    priceFrom: 5000,
    priceTo: 8000,
    experienceYears: 10,
    description: 'Профессиональный дуэт: Дед Мороз и Снегурочка. 10 лет работаем вместе. Полная программа с играми, песнями, хороводом вокруг ёлки. Идеально для больших компаний и корпоративов.',
    costumeStyle: 'Премиум-класс',
    formats: ['home', 'kindergarten', 'school', 'office', 'corporate', 'outdoor'],
    districts: ['samara-leninsky', 'samara-oktyabrsky', 'samara-promyshlenny', 'tolyatti-avtozavodsky'],
    videoGreetingUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    verificationStatus: 'verified',
    ratingAverage: 5.0,
    ratingCount: 203,
    isActive: true,
    commissionRate: 0.12,
    createdAt: '2023-11-01',
    updatedAt: '2024-12-01',
  },
  {
    id: '4',
    userId: 'u4',
    displayName: 'Санта-Клаус Майкл',
    type: ['santa'],
    photoUrls: ['https://images.unsplash.com/photo-1545239705-1564e58b9e4a?w=400&h=400&fit=crop'],
    basePrice: 4000,
    priceFrom: 4000,
    priceTo: 6000,
    experienceYears: 6,
    age: 50,
    description: 'Настоящий американский Санта-Клаус! Программа на русском и английском языках. Идеально для семей, где дети учат английский. Ho-ho-ho!',
    costumeStyle: 'Американский Санта',
    formats: ['home', 'school', 'corporate'],
    districts: ['tolyatti-centralny', 'tolyatti-komsomolsky'],
    verificationStatus: 'verified',
    ratingAverage: 4.7,
    ratingCount: 56,
    isActive: true,
    commissionRate: 0.15,
    createdAt: '2024-03-10',
    updatedAt: '2024-12-01',
  },
  {
    id: '5',
    userId: 'u5',
    displayName: 'Дед Мороз Тимур',
    type: ['ded_moroz'],
    photoUrls: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'],
    basePrice: 2000,
    priceFrom: 2000,
    priceTo: 3500,
    experienceYears: 3,
    age: 35,
    description: 'Молодой и энергичный Дед Мороз. Современная программа с любимыми песнями детей. Доступные цены!',
    costumeStyle: 'Современный',
    formats: ['home', 'kindergarten'],
    districts: ['syzran', 'novokuybyshevsk'],
    verificationStatus: 'verified',
    ratingAverage: 4.5,
    ratingCount: 34,
    isActive: true,
    commissionRate: 0.15,
    createdAt: '2024-10-01',
    updatedAt: '2024-12-01',
  },
  {
    id: '6',
    userId: 'u6',
    displayName: 'Снегурочка Мария',
    type: ['snegurochka'],
    photoUrls: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'],
    basePrice: 2800,
    priceFrom: 2800,
    priceTo: 4500,
    experienceYears: 7,
    age: 32,
    description: 'Снегурочка с музыкальным образованием. Пою живым голосом, играю на гитаре. Авторская программа с новогодними песнями.',
    costumeStyle: 'Элегантный голубой',
    formats: ['home', 'kindergarten', 'school', 'corporate'],
    districts: ['samara-kirovsky', 'samara-krasnoglinsky', 'samara-kuibyshevsky'],
    videoGreetingUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    verificationStatus: 'verified',
    ratingAverage: 4.9,
    ratingCount: 98,
    isActive: true,
    commissionRate: 0.15,
    createdAt: '2024-01-05',
    updatedAt: '2024-12-01',
  },
];

export const mockReviews: Review[] = [
  {
    id: 'r1',
    bookingId: 'b1',
    customerId: 'c1',
    performerId: '1',
    rating: 5,
    text: 'Замечательный Дед Мороз! Дети были в восторге, не хотели отпускать. Обязательно закажем снова!',
    createdAt: '2024-01-05',
    isVisible: true,
    customerName: 'Анна М.',
  },
  {
    id: 'r2',
    bookingId: 'b2',
    customerId: 'c2',
    performerId: '1',
    rating: 5,
    text: 'Профессионал своего дела. Пришёл вовремя, программа была продумана до мелочей.',
    createdAt: '2024-01-10',
    isVisible: true,
    customerName: 'Сергей К.',
  },
  {
    id: 'r3',
    bookingId: 'b3',
    customerId: 'c3',
    performerId: '2',
    rating: 5,
    text: 'Снегурочка Алина — просто чудо! Дочка до сих пор вспоминает и просит позвать её снова.',
    createdAt: '2024-01-08',
    isVisible: true,
    customerName: 'Дмитрий Т.',
  },
  {
    id: 'r4',
    bookingId: 'b4',
    customerId: 'c4',
    performerId: '3',
    rating: 5,
    text: 'Заказывали дуэт на корпоратив. Все коллеги были в восторге! Профессиональная команда.',
    createdAt: '2024-01-12',
    isVisible: true,
    customerName: 'Компания "ТехноПлюс"',
  },
];

// Generate availability slots for the next 30 days
export const generateMockSlots = (performerId: string): AvailabilitySlot[] => {
  const slots: AvailabilitySlot[] = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Morning slot
    if (Math.random() > 0.3) {
      slots.push({
        id: `${performerId}-${dateStr}-morning`,
        performerId,
        date: dateStr,
        startTime: '10:00',
        endTime: '12:00',
        status: Math.random() > 0.7 ? 'booked' : 'free',
      });
    }
    
    // Afternoon slot
    if (Math.random() > 0.3) {
      slots.push({
        id: `${performerId}-${dateStr}-afternoon`,
        performerId,
        date: dateStr,
        startTime: '14:00',
        endTime: '16:00',
        status: Math.random() > 0.7 ? 'booked' : 'free',
      });
    }
    
    // Evening slot
    if (Math.random() > 0.2) {
      slots.push({
        id: `${performerId}-${dateStr}-evening`,
        performerId,
        date: dateStr,
        startTime: '18:00',
        endTime: '20:00',
        status: Math.random() > 0.6 ? 'booked' : 'free',
      });
    }
  }
  
  return slots;
};
