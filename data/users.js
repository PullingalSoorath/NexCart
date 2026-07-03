// ============================================================
// NexCart — Users Data & Authentication Helpers
// Manages: User accounts (localStorage), active session,
//          default Store state, and DB read/write helpers.
// ============================================================


// ── Default Store State ──────────────────────────────────────
// This is the runtime in-memory state. It is loaded/refreshed
// from localStorage by loadActiveUserSession() on app start.
const Store = {
  currentUser: {
    name: "Anonymous User",
    email: "user@nexcart.com",
    phone: "+91 9876543210",
    language: "English",
    state: "Kerala",
    city: "Trivandrum",
    pincode: "695001",
    address: "My House, Neyyattinkara, Trivandrum Kerala",
    interests: ["Fashion", "Gadgets"]
  },
  cart: [],          // items: { product, quantity, size, color }
  wishlist: new Set(), // Set of product IDs
  orders: [
    {
      id: "NX-8172-2026",
      date: "2026-06-25",
      productName: "SonicX Pro Wireless Headphones",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80",
      price: 2499,
      status: "delivered"
    },
    {
      id: "NX-5049-2026",
      date: "2026-06-28",
      productName: "AirCook XL Digital Air Fryer",
      image: "https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=500&auto=format&fit=crop&q=80",
      price: 4999,
      status: "delivered"
    }
  ],
  recentlyWatched: [], // Populated after PRODUCT_CATALOG is ready
  notifications: [
    {
      id: "not-01",
      title: "Order Dispatched!",
      content: "Your order NX-8172-2026 has been shipped via AeroPost and will arrive by tomorrow evening.",
      time: "2 hours ago",
      icon: "package",
      unread: true
    },
    {
      id: "not-02",
      title: "Price Drop Alert!",
      content: "Titan Smart Watch v3 in your wishlist dropped by ₹1,000! Buy now for ₹5,999.",
      time: "1 day ago",
      icon: "trending-down",
      unread: true
    },
    {
      id: "not-03",
      title: "Exclusive Discount Coupon",
      content: "Apply code FESTIVE20 during checkout to get an extra 20% discount on all fashion items.",
      time: "3 days ago",
      icon: "ticket",
      unread: false
    }
  ],
  savedAddresses: [
    {
      id: "addr-default",
      tag: "Home",
      name: "Default User",
      street: "My House, Neyyattinkara, Trivandrum Kerala",
      state: "Kerala",
      city: "Trivandrum",
      pincode: "695001",
      phone: "+91 9090909090"
    }
  ],
  activeTab: "home",
  activeScreen: "screen-auth",
  checkoutSingleItem: null  // Set when user clicks "Buy Now" on a PDP
};

// Seed recentlyWatched after PRODUCT_CATALOG is available
// (called from app.js after all scripts are loaded)
function seedRecentlyWatched() {
  if (typeof PRODUCT_CATALOG !== "undefined" && PRODUCT_CATALOG.length >= 6) {
    Store.recentlyWatched = [
      PRODUCT_CATALOG[3], // AeroPhone 15 Pro Max
      PRODUCT_CATALOG[5]  // SonicX Pro Wireless Headphones
    ];
  }
}


// ── localStorage Keys ────────────────────────────────────────
const DB_USERS_KEY       = "nexcart_users";
const DB_ACTIVE_USER_KEY = "nexcart_active_user";


// ── Read All Users ───────────────────────────────────────────
function getAllUsers() {
  return JSON.parse(localStorage.getItem(DB_USERS_KEY) || "{}");
}

// ── Write All Users ──────────────────────────────────────────
function setAllUsers(users) {
  localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
}

// ── Save / Update Current User to DB ────────────────────────
function saveUserToDatabase() {
  const users = getAllUsers();
  if (Store.currentUser && Store.currentUser.email) {
    users[Store.currentUser.email] = {
      ...users[Store.currentUser.email],
      name:      Store.currentUser.name,
      phone:     Store.currentUser.phone,
      language:  Store.currentUser.language,
      state:     Store.currentUser.state,
      city:      Store.currentUser.city,
      pincode:   Store.currentUser.pincode,
      address:   Store.currentUser.address,
      interests: Store.currentUser.interests,
      savedAddresses: Store.savedAddresses,
      cart:      Store.cart,
      wishlist:  [...Store.wishlist],
      orders:    Store.orders
    };
    setAllUsers(users);
  }
}

// ── Load Active User Session on App Start ────────────────────
function loadActiveUserSession() {
  const activeEmail = localStorage.getItem(DB_ACTIVE_USER_KEY);
  if (!activeEmail) return false;

  const users = getAllUsers();
  const saved = users[activeEmail];
  if (!saved) return false;

  // Restore user profile into Store
  Store.currentUser = {
    name:      saved.name      || "User",
    email:     activeEmail,
    phone:     saved.phone     || "",
    language:  saved.language  || "English",
    state:     saved.state     || "",
    city:      saved.city      || "",
    pincode:   saved.pincode   || "",
    address:   saved.address   || "",
    interests: saved.interests || []
  };

  // Restore cart
  Store.cart = saved.cart || [];

  // Restore wishlist (stored as array, convert back to Set)
  Store.wishlist = new Set(saved.wishlist || []);

  // Restore orders
  if (saved.orders && saved.orders.length) {
    Store.orders = saved.orders;
  }

  // Restore saved addresses
  if (saved.savedAddresses && saved.savedAddresses.length) {
    Store.savedAddresses = saved.savedAddresses;
  }

  return true; // session found
}

// ── Register New User ────────────────────────────────────────
function registerUser(email, password, name) {
  const users = getAllUsers();
  if (users[email]) return { success: false, reason: "exists" };

  users[email] = {
    password,
    name:           name || "NexCart User",
    phone:          "",
    language:       "English",
    state:          "",
    city:           "",
    pincode:        "",
    address:        "",
    interests:      [],
    savedAddresses: [],
    cart:           [],
    wishlist:       [],
    orders:         [],
    profileComplete: false
  };
  setAllUsers(users);
  return { success: true };
}

// ── Login Existing User ──────────────────────────────────────
function loginUser(email, password) {
  const users = getAllUsers();
  if (!users[email])                   return { success: false, reason: "not_found" };
  if (users[email].password !== password) return { success: false, reason: "wrong_password" };
  return { success: true, user: users[email], profileComplete: users[email].profileComplete };
}

// ── Set Active Session ───────────────────────────────────────
function setActiveSession(email) {
  localStorage.setItem(DB_ACTIVE_USER_KEY, email);
}

// ── Clear Active Session (Logout) ───────────────────────────
function clearActiveSession() {
  localStorage.removeItem(DB_ACTIVE_USER_KEY);
}

// ── Mark Profile as Complete ─────────────────────────────────
function markProfileComplete(email) {
  const users = getAllUsers();
  if (users[email]) {
    users[email].profileComplete = true;
    setAllUsers(users);
  }
}
