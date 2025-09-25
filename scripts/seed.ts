import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data (optional - uncomment if you want to reset)
    await clearData();

    // Seed authors
    console.log('📚 Seeding authors...');
    await seedAuthors();

    // Seed categories
    console.log('📂 Seeding categories...');
    await seedCategories();

    // Seed books
    console.log('📖 Seeding books...');
    await seedBooks();

    // Seed podcasts
    console.log('🎧 Seeding podcasts...');
    await seedPodcasts();

    // Seed users
    console.log('👤 Seeding users...');
    await seedUsers();

    // Seed pages
    console.log('📄 Seeding pages...');
    await seedPages();

    console.log('✅ Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function clearData() {
  console.log('🧹 Clearing existing data...');

  await prisma.$transaction([
    prisma.bookMark.deleteMany(),
    prisma.userProgress.deleteMany(),
    prisma.userPreferences.deleteMany(),
    prisma.user.deleteMany(),
    prisma.translatedSummary.deleteMany(),
    prisma.summary.deleteMany(),
    prisma.translatedBook.deleteMany(),
    prisma.book.deleteMany(),
    prisma.translatedPodcast.deleteMany(),
    prisma.podcast.deleteMany(),
    prisma.translatedPodcastCollection.deleteMany(),
    prisma.podcastCollection.deleteMany(),
    prisma.translatedAuthor.deleteMany(),
    prisma.author.deleteMany(),
    prisma.translatedCategory.deleteMany(),
    prisma.category.deleteMany(),
    prisma.dynamicPageBlock.deleteMany(),
    prisma.dynamicPage.deleteMany(),
  ]);
}

async function seedAuthors() {
  console.log('📝 Generating authors...');
  const authors = [];

  // Generate 50 authors
  for (let i = 1; i <= 50; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName}`;
    const title = faker.helpers.arrayElement(['Dr.', 'Prof.', 'Mr.', 'Ms.', 'Mrs.']);
    const displayName = `${title} ${fullName}`;

    // Generate expertise areas
    const expertiseAreas = [
      'psychology', 'leadership', 'business', 'neuroscience', 'productivity',
      'mindfulness', 'entrepreneurship', 'cognitive science', 'behavioral economics',
      'organizational psychology', 'positive psychology', 'clinical psychology',
      'sports psychology', 'educational psychology', 'social psychology'
    ];
    const expertise = faker.helpers.arrayElements(expertiseAreas, { min: 1, max: 3 });

    authors.push({
      id: `author-${i}`,
      name: displayName,
      imageUrl: `https://images.unsplash.com/photo-${faker.string.numeric(10)}?w=400&h=400&fit=crop&crop=face`,
      translations: [
        {
          name: displayName,
          description: `${displayName} is a renowned expert in ${expertise.join(' and ')} with extensive experience in research and practice.`,
          language: 'en'
        },
        {
          name: `${title === 'Dr.' ? 'डॉ.' : title === 'Prof.' ? 'प्रोफेसर' : fullName} ${firstName} ${lastName}`,
          description: `${displayName} ${expertise.join(' और ')} में प्रसिद्ध विशेषज्ञ हैं जिनके पास शोध और अभ्यास में व्यापक अनुभव है।`,
          language: 'hi'
        },
        {
          name: displayName,
          description: `${displayName} adalah ahli terkenal dalam ${expertise.join(' dan ')} dengan pengalaman ekstensif dalam penelitian dan praktik.`,
          language: 'id'
        },
        {
          name: displayName,
          description: `${displayName} خبير مشهور في ${expertise.join(' و ')} ولديه خبرة واسعة في البحث والممارسة.`,
          language: 'ar'
        }
      ]
    });
  }

  console.log(`📚 Creating ${authors.length} authors...`);
  for (const authorData of authors) {
    await prisma.author.create({
      data: {
        id: authorData.id,
        name: authorData.name,
        imageUrl: authorData.imageUrl,
        translations: {
          create: authorData.translations
        }
      }
    });
  }
}

