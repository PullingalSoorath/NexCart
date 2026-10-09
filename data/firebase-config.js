// ============================================================
// NexCart — Firebase Configuration & Firestore Integration
// Initializes Firebase Web SDK (Compat mode) and provides
// Cloud Data persistence, Auth sync, and Auto-seeding.
// ============================================================

// Default Firebase Configuration Object
// Replace placeholders with your own Firebase Console credentials when ready:
const firebaseConfig = {
  apiKey: "AIzaSyBIfeHste78KwsrkbwIzHQNL4mHbVzOq-Y",
  authDomain: "nexcart-ecd64.firebaseapp.com",
  projectId: "nexcart-ecd64",
  storageBucket: "nexcart-ecd64.firebasestorage.app",
  messagingSenderId: "41757176974",
  appId: "1:41757176974:web:38228843c79d0d0396c5df",
  measurementId: "G-Y3G248LYZF"
};

let firebaseApp = null;
let firestoreDb = null;
let firebaseAuth = null;
let isFirebaseConnected = false;

// ── Initialize Firebase App ──────────────────────────────────
function initFirebase() {
  if (typeof firebase !== "undefined" && !firebaseApp) {
    try {
      firebaseApp = firebase.initializeApp(firebaseConfig);
      firestoreDb = firebase.firestore();
      firebaseAuth = firebase.auth();

      // Enable offline persistence if supported
      firestoreDb.enablePersistence({ synchronizeTabs: true }).catch(err => {
        console.warn("Firestore offline persistence notice:", err.message);
      });

      isFirebaseConnected = true;
      console.log("⚡ Firebase Firestore & Auth initialized successfully.");
      
      // Update UI Status Badge
      updateFirebaseStatusUI(true);

      // Trigger automatic cloud seeding check
      seedFirebaseData();

      // Listen to Auth State Changes
      setupFirebaseAuthObserver();
    } catch (err) {
      console.warn("Firebase initialized with local fallback cache:", err.message);
      isFirebaseConnected = false;
      updateFirebaseStatusUI(false);
    }
  } else if (!typeof firebase !== "undefined") {
    console.warn("Firebase SDK scripts not loaded. Operating in Local Cache mode.");
    updateFirebaseStatusUI(false);
  }
}

// ── Firebase Auth Observer Setup ─────────────────────────────
function setupFirebaseAuthObserver() {
  if (!firebaseAuth || !isFirebaseConnected) return;
  firebaseAuth.onAuthStateChanged(async (user) => {
    if (user && user.email) {
      console.log("Firebase Auth State: Logged in as", user.email);
      const cloudUser = await fetchUserFromFirestore(user.email);
      if (cloudUser && typeof Store !== "undefined") {
        const users = typeof getAllUsers === "function" ? getAllUsers() : {};
        users[user.email] = cloudUser;
        if (typeof setAllUsers === "function") setAllUsers(users);
        if (typeof setActiveSession === "function") setActiveSession(user.email);
        if (typeof loadActiveUserSession === "function") loadActiveUserSession();
        if (typeof updateBadges === "function") updateBadges();
      }
      if (typeof routeTo === "function" && (typeof Store === "undefined" || Store.activeScreen === "screen-auth")) {
        routeTo("screen-home");
      }
    }
  });
}

// ── Fetch User Document from Firestore ───────────────────────
async function fetchUserFromFirestore(email) {
  if (!firestoreDb || !isFirebaseConnected || !email) return null;
  try {
    const doc = await firestoreDb.collection("users").doc(email).get();
    if (doc.exists) {
      return doc.data();
    }
    return null;
  } catch (err) {
    console.warn("Firestore fetch user error:", err.message);
    return null;
  }
}

// Update Connection Indicator Badge in UI
function updateFirebaseStatusUI(connected) {
  const badges = document.querySelectorAll(".firebase-status-badge");
  badges.forEach(badge => {
    if (connected) {
      badge.className = "firebase-status-badge success";
      badge.style.backgroundColor = "rgba(16, 185, 129, 0.15)";
      badge.style.color = "#10b981";
      badge.style.border = "1px solid rgba(16, 185, 129, 0.3)";
      badge.innerHTML = `<i data-lucide="cloud" style="width: 12px; height: 12px;"></i> <span>Firebase Cloud Live</span>`;
    } else {
      badge.className = "firebase-status-badge local";
      badge.style.backgroundColor = "rgba(99, 102, 241, 0.15)";
      badge.style.color = "#6366f1";
      badge.style.border = "1px solid rgba(99, 102, 241, 0.3)";
      badge.innerHTML = `<i data-lucide="database" style="width: 12px; height: 12px;"></i> <span>Local DB Mode</span>`;
    }
    if (window.lucide) window.lucide.createIcons();
  });
}

