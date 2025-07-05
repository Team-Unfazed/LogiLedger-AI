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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { ThemeToggle } from "@/components/ui/theme-toggle.jsx";
import { SplineBackground } from "@/components/ui/spline-background.jsx";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  Plus,
  Package,
  IndianRupee,
  Calendar,
  MapPin,
  Users,
  LogOut,
  FileText,
  BarChart3,
} from "lucide-react";

export default function CompanyDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [consignments, setConsignments] = useState([]);
  const [consignmentsLoading, setConsignmentsLoading] = useState(false);
  const [consignmentsError, setConsignmentsError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBidsDialog, setShowBidsDialog] = useState(false);
  const [selectedConsignment, setSelectedConsignment] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [bidsError, setBidsError] = useState("");
  const [newConsignment, setNewConsignment] = useState({
    title: "",
    origin: "",
    destination: "",
    goodsType: "",
    weight: "",
    deadline: "",
    budget: "",
    description: "",
  });

  useEffect(() => {
    fetchConsignments();
  }, []);

  const fetchConsignments = async () => {
    setConsignmentsLoading(true);
    setConsignmentsError("");
    try {
      const token = localStorage.getItem("logiledger_token");
      const response = await fetch("/api/consignments/my-consignments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setConsignments(data.consignments || []);
      } else {
        setConsignmentsError("Failed to fetch consignments.");
      }
    } catch (error) {
      setConsignmentsError("Error fetching consignments.");
    }
    setConsignmentsLoading(false);
  };

  const handleCreateConsignment = async (e) => {
    e.preventDefault();
    try {
      // Mock creation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockNewConsignment = {
        id: `cons_${Date.now()}`,
        ...newConsignment,
        weight: parseFloat(newConsignment.weight),
        budget: parseFloat(newConsignment.budget),
        status: "open",
        companyId: user?.id,
        companyName: user?.companyName,
        bidCount: 0,
        createdAt: new Date().toISOString(),
      };

      setConsignments((prev) => [mockNewConsignment, ...prev]);
      setShowCreateForm(false);
      setNewConsignment({
        title: "",
        origin: "",
        destination: "",
        goodsType: "",
        weight: "",
        deadline: "",
        budget: "",
        description: "",
      });
    } catch (error) {
      console.error("Error creating consignment:", error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { variant: "default", text: "Open for Bids" },
      awarded: { variant: "secondary", text: "Awarded" },
      in_progress: { variant: "outline", text: "In Progress" },
      completed: { variant: "success", text: "Completed" },
    };

    const config = statusConfig[status] || statusConfig.open;
    return (
      <Badge variant={config.variant} className="status-badge">
        {config.text}
      </Badge>
    );
  };

  const handleViewBids = async (consignment) => {
    setSelectedConsignment(consignment);
    setShowBidsDialog(true);
    setBids([]);
    setBidsError("");
    setBidsLoading(true);
    try {
      const token = localStorage.getItem("logiledger_token");
      const response = await fetch(`/api/bids/consignment/${consignment.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBids(data.bids || []);
      } else {
        setBidsError("Failed to fetch bids.");
      }
    } catch (error) {
      setBidsError("Error fetching bids.");
    }
    setBidsLoading(false);
  };

  return (
    <div className="min-h-screen relative">
      <SplineBackground />
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary">
              LogiLedger AI
            </span>
          </div>

          <div className="flex items-center gap-4">
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
            <h1 className="text-3xl font-bold">Company Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your consignments and logistics operations
            </p>
          </div>

          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Consignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Consignment</DialogTitle>
                <DialogDescription>
                  Post a new consignment to receive bids from transport partners
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateConsignment} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Consignment Title</Label>
                    <Input
                      id="title"
                      value={newConsignment.title}
                      onChange={(e) =>
                        setNewConsignment((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="e.g., Electronics Delivery"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goodsType">Goods Type</Label>
                    <Select
                      value={newConsignment.goodsType}
                      onValueChange={(value) =>
                        setNewConsignment((prev) => ({
                          ...prev,
                          goodsType: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select goods type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="textiles">Textiles</SelectItem>
                        <SelectItem value="machinery">Machinery</SelectItem>
                        <SelectItem value="food">Food Products</SelectItem>
                        <SelectItem value="raw_materials">
                          Raw Materials
                        </SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="origin">Origin</Label>
                    <Input
                      id="origin"
                      value={newConsignment.origin}
                      onChange={(e) =>
                        setNewConsignment((prev) => ({
                          ...prev,
                          origin: e.target.value,
                        }))
                      }
                      placeholder="Pickup location"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="destination">Destination</Label>
                    <Input
                      id="destination"
                      value={newConsignment.destination}
                      onChange={(e) =>
                        setNewConsignment((prev) => ({
                          ...prev,
                          destination: e.target.value,
                        }))
                      }
                      placeholder="Delivery location"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={newConsignment.weight}
                      onChange={(e) =>
                        setNewConsignment((prev) => ({
                          ...prev,
                          weight: e.target.value,
                        }))
                      }
                      placeholder="Weight in kg"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget (₹)</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={newConsignment.budget}
                      onChange={(e) =>
                        setNewConsignment((prev) => ({
                          ...prev,
                          budget: e.target.value,
                        }))
                      }
                      placeholder="Maximum budget"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={newConsignment.deadline}
                      onChange={(e) =>
                        setNewConsignment((prev) => ({
                          ...prev,
                          deadline: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newConsignment.description}
                    onChange={(e) =>
                      setNewConsignment((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Additional details about the consignment"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Consignment</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Consignments
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{consignments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bids</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {consignments.reduce((acc, c) => acc + (c.bidCount || 0), 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹
                {consignments
                  .filter((c) => c.status === "completed")
                  .reduce((acc, c) => acc + (c.finalAmount || 0), 0)
                  .toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Success Rate
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {consignments.length > 0
                  ? Math.round(
                      (consignments.filter((c) => c.status === "completed")
                        .length /
                        consignments.length) *
                        100,
                    )
                  : 0}
                %
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Consignments List */}
        <Card>
          <CardHeader>
            <CardTitle>My Consignments</CardTitle>
            <CardDescription>
              Track and manage all your posted consignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {consignmentsLoading ? (
              <div className="text-center py-8">Loading consignments...</div>
            ) : consignmentsError ? (
              <div className="text-center text-red-500 py-8">{consignmentsError}</div>
            ) : consignments.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No consignments yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Create your first consignment to start receiving bids
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Consignment
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {consignments.map((consignment) => (
                  <Card key={consignment.id} className="logistics-card">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">
                            {consignment.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {consignment.origin} → {consignment.destination}
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              {consignment.weight}kg
                            </span>
                            <span className="flex items-center gap-1">
                              <IndianRupee className="h-4 w-4" />₹
                              {consignment.budget?.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(
                                consignment.deadline,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {getStatusBadge(consignment.status)}
                      </div>

                      <p className="text-sm text-muted-foreground mb-4">
                        {consignment.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="font-medium">
                            {consignment.bidCount || 0} bids received
                          </span>
                          {consignment.status === "open" && (
                            <span className="text-muted-foreground ml-2">
                              • Accepting bids
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewBids(consignment)}>
                            <FileText className="h-4 w-4 mr-2" />
                            View Bids
                          </Button>
                          {consignment.status === "open" && (
                            <Button size="sm">Manage</Button>
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
      </div>

      <Dialog open={showBidsDialog} onOpenChange={setShowBidsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bids for: {selectedConsignment?.title}</DialogTitle>
            <DialogDescription>
              All bids placed for this consignment
            </DialogDescription>
          </DialogHeader>
          {bidsLoading ? (
            <div className="text-center py-8">Loading bids...</div>
          ) : bidsError ? (
            <div className="text-center text-red-500 py-8">{bidsError}</div>
          ) : bids.length === 0 ? (
            <div className="text-center py-8">No bids yet.</div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {bids.map((bid) => (
                <Card key={bid.id} className="logistics-card">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{bid.bidderName || bid.userName || "Bidder"}</div>
                        <div className="text-sm text-muted-foreground">{bid.email}</div>
                      </div>
                      <div className="text-lg font-bold text-primary">₹{bid.bidAmount?.toLocaleString()}</div>
                    </div>
                    <div className="text-sm mt-2">
                      <span className="font-medium">Delivery:</span> {bid.estimatedDelivery}
                    </div>
                    {bid.notes && (
                      <div className="text-sm mt-1 text-muted-foreground">
                        <span className="font-medium">Notes:</span> {bid.notes}
                      </div>
                    )}
                    <div className="mt-2">{bid.status && <Badge>{bid.status}</Badge>}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
