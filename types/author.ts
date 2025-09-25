export interface Author {
    id?: string;
    name: string;
    imageUrl: string;
}
export interface TranslatedAuthor {
    id?: string;
    name: string;
    description: string;
    language: string;
}

export interface AuthorResponse {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    author:{
        id: string;
        imageUrl: string;
    }
}