// ── Cloud Database Auto-Seeding Engine ───────────────────────
async function seedFirebaseData(force = false) {
  if (!firestoreDb || !isFirebaseConnected) return;

  try {
    const categoriesSnapshot = await firestoreDb.collection("categories").get();
    
    // Seed default categories if empty or forced
    if (categoriesSnapshot.empty || force) {
      console.log("Seeding default categories to Firestore...");
      const defaultCats = [
        { id: "Fashion", name: "Fashion", icon: "shirt" },
        { id: "Mobiles", name: "Mobiles", icon: "smartphone" },
        { id: "Appliances", name: "Appliances", icon: "home" },
        { id: "Electronics", name: "Electronics", icon: "laptop" },
        { id: "Gadgets", name: "Gadgets", icon: "headphones" },
        { id: "Toys", name: "Toys", icon: "gamepad-2" },
        { id: "Sports", name: "Sports", icon: "bike" },
        { id: "Furniture", name: "Furniture", icon: "armchair" },
        { id: "Books", name: "Books", icon: "book-open" }
      ];
      
      const batch = firestoreDb.batch();
      defaultCats.forEach(cat => {
        const ref = firestoreDb.collection("categories").doc(cat.id);
        batch.set(ref, cat);
      });
      await batch.commit();
    }

    // Seed default products catalog if empty or forced
    const productsSnapshot = await firestoreDb.collection("products").get();
    if (productsSnapshot.empty || force) {
      if (typeof PRODUCT_CATALOG !== "undefined" && PRODUCT_CATALOG.length > 0) {
        console.log("Seeding product catalog to Firestore...");
        const batch = firestoreDb.batch();
        PRODUCT_CATALOG.forEach(prod => {
          const ref = firestoreDb.collection("products").doc(prod.id);
          batch.set(ref, prod);
        });
        await batch.commit();
      }
    }

    // Seed default order history if empty
    const ordersSnapshot = await firestoreDb.collection("orders").get();
    if (ordersSnapshot.empty || force) {
      console.log("Seeding initial order transactions to Firestore...");
      const dummyOrders = [
        { id: "NX-1001-2025", user_email: "user@nexcart.com", date: "2025-11-15", total_amount: 1500, promo_code: "None", discount: 0, status: "delivered" },
        { id: "NX-1002-2025", user_email: "user@nexcart.com", date: "2025-12-20", total_amount: 3200, promo_code: "None", discount: 0, status: "delivered" },
        { id: "NX-1003-2026", user_email: "user@nexcart.com", date: "2026-01-10", total_amount: 2499, promo_code: "None", discount: 0, status: "delivered" },
        { id: "NX-1004-2026", user_email: "user@nexcart.com", date: "2026-02-18", total_amount: 4500, promo_code: "None", discount: 0, status: "delivered" },
        { id: "NX-1005-2026", user_email: "user@nexcart.com", date: "2026-03-22", total_amount: 1200, promo_code: "None", discount: 0, status: "delivered" },
        { id: "NX-1006-2026", user_email: "user@nexcart.com", date: "2026-04-05", total_amount: 8500, promo_code: "None", discount: 0, status: "delivered" },
        { id: "NX-1007-2026", user_email: "user@nexcart.com", date: "2026-05-14", total_amount: 6200, promo_code: "None", discount: 0, status: "delivered" },
        { id: "NX-1008-2026", user_email: "user@nexcart.com", date: "2026-06-25", total_amount: 2499, promo_code: "None", discount: 0, status: "delivered" },
        { id: "NX-1009-2026", user_email: "user@nexcart.com", date: "2026-06-28", total_amount: 4999, promo_code: "None", discount: 0, status: "delivered" }
      ];

      const batch = firestoreDb.batch();
      dummyOrders.forEach(ord => {
        const ref = firestoreDb.collection("orders").doc(ord.id);
        batch.set(ref, ord);
      });
      await batch.commit();
    }

    // Seed default order items if empty
    const orderItemsSnapshot = await firestoreDb.collection("order_items").get();
    if (orderItemsSnapshot.empty || force) {
      const dummyItems = [
        { id: "oi-1001", order_id: "NX-1001-2025", product_id: "fash-01", quantity: 1, price_per_unit: 1500, size: "M", color: "Blue" },
        { id: "oi-1002", order_id: "NX-1002-2025", product_id: "appl-01", quantity: 1, price_per_unit: 3200, size: "", color: "" },
        { id: "oi-1003", order_id: "NX-1003-2026", product_id: "gadg-01", quantity: 1, price_per_unit: 2499, size: "", color: "" },
        { id: "oi-1004", order_id: "NX-1004-2026", product_id: "toys-01", quantity: 3, price_per_unit: 1500, size: "", color: "" },
        { id: "oi-1005", order_id: "NX-1005-2026", product_id: "fash-02", quantity: 1, price_per_unit: 1200, size: "S", color: "Red" },
        { id: "oi-1006", order_id: "NX-1006-2026", product_id: "elec-01", quantity: 1, price_per_unit: 8500, size: "", color: "" },
        { id: "oi-1007", order_id: "NX-1007-2026", product_id: "gadg-02", quantity: 2, price_per_unit: 3100, size: "", color: "" },
        { id: "oi-1008", order_id: "NX-1008-2026", product_id: "gadg-01", quantity: 1, price_per_unit: 2499, size: "", color: "" },
        { id: "oi-1009", order_id: "NX-1009-2026", product_id: "appl-01", quantity: 1, price_per_unit: 4999, size: "", color: "" }
      ];

      const batch = firestoreDb.batch();
      dummyItems.forEach(item => {
        const ref = firestoreDb.collection("order_items").doc(item.id);
        batch.set(ref, item);
      });
      await batch.commit();
    }

  } catch (err) {
    console.warn("Firestore auto-seeding sync note:", err.message);
  }
}

