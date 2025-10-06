export interface User {
    name: string;
    email: string;
    gender: string | null;
    profilePicture: string | null;
    dob: string | null;
}

export interface UserResponse {
    id: string;
    name: string;
    email: string;
    gender: string;
    profilePicture: string;
    dob: string;
    createdAt: Date;
    updatedAt: Date;
    userPreferences?: any[];
    userProgress?: any[];
    BookMark?: any[];
}

export interface UserPreferences {
    id: string;
    allowReminders: boolean;
    appLanguage: string;
    authorPreferences: string[];
    categoryPreferences: string[];
    userId: string;
}

export interface UserProgress {
    bookId: string;
    userId: string;
    completed: boolean;
    lastChapter: number;
    createdAt: Date;
    updatedAt: Date;
    userPreferencesId?: string;
}

export interface BookMark {
    id: string;
    bookId: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
