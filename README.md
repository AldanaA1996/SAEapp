# Project Overview: SAEapp

This document provides a high-level overview of the `SAEapp` project, outlining its architecture, technologies, and structure.

## Core Technologies

- **Framework**: [Astro](https://astro.build/) (`v5.13.7`) serves as the primary web framework, managing the overall structure and build process.
- **UI Library**: [React](https://react.dev/) (`v19.1.1`) is used via Astro's integration (`@astrojs/react`) for building interactive user interfaces.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (`v4.1.13`) is used for utility-first styling, configured as a Vite plugin.
- **UI Components**:
  - [Radix UI](https://www.radix-ui.com/): A set of unstyled, accessible UI primitives for building the design system.
  - [Lucide React](https://lucide.dev/): Provides a library of SVG icons.
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) is used for lightweight, client-side state management within the React application.
- **Forms**: [React Hook Form](https://react-hook-form.com/) (`v7.62.0`) is used for managing form state and validation.
- **Schema Validation**: [Zod](https://zod.dev/) is used to define schemas and validate data, especially for forms.
- **Backend & Database**: [Supabase](https://supabase.com/) (`v2.57.4`) provides the backend-as-a-service, handling database, authentication, and other backend logic.
- **Routing**:
  - **Server-side**: Astro's file-based routing for top-level pages (`/`, `/login`).
  - **Client-side**: [React Router](https://reactrouter.com/) (`v7.8.2`) manages navigation within the core single-page application.

## Project Structure

The project follows a hybrid architecture that leverages both server-side rendering (SSR) and a client-side single-page application (SPA).

- `astro.config.mjs`: Main configuration file for Astro, including integrations like React and Tailwind CSS.
- `src/pages/`: Contains the Astro pages.
  - `index.astro`: The public-facing landing page.
  - `login.astro`: The user login page.
  - `app/[...route].astro`: A catch-all dynamic route that serves as the entry point for the client-side React application.
- `src/app/`: This directory contains the core React SPA.
  - `App.tsx`: The root component of the React application, which sets up client-side routing.
  - `components/`: Contains reusable React components, including forms (`addMaterial-form.tsx`), UI elements (`sidebar.tsx`), and page-level components (`Dashboard.tsx`).
  - `lib/supabaseClient.ts`: The Supabase client instance is initialized and exported from here.
  - `store/`: Zustand store definitions for managing global state like authentication.
- `public/`: Contains static assets like images and favicons.
- `utils/`: Contains utility functions, such as SEO configuration.

## Inferred Features

Based on the file structure, the application appears to be an internal tool for managing resources:

- **Authentication**: User login and protected routes.
- **Dashboard**: A central dashboard page.
- **Tool Management**: Functionality to view and add tools (`Tools.tsx`, `addTool-form.tsx`).
- **Material Management**: Functionality to view and add materials (`MaterialsList.tsx`, `addMaterial-form.tsx`).
- **Department Management**: A grid view for departments and detailed views for each (`departmentsGrid.tsx`, `[id].tsx`).

## Getting Started

To run the project locally, use the following standard Astro commands:

- **Install dependencies**: `npm install`
- **Run development server**: `npm run dev`
- **Build for production**: `npm run build`
- **Preview production build**: `npm run preview`