// ── Generic Async Firestore Helpers ──────────────────────────
async function syncCollectionToFirestore(collectionName, items, keyField = "id") {
  if (!firestoreDb || !isFirebaseConnected) return;
  try {
    const batch = firestoreDb.batch();
    items.forEach(item => {
      const docId = String(item[keyField]);
      const ref = firestoreDb.collection(collectionName).doc(docId);
      batch.set(ref, item, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn(`Firestore sync collection [${collectionName}] note:`, err.message);
  }
}

async function saveDocToFirestore(collectionName, docId, data) {
  if (!firestoreDb || !isFirebaseConnected) return;
  try {
    await firestoreDb.collection(collectionName).doc(String(docId)).set(data, { merge: true });
  } catch (err) {
    console.warn(`Firestore save doc [${collectionName}/${docId}] note:`, err.message);
  }
}

async function deleteDocFromFirestore(collectionName, docId) {
  if (!firestoreDb || !isFirebaseConnected) return;
  try {
    await firestoreDb.collection(collectionName).doc(String(docId)).delete();
  } catch (err) {
    console.warn(`Firestore delete doc [${collectionName}/${docId}] note:`, err.message);
  }
}

async function fetchCollectionFromFirestore(collectionName) {
  if (!firestoreDb || !isFirebaseConnected) return null;
  try {
    const snapshot = await firestoreDb.collection(collectionName).get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => doc.data());
  } catch (err) {
    console.warn(`Firestore fetch collection [${collectionName}] note:`, err.message);
    return null;
  }
}

// ── Google One-Click Authentication Handler ──────────────────
async function loginWithGoogle() {
  if (typeof firebase === "undefined" || !firebase.auth) {
    if (typeof showToast === "function") showToast("Firebase Auth SDK not loaded.", "error");
    return;
  }

  if (!firebaseAuth) {
    try {
      firebaseAuth = firebase.auth();
    } catch (e) {
      console.warn("Initializing auth on demand:", e.message);
    }
  }

  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    const result = await firebaseAuth.signInWithPopup(provider);
    const user = result.user;

    if (user && user.email) {
      console.log("Google Auth Success:", user.email);
      
      const users = typeof getAllUsers === "function" ? getAllUsers() : {};
      let userRecord = users[user.email];

      if (!userRecord) {
        userRecord = {
          password: "",
          name: user.displayName || "Google User",
          email: user.email,
          phone: user.phoneNumber || "+91 9090909090",
          language: "English",
          state: "Kerala",
          city: "Trivandrum",
          pincode: "695001",
          address: "Default Delivery Address",
          interests: ["Fashion", "Gadgets"],
          savedAddresses: [],
          cart: [],
          wishlist: [],
          orders: [],
          profileComplete: true
        };
        users[user.email] = userRecord;
        if (typeof setAllUsers === "function") setAllUsers(users);
        if (typeof saveDocToFirestore === "function") {
          saveDocToFirestore("users", user.email, userRecord);
        }
      }

      if (typeof setActiveSession === "function") setActiveSession(user.email);
      if (typeof loadActiveUserSession === "function") loadActiveUserSession();

      if (typeof showToast === "function") {
        showToast(`Welcome, ${user.displayName || 'User'}! Logged in with Google.`, "success");
      }

      if (typeof routeTo === "function") {
        routeTo("screen-home");
      }
    }
  } catch (err) {
    console.warn("Google Sign-In Popup Note:", err.message);
    if (err.code !== "auth/popup-closed-by-user") {
      if (typeof showToast === "function") showToast(err.message || "Google Login failed", "error");
    }
  }
}
