export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-4xl mx-auto text-center px-6">
        <h1 className="text-6xl font-bold text-gray-900 mb-8">
          🚀 BizPilot
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Comprehensive Business Management Platform
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-blue-600">🏗️ Backend API</h3>
            <p className="text-gray-600">Node.js + TypeScript + Express</p>
            <p className="text-sm text-green-600 mt-2">✅ Running on port 5000</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-green-600">🌐 Web Frontend</h3>
            <p className="text-gray-600">Next.js + TypeScript + Tailwind</p>
            <p className="text-sm text-green-600 mt-2">✅ Running on port 3000</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-purple-600">📱 Mobile App</h3>
            <p className="text-gray-600">React Native + Expo</p>
            <p className="text-sm text-blue-600 mt-2">🔄 Ready for development</p>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">🎯 Cleanup Complete!</h2>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">🗑️ Removed Files</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Old Supabase configuration</li>
                <li>• Legacy React web source</li>
                <li>• Duplicate mobile directory</li>
                <li>• Outdated dependencies</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">✅ Clean Architecture</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Monorepo structure</li>
                <li>• Custom backend API</li>
                <li>• Shared types & utilities</li>
                <li>• Docker containerization</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-12">
          <p className="text-lg text-gray-700 mb-4">
            🎉 <strong>Migration & Cleanup Complete!</strong> The BizPilot platform is now 
            running on a modern, scalable architecture.
          </p>
          <div className="flex justify-center space-x-4">
            <a 
              href="http://localhost:5000/health" 
              target="_blank"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔍 Test Backend API
            </a>
            <a 
              href="http://localhost:5000/api/v1/status" 
              target="_blank"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              📊 API Status
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}