import { useState, useEffect } from "react";

export function useResponsiveColumns() {
    // Default to 1 column for SSR / mobile
    const [columns, setColumns] = useState(1);

    useEffect(() => {
        const updateColumns = () => {
            const width = window.innerWidth;
            if (width >= 1280) setColumns(6);      // xl
            else if (width >= 1024) setColumns(4); // lg
            else if (width >= 768) setColumns(3);  // md
            else if (width >= 640) setColumns(2);  // sm
            else setColumns(1);                    // default
        };

        // Initial check
        updateColumns();

        // Listen for resize events
        window.addEventListener("resize", updateColumns);
        return () => window.removeEventListener("resize", updateColumns);
    }, []);

    return columns;
}
