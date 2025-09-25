export interface Book {
  title: string;
  authors: string[];
  slug: string;
  totalDuration: number;
  categories: string[];
}

export interface BooksResponse {
  id: string;
  title: string;
  coverUrl: string;
  description: string;
  language: string;
  published: boolean;
  audioEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  book: {
    totalDuration: number;
    authors: {
      id: string;
    }[];
  };
}

export interface bookCollectionMetadataFields {
  title: string;
  imageUrl: string;
  slug: string;
  books: string[];

}

export interface BookCollection {
  language: string;
  title: string;
  description: string;
}

export interface Summary {
  title: string;
  order: number;
}

export interface TranslatedSummary {
  language: string;
  title: string;
  content: string;
  keyTakeaways: string[];
}