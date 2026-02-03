export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-700">Total Orders</h2>
                    <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-700">Departments</h2>
                    <p className="text-3xl font-bold text-teal-600 mt-2">0</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-700">Partners</h2>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">0</p>
                </div>
            </div>
        </div>
    );
}
