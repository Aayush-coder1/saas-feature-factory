export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    total_count: number;
    current_page: number;
    limit: number;
    total_pages: number;
  };
}

export function paginate<T>(items: T[], options: PaginationOptions): PaginationResult<T> {
  const { page = 1, limit = 10 } = options;
  const offset = (page - 1) * limit;
  const total_pages = Math.ceil(items.length / limit);
  const data = items.slice(offset, offset + limit);
  return {
    data,
    pagination: {
      total_count: items.length,
      current_page: page,
      limit,
      total_pages,
    },
  };
}