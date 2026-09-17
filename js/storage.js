/*
 * LocalStorage is suitable for this school demonstration.
 * It is NOT secure for real authentication or sensitive business data.
 */

/* =========================================================
   LOCALSTORAGE KEYS
========================================================= */

const KEYS = {
  session: "ims_session",
  products: "ims_products",
  categories: "ims_categories",
  suppliers: "ims_suppliers",
  transactions: "ims_transactions",
  settings: "ims_settings",
  theme: "ims_theme",
  initialized: "ims_initialized",
};

/* =========================================================
   LOCALSTORAGE FUNCTIONS
========================================================= */

/**
 * Reads and parses data from LocalStorage.
 * Returns the fallback value if the data is missing or invalid.
 */
function readStore(key, fallback = []) {
  try {
    const storedData = localStorage.getItem(key);

    if (storedData === null) {
      return fallback;
    }

    const parsedData = JSON.parse(storedData);

    return parsedData ?? fallback;
  } catch (error) {
    console.warn("Invalid stored data:", key, error);
    return fallback;
  }
}

/**
 * Converts data to JSON and saves it in LocalStorage.
 */
function saveStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Unable to save data:", key, error);

    alert(
      "Browser storage is full. Remove large images or export and reset old data."
    );

    return false;
  }
}

/* =========================================================
   UNIQUE ID GENERATOR
========================================================= */

/**
 * Generates a unique ID.
 * Example: PRD-MX123ABC-A1B2
 */
function uid(prefix = "ID") {
  const datePart = Date.now()
    .toString(36)
    .toUpperCase();

  const randomPart = Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase();

  return `${prefix}-${datePart}-${randomPart}`;
}

/* =========================================================
   TEXT SECURITY
========================================================= */

/**
 * Escapes HTML characters to help prevent unwanted HTML
 * from being inserted into the page.
 */
function safeText(value = "") {
  const characters = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  };

  return String(value).replace(
    /[&<>'"]/g,
    (character) => characters[character]
  );
}

/* =========================================================
   DATE FUNCTIONS
========================================================= */

/**
 * Returns today's local date in YYYY-MM-DD format.
 */
function today() {
  const currentDate = new Date();
  const timezoneOffset = currentDate.getTimezoneOffset() * 60_000;

  return new Date(currentDate.getTime() - timezoneOffset)
    .toISOString()
    .slice(0, 10);
}

/**
 * Formats a date using the Philippine date format.
 */
function formatDate(value, withTime = false) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const formattingOptions = withTime
    ? {
        dateStyle: "medium",
        timeStyle: "short",
      }
    : {
        dateStyle: "medium",
      };

  return new Intl.DateTimeFormat(
    "en-PH",
    formattingOptions
  ).format(date);
}

/* =========================================================
   SYSTEM SETTINGS
========================================================= */

/**
 * Returns the saved system settings.
 */
function getSettings() {
  const defaultSettings = {
    businessName: "StockWise",
    adminName: "Admin User",
    username: "admin",
    password: "admin123",
    currency: "PHP",
    profile: "",
  };

  return readStore(KEYS.settings, defaultSettings);
}

/**
 * Formats a value as currency.
 */
function money(value) {
  const settings = getSettings();
  const currency = settings.currency || "PHP";
  const numericValue = Number(value) || 0;

  try {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency,
    }).format(numericValue);
  } catch (error) {
    return `${currency} ${numericValue.toFixed(2)}`;
  }
}

/* =========================================================
   PRODUCT STATUS
========================================================= */

/**
 * Automatically determines the status of a product.
 */
function productStatus(product) {
  const expirationDate = product.expiration;
  const quantity = Number(product.quantity) || 0;
  const minimumStock = Number(product.minimum) || 0;

  if (expirationDate && expirationDate < today()) {
    return "Expired";
  }

  if (quantity === 0) {
    return "Out of Stock";
  }

  if (quantity <= minimumStock) {
    return "Low Stock";
  }

  return "Available";
}

/* =========================================================
   SAMPLE DATA
========================================================= */

/**
 * Creates sample data only during the first opening.
 *
 * The initialized key prevents the system from recreating
 * sample data after the administrator deletes it.
 */
function seedData() {
  const isInitialized = localStorage.getItem(KEYS.initialized);

  if (isInitialized) {
    return;
  }

  const categories = [
    {
      id: "CAT-001",
      name: "Beverages",
      description: "Drinks and refreshments",
    },
    {
      id: "CAT-002",
      name: "Office Supplies",
      description: "Everyday office items",
    },
    {
      id: "CAT-003",
      name: "Personal Care",
      description: "Personal care products",
    },
  ];

  const suppliers = [
    {
      id: "SUP-001",
      name: "Nueva Ecija Trading",
      contact: "Ana Cruz",
      phone: "09171234567",
      email: "sales@netrading.test",
      address: "Cabanatuan City",
      products: "General goods",
      notes: "Primary supplier",
      status: "Active",
    },
    {
      id: "SUP-002",
      name: "Central Wholesale",
      contact: "Mark Reyes",
      phone: "09181234567",
      email: "hello@central.test",
      address: "Gapan City",
      products: "Office supplies",
      notes: "",
      status: "Active",
    },
  ];

  const products = [
    {
      id: "PRD-001",
      name: "Bottled Water",
      sku: "BW-500",
      category: "CAT-001",
      description: "500ml purified water",
      quantity: 48,
      unit: "Bottle",
      cost: 10,
      price: 18,
      supplier: "SUP-001",
      minimum: 12,
      dateAdded: today(),
      expiration: "2027-08-01",
      image: "",
      notes: "Keep away from sunlight",
    },
    {
      id: "PRD-002",
      name: "Bond Paper A4",
      sku: "BP-A4",
      category: "CAT-002",
      description: "80gsm, 500 sheets",
      quantity: 8,
      unit: "Ream",
      cost: 190,
      price: 240,
      supplier: "SUP-002",
      minimum: 10,
      dateAdded: today(),
      expiration: "",
      image: "",
      notes: "",
    },
    {
      id: "PRD-003",
      name: "Hand Sanitizer",
      sku: "HS-100",
      category: "CAT-003",
      description: "100ml sanitizer",
      quantity: 0,
      unit: "Bottle",
      cost: 45,
      price: 65,
      supplier: "SUP-001",
      minimum: 5,
      dateAdded: today(),
      expiration: "2027-02-15",
      image: "",
      notes: "",
    },
  ];

  const transactions = [
    {
      id: "TXN-001",
      productId: "PRD-001",
      productName: "Bottled Water",
      type: "Stock In",
      quantity: 48,
      before: 0,
      after: 48,
      reason: "Initial stock",
      reference: "OPEN-001",
      date: new Date().toISOString(),
      notes: "Sample opening balance",
    },
  ];

  const settings = {
    businessName: "StockWise",
    adminName: "Admin User",
    username: "admin",
    password: "admin123",
    currency: "PHP",
    profile: "",
  };

  saveStore(KEYS.categories, categories);
  saveStore(KEYS.suppliers, suppliers);
  saveStore(KEYS.products, products);
  saveStore(KEYS.transactions, transactions);
  saveStore(KEYS.settings, settings);

  localStorage.setItem(KEYS.initialized, "true");
}