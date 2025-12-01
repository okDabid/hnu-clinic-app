import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TablePaginationProps {
    currentPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    pageSize?: number;
    loading?: boolean;
    className?: string;
}

export function TablePagination({
    currentPage,
    totalItems,
    onPageChange,
    pageSize = 10,
    loading = false,
    className,
}: TablePaginationProps) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endIndex = totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);

    return (
        <div
            className={cn(
                "mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between",
                className
            )}
        >
            <span>
                Showing {startIndex}-{endIndex} of {totalItems}
            </span>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={loading || currentPage <= 1}
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                >
                    Previous
                </Button>
                <span className="text-xs">Page {currentPage} of {totalPages}</span>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={loading || currentPage >= totalPages}
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
