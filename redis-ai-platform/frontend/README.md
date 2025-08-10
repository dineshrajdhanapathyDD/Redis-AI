# Redis AI Platform Frontend

A modern React-based frontend for the Redis AI Platform, featuring multi-modal search, collaborative workspaces, and real-time AI capabilities.

## Features

- **Multi-Modal Search**: Search across text, images, audio, and code using natural language
- **Real-time Collaboration**: WebSocket-powered real-time updates and synchronization
- **Adaptive UI**: Interface that adapts based on user behavior and preferences
- **AI Model Routing**: Intelligent routing to optimal AI models based on context
- **Code Intelligence**: AI-powered code analysis and generation
- **Content Management**: Consistent content generation across platforms
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Type Safety**: Full TypeScript implementation

## Tech Stack

- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework with custom design system
- **Framer Motion** - Smooth animations and transitions
- **React Router** - Client-side routing
- **Zustand** - Lightweight state management
- **React Query** - Server state management and caching
- **Socket.IO Client** - Real-time WebSocket communication
- **Axios** - HTTP client for API requests
- **Lucide React** - Beautiful icon library

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend API server running on port 3001
- Redis server for real-time features

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (Header, Sidebar)
│   └── ui/             # Basic UI components
├── pages/              # Page components
├── providers/          # React context providers
├── store/              # Zustand state management
├── lib/                # Utilities and API clients
├── types/              # TypeScript type definitions
└── hooks/              # Custom React hooks
```

## Key Components

### Layout System
- **Layout**: Main application layout with sidebar and header
- **Sidebar**: Navigation with collapsible design and system status
- **Header**: Top bar with search, notifications, and user menu

### Pages
- **HomePage**: Dashboard with metrics and quick actions
- **SearchPage**: Multi-modal search interface
- **WorkspacePage**: Collaborative workspace (coming soon)
- **CodeIntelligencePage**: Code analysis tools (coming soon)
- **ContentPage**: Content management (coming soon)
- **SettingsPage**: Application settings (coming soon)

### State Management
- **AuthStore**: User authentication and profile
- **UIStore**: UI state, theme, notifications
- **SearchStore**: Search queries, results, history
- **WorkspaceStore**: Workspace data and collaboration
- **WebSocketStore**: Real-time connection state

### Real-time Features
- **WebSocket Provider**: Manages WebSocket connections
- **Toast Notifications**: Real-time system notifications
- **Live Updates**: Real-time data synchronization

## API Integration

The frontend communicates with the backend through:

- **REST API**: Standard HTTP requests for CRUD operations
- **WebSocket**: Real-time bidirectional communication
- **GraphQL**: Complex queries and mutations (planned)

### WebSocket Events

- `search:query` - Perform multi-modal search
- `workspace:join` - Join collaborative workspace
- `learning:behavior:track` - Track user behavior
- `system:subscribe_alerts` - Subscribe to system alerts
- `adaptive_ui:track_interaction` - Track UI interactions

## Styling and Theming

### Tailwind Configuration

The project uses a comprehensive Tailwind CSS configuration with:

#### Custom Color System
- **Primary Colors**: Blue scale (50-900) - `#eff6ff` to `#1e3a8a`
- **Secondary Colors**: Slate scale (50-900) - `#f8fafc` to `#0f172a`
- **Success Colors**: Green scale (50-900) - `#f0fdf4` to `#14532d`
- **Warning Colors**: Amber scale (50-900) - `#fffbeb` to `#78350f`
- **Error Colors**: Red scale (50-900) - `#fef2f2` to `#7f1d1d`

#### Typography
- **Sans Font**: Inter with system fallbacks
- **Mono Font**: JetBrains Mono with Consolas fallback

#### Custom Animations
- **fade-in**: Smooth opacity transitions (0.5s ease-in-out)
- **slide-up**: Upward slide with fade (0.3s ease-out)
- **slide-down**: Downward slide with fade (0.3s ease-out)
- **pulse-slow**: Gentle pulsing effect (3s infinite)

### Component Patterns
- Consistent button styles with variants using custom colors
- Card-based layouts with proper shadows and borders
- Loading states with custom pulse animations
- Form components with validation states using color system
- Modal and overlay patterns with smooth transitions

## Performance Optimizations

- **Code Splitting**: Automatic route-based code splitting
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Responsive images with lazy loading
- **Bundle Analysis**: Optimized chunk sizes
- **Caching**: React Query for server state caching

## Accessibility

- **ARIA Labels**: Proper accessibility labels
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Compatible with screen readers
- **Color Contrast**: WCAG compliant color schemes
- **Focus Management**: Proper focus handling

## Development Guidelines

### Code Style
- Use TypeScript for all components
- Follow React hooks patterns
- Implement proper error boundaries
- Use semantic HTML elements
- Write descriptive component names

### State Management
- Use Zustand for global state
- Keep component state local when possible
- Implement proper loading and error states
- Use React Query for server state

### Testing (Planned)
- Unit tests with Jest and React Testing Library
- Integration tests for user workflows
- E2E tests with Playwright
- Visual regression testing

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
VITE_APP_NAME=Redis AI Platform
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Documentation

- [Styling Guide](docs/STYLING.md) - Comprehensive Tailwind CSS configuration and design system
- [Component Library](docs/COMPONENTS.md) - Reusable component documentation (coming soon)
- [API Integration](docs/API.md) - Frontend-backend integration guide (coming soon)

## Contributing

1. Follow the existing code style and patterns
2. Add TypeScript types for all new code
3. Include proper error handling
4. Test on multiple browsers and devices
5. Update documentation for new features

## Deployment

The frontend can be deployed to:

- **Vercel**: Automatic deployments from Git
- **Netlify**: Static site hosting with CI/CD
- **AWS S3 + CloudFront**: Scalable static hosting
- **Docker**: Containerized deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## License

This project is part of the Redis AI Platform and follows the same licensing terms.