# Hemas FMCG Distribution Channel Dashboard 📊

> **Strategic Micro-Market Tracking Engine vs. Generic Drift Vulnerabilities**

A full-stack MERN (MongoDB, Express, React, Node.js) operational dashboard designed to monitor and combat "Generic Drift" within Hemas Holdings PLC's retail networks in Sri Lanka. 

When macroeconomic instability drives price-sensitive consumers from established corporate brands to unregulated generic alternatives, this system provides real-time, route-level alerting before market share is irrevocably lost.

---

## 📸 System Previews

<!-- INSERT IMAGE HERE: Dashboard Overview / Area Manager View -->

*Figure 1: The Area Manager portal highlighting the Code Red Aggregation Alerts and Global Channels Overview.*

<!-- INSERT IMAGE HERE: Field Supervisor Form -->

*Figure 2: The Field Supervisor view restricted to data collection and route updates.*

---

## 🚀 Key Features

* **Role-Based Access Control (RBAC):** Dynamic UI rendering toggles between **Field Supervisors** (restricted to field data ingestion) and **Area Managers** (full CRUD access and strategic alerting).
* **Automated Data Integrity:** The backend automatically calculates complex variables (like `price_gap_percent`) upon data ingestion to prevent human error during field surveys.
* **Complex NoSQL Aggregation Engine:** Utilizes advanced MongoDB pipelines (`$lookup`, `$unwind`, `$match`, `$project`) to join real-time sales logs with macro-economic indicators seamlessly.
* **"Code Red" Tipping Point Alerts:** Automatically flags distribution routes when consumer loyalty breaks down based on the established analytic rule:
  * `Price_Gap_Percent > 18%` **AND** `Local_Food_Inflation_Rate > 4.5%` **AND** `Active Stockouts`.

---

## 🛠️ Technology Stack

* **Database:** MongoDB Atlas (NoSQL Document Store)
* **Backend:** Node.js & Express.js
* **Frontend:** React.js (via Vite)
* **HTTP Client:** Axios
* **ODM:** Mongoose

---

## 🗄️ Database Architecture (BSON Collections)

The database structure is normalized across four distinct collections to optimize read/write speeds for field telemetry while allowing for relational joins via aggregation:

1. `users`: Manages RBAC roles (`Field_Supervisor`, `Area_Manager`).
2. `distributor_routes`: Tracks live sales velocity, localized pricing gaps, and channel health.
3. `economic_indicators`: Houses high-velocity macroeconomic variables contextually matched to geographic clusters.
4. `retail_outlets`: Captures profile metadata for individual traditional retail storefronts ("kades").

<!-- INSERT IMAGE HERE: Database Schema/Compass View -->


*Figure 3: View of the BSON document structure inside MongoDB Compass.*

---

## ⚙️ Installation & Setup

### Prerequisites
* Node.js (v16+)
* MongoDB (Local instance or Atlas Cluster)

### 1. Clone the Repository
```bash
git clone [https://github.com//.git](https://github.com//.git)
cd hemas-fmcg-dashboard
