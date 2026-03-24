# KAYA - AI-Powered Fitness Application 🏋️‍♂️

<div align="center">

![KAYA Logo](https://img.shields.io/badge/KAYA-Fitness%20App-coral?style=for-the-badge&logo=firebase&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite)
![Firebase](https://img.shields.io/badge/Firebase-12.x-FFCA28?style=flat-square&logo=firebase)
![LINE LIFF](https://img.shields.io/badge/LINE-LIFF-00C300?style=flat-square&logo=line)

**Transform your fitness journey with AI-powered workouts, real-time pose detection, and seamless LINE integration**

[Demo](https://kaya-app.vercel.app) · [Report Bug](https://github.com/itzdeenzxx/Frontend-KAYA-final/issues) · [Request Feature](https://github.com/itzdeenzxx/Frontend-KAYA-final/issues)

</div>

---

## 📖 Overview

KAYA คือแอปพลิเคชันออกกำลังกายอัจฉริยะที่ผสานเทคโนโลยี AI เพื่อวิเคราะห์ท่าทางแบบ Real-time พร้อมระบบ Multi-device สามารถควบคุมการออกกำลังกายจากมือถือไปยังหน้าจอขนาดใหญ่ได้อย่างไร้รอยต่อ รองรับการเข้าสู่ระบบผ่าน LINE และเก็บข้อมูลสุขภาพบน Firebase

---

## ✨ Features

### 🔐 Authentication & User Management
- **LINE Login (LIFF)** - เข้าสู่ระบบผ่าน LINE แบบ Single Sign-On
- **Onboarding Flow** - ระบบลงทะเบียนพร้อมคำนวณ BMI อัตโนมัติ
- **Profile Management** - จัดการโปรไฟล์ น้ำหนัก ส่วนสูง เป้าหมายสุขภาพ
- **User Tiers** - ระบบระดับผู้ใช้ (Silver, Gold, Diamond, Diamond+)

### 🏃 Workout System
- **Smart Workout UI** - หน้าจอออกกำลังกายพร้อม Timer และ Rep Counter
- **AI Pose Detection** - วิเคราะห์ท่าทางด้วย MediaPipe Pose แบบ Real-time
- **Skeleton Overlay** - แสดง Skeleton และ Optical Flow บนหน้าจอ
- **Multi-device Mode**:
  - **Computer Mode** - ออกกำลังกายบนคอมพิวเตอร์โดยตรง
  - **Big Screen Mode** - แสดงผลบนหน้าจอใหญ่ (TV/Monitor)
  - **Remote Control** - ใช้มือถือควบคุมหน้าจอใหญ่
- **QR/Code Pairing** - จับคู่อุปกรณ์ด้วย QR Code หรือรหัส 5 หลัก
- **Workout Templates** - Template การออกกำลังกายหลากหลายรูปแบบ
- **Rest Timer** - จับเวลาพักระหว่างเซ็ต

### 🎵 Music Integration
- **Jamendo API** - สตรีมเพลงลิขสิทธิ์ฟรีขณะออกกำลังกาย
- **Workout Genres** - หมวดหมู่เพลงสำหรับออกกำลังกาย (Electronic, Rock, Hip Hop, etc.)
- **Remote Music Control** - ควบคุมเพลงจากมือถือไปยังหน้าจอใหญ่
- **Music Search** - ค้นหาเพลงตามชื่อหรือแนวเพลง

### 🍎 Nutrition Tracking
- **Meal Logging** - บันทึกอาหาร (Breakfast, Lunch, Dinner, Snack)
- **Calorie Counter** - คำนวณแคลอรี่อัตโนมัติ
- **Macro Tracking** - ติดตาม Protein, Carbs, Fats
- **Water Intake** - บันทึกปริมาณน้ำดื่ม
- **Nutrition Recommendations** - แนะนำอาหารเพื่อสุขภาพ

### 🤖 AI Coach
- **Chat Interface** - แชทกับ AI Coach แบบ Real-time
- **Voice Input** - พูดคุยด้วยเสียง (Speech-to-Text)
- **Workout Tips** - คำแนะนำการออกกำลังกาย
- **Motivation** - ข้อความให้กำลังใจ

### 🏆 Gamification
- **Badge System** - รับเหรียญรางวัลจากความสำเร็จ
- **Challenges** - ความท้าทายรายวัน/รายสัปดาห์
- **Streak Counter** - นับวันออกกำลังกายต่อเนื่อง
- **Points System** - สะสมคะแนนเพื่อเลื่อนระดับ

### 📊 Progress Tracking
- **Dashboard** - หน้าแรกแสดงสรุปข้อมูลทั้งหมด
- **Stats Cards** - แสดงสถิติ Calories, Duration, Workouts
- **Progress Ring** - วงกลมแสดงความคืบหน้าสู่เป้าหมาย
- **Workout History** - ประวัติการออกกำลังกายทั้งหมด

### 🌐 Internationalization
- **Thai & English** - รองรับ 2 ภาษา
- **Auto Language Detection** - ตรวจจับภาษาจาก LINE

### ⚙️ Settings
- **Notification Controls** - ตั้งค่าการแจ้งเตือน
- **Dark/Light Mode** - เปลี่ยนธีมหน้าจอ
- **Connected Devices** - จัดการอุปกรณ์ที่เชื่อมต่อ
- **Workout Preferences** - ตั้งค่าการออกกำลังกาย

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **TypeScript** | Type Safety |
| **Vite** | Build Tool & Dev Server |
| **Tailwind CSS** | Utility-first CSS |
| **shadcn/ui** | UI Component Library |
| **Framer Motion** | Animations |
| **React Router v6** | Client-side Routing |
| **React Query** | Server State Management |
| **React Hook Form + Zod** | Form Handling & Validation |

### Backend & Services
| Service | Purpose |
|---------|---------|
| **Firebase Firestore** | Real-time Database |
| **Firebase Analytics** | User Analytics |
| **LINE LIFF SDK** | LINE Login & Integration |
| **Jamendo API** | Music Streaming |
| **MediaPipe Pose** | AI Pose Detection |

### Additional Libraries
| Library | Purpose |
|---------|---------|
| **i18next** | Internationalization |
| **Recharts** | Data Visualization |
| **date-fns** | Date Utilities |
| **qrcode.react** | QR Code Generation |
| **Lucide React** | Icon Library |

---

## 📁 Project Structure

```
frontend/
├── public/
│   └── robots.txt
├── src/
│   ├── assets/                    # Static assets (images, etc.)
│   ├── components/
│   │   ├── gamification/          # Gamification components
│   │   │   ├── BadgeGrid.tsx      # Badge display grid
│   │   │   ├── ChallengeCard.tsx  # Challenge cards
│   │   │   └── Leaderboard.tsx    # Leaderboard component
│   │   ├── layout/                # Layout components
│   │   │   ├── AppLayout.tsx      # Main app layout
│   │   │   └── BottomNav.tsx      # Bottom navigation bar
│   │   ├── music/                 # Music player components
│   │   │   ├── BigScreenMusicPlayer.tsx
│   │   │   ├── MusicPlayer.tsx
│   │   │   └── RemoteMusicPlayer.tsx
│   │   ├── pairing/               # Device pairing components
│   │   │   ├── CodePairing.tsx    # Code input pairing
│   │   │   └── QRPairing.tsx      # QR code pairing
│   │   ├── shared/                # Shared UI components
│   │   │   ├── PoseOverlay.tsx    # Pose detection overlay
│   │   │   ├── ProgressRing.tsx   # Circular progress
│   │   │   ├── RepCounter.tsx     # Repetition counter
│   │   │   ├── RestTimer.tsx      # Rest timer
│   │   │   ├── SkeletonOverlay.tsx # Skeleton visualization
│   │   │   ├── StatCard.tsx       # Statistics card
│   │   │   ├── StreakCounter.tsx  # Streak display
│   │   │   └── TierBadge.tsx      # User tier badge
│   │   ├── ui/                    # shadcn/ui components
│   │   │   └── ...                # 40+ UI components
│   │   └── workout/               # Workout components
│   │       ├── TemplateCard.tsx   # Workout template card
│   │       └── WorkoutBuilder.tsx # Workout builder
│   ├── contexts/
│   │   └── AuthContext.tsx        # Authentication state
│   ├── hooks/
│   │   ├── useFirestore.ts        # Firestore operations
│   │   ├── useJamendo.ts          # Jamendo API hook
│   │   ├── useMediaPipePose.ts    # MediaPipe pose detection
│   │   ├── use-mobile.tsx         # Mobile detection
│   │   └── use-toast.ts           # Toast notifications
│   ├── lib/
│   │   ├── firebase.ts            # Firebase configuration
│   │   ├── firestore.ts           # Firestore services
│   │   ├── i18n.ts                # Internationalization config
│   │   ├── liff.ts                # LINE LIFF utilities
│   │   ├── mockData.ts            # Mock data for testing
│   │   ├── session.ts             # Device session management
│   │   ├── types.ts               # TypeScript types
│   │   └── utils.ts               # Utility functions
│   ├── pages/
│   │   ├── AICoach.tsx            # AI Coach chat page
│   │   ├── Dashboard.tsx          # Main dashboard
│   │   ├── NotFound.tsx           # 404 page
│   │   ├── Nutrition.tsx          # Nutrition tracking
│   │   ├── Onboarding.tsx         # User onboarding flow
│   │   ├── Profile.tsx            # User profile
│   │   ├── Settings.tsx           # App settings
│   │   ├── WorkoutBigScreen.tsx   # Big screen workout display
│   │   ├── WorkoutMode.tsx        # Workout mode selection
│   │   ├── WorkoutRemote.tsx      # Mobile remote control
│   │   └── WorkoutUI.tsx          # Main workout interface
│   ├── App.tsx                    # Main App component
│   ├── main.tsx                   # Application entry point
│   └── index.css                  # Global styles
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── vercel.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x หรือ **bun** >= 1.x
- **Firebase Project** with Firestore enabled
- **LINE Developers Account** with LIFF app

### Environment Variables

สร้างไฟล์ `.env.local` ใน root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# LINE LIFF Configuration
VITE_LIFF_ID=your_liff_id
VITE_LINE_CHANNEL_ID=your_channel_id

# Jamendo API (optional - has default)
VITE_JAMENDO_CLIENT_ID=your_jamendo_client_id
```

### Installation

```bash
# Clone the repository
git clone https://github.com/itzdeenzxx/Frontend-KAYA-final.git

# Navigate to project directory
cd Frontend-KAYA-final/frontend

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev
```

แอปจะรันที่ `http://localhost:8080`

### Build for Production

```bash
# Build production bundle
npm run build

# Preview production build
npm run preview
```

---

## 📜 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run build:dev` | Build with development mode |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code linting |

---

## 🔄 Application Flow

### Authentication Flow
```
User Opens App
     ↓
LIFF Initialize
     ↓
Check LINE Login ──→ Not Logged In ──→ LINE Login
     ↓                                      ↓
Logged In                              Redirect Back
     ↓                                      ↓
Check New User ────→ New User ────────→ Onboarding
     ↓                                      ↓
Existing User                          Save to Firestore
     ↓                                      ↓
Load User Data                         Complete
     ↓                                      ↓
Dashboard ←─────────────────────────────────┘
```

### Multi-device Workout Flow
```
Desktop/TV                              Mobile
    │                                      │
    ├── Select "Big Screen Mode"           │
    │                                      │
    ├── Generate Pairing Code/QR           │
    │                                      │
    │←─────── Scan QR / Enter Code ────────┤
    │                                      │
    ├── Session Connected                  │
    │                                      │
    ├── Display Workout + Camera ←──── Control Workout
    │                                      │
    ├── Show Skeleton Overlay ←──── Toggle Skeleton
    │                                      │
    ├── Play Music ←───────────────── Control Music
    │                                      │
    └── End Session                        │
```

---

## 🎨 UI Components

### shadcn/ui Components Used
- Accordion, Alert, Alert Dialog
- Avatar, Badge, Breadcrumb
- Button, Calendar, Card, Carousel
- Checkbox, Collapsible, Command
- Context Menu, Dialog, Drawer
- Dropdown Menu, Form, Hover Card
- Input, Label, Menubar, Navigation Menu
- Pagination, Popover, Progress
- Radio Group, Resizable, Scroll Area
- Select, Separator, Sheet, Sidebar
- Skeleton, Slider, Switch
- Table, Tabs, Textarea
- Toast, Toaster, Toggle, Tooltip

---

## 📊 Database Schema (Firestore)

### Collections
```
users/
├── {userId}/
│   ├── displayName: string
│   ├── pictureUrl: string
│   ├── nickname: string
│   ├── tier: "silver" | "gold" | "diamond" | "diamondPlus"
│   ├── points: number
│   ├── streakDays: number
│   └── createdAt: timestamp

healthData/
├── {userId}/
│   ├── weight: number
│   ├── height: number
│   ├── age: number
│   ├── gender: string
│   ├── bmi: number
│   └── activityLevel: string

workoutHistory/
├── {sessionId}/
│   ├── userId: string
│   ├── workoutName: string
│   ├── duration: number
│   ├── caloriesBurned: number
│   └── completedAt: timestamp

nutritionLogs/
├── {logId}/
│   ├── userId: string
│   ├── meals: array
│   ├── totalCalories: number
│   └── waterIntake: number

sessions/
├── {pairingCode}/
│   ├── hostDeviceId: string
│   ├── hostType: string
│   ├── status: string
│   ├── currentExercise: number
│   └── musicState: object
```

---

## 🔌 API Integrations

### LINE LIFF
- Login/Logout
- Get User Profile
- Share Messages
- QR Code Scanner
- Close Window (in-app)

### Jamendo Music API
- Search Tracks
- Get by Genre
- Stream Audio
- Workout Playlists

### MediaPipe Pose
- Real-time Pose Detection
- 33 Body Landmarks
- Skeleton Visualization
- Optical Flow Analysis

---

## 🌍 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Manual Build
```bash
npm run build
# Deploy dist/ folder to any static hosting
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is proprietary software. All rights reserved.

---

## 👨‍💻 Author

**itzdeenzxx**
- GitHub: [@itzdeenzxx](https://github.com/itzdeenzxx)

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [MediaPipe](https://mediapipe.dev/) - AI Pose Detection
- [Jamendo](https://www.jamendo.com/) - Free Music API
- [LINE Developers](https://developers.line.biz/) - LIFF SDK
- [Firebase](https://firebase.google.com/) - Backend Services

---

<div align="center">
Made with ❤️ by KAYA Team
</div>