async function seedCategories() {
  console.log('📂 Generating categories...');
  const categories = [];
  const usedSlugs = new Set<string>();

  // Predefined category data with translations
  const categoryTemplates = [
    {
      name: 'Psychology',
      slug: 'psychology',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"></path><path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path><path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path></svg>',
      translations: {
        en: { name: 'Psychology', description: 'Explore the human mind and behavior' },
        hi: { name: 'मनोविज्ञान', description: 'मनुष्य की मानसिकता और व्यवहार का अध्ययन करें' },
        id: { name: 'Psikologi', description: 'Jelajahi pikiran dan perilaku manusia' },
        ar: { name: 'علم النفس', description: 'استكشف العقل والسلوك البشري' }
      }
    },
    {
      name: 'Leadership',
      slug: 'leadership',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 2l-1 3-3-1 1 3-3 1 3 1-1 3 1-3 3 1-3-1 1-3z"></path></svg>',
      translations: {
        en: { name: 'Leadership', description: 'Develop your leadership skills and influence' },
        hi: { name: 'नेतृत्व', description: 'अपनी नेतृत्व कौशल और प्रभाव विकसित करें' },
        id: { name: 'Kepemimpinan', description: 'Kembangkan keterampilan kepemimpinan dan pengaruh Anda' },
        ar: { name: 'القيادة', description: 'طور مهاراتك في القيادة والتأثير' }
      }
    },
    {
      name: 'Productivity',
      slug: 'productivity',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>',
      translations: {
        en: { name: 'Productivity', description: 'Master time management and efficiency' },
        hi: { name: 'उत्पादकता', description: 'समय प्रबंधन और दक्षता में महारत हासिल करें' },
        id: { name: 'Produktivitas', description: 'Kuasi manajemen waktu dan efisiensi' },
        ar: { name: 'الإنتاجية', description: 'إتقان إدارة الوقت والكفاءة' }
      }
    },
    {
      name: 'Mindfulness',
      slug: 'mindfulness',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M12 6v6l4 2"></path></svg>',
      translations: {
        en: { name: 'Mindfulness', description: 'Cultivate presence and mental wellness' },
        hi: { name: 'माइंडफुलनेस', description: 'उपस्थिति और मानसिक कल्याण को विकसित करें' },
        id: { name: 'Mindfulness', description: 'Kembangkan kehadiran dan kesejahteraan mental' },
        ar: { name: 'اليقظة الذهنية', description: 'زرع الحضور والصحة النفسية' }
      }
    },
    {
      name: 'Business',
      slug: 'business',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
      translations: {
        en: { name: 'Business', description: 'Strategic thinking and entrepreneurial success' },
        hi: { name: 'व्यापार', description: 'रणनीतिक सोच और उद्यमी सफलता' },
        id: { name: 'Bisnis', description: 'Berpikir strategis dan kesuksesan kewirausahaan' },
        ar: { name: 'الأعمال', description: 'التفكير الاستراتيجي والنجاح الريادي' }
      }
    }
  ];

  // Add the predefined categories
  categoryTemplates.forEach((template, index) => {
    usedSlugs.add(template.slug);
    categories.push({
      id: `cat-${index + 1}`,
      name: template.name,
      slug: template.slug,
      categorySVG: template.svg,
      categoryImage: `https://images.unsplash.com/photo-${faker.string.numeric(10)}?w=400&h=300&fit=crop`,
      translations: [
        { name: template.translations.en.name, description: template.translations.en.description, language: 'en' },
        { name: template.translations.hi.name, description: template.translations.hi.description, language: 'hi' },
        { name: template.translations.id.name, description: template.translations.id.description, language: 'id' },
        { name: template.translations.ar.name, description: template.translations.ar.description, language: 'ar' }
      ]
    });
  });

  // Generate additional categories
  const additionalCategories = [
    'Entrepreneurship', 'Finance', 'Marketing', 'Technology', 'Health', 'Education',
    'Communication', 'Creativity', 'Innovation', 'Strategy', 'Management', 'Motivation',
    'Success', 'Personal Development', 'Career', 'Relationships', 'Happiness', 'Wellness'
  ];

  let categoryIndex = 6;
  while (categories.length < 25) {
    const categoryName = faker.helpers.arrayElement(additionalCategories);
    let slug = faker.helpers.slugify(categoryName).toLowerCase();

    // Ensure unique slug
    let counter = 1;
    let originalSlug = slug;
    while (usedSlugs.has(slug)) {
      slug = `${originalSlug}-${counter}`;
      counter++;
    }
    usedSlugs.add(slug);

    categories.push({
      id: `cat-${categoryIndex}`,
      name: categoryName,
      slug: slug,
      categorySVG: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>',
      categoryImage: `https://images.unsplash.com/photo-${faker.string.numeric(10)}?w=400&h=300&fit=crop`,
      translations: [
        { name: categoryName, description: `Explore ${categoryName.toLowerCase()} and its impact on personal and professional growth`, language: 'en' },
        { name: categoryName, description: `${categoryName} और इसकी व्यक्तिगत और व्यावसायिक विकास पर प्रभाव का अध्ययन करें`, language: 'hi' },
        { name: categoryName, description: `Jelajahi ${categoryName.toLowerCase()} dan dampaknya terhadap pertumbuhan pribadi dan profesional`, language: 'id' },
        { name: categoryName, description: `استكشف ${categoryName.toLowerCase()} وتأثيره على النمو الشخصي والمهني`, language: 'ar' }
      ]
    });
    categoryIndex++;
  }

  console.log(`📂 Creating ${categories.length} categories...`);
  for (const categoryData of categories) {
    await prisma.category.create({
      data: {
        id: categoryData.id,
        name: categoryData.name,
        slug: categoryData.slug,
        categorySVG: categoryData.categorySVG,
        categoryImage: categoryData.categoryImage,
        translations: {
          create: categoryData.translations
        }
      }
    });
  }
}

