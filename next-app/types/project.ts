export interface Project {
    id: string;
    title: string;
    status: 'todo' | 'in_progress' | 'done';
    note?: string;
    updatedAt?: string;
}
