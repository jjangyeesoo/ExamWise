# ExamWise - PMP Exam Bank with Gemini AI

ExamWise is an intelligent, bilingual Question Bank application specifically tailored for PMP (Project Management Professional) exam preparation. It leverages the power of Google's Gemini AI to automatically parse, translate, and structure complex exam questions from uploaded images.

## 🚀 Features

- **AI Image Parsing**: Upload a screenshot of a PMP question, and Gemini AI will automatically extract the question, options, answers, and even generate a detailed explanation.
- **📖 몰입형 공부 모드 (Study Mode)**: 영어와 한국어 지문을 대조하며 학습할 수 있는 전용 뷰어와 진행률 표시 기능 추가.
- **🔖 스마트 북마크 (오답 노트)**: 중요하거나 헷갈리는 문제를 별표로 표시하고, 따로 모아볼 수 있는 필터링 기능 구현.
- **🔍 고도화된 검색 및 필터**: PMP 도메인(People, Process, Business)별 필터링과 실시간 텍스트 검색 기능.
- **⌨️ 키보드 단축키 지원**: 마우스 없이도 Space(정답 확인), 방향키(이전/다음 문제)로 빠르게 학습 가능한 환경 구축.
- **🗄️ 스키마 확장**: 문제 번호(number)와 북마크 상태(is_bookmarked) 관리를 위한 SQLite 테이블 고도화.
- **Interactive Question List**: View, filter, and manage questions with an expandable Ant Design Vue table view.
- **Soft Deletion**: Safely bulk remove questions from the active view without permanently deleting historical data.

## 🛠️ Technology Stack

### Frontend
- **Vue 3** (Composition API)
- **Vite** (Next Generation Frontend Tooling)
- **Ant Design Vue** (Premium UI Component Library)
- **Pinia** (State Management)
- **Vue Router** (Client-side Routing)

### Backend
- **Node.js & Express** (Robust Backend Framework)
- **SQLite3** (Lightweight, File-based Relational Database)
- **Multer** (Multipart/form-data middleware for image uploads)
- **Google Generative AI SDK** (`gemini-2.5-flash-lite` for cost-effective, high-performance image analysis)

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/jjangyeesoo/ExamWise.git
cd ExamWise
```

### 2. Install Dependencies
This project uses npm workspaces. You can install all dependencies for both the frontend and backend efficiently from the root directory:
```bash
npm install
```

### 3. Environment Configuration (⚠️ IMPORTANT)
You must configure your environment variables for the Gemini AI integration to work. 

1. Navigate to the `server` directory.
2. Create a new file named `.env`.
3. Add your Google Gemini API key to the new file:

```env
# server/.env
GEMINI_API_KEY=your_actual_api_key_here
PORT=3000
```
*(You can get your free API key from [Google AI Studio](https://aistudio.google.com/))*

### 4. Run the Application
Start both the backend server and the frontend development server concurrently from the root directory with a single command:
```bash
npm run dev
```

- **Frontend Application**: `http://localhost:5173`
- **Backend API Server**: `http://localhost:3000`

## 📂 Project Structure

```text
ExamWise/
├── package.json          # Workspace Root Configuration
├── server/               # Express Backend
│   ├── src/
│   │   ├── config/       # SQLite DB Connection
│   │   ├── db/           # Schema definitions
│   │   └── routes/       # API endpoints (Questions, AI, Translation)
│   ├── .env              # Environment Variables (Create this!)
│   └── package.json
└── client/               # Vue 3 Frontend
    ├── src/
    │   ├── stores/       # Pinia State Management
    │   ├── views/        # Page Components (ListView, CreateView)
    │   ├── App.vue
    │   └── main.js
    └── package.json
```
