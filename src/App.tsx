import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import About from "./pages/About";
import Notices from "./pages/Notices";
import Events from "./pages/Events";
import Login from "./pages/Login";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminNotices from "./pages/admin/AdminNotices";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminContent from "./pages/admin/AdminContent";
import AdminExams from "./pages/admin/AdminExams";
import AdminExamDetail from "./pages/admin/AdminExamDetail";
import AdminFeatures from "./pages/admin/AdminFeatures";
import AdminAudit from "./pages/admin/AdminAudit";
import AdminExamAnalytics from "./pages/admin/AdminExamAnalytics";
import TeacherDashboard from "./pages/dashboards/TeacherDashboard";
import StudentDashboard from "./pages/dashboards/StudentDashboard";
import StudentExam from "./pages/student/StudentExam";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/notices" element={<Notices />} />
            <Route path="/events" element={<Events />} />
            <Route path="/login" element={<Login />} />

            <Route path="/admin" element={<ProtectedRoute allow={["super_admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allow={["super_admin"]}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/notices" element={<ProtectedRoute allow={["super_admin"]}><AdminNotices /></ProtectedRoute>} />
            <Route path="/admin/events" element={<ProtectedRoute allow={["super_admin"]}><AdminEvents /></ProtectedRoute>} />
            <Route path="/admin/content" element={<ProtectedRoute allow={["super_admin"]}><AdminContent /></ProtectedRoute>} />
            <Route path="/admin/exams" element={<ProtectedRoute allow={["super_admin"]}><AdminExams /></ProtectedRoute>} />
            <Route path="/admin/exams/:id" element={<ProtectedRoute allow={["super_admin"]}><AdminExamDetail /></ProtectedRoute>} />
            <Route path="/admin/features" element={<ProtectedRoute allow={["super_admin"]}><AdminFeatures /></ProtectedRoute>} />
            <Route path="/admin/audit" element={<ProtectedRoute allow={["super_admin"]}><AdminAudit /></ProtectedRoute>} />
            <Route path="/admin/exams/:id/analytics" element={<ProtectedRoute allow={["super_admin"]}><AdminExamAnalytics /></ProtectedRoute>} />

            <Route path="/teacher" element={<ProtectedRoute allow={["teacher"]}><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/student" element={<ProtectedRoute allow={["student"]}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/exam/:id" element={<ProtectedRoute allow={["student"]}><StudentExam /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
