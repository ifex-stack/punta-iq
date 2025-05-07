import React from "react";

// Ultra-basic component to confirm rendering works
function App() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-6">PuntaIQ</h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">AI-Powered Sports Predictions</h2>
        <p className="mb-4">
          Welcome to PuntaIQ, your all-in-one platform for AI-generated sports predictions and analytics.
        </p>
        <div className="flex justify-center mt-6">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full"
            onClick={() => alert('Basic UI components are working!')}
          >
            Get Started
          </button>
        </div>
      </div>
      <p className="mt-6 text-sm text-gray-400">
        Diagnostic Mode - Testing basic rendering
      </p>
    </div>
  );
}

export default App;