async function seedBooks() {
  console.log('📖 Generating books...');
  const books = [];
  const usedSlugs = new Set<string>();

  // Generate 200 books
  for (let i = 1; i <= 200; i++) {
    // Generate book title and metadata
    const bookThemes = [
      'habits', 'leadership', 'success', 'mindfulness', 'productivity', 'psychology',
      'business', 'finance', 'innovation', 'creativity', 'communication', 'motivation',
      'strategy', 'entrepreneurship', 'personal development', 'relationships',
      'health', 'wellness', 'education', 'technology', 'marketing', 'sales'
    ];

    const adjectives = ['Atomic', 'Essential', 'Powerful', 'Ultimate', 'Complete', 'Master', 'Advanced', 'Practical', 'Strategic', 'Transformative'];
    const nouns = ['Guide', 'Handbook', 'Principles', 'Strategies', 'Secrets', 'Blueprint', 'Mastery', 'Journey', 'Path', 'Keys'];

    const adjective = faker.helpers.arrayElement(adjectives);
    const theme = faker.helpers.arrayElement(bookThemes);
    const noun = faker.helpers.arrayElement(nouns);

    const englishTitle = `${adjective} ${theme.charAt(0).toUpperCase() + theme.slice(1)} ${noun}`;

    // Generate unique slug
    let slug = faker.helpers.slugify(englishTitle).toLowerCase();
    let counter = 1;
    let originalSlug = slug;
    while (usedSlugs.has(slug)) {
      slug = `${originalSlug}-${counter}`;
      counter++;
    }
    usedSlugs.add(slug);

    // Generate author and category assignments
    const numAuthors = faker.number.int({ min: 1, max: 3 });
    const authors = faker.helpers.arrayElements(
      Array.from({ length: 50 }, (_, idx) => `author-${idx + 1}`),
      numAuthors
    );

    const numCategories = faker.number.int({ min: 1, max: 3 });
    const categories = faker.helpers.arrayElements(
      Array.from({ length: 25 }, (_, idx) => `cat-${idx + 1}`),
      numCategories
    );

    // Generate translations
    const hindiTitle = `${adjective} ${theme} ${noun}`; // Simplified for demo
    const indonesianTitle = englishTitle; // Keep English for demo
    const arabicTitle = englishTitle; // Keep English for demo

    books.push({
      id: `book-${i}`,
      title: englishTitle,
      slug: slug,
      totalDuration: faker.number.int({ min: 180, max: 720 }), // 3-12 hours
      authors: authors,
      categories: categories,
      translations: [
        {
          title: englishTitle,
          description: `A comprehensive exploration of ${theme} principles and practices that can transform your life and career.`,
          language: 'en',
          published: faker.datatype.boolean(),
          audioEnabled: faker.datatype.boolean(),
          coverUrl: `https://images.unsplash.com/photo-${faker.string.numeric(10)}?w=400&h=600&fit=crop`
        },
        {
          title: hindiTitle,
          description: `${theme} के सिद्धांतों और प्रथाओं का व्यापक अध्ययन जो आपके जीवन और करियर को बदल सकता है।`,
          language: 'hi',
          published: faker.datatype.boolean(),
          audioEnabled: faker.datatype.boolean(),
          coverUrl: `https://images.unsplash.com/photo-${faker.string.numeric(10)}?w=400&h=600&fit=crop`
        },
        {
          title: indonesianTitle,
          description: `Eksplorasi komprehensif tentang prinsip dan praktik ${theme} yang dapat mengubah hidup dan karir Anda.`,
          language: 'id',
          published: faker.datatype.boolean(),
          audioEnabled: faker.datatype.boolean(),
          coverUrl: `https://images.unsplash.com/photo-${faker.string.numeric(10)}?w=400&h=600&fit=crop`
        },
        {
          title: arabicTitle,
          description: `استكشاف شامل لمبادئ وممارسات ${theme} التي يمكن أن تغير حياتك ومهنتك.`,
          language: 'ar',
          published: faker.datatype.boolean(),
          audioEnabled: faker.datatype.boolean(),
          coverUrl: `https://images.unsplash.com/photo-${faker.string.numeric(10)}?w=400&h=600&fit=crop`
        }
      ]
    });
  }

  console.log(`📚 Creating ${books.length} books...`);
  // Create books in batches to avoid memory issues
  const batchSize = 20;
  for (let i = 0; i < books.length; i += batchSize) {
    const batch = books.slice(i, i + batchSize);
    console.log(`Creating books ${i + 1}-${Math.min(i + batchSize, books.length)}...`);

    for (const bookData of batch) {
      await prisma.book.create({
        data: {
          id: bookData.id,
          title: bookData.title,
          slug: bookData.slug,
          totalDuration: bookData.totalDuration,
          authors: {
            connect: bookData.authors.map(id => ({ id }))
          },
          categories: {
            connect: bookData.categories.map(id => ({ id }))
          },
          translations: {
            create: bookData.translations
          }
        }
      });
    }
  }
}

