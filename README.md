# AI Study Companion App 🎓

A powerful, intelligent study companion designed to help students organize their learning materials, analyze syllabi, and practice with flashcards and quizzes. Built with modern web technologies and powered by **Google Gemini AI**.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 🚀 Key Features

-   **🧠 AI-Powered Insights**:
    -   **Quiz Generation**: Instantly create quizzes from your study materials using Google Gemini.
    -   **Smart Summaries**: Get concise summaries of long documents and notes.
    -   **Handwriting Recognition**: Upload photos of your handwritten notes and convert them to digital text automatically.
-   **📊 Smart Dashboard**: A personalized overview of your study progress, upcoming tasks, and analytics.
-   **📚 Material Management**: Upload and organize PDFs, notes, and resources in a dedicated library.
-   **📝 Syllabus Analysis**: Intelligent breakdown of course syllabi to help you prioritize.
-   **🗂️ Interactive Flashcards**: Create and practice with flashcards using spaced repetition.
-   **⏱️ Focus Mode**: Built-in Pomodoro timer to help you stay productive and avoid burnout.
-   **🔐 Secure Authentication**: User profiles and data protected by Supabase Auth and Row Level Security (RLS).
-   **📱 Responsive & Offline-Ready**: Works on all devices and caches data locally for offline access.

## 🛠️ Tech Stack

**Frontend:**
-   [React](https://react.dev/) + [Vite](https://vitejs.dev/) - Fast, modern UI development.
-   [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/) - Beautiful, accessible components.
-   [Zustand](https://zustand-demo.pmnd.rs/) - Lightweight state management.
-   [TanStack Query](https://tanstack.com/query) - Efficient data fetching and caching.

**Backend & AI:**
-   [Supabase](https://supabase.com/) - Open Source Firebase alternative (PostgreSQL Database, Auth).
-   [Google Gemini API](https://ai.google.dev/) - Multimodal Generative AI for text and vision tasks.

## 🏁 Getting Started

Follow these steps to get the project running locally.

### Prerequisites
-   Node.js (v18 or higher)
-   npm or pnpm

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/ai-study-companion.git
    cd ai-study-companion
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory. You will need API keys from **Supabase** and **Google AI Studio**.

    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    SUPABASE_ANON_KEY=your_supabase_anon_key
    GEMINI_API_KEY=your_gemini_api_key
    ```
    > **Note**: See `supabase_setup.md` in the project root for detailed database initialization steps.

4.  **Start the Development Server**
    ```bash
    npm run dev
    ```
    The app should now be running at `http://localhost:5173`.

## 📜 Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Builds the app for production.
-   `npm run lint`: Runs ESLint to check for code quality issues.
-   `npm run format`: Formats code using Prettier.
-   `npm run typescript-check`: Checks for TypeScript type errors.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
