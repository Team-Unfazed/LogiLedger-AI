import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { ThemeToggle } from "@/components/ui/theme-toggle.jsx";
import { SplineFinal } from "@/components/ui/spline-final.jsx";
import {
  Truck,
  Package,
  Users,
  BarChart3,
  MessageSquare,
  Brain,
  FileText,
  Globe,
} from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  const [language, setLanguage] = useState("en");

  const content = {
    en: {
      title: "LogiLedger AI",
      subtitle: "Digitizing Logistics & Accounting for Indian Fleet Operators",
      description:
        "Connect big companies with MSMEs, streamline bidding, automate accounting, and transform your logistics operations with AI-powered solutions.",
      getStarted: "Get Started",
      learnMore: "Learn More",
      forCompanies: "For Companies",
      forMSMEs: "For MSMEs",
      companiesDesc:
        "Post consignments, receive bids, and manage logistics operations efficiently.",
      msmeDesc:
        "Find opportunities, place competitive bids, and grow your transport business.",
      features: "Key Features",
      stats: "Platform Statistics",
    },
    hi: {
      title: "लॉजीलेजर AI",
      subtitle:
        "भारतीय फ्लीट ऑपरेटरों के लिए लॉजिस्टिक्स और अकाउंटिंग का डिजिटलकरण",
      description:
        "बड़ी कंपनियों को MSMEs से जोड़ें, बिडिंग को सुव्यवस्थित करें, अकाउंटिंग को स्वचालित करें।",
      getStarted: "शुरू करें",
      learnMore: "और जानें",
      forCompanies: "कंपनियों के लिए",
      forMSMEs: "MSMEs के लिए",
      companiesDesc:
        "कंसाइनमेंट पोस्ट करें, बिड प्राप्त करें, और लॉजिस्टिक्स संचालन को कुशलता से प्रबंधित करें।",
      msmeDesc:
        "अवसर खोजें, प्रतिस्पर्धी बिड लगाएं, और अपने परिवहन व्यवसाय को बढ़ाएं।",
      features: "मुख्य विशेषताएं",
      stats: "प्लेटफ़ॉर्म आंकड़े",
    },
  };

  const t = content[language];

  const features = [
    {
      icon: Package,
      title: "Smart Bidding System",
      description:
        "AI-powered matching between companies and transport partners",
    },
    {
      icon: Brain,
      title: "AI Accounting",
      description: "Automated expense tracking and invoice generation",
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Integration",
      description: "Manage operations through WhatsApp chatbot",
    },
    {
      icon: FileText,
      title: "OCR Processing",
      description: "Extract data from receipts and documents automatically",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Real-time insights into your logistics operations",
    },
    {
      icon: Globe,
      title: "Multi-language Support",
      description: "Available in Hindi and English",
    },
  ];

  const stats = [
    { label: "Active Consignments", value: "1,247" },
    { label: "MSME Partners", value: "3,892" },
    { label: "Companies", value: "156" },
    { label: "Routes Covered", value: "850+" },
  ];

  // Animation variants
  const heroVariant = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };
  const cardContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };
  const cardVariant = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: "easeOut" } },
  };
  const buttonVariant = {
    hover: { scale: 1.07, boxShadow: "0 0 16px #38bdf8" },
    tap: { scale: 0.97 },
  };

  return (
    <div className="min-h-screen relative">
      <SplineFinal />
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary">{t.title}</span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
            </select>

            <Link to="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Register</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <motion.section
        className="container py-24"
        variants={heroVariant}
        initial="hidden"
        animate="visible"
      >
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            🚀 AI-Powered Logistics Platform
          </Badge>
          <motion.h1
            className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl"
            variants={heroVariant}
          >
            {t.title}
          </motion.h1>
          <motion.p className="mb-4 text-xl text-muted-foreground" variants={heroVariant}>
            {t.subtitle}
          </motion.p>
          <motion.p className="mb-8 text-lg text-muted-foreground max-w-2xl mx-auto" variants={heroVariant}>
            {t.description}
          </motion.p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <motion.button
                className="w-full sm:w-auto btn btn-primary glow-on-hover px-8 py-3 rounded-md font-semibold text-lg"
                variants={buttonVariant}
                whileHover="hover"
                whileTap="tap"
                type="button"
              >
                {t.getStarted}
              </motion.button>
            </Link>
            <Link to="/bidding">
              <motion.button
                className="w-full sm:w-auto btn btn-outline glow-on-hover px-8 py-3 rounded-md font-semibold text-lg"
                variants={buttonVariant}
                whileHover="hover"
                whileTap="tap"
                type="button"
              >
                {t.learnMore}
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* User Types */}
      <motion.section
        className="container py-16"
        variants={cardContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto" variants={cardContainer}>
          <motion.div variants={cardVariant}>
            <Card className="logistics-card hover:scale-105 transition-all duration-300 glow-on-hover">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{t.forCompanies}</CardTitle>
                </div>
                <CardDescription>{t.companiesDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/register?type=company">
                  <Button className="w-full">Start as Company</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariant}>
            <Card className="logistics-card hover:scale-105 transition-all duration-300 glow-on-hover">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <Truck className="h-6 w-6 text-secondary" />
                  </div>
                  <CardTitle>{t.forMSMEs}</CardTitle>
                </div>
                <CardDescription>{t.msmeDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/register?type=msme">
                  <Button variant="outline" className="w-full">
                    Start as MSME
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Features */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t.features}</h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to digitize your logistics operations
          </p>
        </div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={cardContainer}
          initial="hidden"
          animate="visible"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={cardVariant}>
              <Card className="logistics-card">
                <CardHeader>
                  <div className="p-2 bg-primary/10 rounded-lg w-fit">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Stats */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t.stats}</h2>
        </div>

        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-8"
          variants={cardContainer}
          initial="hidden"
          animate="visible"
        >
          {stats.map((stat, index) => (
            <motion.div key={index} variants={cardVariant}>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-12">
        <div className="container text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Truck className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">{t.title}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 LogiLedger AI. Transforming logistics in India.
          </p>
        </div>
      </footer>
    </div>
  );
}
