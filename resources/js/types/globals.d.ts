/// <reference types="vite/client" />

declare global {
    /**
     * Laravel route helper - generates URLs for named routes
     * @param name - The route name (e.g., 'anggota.update-details')
     * @param params - Optional parameters for the route
     * @returns The generated URL
     */
    function route(name: string, params?: any): string;
}

export {};
