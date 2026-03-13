# 🔒 Lockify — Secure Password Manager

Lockify is a premium, secure password management solution built with a focus on privacy and zero-knowledge encryption. It allows users to safely store, manage, and generate strong passwords, ensuring that their digital life is protected by military-grade encryption.

## ✨ Key Features

- **🛡️ Zero-Knowledge Encryption**: Your master password never leaves your device. AES-256 encryption ensures only you can access your vault.
- **⚡ One-Click Autofill**: Easily manage credentials and access them instantly.
- **🔑 Password Generator**: Create unbreakable passwords (up to 128 characters) with customizable complexity.

- **📤 Secure Sharing**: Share passwords with trusted contacts via end-to-end encrypted links.


## 🚀 Tech Stack

### Frontend
- **React 19** & **Vite**
- **React Router 7**
- **CSS** for modern, responsive UI
- **Lucide Icons** (inline SVG implementation)

### Backend
- **Node.js** & **Express**
- **MongoDB** with **Mongoose**
- **JWT & BcryptJS** for secure authentication
- **Nodemailer** for OTP and email notifications
- **Helmet & Morgan** for security and logging

---

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local or Atlas)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/lockify.git
cd lockify
```

### 2. Backend Setup
```bash
cd Backend
npm install
```
Create a `.env` file in the `Backend` directory and add the following:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=your_32_char_encryption_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
CLIENT_URL=http://localhost:5173
```
Run the backend:
```bash
node server.js
```

### 3. Frontend Setup
```bash
cd ../Frontend
npm install
npm run dev
```
---

## 🔒 Security Architecture
Lockify utilizes a zero-knowledge architecture. This means:
1. Data is encrypted on the client side before being sent to the server.
2. The master password is never stored or transmitted in plain text.
3. Encryption keys are derived from the master password using PBKDF2.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is licensed under the MIT License.
