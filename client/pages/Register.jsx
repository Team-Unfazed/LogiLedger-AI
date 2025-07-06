import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
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
import { Alert, AlertDescription } from "@/components/ui/alert.jsx";
import { ThemeToggle } from "@/components/ui/theme-toggle.jsx";
import { SplineFinal } from "@/components/ui/spline-final.jsx";
import { Truck, Loader2, Users, Building } from "lucide-react";

export default function Register() {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: searchParams.get("type") || "",
    companyName: "",
    phoneNumber: "",
    gstNumber: "",
    location: "",
    fleetSize: "",
    vehicleTypes: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleVehicleTypeChange = (vehicleType) => {
    setFormData((prev) => {
      const currentTypes = prev.vehicleTypes || [];
      if (currentTypes.includes(vehicleType)) {
        return {
          ...prev,
          vehicleTypes: currentTypes.filter(type => type !== vehicleType)
        };
      } else {
        return {
          ...prev,
          vehicleTypes: [...currentTypes, vehicleType]
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!formData.userType) {
      setError("Please select user type");
      setLoading(false);
      return;
    }

    // MSME-specific validation
    if (formData.userType === "msme") {
      if (!formData.fleetSize || formData.fleetSize < 1) {
        setError("Fleet size is required for MSME users");
        setLoading(false);
        return;
      }
      if (!formData.vehicleTypes || formData.vehicleTypes.length === 0) {
        setError("Please select at least one vehicle type");
        setLoading(false);
        return;
      }
    }

    // Prepare data for API
    const apiData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      userType: formData.userType,
      companyName: formData.companyName,
      location: formData.location,
      phone: formData.phoneNumber,
      fleetSize: formData.userType === "msme" ? parseInt(formData.fleetSize) : undefined,
      vehicleTypes: formData.userType === "msme" ? formData.vehicleTypes : undefined,
    };

    const result = await register(apiData);

    if (result.success) {
      // Redirect based on user type
      const userType = result.user.userType || result.user.companyType;
      if (userType === "company") {
        navigate("/company-dashboard");
      } else {
        navigate("/msme-dashboard");
      }
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4">
      <SplineFinal />
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-lg relative z-10 bg-white/10 dark:bg-black/30 backdrop-blur-lg border border-white/20 shadow-xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Truck className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">
              LogiLedger AI
            </span>
          </div>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>
            Join the future of logistics management in India
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* User Type Selection */}
            <div className="space-y-2">
              <Label>Account Type</Label>
              <Select
                value={formData.userType}
                onValueChange={(value) => handleInputChange("userType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Company (Post Consignments)
                    </div>
                  </SelectItem>
                  <SelectItem value="msme">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      MSME (Bid for Work)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    handleInputChange("phoneNumber", e.target.value)
                  }
                  placeholder="Phone number"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">
                {formData.userType === "company"
                  ? "Company Name"
                  : "Business Name"}
              </Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) =>
                  handleInputChange("companyName", e.target.value)
                }
                placeholder={
                  formData.userType === "company"
                    ? "Your company name"
                    : "Your business name"
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  placeholder="City, State"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gst">GST Number</Label>
                <Input
                  id="gst"
                  value={formData.gstNumber}
                  onChange={(e) =>
                    handleInputChange("gstNumber", e.target.value)
                  }
                  placeholder="GST number (optional)"
                />
              </div>
            </div>

            {/* MSME-specific fields */}
            {formData.userType === "msme" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fleetSize">Fleet Size</Label>
                  <Input
                    id="fleetSize"
                    type="number"
                    min="1"
                    value={formData.fleetSize}
                    onChange={(e) =>
                      handleInputChange("fleetSize", e.target.value)
                    }
                    placeholder="Number of vehicles"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Vehicle Types</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["truck", "tempo", "pickup", "container", "trailer"].map((type) => (
                      <label key={type} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.vehicleTypes?.includes(type) || false}
                          onChange={() => handleVehicleTypeChange(type)}
                          className="rounded"
                        />
                        <span className="text-sm capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  placeholder="Create password"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  placeholder="Confirm password"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary hover:underline font-medium"
              >
                Sign in here
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              ← Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
