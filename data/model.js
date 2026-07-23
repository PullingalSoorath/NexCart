// ============================================================
// RELATIONAL RDBMS SIMULATION ENGINE (localStorage DB)
// ============================================================

// ── Initialize Relational Tables ─────────────────────────────
function initRelationalTables() {
  // 1. Initialize Categories Table
  if (!localStorage.getItem("nexcart_categories")) {
    const defaultCats = [
      { id: "Fashion",     name: "Fashion",     icon: "shirt" },
      { id: "Mobiles",     name: "Mobiles",     icon: "smartphone" },
      { id: "Appliances",  name: "Appliances",  icon: "home" },
      { id: "Electronics", name: "Electronics", icon: "laptop" },
      { id: "Gadgets",     name: "Gadgets",     icon: "headphones" },
      { id: "Toys",        name: "Toys",        icon: "gamepad-2" },
      { id: "Sports",      name: "Sports",      icon: "bike" },
      { id: "Furniture",   name: "Furniture",   icon: "armchair" },
      { id: "Books",       name: "Books",       icon: "book-open" }
    ];
    localStorage.setItem("nexcart_categories", JSON.stringify(defaultCats));
  }

  // 2. Initialize Products Table
  if (!localStorage.getItem("nexcart_products")) {
    if (typeof PRODUCT_CATALOG !== "undefined") {
      localStorage.setItem("nexcart_products", JSON.stringify(PRODUCT_CATALOG));
    } else {
      localStorage.setItem("nexcart_products", JSON.stringify([]));
    }
  }

  // 3. Initialize Orders Table
  if (!localStorage.getItem("nexcart_orders")) {
    const dummyOrders = [
      {
        id: "NX-1001-2025",
        user_email: "user@nexcart.com",
        date: "2025-11-15",
        total_amount: 1500,
        promo_code: "None",
        discount: 0,
        status: "delivered"
      },
      {
        id: "NX-1002-2025",
        user_email: "user@nexcart.com",
        date: "2025-12-20",
        total_amount: 3200,
        promo_code: "None",
        discount: 0,
        status: "delivered"
      },
      {
        id: "NX-1003-2026",
        user_email: "user@nexcart.com",
        date: "2026-01-10",
        total_amount: 2499,
        promo_code: "None",
        discount: 0,
        status: "delivered"
      },
      {
        id: "NX-1004-2026",
        user_email: "user@nexcart.com",
        date: "2026-02-18",
        total_amount: 4500,
        promo_code: "None",
        discount: 0,
        status: "delivered"
      },
      {
        id: "NX-1005-2026",
        user_email: "user@nexcart.com",
        date: "2026-03-22",
        total_amount: 1200,
        promo_code: "None",
        discount: 0,
        status: "delivered"
      },
      {
        id: "NX-1006-2026",
        user_email: "user@nexcart.com",
        date: "2026-04-05",
        total_amount: 8500,
        promo_code: "None",
        discount: 0,
        status: "delivered"
      },
      {
        id: "NX-1007-2026",
        user_email: "user@nexcart.com",
        date: "2026-05-14",
        total_amount: 6200,
        promo_code: "None",
        discount: 0,
        status: "delivered"
      },
      {
        id: "NX-1008-2026",
        user_email: "user@nexcart.com",
        date: "2026-06-25",
        total_amount: 2499,
        promo_code: "None",
        discount: 0,
        status: "delivered"
      },
      {
        id: "NX-1009-2026",
        user_email: "user@nexcart.com",
        date: "2026-06-28",
        total_amount: 4999,
        promo_code: "None",
        discount: 0,
        status: "delivered"
      }
    ];
    localStorage.setItem("nexcart_orders", JSON.stringify(dummyOrders));
  }

  // 4. Initialize Order_Items Table (Relation Join Table)
  if (!localStorage.getItem("nexcart_order_items")) {
    const dummyItems = [
      {
        id: "oi-1001",
        order_id: "NX-1001-2025",
        product_id: "fash-01",
        quantity: 1,
        price_per_unit: 1500,
        size: "M",
        color: "Blue"
      },
      {
        id: "oi-1002",
        order_id: "NX-1002-2025",
        product_id: "appl-01",
        quantity: 1,
        price_per_unit: 3200,
        size: "",
        color: ""
      },
      {
        id: "oi-1003",
        order_id: "NX-1003-2026",
        product_id: "gadg-01",
        quantity: 1,
        price_per_unit: 2499,
        size: "",
        color: ""
      },
      {
        id: "oi-1004",
        order_id: "NX-1004-2026",
        product_id: "toys-01",
        quantity: 3,
        price_per_unit: 1500,
        size: "",
        color: ""
      },
      {
        id: "oi-1005",
        order_id: "NX-1005-2026",
        product_id: "fash-02",
        quantity: 1,
        price_per_unit: 1200,
        size: "S",
        color: "Red"
      },
      {
        id: "oi-1006",
        order_id: "NX-1006-2026",
        product_id: "elec-01",
        quantity: 1,
        price_per_unit: 8500,
        size: "",
        color: ""
      },
      {
        id: "oi-1007",
        order_id: "NX-1007-2026",
        product_id: "gadg-02",
        quantity: 2,
        price_per_unit: 3100,
        size: "",
        color: ""
      },
      {
        id: "oi-1008",
        order_id: "NX-1008-2026",
        product_id: "gadg-01",
        quantity: 1,
        price_per_unit: 2499,
        size: "",
        color: ""
      },
      {
        id: "oi-1009",
        order_id: "NX-1009-2026",
        product_id: "appl-01",
        quantity: 1,
        price_per_unit: 4999,
        size: "",
        color: ""
      }
    ];
    localStorage.setItem("nexcart_order_items", JSON.stringify(dummyItems));
  }
}

