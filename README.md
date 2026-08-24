# VendaLink

**Find local street vendors near you** — A location-based marketplace platform connecting customers with informal traders. Discover nearby vendors with live status, stock availability, and payment options.

---

## 🌍 About VendaLink

VendaLink bridges the gap between customers and street vendors by providing a digital platform for the informal economy. Customers can discover traders in their area, check real-time availability, browse inventory, and learn about payment methods — all in one place.

Built for **GKHack26** · Supporting the Street Economy

---

## ✨ Features

- 📍 **Location-Based Discovery** — Find vendors near you using GPS
- ⏰ **Real-Time Status** — See who's open now
- 🛍️ **Product Browsing** — View inventory and stock availability
- 💳 **Payment Methods** — Check accepted payment options
- 🏪 **Vendor Dashboard** — Manage profiles, products, and reviews
- ⭐ **Rating System** — Community reviews and ratings

---

## 📁 Project Structure

```
VendaLink Final/
├── index.html              # Customer homepage
├── app.js                  # Frontend logic
├── styles.css              # Styling
├── vendor-admin.html       # Vendor admin panel
├── vendor-signup.html      # Vendor registration
├── vendor.js               # Vendor app logic
├── vendor-app.js           # Vendor dashboard
├── settings.json           # Configuration
├── .gitignore              # Git ignore rules
│
├── backend/                # Node.js backend
│   ├── server.js           # Express server
│   ├── db.js               # Database connection
│   ├── package.json        # Dependencies
│   ├── routes/
│   │   ├── auth.js         # Authentication routes
│   │   ├── vendors.js      # Vendor management
│   │   ├── products.js     # Product routes
│   │   └── reviews.js      # Review routes
│   └── .gitignore
│
└── database/               # Database files
    ├── schema.sql          # Main schema
    └── schema1.sql         # Additional schema
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- PostgreSQL

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/The-Technoids/vendalink.git
   cd vendalink
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cd backend
   cp .env.example .env
   ```
   Update `.env` with your configuration:
   ```
   PORT=5000
   DATABASE_URL=sqlite:///vendalink.db
   JWT_SECRET=your_secret_key
   NODE_ENV=development
   ```

4. **Initialize the database**
   ```bash
   npm run db:migrate
   ```

### Running the Application

**Backend:**
```bash
cd backend
npm start
```
Server runs at `http://localhost:5000`

**Frontend:**
Open `index.html` in your browser or serve with a local server:
```bash
npx http-server
```
Frontend runs at `http://localhost:8080`

---

## 🛠️ Tech Stack

**Frontend:**
- HTML5
- CSS3
- Vanilla JavaScript
- Geolocation API

**Backend:**
- Node.js
- Express.js
- PostgreSQL
- JWT Authentication

**Database:**
- SQL-based schema
- Relational data model

---

## 📝 API Routes

### Authentication (`/routes/auth.js`)
- POST `/api/auth/signup` — Register new user
- POST `/api/auth/login` — User login
- POST `/api/auth/vendor-signup` — Vendor registration

### Vendors (`/routes/vendors.js`)
- GET `/api/vendors` — List vendors near location
- GET `/api/vendors/:id` — Get vendor details
- POST `/api/vendors` — Create vendor profile
- PUT `/api/vendors/:id` — Update vendor profile

### Products (`/routes/products.js`)
- GET `/api/products` — List all products
- GET `/api/vendors/:id/products` — Get vendor's products
- POST `/api/products` — Add product
- PUT `/api/products/:id` — Update product

### Reviews (`/routes/reviews.js`)
- GET `/api/vendors/:id/reviews` — Get vendor reviews
- POST `/api/reviews` — Submit review

---

## 🔐 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=sqlite:///vendalink.db

# Authentication
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRE=7d

# API
CORS_ORIGIN=http://localhost:8080
```

**Never commit `.env` file to Git** — it's already in `.gitignore`

---

## 📚 Development

### Running Tests
```bash
cd backend
npm test
```

### Building for Production
```bash
npm run build
```

### Code Style
The project uses standard JavaScript conventions. Ensure consistency before committing.

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see LICENSE file for details.

---

## 💬 Support & Contact

Have questions? Found a bug?
- Open an issue on GitHub
- Check existing documentation

---

## 🙏 Acknowledgments

- Built for **GKHack26**
- Supporting the informal economy and street vendors
- Community-driven development

---

**Made with ❤️ for street vendors everywhere**

