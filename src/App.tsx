import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/supabase";
import Auth from "./pages/Auth";
import LMSDashboard from "./pages/LMSDashboard";
import DashboardHome from "./pages/DashboardHome";
import Courses from "./pages/Courses";
import CourseMaterials from "./pages/CourseMaterials";
import Assignments from "./pages/Assignments";
import Progress from "./pages/Progress";
import Query from "./pages/Query";
import ChatPage from "./pages/ChatPage";
import MySpace from "./pages/MySpace";
import Exams from "./pages/Exams";
import AdminDashboard from "./pages/AdminDashboard";
import AdminHome from "./pages/AdminHome";
import AdminCourses from "./pages/AdminCourses";
import AdminCourseMaterials from "./pages/AdminCourseMaterials";
import AdminStudents from "./pages/AdminStudents";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminExams from "./pages/AdminExams";
import AdminControlCenter from "./pages/AdminControlCenter";
import Maintenance from "./pages/Maintenance";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/dashboard" element={<LMSDashboard />}>
              <Route index element={<DashboardHome />} />
              <Route path="courses" element={<Courses />} />
              <Route path="courses/:courseId/materials" element={<CourseMaterials />} />
              <Route path="assignments" element={<Assignments />} />
              <Route path="progress" element={<Progress />} />
              <Route path="myspace" element={<MySpace />} />
              <Route path="exams" element={<Exams />} />
              <Route path="query" element={<Query />} />
              <Route path="chat" element={<ChatPage />} />
            </Route>
            <Route path="/admin" element={<AdminDashboard />}>
              <Route index element={<AdminHome />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="courses/:courseId/materials" element={<AdminCourseMaterials />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="exams" element={<AdminExams />} />
              <Route path="control-center" element={<AdminControlCenter />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