async function seedPodcasts() {
  console.log('🎧 Generating podcasts...');

  // First create podcast collections (15 collections)
  const collections = [];
  const usedCollectionSlugs = new Set<string>();
  const collectionThemes = [
    'Business Insights', 'Tech Talks', 'Leadership Lessons', 'Mindfulness Moments',
    'Entrepreneur Stories', 'Psychology Deep Dives', 'Productivity Hacks',
    'Innovation Spotlight', 'Career Advice', 'Personal Growth', 'Finance Wisdom',
    'Health & Wellness', 'Creative Thinking', 'Future of Work', 'Success Stories'
  ];

  for (let i = 1; i <= 15; i++) {
    const theme = faker.helpers.arrayElement(collectionThemes);
    const englishName = `${theme} Collection`;

    // Generate unique slug for collections
    let slug = faker.helpers.slugify(englishName).toLowerCase();
    let counter = 1;
    let originalSlug = slug;
    while (usedCollectionSlugs.has(slug)) {
      slug = `${originalSlug}-${counter}`;
      counter++;
    }
    usedCollectionSlugs.add(slug);

    collections.push({
      id: `podcast-collection-${i}`,
      name: englishName,
      imageUrl: `https://images.unsplash.com/photo-${faker.string.numeric(10)}?w=400&h=300&fit=crop`,
      slug: slug,
      podcastsIds: [], // Will be populated after creating podcasts
      translations: [
        {
          name: englishName,
          description: `A curated collection of podcasts exploring ${theme.toLowerCase()} and related topics.`,
          language: 'en'
        },
        {
          name: `${theme} संग्रह`,
          description: `${theme.toLowerCase()} और संबंधित विषयों का पता लगाने वाले पॉडकास्ट का एक क्यूरेटेड संग्रह।`,
          language: 'hi'
        },
        {
          name: `Koleksi ${englishName}`,
          description: `Koleksi podcast pilihan yang mengeksplorasi ${theme.toLowerCase()} dan topik terkait.`,
          language: 'id'
        },
        {
          name: `مجموعة ${englishName}`,
          description: `مجموعة من البودكاست المختارة التي تستكشف ${theme.toLowerCase()} والمواضيع ذات الصلة.`,
          language: 'ar'
        }
      ]
    });
  }

  console.log(`📂 Creating ${collections.length} podcast collections...`);
  for (const collectionData of collections) {
    await prisma.podcastCollection.create({
      data: {
        id: collectionData.id,
        name: collectionData.name,
        imageUrl: collectionData.imageUrl,
        slug: collectionData.slug,
        podcastsIds: collectionData.podcastsIds,
        translations: {
          create: collectionData.translations
        }
      }
    });
  }

  // Create individual podcasts (150 podcasts)
  const podcasts = [];
  const usedPodcastSlugs = new Set<string>();

  for (let i = 1; i <= 150; i++) {
    const podcastThemes = [
      'leadership', 'entrepreneurship', 'productivity', 'mindfulness', 'success',
      'innovation', 'communication', 'strategy', 'motivation', 'creativity',
      'technology', 'business', 'psychology', 'personal development', 'finance'
    ];

    const formats = ['Interview', 'Discussion', 'Solo Episode', 'Panel Talk', 'Q&A Session'];
    const topics = ['strategies', 'habits', 'mindset', 'techniques', 'principles', 'methods', 'approaches'];

    const theme = faker.helpers.arrayElement(podcastThemes);
    const format = faker.helpers.arrayElement(formats);
    const topic = faker.helpers.arrayElement(topics);

    const englishTitle = `${format}: Mastering ${theme.charAt(0).toUpperCase() + theme.slice(1)} ${topic.charAt(0).toUpperCase() + topic.slice(1)}`;

    // Generate unique slug for podcasts
    let slug = faker.helpers.slugify(englishTitle).toLowerCase();
    let counter = 1;
    let originalSlug = slug;
    while (usedPodcastSlugs.has(slug)) {
      slug = `${originalSlug}-${counter}`;
      counter++;
    }
    usedPodcastSlugs.add(slug);

    // Assign speakers and categories
    const numSpeakers = faker.number.int({ min: 1, max: 3 });
    const speakers = faker.helpers.arrayElements(
      Array.from({ length: 50 }, (_, idx) => `author-${idx + 1}`),
      numSpeakers
    );

    const numGuests = faker.number.int({ min: 0, max: 2 });
    const guests = numGuests > 0 ? faker.helpers.arrayElements(
      Array.from({ length: 50 }, (_, idx) => `author-${idx + 1}`),
      numGuests
    ) : [];

    const numCategories = faker.number.int({ min: 1, max: 2 });
    const categories = faker.helpers.arrayElements(
      Array.from({ length: 25 }, (_, idx) => `cat-${idx + 1}`),
      numCategories
    );

    // Generate key takeaways
    const keyTakeaways = [
      `Understand the core ${topic} of ${theme}`,
      `Apply practical ${topic} in daily life`,
      `Learn from real-world examples`,
      `Develop sustainable habits`,
      `Build lasting change`
    ];

    const selectedTakeaways = faker.helpers.arrayElements(keyTakeaways, 3);

    podcasts.push({
      id: `podcast-${i}`,
      title: englishTitle,
      slug: slug,
      imageUrl: `https://images.unsplash.com/photo-${faker.string.numeric(10)}?w=400&h=400&fit=crop`,
      totalDuration: faker.number.int({ min: 25, max: 90 }), // 25-90 minutes
      published: faker.datatype.boolean(),
      categories: categories,
      speakers: speakers,
      guests: guests,
      translations: [
        {
          title: englishTitle,
          description: `An insightful ${format.toLowerCase()} exploring ${theme} ${topic} that can transform your approach to personal and professional growth.`,
          summary: `Join us as we dive deep into ${theme} ${topic} and discover practical insights that can be applied immediately.`,
          keyTakeaways: selectedTakeaways,
          language: 'en'
        },
        {
          title: englishTitle,
          description: `${theme} ${topic} का पता लगाने वाला एक अंतर्दृष्टिपूर्ण ${format.toLowerCase()} जो व्यक्तिगत और व्यावसायिक विकास के लिए आपके दृष्टिकोण को बदल सकता है।`,
          summary: `हमारे साथ जुड़ें क्योंकि हम ${theme} ${topic} में गहराई से गोता लगाते हैं और तुरंत लागू किए जा सकने वाले व्यावहारिक अंतर्दृष्टि खोजते हैं।`,
          keyTakeaways: selectedTakeaways.map(t => t), // Keep same for demo
          language: 'hi'
        },
        {
          title: englishTitle,
          description: `${format.toLowerCase()} yang insightful mengeksplorasi ${theme} ${topic} yang dapat mengubah pendekatan Anda terhadap pertumbuhan pribadi dan profesional.`,
          summary: `Bergabunglah dengan kami saat kami mendalami ${theme} ${topic} dan menemukan wawasan praktis yang dapat diterapkan segera.`,
          keyTakeaways: selectedTakeaways.map(t => t), // Keep same for demo
          language: 'id'
        },
        {
          title: englishTitle,
          description: `${format.toLowerCase()} مفيد يستكشف ${theme} ${topic} الذي يمكن أن يغير نهجك تجاه النمو الشخصي والمهني.`,
          summary: `انضم إلينا ونحن نتعمق في ${theme} ${topic} ونكتشف رؤى عملية يمكن تطبيقها فوراً.`,
          keyTakeaways: selectedTakeaways.map(t => t), // Keep same for demo
          language: 'ar'
        }
      ]
    });
  }

  console.log(`🎙️ Creating ${podcasts.length} podcasts...`);
  // Create podcasts in batches
  const batchSize = 15;
  for (let i = 0; i < podcasts.length; i += batchSize) {
    const batch = podcasts.slice(i, i + batchSize);
    console.log(`Creating podcasts ${i + 1}-${Math.min(i + batchSize, podcasts.length)}...`);

    for (const podcastData of batch) {
      await prisma.podcast.create({
        data: {
          id: podcastData.id,
          title: podcastData.title,
          slug: podcastData.slug,
          imageUrl: podcastData.imageUrl,
          totalDuration: podcastData.totalDuration,
          published: podcastData.published,
          categories: {
            connect: podcastData.categories.map(id => ({ id }))
          },
          speakers: {
            connect: podcastData.speakers.map(id => ({ id }))
          },
          guests: {
            connect: podcastData.guests.map(id => ({ id }))
          },
          translations: {
            create: podcastData.translations
          }
        }
      });
    }
  }

  // Update collections with podcast IDs
  console.log('🔄 Updating podcast collections with podcast IDs...');
  for (let i = 0; i < collections.length; i++) {
    const collection = collections[i];
    const podcastIds = podcasts
      .slice(i * 10, (i + 1) * 10) // Assign 10 podcasts per collection
      .map(p => p.id);

    await prisma.podcastCollection.update({
      where: { id: collection.id },
      data: {
        podcastsIds: podcastIds
      }
    });
  }
}

