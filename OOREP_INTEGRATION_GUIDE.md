# OOREP Integration Guide for Abel Wellness

A complete, step-by-step guide to deploying your own OOREP (Open Online Repertory for Homeopathy) instance and integrating it into your Abel Wellness application.

---

## Table of Contents

1. [What is OOREP?](#1-what-is-oorep)
2. [Prerequisites](#2-prerequisites)
3. [Deploying OOREP with Docker](#3-deploying-oorep-with-docker)
4. [Testing Your OOREP Instance](#4-testing-your-oorep-instance)
5. [Understanding OOREP API Endpoints](#5-understanding-oorep-api-endpoints)
6. [Integrating OOREP into Abel Wellness](#6-integrating-oorep-into-abel-wellness)
7. [Creating the OOREP Page](#7-creating-the-oorep-page)
8. [Adding Floating Widget to Consultation](#8-adding-floating-widget-to-consultation)
9. [Troubleshooting](#9-troubleshooting)
10. [Production Deployment](#10-production-deployment)

---

## 1. What is OOREP?

OOREP (Open Online Repertory) is a free, open-source web application for looking up homeopathic repertories and materia medicas. It allows doctors to:

- **Search Repertories**: Find symptoms and their associated remedies (Kent, Boger, Hering, Publicum, etc.)
- **Search Materia Medica**: Look up detailed remedy information (Boericke, Allen, Clarke, etc.)
- **Build Cases**: Collect rubrics for a patient and analyze remedy matches
- **Repertorisation**: Cross-reference symptoms to find the most suitable remedies

### Key Features for Doctors

- Search with wildcards (`head*`), exact phrases (`"wisdom teeth"`), and exclusions (`-abdomen`)
- Filter by remedy weight (1-5, where higher means stronger indication)
- View remedies associated with each symptom
- Build and save patient cases

---

## 2. Prerequisites

Before starting, ensure you have the following installed on your system:

### 2.1 Install Docker Desktop

Docker allows you to run OOREP in an isolated container without installing all its dependencies.

**For Windows:**

1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
2. Run the installer
3. During installation, ensure "Use WSL 2 instead of Hyper-V" is checked (recommended)
4. Restart your computer when prompted
5. Open Docker Desktop and wait for it to start (you'll see "Docker Desktop is running" in the system tray)

**Verify Docker is installed:**

```powershell
docker --version
# Should output something like: Docker version 24.0.0, build xxxxx

docker-compose --version
# Should output something like: Docker Compose version v2.20.0
```

### 2.2 Install Git

Git is needed to clone the OOREP repository.

**For Windows:**

1. Download Git from: https://git-scm.com/download/win
2. Run the installer with default options
3. Restart your terminal

**Verify Git is installed:**

```powershell
git --version
# Should output something like: git version 2.42.0.windows.1
```

### 2.3 System Requirements

- **RAM**: At least 4GB free (8GB recommended)
- **Disk Space**: At least 5GB free
- **Ports**: 9000 and 5432 should be available (we'll configure these)

---

## 3. Deploying OOREP with Docker

### 3.1 Create a Directory for OOREP

Open PowerShell and run:

```powershell
# Create a directory for OOREP (you can choose any location)
mkdir C:\oorep
cd C:\oorep
```

### 3.2 Clone the OOREP Repository

```powershell
git clone https://github.com/nondeterministic/oorep.git
cd oorep
```

### 3.3 Examine the Docker Configuration

OOREP comes with Docker configuration files. Let's understand what we have:

```powershell
# List the docker directory contents
dir docker
```

You should see:

- `docker-compose.yml` - Orchestrates all services
- `Dockerfile.backend` - Instructions to build the OOREP backend
- `nginx.conf` - Web server configuration
- Other configuration files

### 3.4 Create Environment Configuration

Create a `.env` file in the `docker` directory with your configuration:

```powershell
cd docker
```

Create a file named `.env` with the following content:

```env
# OOREP Configuration for Abel Wellness

# Application Settings
OOREP_APP_PROTOCOL=http
OOREP_APP_HOSTNAME=localhost
OOREP_APP_DOMAIN=localhost
OOREP_APP_PORT=9000

# Database Settings (PostgreSQL)
OOREP_DB_NAME=oorep
OOREP_DB_USER=oorep_user
OOREP_DB_PASS=your_secure_password_here_change_this
OOREP_DB_HOST=db
OOREP_DB_PORT=5432

# Mail Settings (optional, for user registration)
OOREP_MAIL_SERVER=smtp.gmail.com
OOREP_MAIL_USER=your_email@gmail.com
OOREP_MAIL_PASS=your_app_password

# Logout URL (redirect after logout)
OOREP_URL_LOGOUT=http://localhost:9000

# Play Framework Secret (generate a random string)
PLAY_SECRET=change_this_to_a_random_64_character_string_for_security_abc123
```

**Important**: Change `OOREP_DB_PASS` and `PLAY_SECRET` to secure random values!

### 3.5 Create docker-compose.yml (if not present or needs modification)

If the existing docker-compose.yml doesn't work, create/modify it in the `docker` directory:

```yaml
version: "3.8"

services:
  # PostgreSQL Database
  db:
    image: postgres:15-alpine
    container_name: oorep_db
    environment:
      POSTGRES_DB: ${OOREP_DB_NAME:-oorep}
      POSTGRES_USER: ${OOREP_DB_USER:-oorep_user}
      POSTGRES_PASSWORD: ${OOREP_DB_PASS:-oorep_pass}
    volumes:
      - oorep_pgdata:/var/lib/postgresql/data
      - ./init-db:/docker-entrypoint-initdb.d # For initial data
    ports:
      - "5433:5432" # External:Internal (using 5433 to avoid conflicts)
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "pg_isready -U ${OOREP_DB_USER:-oorep_user} -d ${OOREP_DB_NAME:-oorep}",
        ]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # OOREP Backend Application
  backend:
    build:
      context: ..
      dockerfile: docker/Dockerfile.backend
    container_name: oorep_backend
    environment:
      - OOREP_APP_PROTOCOL=${OOREP_APP_PROTOCOL:-http}
      - OOREP_APP_HOSTNAME=${OOREP_APP_HOSTNAME:-localhost}
      - OOREP_APP_DOMAIN=${OOREP_APP_DOMAIN:-localhost}
      - OOREP_APP_PORT=${OOREP_APP_PORT:-9000}
      - OOREP_DB_NAME=${OOREP_DB_NAME:-oorep}
      - OOREP_DB_USER=${OOREP_DB_USER:-oorep_user}
      - OOREP_DB_PASS=${OOREP_DB_PASS:-oorep_pass}
      - OOREP_DB_HOST=db
      - OOREP_DB_PORT=5432
      - PLAY_SECRET=${PLAY_SECRET:-change_me}
    ports:
      - "9000:9000"
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

volumes:
  oorep_pgdata:
    driver: local
```

### 3.6 Build and Start OOREP

Now let's build and start all services:

```powershell
# Make sure you're in the docker directory
cd C:\oorep\oorep\docker

# Build and start all services (this will take 10-20 minutes the first time)
docker-compose up --build -d
```

**What this does:**

- `--build`: Builds the Docker images from scratch
- `-d`: Runs in detached mode (background)

### 3.7 Monitor the Startup

Watch the logs to ensure everything starts correctly:

```powershell
# View logs from all services
docker-compose logs -f

# Or view logs from a specific service
docker-compose logs -f backend
docker-compose logs -f db
```

Press `Ctrl+C` to stop watching logs (the services keep running).

### 3.8 Check Service Status

```powershell
docker-compose ps
```

You should see both `oorep_db` and `oorep_backend` with status "Up".

---

## 4. Testing Your OOREP Instance

### 4.1 Access OOREP Web Interface

Open your browser and go to:

```
http://localhost:9000
```

You should see the OOREP homepage with:

- Search bar
- Repertory selection dropdown
- Information about available repertories

### 4.2 Test a Basic Search

1. Select a repertory (e.g., "Publicum" - the free/public one)
2. Enter a search term like "headache"
3. Click Search
4. You should see matching rubrics with associated remedies

### 4.3 Test the API Directly

Open a new PowerShell window and test the API:

```powershell
# Test if the server is running
curl http://localhost:9000

# Test repertory search API
curl "http://localhost:9000/api/lookup_rep?repertory=publicum&symptom=head&page=1&remedyString=&minWeight=1&getRemedies=1"
```

You should receive JSON responses with search results.

### 4.4 Verify Database Connection

```powershell
# Connect to the database container
docker exec -it oorep_db psql -U oorep_user -d oorep

# Inside psql, run:
\dt  # List tables
SELECT COUNT(*) FROM rubric;  # Count rubrics
SELECT COUNT(*) FROM remedy;  # Count remedies
\q   # Exit
```

---

## 5. Understanding OOREP API Endpoints

Here are the key API endpoints you'll use in Abel Wellness:

### 5.1 Public Endpoints (No Authentication Required)

| Endpoint                       | Method | Description                           | Example                                   |
| ------------------------------ | ------ | ------------------------------------- | ----------------------------------------- |
| `/api/lookup_rep`              | GET    | Search a repertory                    | `?repertory=publicum&symptom=head&page=1` |
| `/api/lookup_mm`               | GET    | Search materia medica                 | `?materiamedica=boericke&symptom=anxiety` |
| `/api/available_remedies`      | GET    | Get all available remedies            | -                                         |
| `/api/available_rems_and_reps` | GET    | Get repertories with remedy lists     | -                                         |
| `/api/available_mms_and_reps`  | GET    | Get materia medicas with remedy lists | -                                         |

### 5.2 Search Parameters Explained

**For `/api/lookup_rep`:**

| Parameter      | Type   | Description                                                |
| -------------- | ------ | ---------------------------------------------------------- |
| `repertory`    | string | Repertory abbreviation (e.g., "publicum", "kent", "boger") |
| `symptom`      | string | Search term(s), comma-separated                            |
| `page`         | number | Page number for pagination (starts at 1)                   |
| `remedyString` | string | Filter by specific remedy                                  |
| `minWeight`    | number | Minimum remedy weight (1-5)                                |
| `getRemedies`  | number | 0 or 1 - whether to include remedy list                    |

### 5.3 Search Syntax

| Syntax       | Example                     | Meaning                                     |
| ------------ | --------------------------- | ------------------------------------------- |
| Simple terms | `head, pain`                | Both words must appear                      |
| Wildcards    | `head*`                     | Matches "head", "headache", "heading", etc. |
| Exact phrase | `"wisdom teeth"`            | Exact phrase match                          |
| Exclusion    | `pain, -abdomen`            | Has "pain" but NOT "abdomen"                |
| Combined     | `head*, -eye, "sharp pain"` | Complex search                              |

### 5.4 Response Structure

```json
{
  "results": [
    {
      "rubric": {
        "id": 12345,
        "fullPath": "Head > Pain > pressing",
        "textt": "Additional rubric text"
      },
      "repertoryAbbrev": "publicum",
      "weightedRemedies": [
        {
          "remedy": {
            "id": 1,
            "nameAbbrev": "Bell.",
            "nameLong": "Belladonna"
          },
          "weight": 3
        }
      ]
    }
  ],
  "totalResults": 150,
  "page": 1,
  "hasMore": true
}
```

---

## 6. Integrating OOREP into Abel Wellness

Now let's integrate OOREP into your Abel Wellness Next.js application.

### 6.1 Add Environment Variables

Add OOREP configuration to your Abel Wellness `.env.local` file:

```env
# OOREP Integration
OOREP_API_URL=http://localhost:9000
NEXT_PUBLIC_OOREP_ENABLED=true
```

### 6.2 Create API Proxy Routes

Create proxy routes in your Next.js app to communicate with OOREP. This helps with:

- CORS handling
- Adding authentication if needed
- Transforming responses
- Logging and error handling

**Create directory structure:**

```
app/
  api/
    oorep/
      search/
        route.js
      materia-medica/
        route.js
      remedies/
        route.js
      config/
        route.js
```

### 6.3 Create the Search API Route

**File: `app/api/oorep/search/route.js`**

```javascript
import { NextResponse } from "next/server";

const OOREP_API_URL = process.env.OOREP_API_URL || "http://localhost:9000";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const repertory = searchParams.get("repertory") || "publicum";
    const symptom = searchParams.get("symptom") || "";
    const page = searchParams.get("page") || "1";
    const remedyString = searchParams.get("remedyString") || "";
    const minWeight = searchParams.get("minWeight") || "1";
    const getRemedies = searchParams.get("getRemedies") || "1";

    if (!symptom.trim()) {
      return NextResponse.json(
        { error: "Search term is required" },
        { status: 400 },
      );
    }

    // Build OOREP API URL
    const oorepUrl = new URL(`${OOREP_API_URL}/api/lookup_rep`);
    oorepUrl.searchParams.set("repertory", repertory);
    oorepUrl.searchParams.set("symptom", symptom);
    oorepUrl.searchParams.set("page", page);
    oorepUrl.searchParams.set("remedyString", remedyString);
    oorepUrl.searchParams.set("minWeight", minWeight);
    oorepUrl.searchParams.set("getRemedies", getRemedies);

    // Fetch from OOREP
    const response = await fetch(oorepUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      // Set timeout
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`OOREP API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data,
      meta: {
        repertory,
        searchTerm: symptom,
        page: parseInt(page),
      },
    });
  } catch (error) {
    console.error("OOREP Search Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to search repertory",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
```

### 6.4 Create the Materia Medica API Route

**File: `app/api/oorep/materia-medica/route.js`**

```javascript
import { NextResponse } from "next/server";

const OOREP_API_URL = process.env.OOREP_API_URL || "http://localhost:9000";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const materiamedica = searchParams.get("materiamedica") || "boericke";
    const symptom = searchParams.get("symptom") || "";
    const page = searchParams.get("page") || "1";
    const remedyString = searchParams.get("remedyString") || "";

    if (!symptom.trim()) {
      return NextResponse.json(
        { error: "Search term is required" },
        { status: 400 },
      );
    }

    const oorepUrl = new URL(`${OOREP_API_URL}/api/lookup_mm`);
    oorepUrl.searchParams.set("materiamedica", materiamedica);
    oorepUrl.searchParams.set("symptom", symptom);
    oorepUrl.searchParams.set("page", page);
    oorepUrl.searchParams.set("remedyString", remedyString);

    const response = await fetch(oorepUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`OOREP API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data,
      meta: {
        materiamedica,
        searchTerm: symptom,
        page: parseInt(page),
      },
    });
  } catch (error) {
    console.error("OOREP Materia Medica Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to search materia medica",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
```

### 6.5 Create the Remedies API Route

**File: `app/api/oorep/remedies/route.js`**

```javascript
import { NextResponse } from "next/server";

const OOREP_API_URL = process.env.OOREP_API_URL || "http://localhost:9000";

// Cache remedies in memory (they don't change often)
let cachedRemedies = null;
let cachedAt = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function GET(request) {
  try {
    // Check cache
    if (cachedRemedies && cachedAt && Date.now() - cachedAt < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: cachedRemedies,
        cached: true,
      });
    }

    const response = await fetch(`${OOREP_API_URL}/api/available_remedies`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`OOREP API error: ${response.status}`);
    }

    const data = await response.json();

    // Update cache
    cachedRemedies = data;
    cachedAt = Date.now();

    return NextResponse.json({
      success: true,
      data: data,
      cached: false,
    });
  } catch (error) {
    console.error("OOREP Remedies Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch remedies",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
```

### 6.6 Create Config API Route

**File: `app/api/oorep/config/route.js`**

```javascript
import { NextResponse } from "next/server";

const OOREP_API_URL = process.env.OOREP_API_URL || "http://localhost:9000";

export async function GET() {
  try {
    // Fetch available repertories
    const repsResponse = await fetch(
      `${OOREP_API_URL}/api/available_rems_and_reps`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
      },
    );

    // Fetch available materia medicas
    const mmsResponse = await fetch(
      `${OOREP_API_URL}/api/available_mms_and_reps`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
      },
    );

    const repertories = repsResponse.ok ? await repsResponse.json() : [];
    const materiaMedicas = mmsResponse.ok ? await mmsResponse.json() : [];

    return NextResponse.json({
      success: true,
      data: {
        repertories,
        materiaMedicas,
        oorepUrl: OOREP_API_URL,
        enabled: process.env.NEXT_PUBLIC_OOREP_ENABLED === "true",
      },
    });
  } catch (error) {
    console.error("OOREP Config Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch OOREP configuration",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
```

---

## 7. Creating the OOREP Page

Now let's create the dedicated OOREP page for your application.

### 7.1 Create the OOREP Page Component

**File: `app/oorep/page.jsx`**

```jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiBook,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiPlus,
  FiX,
  FiInfo,
  FiList,
  FiBookOpen,
  FiLoader,
  FiAlertCircle,
  FiCopy,
  FiCheck,
} from "react-icons/fi";
import { toast } from "sonner";
import Link from "next/link";

// Available repertories (common ones)
const REPERTORIES = [
  {
    value: "publicum",
    label: "Publicum (Free)",
    description: "Free public repertory",
  },
  { value: "kent", label: "Kent", description: "Kent's Repertory" },
  { value: "boger", label: "Boger", description: "Boger's Repertory" },
  {
    value: "bogboen",
    label: "Boger-Bönninghausen",
    description: "Boger-Bönninghausen Repertory",
  },
];

const MATERIA_MEDICAS = [
  {
    value: "boericke",
    label: "Boericke",
    description: "Boericke's Materia Medica",
  },
  { value: "allen", label: "Allen", description: "Allen's Encyclopedia" },
  { value: "clarke", label: "Clarke", description: "Clarke's Dictionary" },
];

const MIN_WEIGHTS = [
  { value: 1, label: "All (1+)" },
  { value: 2, label: "Medium (2+)" },
  { value: 3, label: "Strong (3+)" },
  { value: 4, label: "Very Strong (4+)" },
];

export default function OOREPPage() {
  // Search state
  const [searchMode, setSearchMode] = useState("repertory"); // 'repertory' or 'materiamedica'
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRepertory, setSelectedRepertory] = useState("publicum");
  const [selectedMM, setSelectedMM] = useState("boericke");
  const [minWeight, setMinWeight] = useState(1);
  const [remedyFilter, setRemedyFilter] = useState("");

  // Results state
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  // Case builder state
  const [selectedRubrics, setSelectedRubrics] = useState([]);
  const [showCasePanel, setShowCasePanel] = useState(false);

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRubrics, setExpandedRubrics] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);

  // Search function
  const performSearch = useCallback(
    async (page = 1) => {
      if (!searchTerm.trim()) {
        toast.error("Please enter a search term");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const endpoint =
          searchMode === "repertory"
            ? "/api/oorep/search"
            : "/api/oorep/materia-medica";

        const params = new URLSearchParams({
          symptom: searchTerm,
          page: page.toString(),
          ...(searchMode === "repertory"
            ? {
                repertory: selectedRepertory,
                minWeight: minWeight.toString(),
                getRemedies: "1",
                remedyString: remedyFilter,
              }
            : {
                materiamedica: selectedMM,
                remedyString: remedyFilter,
              }),
        });

        const response = await fetch(`${endpoint}?${params}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Search failed");
        }

        if (page === 1) {
          setResults(data.data.results || data.data || []);
        } else {
          setResults((prev) => [
            ...prev,
            ...(data.data.results || data.data || []),
          ]);
        }

        setCurrentPage(page);
        setHasMore(data.data.hasMore || false);
        setTotalResults(data.data.totalResults || 0);
      } catch (err) {
        console.error("Search error:", err);
        setError(err.message);
        toast.error("Search failed: " + err.message);
      } finally {
        setLoading(false);
      }
    },
    [
      searchTerm,
      searchMode,
      selectedRepertory,
      selectedMM,
      minWeight,
      remedyFilter,
    ],
  );

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setResults([]);
    performSearch(1);
  };

  // Load more results
  const loadMore = () => {
    if (!loading && hasMore) {
      performSearch(currentPage + 1);
    }
  };

  // Toggle rubric expansion
  const toggleRubricExpand = (rubricId) => {
    setExpandedRubrics((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rubricId)) {
        newSet.delete(rubricId);
      } else {
        newSet.add(rubricId);
      }
      return newSet;
    });
  };

  // Add rubric to case
  const addToCase = (rubric) => {
    if (selectedRubrics.find((r) => r.rubric?.id === rubric.rubric?.id)) {
      toast.info("Rubric already in case");
      return;
    }
    setSelectedRubrics((prev) => [...prev, rubric]);
    toast.success("Added to case");
  };

  // Remove rubric from case
  const removeFromCase = (rubricId) => {
    setSelectedRubrics((prev) => prev.filter((r) => r.rubric?.id !== rubricId));
  };

  // Copy rubric path
  const copyRubricPath = async (path) => {
    try {
      await navigator.clipboard.writeText(path);
      setCopiedId(path);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("Copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  // Get remedy weight color
  const getWeightColor = (weight) => {
    switch (weight) {
      case 5:
        return "text-red-400 bg-red-500/20";
      case 4:
        return "text-orange-400 bg-orange-500/20";
      case 3:
        return "text-yellow-400 bg-yellow-500/20";
      case 2:
        return "text-blue-400 bg-blue-500/20";
      default:
        return "text-slate-400 bg-slate-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-slate-400 hover:text-white transition-colors"
              >
                ← Back
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FiBook className="w-6 h-6 text-emerald-400" />
                  Homeopathy Repertory
                </h1>
                <p className="text-slate-400 text-sm">
                  Search symptoms and find matching remedies
                </p>
              </div>
            </div>

            {/* Case Panel Toggle */}
            <button
              onClick={() => setShowCasePanel(!showCasePanel)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                selectedRubrics.length > 0
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                  : "bg-slate-700/50 text-slate-400 border border-slate-600/50"
              }`}
            >
              <FiList className="w-4 h-4" />
              Case ({selectedRubrics.length})
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className={`flex-1 ${showCasePanel ? "lg:mr-80" : ""}`}>
            {/* Search Form */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 mb-6">
              {/* Search Mode Tabs */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setSearchMode("repertory")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    searchMode === "repertory"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                      : "bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700"
                  }`}
                >
                  <FiBook className="w-4 h-4" />
                  Repertory
                </button>
                <button
                  onClick={() => setSearchMode("materiamedica")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    searchMode === "materiamedica"
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                      : "bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700"
                  }`}
                >
                  <FiBookOpen className="w-4 h-4" />
                  Materia Medica
                </button>
              </div>

              {/* Search Input */}
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search symptoms... (e.g., headache, head* pain, -eye)"
                    className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
                  />
                </div>

                {/* Filters Toggle */}
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                  <FiFilter className="w-4 h-4" />
                  <span>Filters</span>
                  {showFilters ? (
                    <FiChevronUp className="w-4 h-4" />
                  ) : (
                    <FiChevronDown className="w-4 h-4" />
                  )}
                </button>

                {/* Filter Options */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-700/50">
                        {/* Repertory/MM Selection */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            {searchMode === "repertory"
                              ? "Repertory"
                              : "Materia Medica"}
                          </label>
                          <select
                            value={
                              searchMode === "repertory"
                                ? selectedRepertory
                                : selectedMM
                            }
                            onChange={(e) =>
                              searchMode === "repertory"
                                ? setSelectedRepertory(e.target.value)
                                : setSelectedMM(e.target.value)
                            }
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-emerald-500"
                          >
                            {(searchMode === "repertory"
                              ? REPERTORIES
                              : MATERIA_MEDICAS
                            ).map((item) => (
                              <option key={item.value} value={item.value}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Min Weight (Repertory only) */}
                        {searchMode === "repertory" && (
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Minimum Weight
                            </label>
                            <select
                              value={minWeight}
                              onChange={(e) =>
                                setMinWeight(parseInt(e.target.value))
                              }
                              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-emerald-500"
                            >
                              {MIN_WEIGHTS.map((w) => (
                                <option key={w.value} value={w.value}>
                                  {w.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Remedy Filter */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Filter by Remedy
                          </label>
                          <input
                            type="text"
                            value={remedyFilter}
                            onChange={(e) => setRemedyFilter(e.target.value)}
                            placeholder="e.g., Bell, Arn"
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Search Button */}
                <button
                  type="submit"
                  disabled={loading || !searchTerm.trim()}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <FiLoader className="w-5 h-5 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <FiSearch className="w-5 h-5" />
                      Search
                    </>
                  )}
                </button>
              </form>

              {/* Search Tips */}
              <div className="mt-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                <div className="flex items-start gap-2">
                  <FiInfo className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-slate-400">
                    <strong className="text-slate-300">Search Tips:</strong>
                    <ul className="mt-1 space-y-1 list-disc list-inside">
                      <li>
                        Use{" "}
                        <code className="px-1 bg-slate-600/50 rounded">
                          head*
                        </code>{" "}
                        for wildcards
                      </li>
                      <li>
                        Use{" "}
                        <code className="px-1 bg-slate-600/50 rounded">
                          "exact phrase"
                        </code>{" "}
                        for exact matches
                      </li>
                      <li>
                        Use{" "}
                        <code className="px-1 bg-slate-600/50 rounded">
                          -word
                        </code>{" "}
                        to exclude terms
                      </li>
                      <li>
                        Combine terms with commas:{" "}
                        <code className="px-1 bg-slate-600/50 rounded">
                          head, pain, -eye
                        </code>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6 flex items-center gap-3">
                <FiAlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400">{error}</span>
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    Results {totalResults > 0 && `(${totalResults})`}
                  </h2>
                </div>

                {results.map((result, index) => (
                  <motion.div
                    key={result.rubric?.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden"
                  >
                    {/* Rubric Header */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
                              {result.repertoryAbbrev || selectedRepertory}
                            </span>
                          </div>
                          <h3 className="text-white font-medium break-words">
                            {result.rubric?.fullPath ||
                              result.fullPath ||
                              "Unknown rubric"}
                          </h3>
                          {result.rubric?.textt && (
                            <p className="text-slate-400 text-sm mt-1">
                              {result.rubric.textt}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() =>
                              copyRubricPath(
                                result.rubric?.fullPath || result.fullPath,
                              )
                            }
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                            title="Copy rubric path"
                          >
                            {copiedId ===
                            (result.rubric?.fullPath || result.fullPath) ? (
                              <FiCheck className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <FiCopy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => addToCase(result)}
                            className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded-lg transition-colors"
                            title="Add to case"
                          >
                            <FiPlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              toggleRubricExpand(result.rubric?.id || index)
                            }
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                          >
                            {expandedRubrics.has(result.rubric?.id || index) ? (
                              <FiChevronUp className="w-4 h-4" />
                            ) : (
                              <FiChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Remedies (Expanded) */}
                    <AnimatePresence>
                      {expandedRubrics.has(result.rubric?.id || index) &&
                        result.weightedRemedies && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-700/50 bg-slate-700/20"
                          >
                            <div className="p-4">
                              <h4 className="text-sm font-medium text-slate-300 mb-3">
                                Remedies ({result.weightedRemedies.length})
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {result.weightedRemedies
                                  .sort((a, b) => b.weight - a.weight)
                                  .map((wr, idx) => (
                                    <span
                                      key={idx}
                                      className={`px-2 py-1 rounded text-sm font-medium ${getWeightColor(wr.weight)}`}
                                      title={`${wr.remedy?.nameLong || wr.remedy?.nameAbbrev} - Weight: ${wr.weight}`}
                                    >
                                      {wr.remedy?.nameAbbrev || "?"}
                                      <sup className="ml-0.5">{wr.weight}</sup>
                                    </span>
                                  ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                    </AnimatePresence>
                  </motion.div>
                ))}

                {/* Load More */}
                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="w-full py-3 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Loading..." : "Load More"}
                  </button>
                )}
              </div>
            )}

            {/* Empty State */}
            {!loading && results.length === 0 && searchTerm && (
              <div className="text-center py-12">
                <FiSearch className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-400 mb-2">
                  No results found
                </h3>
                <p className="text-slate-500">
                  Try adjusting your search terms or filters
                </p>
              </div>
            )}
          </div>

          {/* Case Panel (Sidebar) */}
          <AnimatePresence>
            {showCasePanel && (
              <motion.div
                initial={{ x: 320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 320, opacity: 0 }}
                className="fixed right-0 top-0 h-full w-80 bg-slate-800 border-l border-slate-700/50 z-40 overflow-hidden flex flex-col"
              >
                <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    Case Builder
                  </h3>
                  <button
                    onClick={() => setShowCasePanel(false)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {selectedRubrics.length === 0 ? (
                    <div className="text-center py-8">
                      <FiList className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">No rubrics selected</p>
                      <p className="text-slate-500 text-sm mt-1">
                        Click + on a rubric to add it to your case
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedRubrics.map((rubric, index) => (
                        <div
                          key={rubric.rubric?.id || index}
                          className="p-3 bg-slate-700/50 rounded-xl border border-slate-600/50"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-white flex-1 break-words">
                              {rubric.rubric?.fullPath || "Unknown"}
                            </p>
                            <button
                              onClick={() => removeFromCase(rubric.rubric?.id)}
                              className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          </div>
                          {rubric.weightedRemedies && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {rubric.weightedRemedies
                                .slice(0, 5)
                                .map((wr, idx) => (
                                  <span
                                    key={idx}
                                    className={`px-1.5 py-0.5 rounded text-xs ${getWeightColor(wr.weight)}`}
                                  >
                                    {wr.remedy?.nameAbbrev}
                                  </span>
                                ))}
                              {rubric.weightedRemedies.length > 5 && (
                                <span className="text-xs text-slate-500">
                                  +{rubric.weightedRemedies.length - 5} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedRubrics.length > 0 && (
                  <div className="p-4 border-t border-slate-700/50 space-y-3">
                    <button
                      onClick={() => {
                        const caseText = selectedRubrics
                          .map((r) => r.rubric?.fullPath)
                          .join("\n");
                        navigator.clipboard.writeText(caseText);
                        toast.success("Case copied to clipboard");
                      }}
                      className="w-full py-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <FiCopy className="w-4 h-4" />
                      Copy Case
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRubrics([]);
                        toast.success("Case cleared");
                      }}
                      className="w-full py-2 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
```

---

## 8. Adding Floating Widget to Consultation

Now let's add the floating OOREP widget to the doctor's consultation page.

### 8.1 Create the Floating Widget Component

**File: `app/doctor/components/OOREPWidget.jsx`**

```jsx
"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBook,
  FiSearch,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiPlus,
  FiCopy,
  FiCheck,
  FiLoader,
  FiFilter,
  FiMinimize2,
  FiMaximize2,
} from "react-icons/fi";
import { toast } from "sonner";

const REPERTORIES = [
  { value: "publicum", label: "Publicum (Free)" },
  { value: "kent", label: "Kent" },
  { value: "boger", label: "Boger" },
];

export default function OOREPWidget({ onAddToAnalysis }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRepertory, setSelectedRepertory] = useState("publicum");
  const [minWeight, setMinWeight] = useState(1);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRubrics, setExpandedRubrics] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);

  const performSearch = useCallback(async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        repertory: selectedRepertory,
        symptom: searchTerm,
        page: "1",
        minWeight: minWeight.toString(),
        getRemedies: "1",
      });

      const response = await fetch(`/api/oorep/search?${params}`);
      const data = await response.json();

      if (data.success) {
        setResults(data.data.results || data.data || []);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error("OOREP search error:", err);
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedRepertory, minWeight]);

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch();
  };

  const toggleRubricExpand = (id) => {
    setExpandedRubrics((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const addToAnalysis = (rubric) => {
    const text = `${rubric.rubric?.fullPath || ""}\nRemedies: ${
      rubric.weightedRemedies
        ?.sort((a, b) => b.weight - a.weight)
        .slice(0, 10)
        .map((r) => `${r.remedy?.nameAbbrev}(${r.weight})`)
        .join(", ") || ""
    }`;

    if (onAddToAnalysis) {
      onAddToAnalysis(text);
      toast.success("Added to analysis");
    }
  };

  const copyRubric = async (rubric) => {
    const text = `${rubric.rubric?.fullPath || ""}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(rubric.rubric?.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const getWeightColor = (weight) => {
    switch (weight) {
      case 5:
        return "text-red-400 bg-red-500/20";
      case 4:
        return "text-orange-400 bg-orange-500/20";
      case 3:
        return "text-yellow-400 bg-yellow-500/20";
      case 2:
        return "text-blue-400 bg-blue-500/20";
      default:
        return "text-slate-400 bg-slate-500/20";
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 flex items-center justify-center transition-all hover:scale-110"
            title="Open Repertory Search"
          >
            <FiBook className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Widget Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className={`fixed z-50 bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
              isExpanded
                ? "bottom-4 right-4 left-4 top-20 sm:left-auto sm:w-[600px] sm:top-20 sm:bottom-4"
                : "bottom-6 right-6 w-96 max-h-[70vh]"
            }`}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/90 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <FiBook className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-white">Repertory</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  {isExpanded ? (
                    <FiMinimize2 className="w-4 h-4" />
                  ) : (
                    <FiMaximize2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search Form */}
            <div className="p-4 border-b border-slate-700/50">
              <form onSubmit={handleSearch} className="space-y-3">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search symptoms..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    autoFocus
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={selectedRepertory}
                    onChange={(e) => setSelectedRepertory(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    {REPERTORIES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={minWeight}
                    onChange={(e) => setMinWeight(parseInt(e.target.value))}
                    className="w-24 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={1}>1+</option>
                    <option value={2}>2+</option>
                    <option value={3}>3+</option>
                  </select>
                  <button
                    type="submit"
                    disabled={loading || !searchTerm.trim()}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <FiLoader className="w-4 h-4 animate-spin" />
                    ) : (
                      <FiSearch className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {results.length === 0 && !loading && (
                <div className="text-center py-8">
                  <FiSearch className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Search for symptoms</p>
                </div>
              )}

              {results.map((result, index) => (
                <div
                  key={result.rubric?.id || index}
                  className="bg-slate-700/30 border border-slate-600/30 rounded-xl overflow-hidden"
                >
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-white flex-1 break-words leading-relaxed">
                        {result.rubric?.fullPath || "Unknown"}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => copyRubric(result)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600/50 rounded transition-colors"
                          title="Copy"
                        >
                          {copiedId === result.rubric?.id ? (
                            <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <FiCopy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => addToAnalysis(result)}
                          className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded transition-colors"
                          title="Add to analysis"
                        >
                          <FiPlus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            toggleRubricExpand(result.rubric?.id || index)
                          }
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600/50 rounded transition-colors"
                        >
                          {expandedRubrics.has(result.rubric?.id || index) ? (
                            <FiChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <FiChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedRubrics.has(result.rubric?.id || index) &&
                      result.weightedRemedies && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-slate-600/30 bg-slate-700/20 p-3"
                        >
                          <div className="flex flex-wrap gap-1.5">
                            {result.weightedRemedies
                              .sort((a, b) => b.weight - a.weight)
                              .map((wr, idx) => (
                                <span
                                  key={idx}
                                  className={`px-1.5 py-0.5 rounded text-xs font-medium ${getWeightColor(wr.weight)}`}
                                >
                                  {wr.remedy?.nameAbbrev}
                                  <sup>{wr.weight}</sup>
                                </span>
                              ))}
                          </div>
                        </motion.div>
                      )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

### 8.2 Add Widget to Consultation Page

Add the following import and component to `app/doctor/consultation/[id]/page.jsx`:

**At the top with other imports:**

```jsx
import OOREPWidget from "../../components/OOREPWidget";
```

**Inside the component, add a handler function:**

```jsx
// Add to totality analysis from OOREP
const handleAddToAnalysis = (text) => {
  setMedicalRecord((prev) => ({
    ...prev,
    totality_analysis: prev.totality_analysis
      ? `${prev.totality_analysis}\n\n${text}`
      : text,
  }));
};
```

**Before the closing `</div>` of the main container, add:**

```jsx
{
  /* OOREP Widget */
}
<OOREPWidget onAddToAnalysis={handleAddToAnalysis} />;
```

---

## 9. Troubleshooting

### 9.1 Docker Issues

**"Cannot connect to Docker daemon"**

```powershell
# Make sure Docker Desktop is running
# Open Docker Desktop application and wait for it to start
```

**"Port already in use"**

```powershell
# Check what's using port 9000
netstat -ano | findstr :9000

# Kill the process using that port (replace PID with actual ID)
taskkill /PID <PID> /F

# Or change the port in docker-compose.yml
ports:
  - "9001:9000"  # Use 9001 externally
```

**"Container keeps restarting"**

```powershell
# Check logs for errors
docker-compose logs backend

# Common issues:
# - Database not ready: Wait longer or check db health
# - Missing environment variables: Check .env file
# - Build errors: Run docker-compose build --no-cache
```

### 9.2 Database Issues

**"Database connection refused"**

```powershell
# Check if database container is running
docker-compose ps

# Check database logs
docker-compose logs db

# Try restarting
docker-compose restart db
```

**"Empty database / No data"**

```powershell
# You may need to import repertory data
# Check OOREP documentation for data import scripts
# Or use the public OOREP instance initially
```

### 9.3 API Issues

**"CORS errors"**

- The API proxy routes in Next.js should handle CORS
- Make sure you're calling `/api/oorep/search` not directly to `localhost:9000`

**"Connection timeout"**

- Check if OOREP container is running: `docker-compose ps`
- Check if the URL is correct in `.env.local`
- Try accessing directly: `curl http://localhost:9000/api/lookup_rep?repertory=publicum&symptom=head&page=1`

### 9.4 Useful Docker Commands

```powershell
# View running containers
docker ps

# Stop all OOREP services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d

# View container resource usage
docker stats

# Enter container shell for debugging
docker exec -it oorep_backend /bin/bash
docker exec -it oorep_db /bin/bash

# View container logs in real-time
docker-compose logs -f --tail=100
```

---

## 10. Production Deployment

For production, you'll want to:

### 10.1 Secure Your Deployment

1. **Use strong passwords** - Change all default passwords
2. **Enable HTTPS** - Use a reverse proxy like nginx with SSL
3. **Restrict network access** - Don't expose PostgreSQL port publicly
4. **Regular backups** - Set up automated database backups

### 10.2 Deploy on a Server

**Option A: Same server as Abel Wellness**

- Run OOREP Docker containers alongside your Next.js app
- Use `localhost:9000` for API calls

**Option B: Separate server**

- Deploy OOREP on a dedicated VM (e.g., AWS EC2, DigitalOcean)
- Update `OOREP_API_URL` to point to the server's IP/domain
- Ensure firewall allows traffic on port 9000

### 10.3 Environment Variables for Production

```env
# Production .env for Abel Wellness
OOREP_API_URL=https://oorep.yourdomain.com
NEXT_PUBLIC_OOREP_ENABLED=true
```

### 10.4 Using Docker Compose in Production

Create a `docker-compose.prod.yml`:

```yaml
version: "3.8"

services:
  db:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_DB: ${OOREP_DB_NAME}
      POSTGRES_USER: ${OOREP_DB_USER}
      POSTGRES_PASSWORD: ${OOREP_DB_PASS}
    volumes:
      - oorep_pgdata:/var/lib/postgresql/data
    # Don't expose port in production!
    # ports:
    #   - "5432:5432"

  backend:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
    restart: always
    environment:
      - OOREP_APP_PROTOCOL=https
      - OOREP_APP_HOSTNAME=oorep.yourdomain.com
      # ... other env vars
    ports:
      - "9000:9000"
    depends_on:
      - db

volumes:
  oorep_pgdata:
```

---

## Quick Reference

### Starting OOREP

```powershell
cd C:\oorep\oorep\docker
docker-compose up -d
```

### Stopping OOREP

```powershell
cd C:\oorep\oorep\docker
docker-compose down
```

### Viewing Logs

```powershell
docker-compose logs -f
```

### Testing API

```powershell
curl "http://localhost:9000/api/lookup_rep?repertory=publicum&symptom=headache&page=1&getRemedies=1"
```

### Key Files to Create in Abel Wellness

- `app/api/oorep/search/route.js` - Search API proxy
- `app/api/oorep/materia-medica/route.js` - MM API proxy
- `app/api/oorep/remedies/route.js` - Remedies API proxy
- `app/api/oorep/config/route.js` - Config API
- `app/oorep/page.jsx` - Dedicated OOREP page
- `app/doctor/components/OOREPWidget.jsx` - Floating widget

---

## Summary

You've now learned how to:

1. ✅ Set up Docker and prerequisites
2. ✅ Deploy your own OOREP instance
3. ✅ Test the OOREP API
4. ✅ Create API proxy routes in Next.js
5. ✅ Build a dedicated OOREP search page
6. ✅ Add a floating widget to the consultation page
7. ✅ Troubleshoot common issues
8. ✅ Prepare for production deployment

**Next Steps:**

1. Follow this guide step by step
2. Test each component as you build it
3. Customize the UI to match your exact needs
4. Add more features like saving cases to your database

If you encounter any issues, refer to the troubleshooting section or check the OOREP GitHub issues page: https://github.com/nondeterministic/oorep/issues
