import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CookieConsent } from "@/components/CookieConsent";
import { MessageNotificationBubble } from "@/components/notifications/MessageNotificationBubble";
import { lazy, Suspense, useEffect } from "react";
import { checkAndSaveReferralFromUrl } from "@/lib/referral";
import { Skeleton } from "@/components/ui/skeleton";

// Critical pages - loaded immediately
import Index from "./pages/Index";
import Catalog from "./pages/Catalog";
import PerformerProfile from "./pages/PerformerProfile";
import Auth from "./pages/Auth";

// Lazy loaded pages - loaded on demand
const Booking = lazy(() => import("./pages/Booking"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminPerformers = lazy(() => import("./pages/admin/AdminPerformers"));
const AdminVerification = lazy(() => import("./pages/admin/AdminVerification"));
const AdminModeration = lazy(() => import("./pages/admin/AdminModeration"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminPerformerView = lazy(() => import("./pages/admin/AdminPerformerView"));
const AdminBookingHistory = lazy(() => import("./pages/admin/AdminBookingHistory"));
const AdminPaidBookings = lazy(() => import("./pages/admin/AdminPaidBookings"));
const AdminAuditLog = lazy(() => import("./pages/admin/AdminAuditLog"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminPartners = lazy(() => import("./pages/admin/AdminPartners"));
const AdminSmsLogs = lazy(() => import("./pages/admin/AdminSmsLogs"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const PartnerDashboard = lazy(() => import("./pages/PartnerDashboard"));
const PerformerRegistration = lazy(() => import("./pages/PerformerRegistration"));
const PerformerDashboard = lazy(() => import("./pages/performer/PerformerDashboard"));
const PerformerProfilePage = lazy(() => import("./pages/performer/PerformerProfile"));
const PerformerCalendar = lazy(() => import("./pages/performer/PerformerCalendar"));
const PerformerBookings = lazy(() => import("./pages/performer/PerformerBookings"));
const CustomerDashboard = lazy(() => import("./pages/customer/CustomerDashboard"));
const CustomerBookings = lazy(() => import("./pages/customer/CustomerBookings"));
const CustomerProfile = lazy(() => import("./pages/customer/CustomerProfile"));
const CustomerCatalog = lazy(() => import("./pages/customer/CustomerCatalog"));
const Messages = lazy(() => import("./pages/Messages"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Offer = lazy(() => import("./pages/Offer"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const Cookies = lazy(() => import("./pages/Cookies"));
const PerformerAgreement = lazy(() => import("./pages/PerformerAgreement"));
const PerformerCode = lazy(() => import("./pages/PerformerCode"));
const CustomerRules = lazy(() => import("./pages/CustomerRules"));
const ImageUsage = lazy(() => import("./pages/ImageUsage"));
const BankInfo = lazy(() => import("./pages/BankInfo"));
const Students = lazy(() => import("./pages/Students"));
const InternalStatistics = lazy(() => import("./pages/InternalStatistics"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="space-y-4 w-full max-w-md px-4">
      <Skeleton className="h-8 w-3/4 mx-auto" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

// Check referral on app load
function ReferralTracker() {
  useEffect(() => {
    checkAndSaveReferralFromUrl();
  }, []);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ReferralTracker />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/performer/:id" element={<PerformerProfile />} />
              <Route path="/booking/:performerId" element={<Booking />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/register" element={<Auth />} />
              <Route path="/become-performer" element={<PerformerRegistration />} />
              {/* Partner dashboard */}
              <Route path="/partner/:token" element={<PartnerDashboard />} />
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
              {/* Internal statistics - secret URL */}
              <Route path="/x7k9m2p4-q8r1-s5t3-u6v0-w8y4z1a2b3c4d5e6f7g8h9j" element={<InternalStatistics />} />
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
              <Route path="/admin/partners" element={<AdminPartners />} />
              <Route path="/admin/audit" element={<AdminAuditLog />} />
              <Route path="/admin/messages" element={<AdminMessages />} />
              <Route path="/admin/sms-logs" element={<AdminSmsLogs />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/performer/:id" element={<AdminPerformerView />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <CookieConsent />
          <MessageNotificationBubble />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
