# Zone01 Kisumu - GraphQL Profile

A modern, responsive web application that displays your Zone01 Kisumu learning profile using GraphQL queries and interactive SVG statistics.

##  Project Overview

This project creates a personalized profile page for Zone01 Kisumu students, featuring:
- **JWT Authentication** with Zone01 credentials
- **GraphQL API Integration** for data retrieval
- **Interactive SVG Graphs** for statistics visualization
- **Responsive Design** for all devices
- **Real-time Data** from Zone01 platform

##  Features

###  Authentication
- **Basic Authentication** with base64 encoding
- **JWT Token Management** with automatic session handling
- **Dual Login Support**: Username or Email + Password
- **Secure Logout** with session cleanup

###  Profile Information (3 Mandatory Sections)
1. **User Information**: Username, ID, member since date, contact details
2. **Experience Points (XP)**: Total XP, project count, recent activity, filtered data
3. **Grades & Skills**: Success rate, project results, audit ratio, recent grades

###  Interactive Statistics (2+ SVG Graphs)
1. **XP Progress Over Time**: Line graph showing cumulative XP growth
2. **Project Success Rate**: Pie chart displaying pass/fail ratio
3. **Interactive Features**: Hover tooltips, responsive design, smooth animations

###  GraphQL Implementation
- **Normal Queries**: Basic user data retrieval
- **Nested Queries**: Complex data with object relationships
- **Argument-based Queries**: Filtered queries with variables
- **Error Handling**: Comprehensive GraphQL error management

##  Project Structure

```
graphql/
├── index.html                 # Main HTML file
├── app.js                     # Main application controller
├── assets/
│   └── styles/
│       ├── main.css          # Main styles & layout
│       └── components.css    # Component-specific styles
├── components/
│   ├── profile.js           # Profile data rendering
│   └── graphs.js            # SVG graph generation
├── services/
│   ├── auth.js              # Authentication service
│   └── graphql.js           # GraphQL API service
└── utils/
    └── helpers.js           # Utility functions
```

##  Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for Zone01 API access
- Valid Zone01 Kisumu account credentials

### Installation
1. **Clone or download** the project files
2. **Start a local server** (required for CORS):
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server -p 8000
   
   # Using PHP
   php -S localhost:8000
   ```
3. **Open your browser** and navigate to `http://localhost:8000`

### Usage
1. **Enter your Zone01 credentials**:
   - Username or Email
   - Password
2. **Click Login** to authenticate
3. **View your profile** with:
   - Personal information
   - XP statistics and progress
   - Project grades and success rate
   - Interactive graphs and charts

##  Technical Implementation

### Authentication Flow
```
User Input → Basic Auth (base64) → Zone01 API → JWT Token → Session Storage
```

### GraphQL Queries
- **User Data**: `getCurrentUser()` - Basic profile information
- **XP Transactions**: `getUserXP(userId)` - Experience points with filtering
- **Progress Data**: `getUserProgress(userId)` - Project grades and completion
- **Results Data**: `getUserResults(userId)` - Detailed project results
- **Audit Data**: `getUserAudits(userId)` - Peer review statistics

### Data Processing
- **XP Filtering**: Excludes piscine projects (Go, JavaScript, Rust)
- **Date Formatting**: Human-readable timestamps
- **Statistics Calculation**: Success rates, averages, totals
- **Responsive Graphs**: SVG-based charts with interactivity

##  Design Features

### Responsive Layout
- **Mobile-first design** with breakpoints
- **Flexible grid system** for profile cards
- **Adaptive typography** and spacing
- **Touch-friendly interactions**

### Visual Elements
- **Modern CSS** with custom properties
- **Smooth animations** and transitions
- **Interactive hover effects**
- **Professional color scheme**

### Accessibility
- **Semantic HTML** structure
- **ARIA labels** for screen readers
- **Keyboard navigation** support
- **High contrast** color ratios

##  Statistics & Graphs

### XP Progress Graph
- **Line chart** showing cumulative XP over time
- **Interactive points** with hover tooltips
- **Area fill** for visual appeal
- **Responsive scaling** for all screen sizes

### Success Rate Chart
- **Pie chart** displaying project pass/fail ratio
- **Center statistics** with percentage display
- **Color-coded segments** (green for pass, red for fail)
- **Legend** with detailed breakdown

##  Security Features

- **JWT Token Validation** with expiration handling
- **Input Sanitization** to prevent XSS attacks
- **CORS Compliance** for secure API requests
- **Session Management** with automatic cleanup

##  Browser Compatibility

-  **Chrome** 80+
-  **Firefox** 75+
-  **Safari** 13+
-  **Edge** 80+

##  Mobile Support

- **Responsive design** for all screen sizes
- **Touch-optimized** interactions
- **Mobile-friendly** navigation
- **Optimized performance** on mobile devices

##  Development

### Code Organization
- **Modular architecture** with separated concerns
- **ES6+ JavaScript** with modern syntax
- **CSS custom properties** for theming
- **Component-based structure**

### Error Handling
- **Comprehensive error catching** at all levels
- **User-friendly error messages**
- **Console logging** for debugging
- **Graceful fallbacks** for missing data

##  Requirements Met

 **GraphQL Integration**: All query types implemented  
 **JWT Authentication**: Basic auth with token management  
 **Three Profile Sections**: User info, XP, grades/skills  
 **Two SVG Graphs**: XP progress and success rate  
 **Login/Logout**: Complete session management  
 **Responsive Design**: Mobile and desktop support  
 **Error Handling**: Comprehensive error management  

##  Learning Outcomes

This project demonstrates proficiency in:
- **GraphQL** query language and API integration
- **JWT Authentication** and session management
- **SVG Graphics** and data visualization
- **Responsive Web Design** principles
- **Modern JavaScript** (ES6+) development
- **API Integration** and error handling

##  Support

For issues or questions:
1. Check browser console for error messages
2. Verify Zone01 credentials are correct
3. Ensure internet connection is stable
4. Try refreshing the page or clearing browser cache

##  Zone01 Kisumu Integration

This project is specifically designed for **Zone01 Kisumu** students and integrates with:
- **Zone01 Authentication API**: `https://learn.zone01kisumu.ke/api/auth/signin`
- **Zone01 GraphQL API**: `https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql`
- **Zone01 Database Schema**: User, transaction, progress, result, and object tables

