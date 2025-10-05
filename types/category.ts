export interface Category {
    name: string;
    categorySVG: string;
    categoryImage: string;
    midImage?: string;
    slug: string;
}

export interface CategoryResponse {
    categoryId: string;
    name: string;
    description: string;
    category: {
        categorySVG: string;
        categoryImage: string;
        midImage: string;
    }
}
