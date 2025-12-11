import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CookieConsent } from "@/components/CookieConsent";
import { MessageNotificationBubble } from "@/components/notifications/MessageNotificationBubble";
import Index from "./pages/Index";
import Catalog from "./pages/Catalog";
import PerformerProfile from "./pages/PerformerProfile";
import Booking from "./pages/Booking";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPerformers from "./pages/admin/AdminPerformers";
import AdminVerification from "./pages/admin/AdminVerification";
import AdminModeration from "./pages/admin/AdminModeration";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminPerformerView from "./pages/admin/AdminPerformerView";
import AdminBookingHistory from "./pages/admin/AdminBookingHistory";
import AdminPaidBookings from "./pages/admin/AdminPaidBookings";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import AdminMessages from "./pages/admin/AdminMessages";
import PerformerRegistration from "./pages/PerformerRegistration";
import PerformerDashboard from "./pages/performer/PerformerDashboard";
import PerformerProfilePage from "./pages/performer/PerformerProfile";
import PerformerCalendar from "./pages/performer/PerformerCalendar";
import PerformerBookings from "./pages/performer/PerformerBookings";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerBookings from "./pages/customer/CustomerBookings";
import CustomerProfile from "./pages/customer/CustomerProfile";
import CustomerCatalog from "./pages/customer/CustomerCatalog";
import Messages from "./pages/Messages";
import HowItWorks from "./pages/HowItWorks";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Offer from "./pages/Offer";
import RefundPolicy from "./pages/RefundPolicy";
import Cookies from "./pages/Cookies";
import PerformerAgreement from "./pages/PerformerAgreement";
import PerformerCode from "./pages/PerformerCode";
import CustomerRules from "./pages/CustomerRules";
import ImageUsage from "./pages/ImageUsage";
import BankInfo from "./pages/BankInfo";
import Students from "./pages/Students";

import AdminReviews from "./pages/admin/AdminReviews";

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
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/performer/:id" element={<PerformerProfile />} />
            <Route path="/booking/:performerId" element={<Booking />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/register" element={<Auth />} />
            <Route path="/become-performer" element={<PerformerRegistration />} />
            {/* Info pages */}
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/offer" element={<Offer />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/performer-agreement" element={<PerformerAgreement />} />
            <Route path="/performer-code" element={<PerformerCode />} />
            <Route path="/customer-rules" element={<CustomerRules />} />
            <Route path="/image-usage" element={<ImageUsage />} />
            <Route path="/bank-info" element={<BankInfo />} />
            <Route path="/students" element={<Students />} />
            {/* Messages */}
            <Route path="/messages" element={<Messages />} />
            {/* Customer cabinet routes */}
            <Route path="/cabinet" element={<CustomerDashboard />} />
            <Route path="/cabinet/catalog" element={<CustomerCatalog />} />
            <Route path="/cabinet/bookings" element={<CustomerBookings />} />
            <Route path="/cabinet/profile" element={<CustomerProfile />} />
            <Route path="/my-bookings" element={<CustomerBookings />} />
            {/* Performer dashboard routes */}
            <Route path="/performer" element={<PerformerDashboard />} />
            <Route path="/performer/profile" element={<PerformerProfilePage />} />
            <Route path="/performer/calendar" element={<PerformerCalendar />} />
            <Route path="/performer/bookings" element={<PerformerBookings />} />
            {/* Admin routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/performers" element={<AdminPerformers />} />
            <Route path="/admin/verification" element={<AdminVerification />} />
            <Route path="/admin/moderation" element={<AdminModeration />} />
            <Route path="/admin/reviews" element={<AdminReviews />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/history" element={<AdminBookingHistory />} />
            <Route path="/admin/paid" element={<AdminPaidBookings />} />
            <Route path="/admin/audit" element={<AdminAuditLog />} />
            <Route path="/admin/messages" element={<AdminMessages />} />
            <Route path="/admin/performer/:id" element={<AdminPerformerView />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieConsent />
          <MessageNotificationBubble />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
