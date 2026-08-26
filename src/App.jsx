import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import FarmerDashboard from './pages/FarmerDashboard';
import TraderDashboard from './pages/TraderDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Marketplace from './pages/Marketplace';
import AIRecommendation from './pages/AIRecommendation';
import WeatherDashboard from './pages/WeatherDashboard';
import Chat from './pages/Chat';
import Login from './pages/Login';
import Register from './pages/Register';
import DealDetails from './pages/DealDetails';
import PlantDiseaseDetection from './pages/PlantDiseaseDetection';
import PlantDetectionHistory from './pages/PlantDetectionHistory';
import PlantDetectionDetail from './pages/PlantDetectionDetail';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
            <Route path="/trader-dashboard" element={<TraderDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/ai-recommendation" element={<AIRecommendation />} />
            <Route path="/weather" element={<WeatherDashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/deals/:id" element={<DealDetails />} />
            <Route path="/plant-disease-detection" element={<PlantDiseaseDetection />} />
            <Route path="/plant%20disease%20detection" element={<PlantDiseaseDetection />} />
            <Route path="/plant disease detection" element={<PlantDiseaseDetection />} />
            <Route path="/plant-detection" element={<PlantDiseaseDetection />} />
            <Route path="/disease-detection" element={<PlantDiseaseDetection />} />
            <Route path="/plant-detection-history" element={<PlantDetectionHistory />} />
            <Route path="/plant-detection/:id" element={<PlantDetectionDetail />} />
            {/* Catch-all fallback */}
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
