// src/app/admin/page.tsx
export default function AdminHome() {
    return (
        <div>
            <h1 className="text-3xl font-bold text-green-600 mb-4">
                Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
                Welcome to the administration panel.
                Use the sidebar to manage users and clinics.
            </p>
        </div>
    );
}
