# Zone01 Kisumu - GraphQL Profile

A responsive web application that displays your Zone01 Kisumu learning profile using GraphQL queries and interactive SVG statistics.

## Features

- **JWT Authentication** with Zone01 credentials
- **Three Profile Sections**: User info, XP statistics, skills & grades
- **Interactive SVG Graphs**: XP progress and audit ratio charts
- **Responsive Design** for all devices
- **Real-time Data** from Zone01 platform

## Quick Start

1. **Start a local server**:
   ```bash
   python3 -m http.server 8000
   ```

2. **Open browser** and navigate to `http://localhost:8000`

3. **Login** with your Zone01 credentials (username/email + password)

## Project Structure

```
graphql/
├── index.html              # Main HTML file
├── app.js                  # Application controller
├── assets/styles/          # CSS files
├── components/             # Profile & graph components
├── services/               # Auth & GraphQL services
└── utils/                  # Helper functions
```

## Technical Stack

- **Frontend**: Vanilla JavaScript (ES6+), CSS3, HTML5
- **Authentication**: JWT with Basic Auth
- **API**: GraphQL queries to Zone01 database
- **Graphics**: SVG-based interactive charts
- **Design**: Mobile-first responsive layout

## Requirements Met

✅ **GraphQL Integration**: Multiple query types implemented
✅ **JWT Authentication**: Secure login/logout system
✅ **Profile Sections**: User info, XP, skills display
✅ **SVG Graphs**: Interactive charts with tooltips
✅ **Responsive Design**: Works on all devices

## Browser Support

Chrome 80+, Firefox 75+, Safari 13+, Edge 80+

## Zone01 Integration

Connects to Zone01 Kisumu APIs:
- **Auth**: `https://learn.zone01kisumu.ke/api/auth/signin`
- **GraphQL**: `https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql`

