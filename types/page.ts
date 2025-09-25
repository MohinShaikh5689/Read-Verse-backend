export interface Page {
    title: string;
    slug: string;
}

export interface BlockData {
    singleBookCollectionId?: string;
    multiBookCollectionIds?: string[];
    singlePodcastCollectionId?: string;
    multiPodcastCollectionIds?: string[];
    singleCategoryBooksId?: string;
    singleCategoryPodcastsId?: string;
    singleCategoryId?: string;
    multiCategoryIds?: string[];
}

export interface BlockMetaData {
    titles?: {
        en: { title: string; subTitle: string };
        hi: { title: string; subTitle: string };
        ar: { title: string; subTitle: string };
        id: { title: string; subTitle: string };
    };
}

export interface AddCollectionsToPage {
    Id?: string;
    pageId: string;
    type: 'singleBookCollection' | 'multiBookCollection' | 'singlePodcastCollection' | 'multiPodcastCollection' | 'singleCategoryBooks' | 'singleCategoryPodcasts' | 'singleCategory' | 'multiCategory';
    viewType: 'carousel' | 'grid';
    order: number;
    data: BlockData;
    imageUrl?: string | null;
    metadata?: BlockMetaData | null;
}
