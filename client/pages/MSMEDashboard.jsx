import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import { ThemeToggle } from "@/components/ui/theme-toggle.jsx";
import { SplineBackground } from "@/components/ui/spline-background.jsx";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  Package,
  IndianRupee,
  Calendar,
  MapPin,
  LogOut,
  FileText,
  BarChart3,
  Clock,
  CheckCircle,
  Upload,
} from "lucide-react";
import { StyledWrapper } from "@/components/ui/styled-wrapper.jsx";

export default function MSMEDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [availableConsignments, setAvailableConsignments] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [awardedJobs, setAwardedJobs] = useState([]);
  const [showBidForm, setShowBidForm] = useState(false);
  const [selectedConsignment, setSelectedConsignment] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [bidNotes, setBidNotes] = useState("");

  useEffect(() => {
    fetchAvailableConsignments();
    fetchMyBids();
    fetchAwardedJobs();
  }, []);

  const fetchAvailableConsignments = async () => {
    try {
      const token = localStorage.getItem("logiledger_token");
      const response = await fetch("/api/consignments/available", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableConsignments(data.consignments || []);
      }
    } catch (error) {
      console.error("Error fetching consignments:", error);
    }
  };

  const fetchMyBids = async () => {
    try {
      const token = localStorage.getItem("logiledger_token");
      const response = await fetch("/api/bids/my-bids", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMyBids(data.bids || []);
      }
    } catch (error) {
      console.error("Error fetching bids:", error);
    }
  };

  const fetchAwardedJobs = async () => {
    try {
      const token = localStorage.getItem("logiledger_token");
      const response = await fetch("/api/jobs/awarded", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAwardedJobs(data.jobs || []);
      }
    } catch (error) {
      console.error("Error fetching awarded jobs:", error);
    }
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("logiledger_token");
      const response = await fetch("/api/bids/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          consignmentId: selectedConsignment.id,
          bidAmount: parseFloat(bidAmount),
          estimatedDelivery,
          notes: bidNotes,
        }),
      });

      if (response.ok) {
        setShowBidForm(false);
        setBidAmount("");
        setEstimatedDelivery("");
        setBidNotes("");
        setSelectedConsignment(null);
        fetchAvailableConsignments();
        fetchMyBids();
      }
    } catch (error) {
      console.error("Error submitting bid:", error);
    }
  };

  const updateJobStatus = async (jobId, status) => {
    try {
      const token = localStorage.getItem("logiledger_token");
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchAwardedJobs();
      }
    } catch (error) {
      console.error("Error updating job status:", error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: "secondary", text: "Pending", icon: Clock },
      awarded: { variant: "default", text: "Awarded", icon: CheckCircle },
      rejected: { variant: "destructive", text: "Rejected", icon: null },
      in_progress: { variant: "outline", text: "In Progress", icon: Truck },
      completed: { variant: "success", text: "Completed", icon: CheckCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="status-badge">
        {Icon && <Icon className="h-3 w-3 mr-1" />}
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen relative">
      <SplineBackground />
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">LogiLedger AI</span>
          </div>

          <div className="flex items-center gap-4">
            <StyledWrapper>
              <button 
                className="btn"
                onClick={() => window.open('https://t.me/LogiLedger_aiBot', '_blank')}
              >
                <span className="btn-text-one">AI CHATBOT</span>
                <span className="btn-text-two">OPEN!!</span>
              </button>
            </StyledWrapper>
            {/* Fallback button in case styled-components doesn't work */}
            <button 
              className="btn-fallback"
              onClick={() => window.open('https://t.me/LogiLedger_aiBot', '_blank')}
              style={{
                width: '100px',
                height: '35px',
                background: 'linear-gradient(to top, #00154c, #12376e, #23487f)',
                color: '#fff',
                borderRadius: '50px',
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: '0 15px 30px rgba(0, 0, 0, 0.5)',
                overflow: 'hidden',
                marginLeft: '20px',
                display: 'inline-block',
                zIndex: 1000,
                fontWeight: 'bold',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              AI CHATBOT
            </button>
            <ThemeToggle />
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.name}
            </span>
            <Button variant="outline" size="sm" onClick={() => { logout(); navigate("/login"); }}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">MSME Dashboard</h1>
            <p className="text-muted-foreground">
              Find opportunities and manage your transport business
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myBids.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Awarded Jobs
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{awardedJobs.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Earnings
              </CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹
                {awardedJobs
                  .filter((job) => job.status === "completed")
                  .reduce((acc, job) => acc + (job.amount || 0), 0)
                  .toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {myBids.length > 0
                  ? Math.round(
                      (myBids.filter((bid) => bid.status === "awarded").length /
                        myBids.length) *
                        100,
                    )
                  : 0}
                %
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="opportunities" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="opportunities">
              Available Opportunities
            </TabsTrigger>
            <TabsTrigger value="bids">My Bids</TabsTrigger>
            <TabsTrigger value="jobs">Awarded Jobs</TabsTrigger>
          </TabsList>

          {/* Available Opportunities */}
          <TabsContent value="opportunities">
            <Card>
              <CardHeader>
                <CardTitle>Available Consignments</CardTitle>
                <CardDescription>
                  Browse and bid on open consignments from companies
                </CardDescription>
              </CardHeader>
              <CardContent>
                {availableConsignments.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No opportunities available
                    </h3>
                    <p className="text-muted-foreground">
                      Check back later for new consignment postings
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableConsignments.map((consignment) => (
                      <Card key={consignment.id} className="logistics-card">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-lg mb-1">
                                {consignment.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                by {consignment.companyName}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {consignment.origin} →{" "}
                                  {consignment.destination}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Package className="h-4 w-4" />
                                  {consignment.weight}kg
                                </span>
                                <span className="flex items-center gap-1">
                                  <IndianRupee className="h-4 w-4" />₹
                                  {consignment.budget?.toLocaleString()} max
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(
                                    consignment.deadline,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <Badge variant="default">
                              {consignment.bidCount || 0} bids
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground mb-4">
                            {consignment.description}
                          </p>

                          <div className="flex justify-end">
                            <Button
                              onClick={() => {
                                setSelectedConsignment(consignment);
                                setShowBidForm(true);
                              }}
                            >
                              Place Bid
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Bids */}
          <TabsContent value="bids">
            <Card>
              <CardHeader>
                <CardTitle>My Bids</CardTitle>
                <CardDescription>
                  Track the status of all your submitted bids
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myBids.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No bids submitted yet
                    </h3>
                    <p className="text-muted-foreground">
                      Start bidding on available opportunities to grow your
                      business
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myBids.map((bid) => (
                      <Card key={bid.id} className="logistics-card">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-lg mb-1">
                                {bid.consignmentTitle}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <IndianRupee className="h-4 w-4" />₹
                                  {bid.bidAmount?.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  Est. delivery:{" "}
                                  {new Date(
                                    bid.estimatedDelivery,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            {getStatusBadge(bid.status)}
                          </div>

                          {bid.notes && (
                            <p className="text-sm text-muted-foreground">
                              {bid.notes}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Awarded Jobs */}
          <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <CardTitle>Awarded Jobs</CardTitle>
                <CardDescription>
                  Manage your active and completed transport jobs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {awardedJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No awarded jobs yet
                    </h3>
                    <p className="text-muted-foreground">
                      Keep bidding on opportunities to win your first job
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {awardedJobs.map((job) => (
                      <Card key={job.id} className="logistics-card">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-lg mb-1">
                                {job.consignmentTitle}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                for {job.companyName}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {job.origin} → {job.destination}
                                </span>
                                <span className="flex items-center gap-1">
                                  <IndianRupee className="h-4 w-4" />₹
                                  {job.amount?.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  Due:{" "}
                                  {new Date(job.deadline).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            {getStatusBadge(job.status)}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              Awarded on{" "}
                              {new Date(job.awardedDate).toLocaleDateString()}
                            </div>

                            <div className="flex gap-2">
                              {job.status === "awarded" && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    updateJobStatus(job.id, "in_progress")
                                  }
                                >
                                  Start Job
                                </Button>
                              )}
                              {job.status === "in_progress" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      /* Handle invoice upload */
                                    }}
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Invoice
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      updateJobStatus(job.id, "completed")
                                    }
                                  >
                                    Mark Complete
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bid Form Dialog */}
      <Dialog open={showBidForm} onOpenChange={setShowBidForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Place Your Bid</DialogTitle>
            <DialogDescription>
              Submit a competitive bid for {selectedConsignment?.title}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitBid} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bidAmount">Bid Amount (₹)</Label>
              <Input
                id="bidAmount"
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="Enter your bid amount"
                max={selectedConsignment?.budget}
                required
              />
              <p className="text-xs text-muted-foreground">
                Maximum budget: ₹{selectedConsignment?.budget?.toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedDelivery">Estimated Delivery Date</Label>
              <Input
                id="estimatedDelivery"
                type="date"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
                max={selectedConsignment?.deadline}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bidNotes">Additional Notes (Optional)</Label>
              <Textarea
                id="bidNotes"
                value={bidNotes}
                onChange={(e) => setBidNotes(e.target.value)}
                placeholder="Why should they choose you? Fleet details, experience, etc."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBidForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Submit Bid</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
