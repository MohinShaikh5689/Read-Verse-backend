export interface PodcastChannel {
    name: string;
    imageUrl: string;
    slug: string;
    podcastsIds: string[];
}

export interface TranslatedPodcastChannel {
    name: string;
    description: string;
    language: string;
}

export interface Podcast {
    title: string;
    imageUrl: string;
    totalDuration: number;
    slug: string;
    published: boolean;
    speakers: string[];
    guests: string[];
    categories: string[];
}

export interface TranslatedPodcast {
    language: string;
    title: string;
    summary: string;
    description: string;
    imageUrl: string | null;
    keyTakeaways: string[];
}