// ── CRUD: Category Management with Integrity Checks ──────────
function getCategories() {
  return JSON.parse(localStorage.getItem("nexcart_categories") || "[]");
}

function saveCategory(cat) {
  const cats = getCategories();
  const idx = cats.findIndex(c => c.id === cat.id);
  if (idx > -1) {
    cats[idx] = cat;
  } else {
    cats.push(cat);
  }
  localStorage.setItem("nexcart_categories", JSON.stringify(cats));
  return { success: true };
}

function deleteCategory(categoryId) {
  const products = JSON.parse(localStorage.getItem("nexcart_products") || "[]");
  
  // ON DELETE RESTRICT check: Do not delete category if active products belong to it
  const hasProducts = products.some(p => p.category === categoryId);
  if (hasProducts) {
    return { 
      success: false, 
      reason: `RESTRICT CONSTRAINT VIOLATION: Cannot delete category. Product records link to category '${categoryId}'.` 
    };
  }

  const cats = getCategories();
  const updated = cats.filter(c => c.id !== categoryId);
  localStorage.setItem("nexcart_categories", JSON.stringify(updated));
  return { success: true };
}

// ── CRUD: Product Management with Integrity Checks ───────────
function getProducts() {
  return JSON.parse(localStorage.getItem("nexcart_products") || "[]");
}

function saveProduct(product) {
  const cats = getCategories();
  
  // FOREIGN KEY check: category_id must exist in nexcart_categories
  const categoryExists = cats.some(c => c.id === product.category);
  if (!categoryExists) {
    return { 
      success: false, 
      reason: `FOREIGN KEY VIOLATION: Category '${product.category}' does not exist.` 
    };
  }

  const products = getProducts();
  const idx = products.findIndex(p => p.id === product.id);
  if (idx > -1) {
    products[idx] = product;
  } else {
    products.push(product);
  }
  
  localStorage.setItem("nexcart_products", JSON.stringify(products));
  
  // Sync global in-memory catalog
  if (typeof PRODUCT_CATALOG !== "undefined") {
    const memIdx = PRODUCT_CATALOG.findIndex(p => p.id === product.id);
    if (memIdx > -1) {
      PRODUCT_CATALOG[memIdx] = product;
    } else {
      PRODUCT_CATALOG.push(product);
    }
  }
  return { success: true };
}

function deleteProduct(productId) {
  const orderItems = JSON.parse(localStorage.getItem("nexcart_order_items") || "[]");
  
  // ON DELETE RESTRICT check: Do not delete product if it was purchased in placed order_items
  const hasOrderLink = orderItems.some(oi => oi.product_id === productId);
  if (hasOrderLink) {
    return { 
      success: false, 
      reason: `RESTRICT CONSTRAINT VIOLATION: Cannot delete product. Product exists inside historical Order Items.` 
    };
  }

  const products = getProducts();
  const updated = products.filter(p => p.id !== productId);
  localStorage.setItem("nexcart_products", JSON.stringify(updated));
  
  // Sync memory catalog
  if (typeof PRODUCT_CATALOG !== "undefined") {
    const memIdx = PRODUCT_CATALOG.findIndex(p => p.id === productId);
    if (memIdx > -1) PRODUCT_CATALOG.splice(memIdx, 1);
  }
  
  return { success: true };
}

