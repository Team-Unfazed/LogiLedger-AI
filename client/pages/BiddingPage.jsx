import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
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
import {
  Truck,
  Package,
  IndianRupee,
  Calendar,
  MapPin,
  Search,
  Filter,
  SortAsc,
  Users,
  Clock,
} from "lucide-react";

export default function BiddingPage() {
  const [consignments, setConsignments] = useState([]);
  const [filteredConsignments, setFilteredConsignments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [goodsTypeFilter, setGoodsTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("deadline");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicConsignments();
  }, []);

  useEffect(() => {
    filterAndSortConsignments();
  }, [consignments, searchQuery, locationFilter, goodsTypeFilter, sortBy]);

  const fetchPublicConsignments = async () => {
    try {
      const response = await fetch("/api/consignments/public");
      if (response.ok) {
        const data = await response.json();
        setConsignments(data.consignments || []);
      }
    } catch (error) {
      console.error("Error fetching consignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortConsignments = () => {
    let filtered = [...consignments];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.companyName.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter(
        (c) =>
          c.origin.toLowerCase().includes(locationFilter.toLowerCase()) ||
          c.destination.toLowerCase().includes(locationFilter.toLowerCase()),
      );
    }

    // Goods type filter
    if (goodsTypeFilter) {
      filtered = filtered.filter((c) => c.goodsType === goodsTypeFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "deadline":
          return new Date(a.deadline) - new Date(b.deadline);
        case "budget_high":
          return b.budget - a.budget;
        case "budget_low":
          return a.budget - b.budget;
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "bids":
          return (b.bidCount || 0) - (a.bidCount || 0);
        default:
          return 0;
      }
    });

    setFilteredConsignments(filtered);
  };

  const getStatusBadge = (status, deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

    if (status === "closed") {
      return <Badge variant="destructive">Closed</Badge>;
    }

    if (daysLeft < 0) {
      return <Badge variant="destructive">Expired</Badge>;
    }

    if (daysLeft <= 1) {
      return <Badge variant="secondary">Urgent</Badge>;
    }

    return <Badge variant="default">Open</Badge>;
  };

  const getUrgencyColor = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return "border-l-red-500";
    if (daysLeft <= 1) return "border-l-red-400";
    if (daysLeft <= 3) return "border-l-orange-400";
    if (daysLeft <= 7) return "border-l-yellow-400";
    return "border-l-green-400";
  };

  const uniqueLocations = [
    ...new Set(
      consignments.flatMap((c) => [c.origin, c.destination]).filter(Boolean),
    ),
  ];

  const uniqueGoodsTypes = [
    ...new Set(consignments.map((c) => c.goodsType).filter(Boolean)),
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Truck className="h-12 w-12 text-primary mx-auto mb-4 animate-bounce" />
          <p className="text-muted-foreground">Loading opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <SplineBackground />
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Truck className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary">
              LogiLedger AI
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Register</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Live Bidding Platform</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover logistics opportunities across India. Connect with
            companies and bid on consignments that match your fleet capacity.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Consignments
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {consignments.filter((c) => c.status === "open").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹
                {Math.round(
                  consignments
                    .filter((c) => c.status === "open")
                    .reduce((acc, c) => acc + (c.budget || 0), 0) / 100000,
                )}
                L
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Bid Count
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {consignments.length > 0
                  ? Math.round(
                      consignments.reduce(
                        (acc, c) => acc + (c.bidCount || 0),
                        0,
                      ) / consignments.length,
                    )
                  : 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Urgent (24h)
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  consignments.filter((c) => {
                    const daysLeft = Math.ceil(
                      (new Date(c.deadline) - new Date()) /
                        (1000 * 60 * 60 * 24),
                    );
                    return daysLeft <= 1 && daysLeft >= 0;
                  }).length
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search consignments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Locations</SelectItem>
                  {uniqueLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={goodsTypeFilter}
                onValueChange={setGoodsTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Goods type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {uniqueGoodsTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deadline">
                    Deadline (Urgent first)
                  </SelectItem>
                  <SelectItem value="budget_high">
                    Budget (High to Low)
                  </SelectItem>
                  <SelectItem value="budget_low">
                    Budget (Low to High)
                  </SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="bids">Most Bids</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setLocationFilter("");
                  setGoodsTypeFilter("");
                  setSortBy("deadline");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Consignments List */}
        <div className="space-y-4">
          {filteredConsignments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No consignments found
                  </h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or check back later for new
                    opportunities
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredConsignments.map((consignment) => (
              <Card
                key={consignment.id}
                className={`logistics-card border-l-4 ${getUrgencyColor(consignment.deadline)}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {consignment.title}
                        </h3>
                        {getStatusBadge(
                          consignment.status,
                          consignment.deadline,
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        Posted by{" "}
                        <span className="font-medium">
                          {consignment.companyName}
                        </span>
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Route</p>
                            <p className="text-muted-foreground">
                              {consignment.origin} → {consignment.destination}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Cargo</p>
                            <p className="text-muted-foreground">
                              {consignment.goodsType} ({consignment.weight}kg)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <IndianRupee className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Budget</p>
                            <p className="text-primary font-semibold">
                              ₹{consignment.budget?.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Deadline</p>
                            <p className="text-muted-foreground">
                              {new Date(
                                consignment.deadline,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {consignment.description && (
                        <p className="text-sm text-muted-foreground mt-3">
                          {consignment.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-muted-foreground mb-2">
                        {consignment.bidCount || 0} bids
                      </div>
                      <Link to="/register?type=msme">
                        <Button>Place Bid</Button>
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-xs text-muted-foreground">
                      Posted{" "}
                      {new Date(consignment.createdAt).toLocaleDateString()}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {Math.ceil(
                          (new Date(consignment.deadline) - new Date()) /
                            (1000 * 60 * 60 * 24),
                        )}{" "}
                        days left
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {consignment.goodsType}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Call to Action */}
        <Card className="mt-12 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">
                Ready to Start Bidding?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Join LogiLedger AI today and connect with companies across
                India. Grow your transport business with our AI-powered
                logistics platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register?type=msme">
                  <Button size="lg">Register as MSME</Button>
                </Link>
                <Link to="/register?type=company">
                  <Button variant="outline" size="lg">
                    Register as Company
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
