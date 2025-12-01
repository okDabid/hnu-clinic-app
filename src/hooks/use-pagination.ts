import { DependencyList, useEffect, useMemo, useState } from "react";

interface UsePaginationOptions {
    pageSize?: number;
    resetDeps?: DependencyList;
}

export function usePagination<T>(items: T[], options: UsePaginationOptions = {}) {
    const { pageSize = 10, resetDeps = [] } = options;
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, resetDeps);

    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const pageItems = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return items.slice(start, start + pageSize);
    }, [currentPage, items, pageSize]);

    const startIndex = items.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endIndex = items.length === 0 ? 0 : Math.min(currentPage * pageSize, items.length);

    return {
        currentPage,
        pageSize,
        totalPages,
        pageItems,
        startIndex,
        endIndex,
        setPage: setCurrentPage,
        goToPrevious: () => setCurrentPage((page) => Math.max(page - 1, 1)),
        goToNext: () => setCurrentPage((page) => Math.min(page + 1, totalPages)),
    };
}
