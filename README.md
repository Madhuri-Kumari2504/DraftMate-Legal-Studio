
<div align="center">

# ⚖️ DraftMate Legal Studio

### ✨ Intelligent Legal Drafting, Reimagined

**An AI-powered legal workspace for smarter drafting, faster reviews, and efficient document management.**

<br>

[![Live Demo](https://img.shields.io/badge/🚀_LIVE_DEMO-Launch_Application-00C896?style=for-the-badge)](https://draft-mate-legal-studio--draftmate.replit.app)
[![Team](https://img.shields.io/badge/TEAM-codeX-8B5CF6?style=for-the-badge)](#-meet-team-codex)
[![Status](https://img.shields.io/badge/STATUS-Active_Development-2563EB?style=for-the-badge)](#-project-roadmap)

<br>

### 🌐 [Explore the Live Application](https://draft-mate-legal-studio--draftmate.replit.app)

**Built with innovation and passion by Team codeX**

</div>

---

## 🌟 About DraftMate

> **"Draft Smarter. Review Faster. Work Confidently."**

**DraftMate Legal Studio** is an AI-powered legal technology platform designed to simplify document drafting, contract analysis, and legal content refinement.

Our goal is to bridge the gap between complex legal workflows and modern artificial intelligence through an intuitive, accessible digital workspace.

### 🎯 Our Mission

To empower legal professionals, students, and organizations with intelligent tools that help reduce repetitive drafting work and improve productivity while preserving human oversight.

---

## 💎 Core Features

| Feature | Description |
|:---|:---|
| 🤖 **AI-Powered Drafting** | Generate and refine legal text using artificial intelligence |
| 📄 **Legal Document Workspace** | Work with legal drafts in an organized interface |
| 🔍 **Contract Review** | Assist with reviewing contracts and legal clauses |
| ✍️ **Smart Refinement** | Improve clarity, structure, and tone |
| 🎨 **Modern Dashboard** | Responsive, user-friendly legal workspace |
| ⚡ **Backend API** | Express-based API architecture |
| 🧠 **AI Integration** | OpenAI-powered legal assistance |

---

## 🛠️ Technology Stack

<div align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)

</div>

| Component | Technology |
|:---|:---|
| **Frontend** | React, TypeScript, Vite |
| **Backend** | Node.js, Express |
| **Database** | PostgreSQL |
| **ORM** | Drizzle ORM |
| **AI Engine** | OpenAI API |
| **Package Manager** | pnpm |
| **Deployment** | Replit |

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    A["👤 User"] --> B["⚛️ React Frontend"]
    B --> C["⚡ Express Backend"]
    C --> D["🤖 OpenAI Integration"]
    C --> E["🗄️ PostgreSQL"]
    E --> F["🔧 Drizzle ORM"]

    style A fill:#172554,color:#ffffff
    style B fill:#1d4ed8,color:#ffffff
    style C fill:#6d28d9,color:#ffffff
    style D fill:#047857,color:#ffffff
    style E fill:#0f766e,color:#ffffff
    style F fill:#334155,color:#ffffff
```

---

## 📂 Project Structure

```text
DraftMate-Legal-Studio/
│
├── artifacts/
│   ├── draftmate-studio/      # React Frontend
│   └── api-server/            # Express Backend
│
├── lib/
│   └── db/                    # Database Configuration
│
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Madhuri-Kumari2504/DraftMate-Legal-Studio.git
cd DraftMate-Legal-Studio
```

### 2️⃣ Install Dependencies

Ensure Node.js and pnpm are installed.

```bash
pnpm install
```

### 3️⃣ Configure Environment Variables

Set the following server-side environment variables:

```env
DATABASE_URL=your_postgresql_connection_string
OPENAI_API_KEY=your_openai_api_key
PORT=8000
```

Never commit actual API keys or passwords to GitHub.

### 4️⃣ Initialize Database

```bash
pnpm --filter @workspace/db run push
```

### 5️⃣ Start Backend

```bash
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run start
```

### 6️⃣ Start Frontend

Configure the frontend API URL and required Vite environment variables.

```bash
pnpm --filter @workspace/draftmate-studio run dev
```

---

## 🌐 Live Application

<div align="center">

### 🚀 Experience DraftMate Legal Studio

**AI-powered legal drafting at your fingertips.**

[![Launch App](https://img.shields.io/badge/LAUNCH_DRAFTMATE-OPEN_LIVE_WEBSITE-00C896?style=for-the-badge&logo=googlechrome&logoColor=white)](https://draft-mate-legal-studio--draftmate.replit.app)

**Website:** https://draft-mate-legal-studio--draftmate.replit.app

</div>

---

## 👨‍💻 Meet Team codeX

<div align="center">

### 💜 The Minds Behind DraftMate

**Team codeX**

*Building innovative technology solutions through collaboration, creativity, and engineering.*

</div>

| Role | Name | Responsibility |
|:---|:---|:---|
| 👑 **Team Leader** | **Alka Kumari** | Team leadership, coordination, and project direction |
| 💻 **Development Team** | **Team codeX** | Application development, integration, and improvements |

### 🌟 Our Team Philosophy

> **"Think Bold. Build Smart. Code Beyond Limits."**

At **codeX**, we believe meaningful innovation comes from combining technical expertise, creativity, teamwork, and real-world problem-solving.

DraftMate Legal Studio reflects our commitment to developing intelligent solutions that make professional workflows more efficient and accessible.

---

## 🗺️ Project Roadmap

- [ ] Advanced AI-powered clause comparison
- [ ] Automated legal risk assessment
- [ ] Secure cloud document storage
- [ ] Document version control
- [ ] Multi-user collaboration
- [ ] Enhanced document export
- [ ] Expanded legal document templates
- [ ] Role-based access controls

*Roadmap items represent planned enhancements, not existing functionality.*

---

## 🔐 Security & Privacy

Legal documents may contain confidential information.

Production deployments should include:

- Secure authentication and authorization
- Encrypted communication
- Appropriate data protection and retention
- Secure API key management
- Access controls for sensitive documents

---

## ⚖️ Legal Disclaimer

DraftMate Legal Studio is an AI-assisted software platform and does not provide professional legal advice.

AI-generated or AI-reviewed documents may contain inaccuracies. Users should consult qualified legal professionals before relying on generated content for legal matters.

---

## 🤝 Contributing

We welcome ideas, improvements, and constructive feedback.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Submit a pull request.

---

<div align="center">

## 💜 Crafted by Team codeX

### 👑 Led by Alka Kumari

**Innovation • Collaboration • Technology**

<br>

[![GitHub](https://img.shields.io/badge/GitHub-View_Repository-181717?style=for-the-badge&logo=github)](https://github.com/Madhuri-Kumari2504/DraftMate-Legal-Studio)
[![Live Website](https://img.shields.io/badge/Live_Website-Explore_DraftMate-00C896?style=for-the-badge)](https://draft-mate-legal-studio--draftmate.replit.app)

### ⚖️ DraftMate Legal Studio

**Draft Smarter. Review Faster. Work Confidently.**

Made with ❤️ by **Team codeX**

⭐ **Star this repository if you like our project!**

</div>