// ── Programmatic Joins & Aggregations ────────────────────────

// Multi-table Join for Invoice Summary (Users + Orders + Order_Items + Products)
function getOrderInvoiceSummary(orderId) {
  const orders = JSON.parse(localStorage.getItem("nexcart_orders") || "[]");
  const orderItems = JSON.parse(localStorage.getItem("nexcart_order_items") || "[]");
  const products = getProducts();
  const users = getAllUsers();

  const order = orders.find(o => o.id === orderId);
  if (!order) return null;

  const user = users[order.user_email] || {};

  const items = orderItems.filter(oi => oi.order_id === orderId).map(oi => {
    const prod = products.find(p => p.id === oi.product_id) || {};
    return {
      product_id: oi.product_id,
      product_name: prod.name || "Unknown Product",
      image: prod.image || "",
      quantity: oi.quantity,
      size: oi.size,
      color: oi.color,
      price_per_unit: oi.price_per_unit,
      subtotal: oi.quantity * oi.price_per_unit
    };
  });

  return {
    order_id: order.id,
    order_date: order.date,
    order_status: order.status,
    total_amount: order.total_amount,
    promo_code: order.promo_code || "None",
    discount: order.discount || 0,
    customer: {
      name: user.name || "N/A",
      email: order.user_email,
      phone: user.phone || "N/A",
      address: user.address || "N/A",
      state: user.state || "N/A",
      city: user.city || "N/A",
      pincode: user.pincode || "N/A"
    },
    items: items
  };
}

// Aggregate Query Engine (equivalent to SUM, COUNT, GROUP BY)
function getAdminAnalytics() {
  const orders = JSON.parse(localStorage.getItem("nexcart_orders") || "[]");
  const orderItems = JSON.parse(localStorage.getItem("nexcart_order_items") || "[]");
  const products = getProducts();
  const categories = getCategories();

  // 1. SUM(total_amount) -> Total Revenue
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);

  // 2. COUNT(order_id) -> Total Orders
  const totalOrders = orders.length;

  // 3. GROUP BY Category SUM(quantity * price)
  const categoryRevenue = {};
  categories.forEach(c => {
    categoryRevenue[c.name] = 0;
  });

  orderItems.forEach(oi => {
    const prod = products.find(p => p.id === oi.product_id);
    if (prod) {
      const catName = prod.category;
      if (categoryRevenue[catName] === undefined) {
        categoryRevenue[catName] = 0;
      }
      categoryRevenue[catName] += (oi.quantity * oi.price_per_unit);
    }
  });

  // 4. GROUP BY Product SUM(quantity) ORDER BY sales DESC LIMIT 5 (Best Sellers)
  const productSalesCount = {};
  orderItems.forEach(oi => {
    if (!productSalesCount[oi.product_id]) {
      productSalesCount[oi.product_id] = 0;
    }
    productSalesCount[oi.product_id] += oi.quantity;
  });

  const topProducts = Object.keys(productSalesCount).map(pid => {
    const prod = products.find(p => p.id === pid) || {};
    return {
      id: pid,
      name: prod.name || "Unknown Product",
      image: prod.image || "",
      sold: productSalesCount[pid]
    };
  }).sort((a, b) => b.sold - a.sold).slice(0, 5);

  return {
    totalRevenue,
    totalOrders,
    categoryRevenue,
    topProducts
  };
}

// Relational Query mapping for Client Orders History Page
function getOrdersByUser(email) {
  const orders = JSON.parse(localStorage.getItem("nexcart_orders") || "[]");
  const orderItems = JSON.parse(localStorage.getItem("nexcart_order_items") || "[]");
  const products = getProducts();

  const userOrders = orders.filter(o => o.user_email === email);
  const joinedList = [];

  userOrders.forEach(o => {
    const items = orderItems.filter(oi => oi.order_id === o.id);
    items.forEach(oi => {
      const prod = products.find(p => p.id === oi.product_id);
      if (prod) {
        joinedList.push({
          id: o.id,
          date: o.date,
          productName: prod.name,
          image: prod.image,
          price: oi.price_per_unit * oi.quantity,
          status: o.status
        });
      }
    });
  });

  return joinedList;
}
