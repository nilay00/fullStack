import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles/app.css";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { NotificationProvider } from "./context/NotificationContext";

import Navbar from "./components/layout/Navbar";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import BrowsePage from "./pages/BrowsePage";
import ProfileDetailPage from "./pages/ProfileDetailPage";
import MessagesPage from "./pages/MessagesPage";
import DashboardPage from "./pages/DashboardPage";
import EditProfilePage from "./pages/EditProfilePage";
import SavedProfilesPage from "./pages/SavedProfilesPage";
import ActivityPage from "./pages/ActivityPage";
import PrivacySettingsPage from "./pages/PrivacySettingsPage";

function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      {children}
    </div>
  );
}

function Protected({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected */}
              <Route path="/" element={<Protected><HomePage /></Protected>} />
              <Route path="/browse" element={<Protected><BrowsePage /></Protected>} />
              <Route path="/profile/edit" element={<Protected><EditProfilePage /></Protected>} />
              <Route path="/privacy-settings" element={<Protected><PrivacySettingsPage /></Protected>} />
              <Route path="/profile/:id" element={<Protected><ProfileDetailPage /></Protected>} />
              <Route path="/messages" element={<Protected><MessagesPage /></Protected>} />
              <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
              <Route path="/saved" element={<Protected><SavedProfilesPage /></Protected>} />
              <Route path="/activity" element={<Protected><ActivityPage /></Protected>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
