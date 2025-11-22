import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/supabase";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import LMSDashboard from "./pages/LMSDashboard";
import DashboardHome from "./pages/DashboardHome";
import Courses from "./pages/Courses";
import Assignments from "./pages/Assignments";
import Progress from "./pages/Progress";
import ChatPage from "./pages/ChatPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminHome from "./pages/AdminHome";
import AdminCourses from "./pages/AdminCourses";
import AdminStudents from "./pages/AdminStudents";
import AdminAnalytics from "./pages/AdminAnalytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<LMSDashboard />}>
              <Route index element={<DashboardHome />} />
              <Route path="courses" element={<Courses />} />
              <Route path="assignments" element={<Assignments />} />
              <Route path="progress" element={<Progress />} />
              <Route path="chat" element={<ChatPage />} />
            </Route>
            <Route path="/admin" element={<AdminDashboard />}>
              <Route index element={<AdminHome />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="analytics" element={<AdminAnalytics />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
