import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { StudentProvider } from "./contexts/StudentContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HavenLandingPage } from "./pages/HavenLandingPage";
import { OriginalLandingPage } from "./pages/OriginalLandingPage";
import { PersonalCare } from "./pages/PersonalCare";
import { ResourcesAndSelfCare } from "./pages/ResourcesAndSelfCare";
import { StudentLogin } from "./pages/StudentLogin";

// TEST: Verify StudentLogin is imported
console.log('🔵 App.tsx: StudentLogin imported:', typeof StudentLogin, 'from StudentLogin.tsx', 'TIMESTAMP:', Date.now());
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";
import { BookSession } from "./pages/BookSession";
import { ScreeningTests } from "./pages/ScreeningTests";
import { Results } from "./pages/Results";
import { StudentRequests } from "./pages/StudentRequests";
import { Alerts } from "./pages/Alerts";
import { Journal } from "./pages/Journal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  console.log('🟢 App component rendering...');
  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <StudentProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HavenLandingPage />} />
              <Route path="/mindcare" element={<OriginalLandingPage />} />
              <Route path="/student-login" element={<StudentLogin />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route 
                path="/student-dashboard" 
                element={
                  <ProtectedRoute>
                    <PersonalCare />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student-dashboard/resources" 
                element={
                  <ProtectedRoute>
                    <ResourcesAndSelfCare />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student-dashboard/journal" 
                element={
                  <ProtectedRoute>
                    <Journal />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student-dashboard/booking" 
                element={
                  <ProtectedRoute>
                    <BookSession />
                  </ProtectedRoute>
                } 
              />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/admin-dashboard/resources" element={<ResourcesAndSelfCare />} />
              <Route path="/admin-dashboard/results" element={<Results />} />
              <Route path="/admin-dashboard/requests" element={<StudentRequests />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </StudentProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;