async function seedUsers() {
  const users = [
    {
      id: 'user-1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      gender: 'male',
      profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      dob: '1990-05-15'
    },
    {
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      gender: 'female',
      profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
      dob: '1988-09-22'
    },
    {
      id: 'user-3',
      name: 'Alex Johnson',
      email: 'alex.johnson@example.com',
      gender: 'non-binary',
      profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
      dob: '1995-12-03'
    }
  ];

  for (const userData of users) {
    await prisma.user.create({
      data: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        gender: userData.gender,
        profilePicture: userData.profilePicture,
        dob: userData.dob,
        userPreferences: {
          create: {
            allowRemainders: true,
            appLangauge: 'en',
            authorPreferences: ['author-1', 'author-2'],
            categoryPreferences: ['cat-1', 'cat-3']
          }
        },
        userProgress: {
          create: [
            {
              bookId: 'book-1',
              completed: false,
              lastChapter: 3
            },
            {
              bookId: 'book-2',
              completed: true,
              lastChapter: 12
            }
          ]
        },
        BookMark: {
          create: [
            { bookId: 'book-1' },
            { bookId: 'book-3' }
          ]
        }
      }
    });
  }
}

async function seedPages() {
  const pages = [
    {
      id: 'page-1',
      title: 'Home',
      slug: 'home',
      blocks: [
        {
          type: 'hero',
          viewType: 'featured',
          order: 1,
          data: { title: 'Welcome to Nosis', subtitle: 'Your gateway to knowledge' },
          metadata: { backgroundImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=600&fit=crop' },
          imageUrl: null
        },
        {
          type: 'books',
          viewType: 'grid',
          order: 2,
          data: { category: 'psychology', limit: 6 },
          metadata: { title: 'Featured Psychology Books' },
          imageUrl: null
        },
        {
          type: 'podcasts',
          viewType: 'carousel',
          order: 3,
          data: { collection: 'business-insights', limit: 4 },
          metadata: { title: 'Business Insights Podcasts' },
          imageUrl: null
        }
      ]
    },
    {
      id: 'page-2',
      title: 'Psychology',
      slug: 'psychology',
      blocks: [
        {
          type: 'category-hero',
          viewType: 'banner',
          order: 1,
          data: { categoryId: 'cat-1' },
          metadata: { showStats: true },
          imageUrl: null
        },
        {
          type: 'books',
          viewType: 'list',
          order: 2,
          data: { category: 'psychology', sortBy: 'popular' },
          metadata: { title: 'All Psychology Books' },
          imageUrl: null
        }
      ]
    }
  ];

  for (const pageData of pages) {
    const { blocks, ...pageFields } = pageData;

    await prisma.dynamicPage.create({
      data: {
        id: pageFields.id,
        title: pageFields.title,
        slug: pageFields.slug,
        blocks: {
          create: blocks
        }
      }
    });
  }
}

// Run the seeder
seed()
  .then(() => {
    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
