"use client";

import {
  HelpCircle,
  Home,
  Mail,
  MessageSquare,
  Phone,
  FileText,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function HelpSupportPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      question: "How do I track my workouts?",
      answer:
        "To track your workouts, navigate to the Workouts tab and click 'New Workout'. You can then select your exercise type, set your goals, and track your progress in real-time. Don't forget to save your workout when you're done!",
    },
    {
      question: "Can I connect with other users?",
      answer:
        "Yes! Visit the Community section to connect with other fitness enthusiasts. You can follow other users, share your progress, and engage with their posts. Building a supportive community can help keep you motivated on your fitness journey.",
    },
    {
      question: "How do I set fitness goals?",
      answer:
        "Go to your Profile settings and look for the Goals section. Here you can set both short-term and long-term fitness goals. You can track your progress towards these goals from your dashboard, and receive notifications when you achieve them.",
    },
    {
      question: "What should I do if I encounter technical issues?",
      answer:
        "If you experience any technical issues, first try refreshing the page or logging out and back in. If the problem persists, you can contact our support team through the Contact Support button below, or email us directly at support@workouttracker.com.",
    },
    {
      question: "How can I customize my workout plans?",
      answer:
        "In the Workouts section, you can create custom workout plans by clicking 'Create Plan'. Choose from our exercise library or add your own exercises, set your preferred sets and reps, and organize them into a routine that fits your schedule.",
    },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="flex items-center gap-1">
              <Home className="h-3 w-3" />
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Help & Support</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
        <div className="absolute inset-0">
          <Image
            src="/images/profile/Help_Support_Fitness.jpg"
            alt="Help and Support"
            fill
            className="object-cover opacity-15"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/80 to-background/20" />
        </div>
        <div className="relative flex flex-col md:flex-row items-center gap-6 p-8">
          <div className="flex-1 min-w-[50%]">
            <div className="flex items-center gap-4 mb-4">
              <div className="rounded-full bg-primary/10 p-3">
                <HelpCircle className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Help & Support
              </h1>
            </div>
            <p className="text-muted-foreground">
              Find answers to common questions and get the support you need
            </p>
          </div>
          <div className="relative w-full md:w-1/2 aspect-[16/9] rounded-lg overflow-hidden">
            <Image
              src="/images/profile/Help_Support_Fitness.jpg"
              alt="Help and Support"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6 hover:bg-accent/50 transition-colors">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="rounded-full bg-primary/10 p-3">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Live Chat</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get instant help from our support team
              </p>
              <Button variant="outline" className="w-full">
                Start Chat
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:bg-accent/50 transition-colors">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Email Support</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Send us a detailed message
              </p>
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:bg-accent/50 transition-colors">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="rounded-full bg-primary/10 p-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Documentation</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Browse our detailed guides
              </p>
              <Button variant="outline" className="w-full">
                View Guides
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* FAQ Section */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold mb-1">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-muted-foreground">
              Find quick answers to common questions
            </p>
          </div>
          <div className="w-full md:w-auto">
            <Input
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {filteredFaqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {filteredFaqs.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No matching questions found.
            </p>
          </div>
        )}
      </Card>

      {/* Additional Resources */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Additional Resources</h3>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button variant="outline" className="justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Getting Started Guide
              </div>
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Video Tutorials
              </div>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Still Need Help?</h3>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Our support team is available Monday through Friday, 9am to 5pm EST.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="flex-1">
              <Phone className="mr-2 h-4 w-4" /> Schedule a Call
            </Button>
            <Button variant="outline" className="flex-1">
              <Mail className="mr-2 h-4 w-4" /> Send an Email
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
