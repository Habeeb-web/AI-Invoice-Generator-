import { Sparkles,BarChart2,FileText,Mail,LayoutDashboard,Plus,Users } from "lucide-react";


export const FEATURES = [
{
    icon: Sparkles,
    title: "AI Invoice Creation",
    description:
       "Paste any text, email, or receipt, and let our AI instantly generate a complete, professional invoice for you.",
},
{

icon: BarChart2,
title: "AI-Powered Dashboard",
description:
        "Get smart, actionable insights about your business finances, generated automaticall by our AI analyst.",
},
{
icon: Mail,
title: "Smart Reminders",

description:

"Automatically generate polite and effective payment reminder emails for overdue invoices with a single click.",

},{

icon: FileText,

title: "Easy Invoice Management",

description:
"Easily manage all your invoices, track payments, and send reminders for overdue payments.",
},
];
export const TESTIMONIALS=[
        {
                quote: "This app saved me hours of work. I can now create and send invoices in minutes!",
                author:"Jane Doe",
                title: "Freelance Designer",
                avatar: "https://placehold.co/100x100/000000/ffffff?text=JD"
        },
        {
                quote: "The best invoicing app I have ever used. Simple, intuitive, and powerful.",
                author: "John Smith",
                title: "Small Business Owner",
                avatar: "https://placehold.co/100x100/000000/ffffff?text=JS" 
        },
        {
                quote: "I love the dashboard and reporting features. It helps me keep track of my finance",
                author: "Peter Jones",
                title: "Consultant",
                avatar:"https://placehold.co/100x100/000000/ffffff?text=PJ"

        }
];

export const FAQS = [
  {
    question: "How does the AI invoice creation work?",
    answer: "Simply paste any text that contains invoice details - like an email, a list of items, or a description - and our AI will automatically generate a professional invoice for you, saving your time and effort, Because we respect your time."
  },
  {
    question: "Is there a free trial available?",
    answer: "Yes, you can try our platform for free for 14 days. If you want, we'll provide a guided tour to help you get the most out of our features during your trial period."
  },
  {
    question: "Can I change my plan later?",
    answer: "Of course. Our pricing scales with your company. Chat to our friendly team to discuss plan changes that better suit your growing business needs."
  },
  {
    question: "What is your cancellation policy?",
    answer: "We understand that things change. You can cancel your plan at any time and we'll prorate your refund based on the unused portion of your billing cycle."
  },
  {
    question: "Can other info be added to an invoice?",
    answer: "Yes, you can add notes, payment terms, and even attach files to your invoices. Customize each invoice to include all the relevant information your clients need."
  },
  {
    question: "How does billing work?",
    answer: "Plans are per workspace, not per account. You can upgrade one workspace, and still maintain basic features on others. Billing cycles are monthly or annually based on your preference."
  }
];
// Navigation items configuration

export const NAVIGATION_MENU = [
  {id: "dashboard", name: "Dashboard", icon: LayoutDashboard },
  { id: "invoices", name: "Invoices", icon: FileText },
  { id: "invoices/new", name: "Create Invoice", icon: Plus},
  { id: "profile", name: "Profile", icon: Users },
];
