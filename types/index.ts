export type ProjectStatus = 'todo' | 'in_progress' | 'done';

export interface Project {
    id: string;
    title: string;
    status: ProjectStatus;
    note?: string;
}

export interface Note {
    id: number;
    text: string;
    color: string;
    rotation: string;
}

export type ShoppingCategory = 'produce' | 'dairy' | 'meat' | 'pantry' | 'household' | 'frozen' | 'beverages' | 'other';

export interface ShoppingItem {
    id: string;
    text: string;
    checked: boolean;
    category: ShoppingCategory;
}
