// NexCart E-commerce SPA — Core Application Logic
//
// Data is loaded from separate files before this script:
//   data/products/fashion.js   → FASHION_PRODUCTS
//   data/products/electronics.js → ELECTRONICS_PRODUCTS
//   data/products/appliances.js → APPLIANCES_PRODUCTS
//   data/products/toys.js      → TOYS_PRODUCTS
//   data/products/others.js    → OTHERS_PRODUCTS
//   data/products/index.js     → PRODUCT_CATALOG (merged + enriched)
//   data/config.js             → BANNER_SLIDES, INTEREST_CATEGORIES, CATEGORY_TABS
//   data/users.js              → Store, saveUserToDatabase, loadActiveUserSession, etc.

// Global chart references for destruction on reload
let chartCategoryReviews = null;
let chartSalesTrend = null;


// --- PAGE ROUTER SYSTEM ---
// --- 3. PAGE ROUTER SYSTEM ---
function routeTo(screenId, ignoreHistory = false) {
  console.log(`Routing to: ${screenId}`);
  
  if (!ignoreHistory) {
    window.history.pushState({ screenId: screenId }, "", "#" + screenId);
  }
  
  // Clear PDP slider timer when leaving PDP
  if (screenId !== "screen-pdp" && typeof pdpCarouselInterval !== "undefined" && pdpCarouselInterval) {
    clearInterval(pdpCarouselInterval);
    pdpCarouselInterval = null;
  }
  
  // Transition screens
  const currentActive = document.querySelector(".screen-view.active");
  const targetScreen = document.getElementById(screenId);
  
  if (currentActive && currentActive.id !== screenId) {
    currentActive.classList.remove("active");
    // Short delay to allow layout reflow for animation
    setTimeout(() => {
      currentActive.style.display = "none";
      targetScreen.style.display = "flex";
      
      // Trigger reflow
      targetScreen.offsetHeight;
      
      targetScreen.classList.add("active");
    }, 150);
  } else {
    targetScreen.style.display = "flex";
    targetScreen.classList.add("active");
  }
  
  Store.activeScreen = screenId;
  updateBadges(); // Sync header & nav badges on every route transition
  
  // Determine Header & Bottom Nav visibility
  const header = document.getElementById("app-header");
  const bottomNav = document.getElementById("app-bottom-nav");
  const fab = document.getElementById("fab-support-btn");
  
  const isShoppingTab = ["screen-home", "screen-categories", "screen-account", "screen-cart"].includes(screenId);
  
  if (isShoppingTab) {
    header.style.display = "flex";
    bottomNav.style.display = "flex";
    fab.style.display = "flex";
  } else {
    header.style.display = "none";
    bottomNav.style.display = "none";
    fab.style.display = "none";
  }
  
  // Map screenId to corresponding Nav Tab active class
  if (isShoppingTab) {
    const tabName = screenId.replace("screen-", "");
    document.querySelectorAll(".nav-tab").forEach(tab => {
      if (tab.getAttribute("data-tab") === tabName) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });
    Store.activeTab = tabName;
  }
  
  // Reset Scroll
  const scrollContainer = document.getElementById("main-content-scroll");
  if (scrollContainer) scrollContainer.scrollTop = 0;
  targetScreen.scrollTop = 0;
  
  // Refresh Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}


// --- 4. RENDER COMPONENT UTILITIES ---

// Custom Reusable Alert Modal
function showAlert(title, content, type = "info", onClose = null) {
  const overlay = document.getElementById("custom-alert-overlay");
  const iconWrap = document.getElementById("custom-alert-icon-wrap");
  const icon = document.getElementById("custom-alert-icon");
  const titleEl = document.getElementById("custom-alert-title");
  const contentEl = document.getElementById("custom-alert-content");
  const closeBtn = document.getElementById("btn-custom-alert-close");
  
  if (!overlay || !titleEl || !contentEl || !closeBtn) return;
  
  // Set contents
  titleEl.textContent = title;
  contentEl.textContent = content;
  
  // Reset classes/icons
  icon.removeAttribute("data-lucide");
  
  // Customize styling based on type
  if (type === "error" || type === "danger") {
    iconWrap.style.backgroundColor = "#ffe4e6";
    iconWrap.style.color = "var(--danger)";
    icon.setAttribute("data-lucide", "alert-circle");
  } else if (type === "success") {
    iconWrap.style.backgroundColor = "var(--accent-light)";
    iconWrap.style.color = "var(--accent)";
    icon.setAttribute("data-lucide", "check-circle-2");
  } else if (type === "warning") {
    iconWrap.style.backgroundColor = "#fef3c7";
    iconWrap.style.color = "var(--warning)";
    icon.setAttribute("data-lucide", "alert-triangle");
  } else {
    iconWrap.style.backgroundColor = "var(--primary-light)";
    iconWrap.style.color = "var(--primary)";
    icon.setAttribute("data-lucide", "info");
  }
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
  
  // Re-bind close event to avoid duplication
  const newCloseBtn = closeBtn.cloneNode(true);
  closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
  
  newCloseBtn.addEventListener("click", () => {
    overlay.classList.remove("active");
    setTimeout(() => {
      overlay.style.display = "none";
      if (typeof onClose === "function") {
        onClose();
      }
    }, 200);
  });
  
  // Show overlay
  overlay.style.display = "flex";
  overlay.offsetHeight; // trigger reflow
  overlay.classList.add("active");
}

// PREMIUM ANIMATED TOAST NOTIFICATION SYSTEM
function showToast(message, type = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.position = "fixed";
    container.style.bottom = "80px"; // Positioned above sticky navigation bar
    container.style.left = "50%";
    container.style.transform = "translateX(-50%)";
    container.style.zIndex = "9999";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "8px";
    container.style.width = "90%";
    container.style.maxWidth = "350px";
    container.style.pointerEvents = "none";
    document.body.appendChild(container);
  }
  
  const toast = document.createElement("div");
  toast.className = `toast-message ${type}`;
  
  // High-fidelity background configuration based on toast type
  let bg = "var(--bg-primary)";
  let border = "1.5px solid var(--border-color)";
  let textColor = "var(--text-primary)";
  let closeColor = "var(--text-light)";
  let iconColor = "var(--success)";
  let iconName = "check-circle";

  if (type === "success") {
    bg = "rgba(16, 185, 129, 0.98)"; // Premium Emerald Green
    border = "1.5px solid rgba(4, 120, 87, 0.4)";
    textColor = "#ffffff";
    closeColor = "rgba(255, 255, 255, 0.8)";
    iconColor = "#ffffff";
    iconName = "check-circle";
  } else if (type === "error" || type === "danger") {
    bg = "rgba(239, 68, 68, 0.98)"; // Elegant Crimson
    border = "1.5px solid rgba(185, 28, 28, 0.4)";
    textColor = "#ffffff";
    closeColor = "rgba(255, 255, 255, 0.8)";
    iconColor = "#ffffff";
    iconName = "alert-circle";
  } else if (type === "warning") {
    bg = "rgba(245, 158, 11, 0.98)"; // Bright Gold
    border = "1.5px solid rgba(180, 83, 9, 0.4)";
    textColor = "#ffffff";
    closeColor = "rgba(255, 255, 255, 0.8)";
    iconColor = "#ffffff";
    iconName = "alert-triangle";
  } else if (type === "info") {
    bg = "rgba(59, 130, 246, 0.98)"; // Royal Blue
    border = "1.5px solid rgba(29, 78, 216, 0.4)";
    textColor = "#ffffff";
    closeColor = "rgba(255, 255, 255, 0.8)";
    iconColor = "#ffffff";
    iconName = "info";
  }

  toast.style.background = bg;
  toast.style.border = border;
  toast.style.borderRadius = "var(--radius-md)";
  toast.style.padding = "10px 14px";
  toast.style.display = "flex";
  toast.style.alignItems = "center";
  toast.style.gap = "10px";
  toast.style.boxShadow = "var(--shadow-lg)";
  toast.style.pointerEvents = "auto";
  toast.style.backdropFilter = "blur(8px)";
  
  // Transition effects
  toast.style.opacity = "0";
  toast.style.transform = "translateY(25px) scale(0.9)";
  toast.style.transition = "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
  
  toast.innerHTML = `
    <i class="toast-icon" data-lucide="${iconName}" style="width: 18px; height: 18px; color: ${iconColor}; flex-shrink: 0;"></i>
    <span style="font-size: 12px; font-weight: 700; color: ${textColor}; flex: 1;">${message}</span>
    <button style="border: none; background: none; cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center;" onclick="this.parentElement.remove()">
      <i data-lucide="x" style="width: 14px; height: 14px; color: ${closeColor};"></i>
    </button>
  `;
  
  container.appendChild(toast);
  
  if (window.lucide) window.lucide.createIcons();
  
  // Trigger animation reflow
  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0) scale(1)";
  }, 30);
  
  // Auto-remove after 3.2 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px) scale(0.95)";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3200);
}

// Render Star rating icons
function getStarsHTML(rating) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars += `<i data-lucide="star" style="width: 11px; height: 11px; fill: var(--warning); color: var(--warning);"></i>`;
    } else {
      stars += `<i data-lucide="star" style="width: 11px; height: 11px; color: var(--text-light);"></i>`;
    }
  }
  return `<div style="display: flex; gap: 1px;">${stars}</div>`;
}

// Render dynamic product card
function createProductCardHTML(product) {
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const isWishlisted = Store.wishlist.has(product.id);
  const badgeHTML = product.trending ? `<div class="product-card-badge">TRENDING</div>` : '';
  
  return `
    <div class="product-card" data-product-id="${product.id}">
      ${badgeHTML}
      <button class="wishlist-toggle-btn ${isWishlisted ? 'active' : ''}" data-product-id="${product.id}">
        <i data-lucide="heart" style="width: 16px; height: 16px; ${isWishlisted ? 'fill: currentColor;' : ''}"></i>
      </button>
      <button class="share-toggle-btn" data-product-id="${product.id}" style="position: absolute; top: 48px; right: 10px; width: 32px; height: 32px; border-radius: 50%; background-color: var(--bg-primary); border: none; box-shadow: var(--shadow-sm); display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 5; color: var(--text-secondary); transition: var(--transition-fast);">
        <i data-lucide="share-2" style="width: 14px; height: 14px;"></i>
      </button>
      <div class="product-img-wrap">
        <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
      </div>
      <div class="product-info-wrap">
        <span class="product-cat">${product.category}</span>
        <h4 class="product-name">${product.name}</h4>
        <div class="rating-row" style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
          ${getStarsHTML(product.rating)}
          <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary);">5/${product.rating}</span>
          <span style="font-size: 10px; color: var(--text-light); font-weight: 500;">(${product.reviews})</span>
        </div>
        <div class="price-row">
          <div class="prices">
            <span class="price-current">₹${product.price.toLocaleString("en-IN")}</span>
            <span class="price-mrp">₹${product.mrp.toLocaleString("en-IN")}</span>
          </div>
          <button class="quick-add-btn" data-product-id="${product.id}" title="Quick Add to Cart">
            <i data-lucide="shopping-cart" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Update badges count
function updateBadges() {
  const cartBadgeBottom = document.getElementById("bottom-nav-cart-badge");
  const wishlistBadgeHeader = document.getElementById("wishlist-badge");
  const cartCountHeader = document.getElementById("cart-item-count-badge");
  
  const headerCartBadge = document.getElementById("header-cart-badge");
  const pdpHeaderCartBadge = document.getElementById("pdp-header-cart-badge");
  const notificationBadge = document.getElementById("notification-badge");
  
  // Cart items sum
  const cartTotalQty = Store.cart.reduce((sum, item) => sum + item.quantity, 0);
  
  if (cartTotalQty > 0) {
    cartBadgeBottom.textContent = cartTotalQty;
    cartBadgeBottom.style.display = "flex";
    
    if (headerCartBadge) {
      headerCartBadge.textContent = cartTotalQty;
      headerCartBadge.style.display = "flex";
    }
    if (pdpHeaderCartBadge) {
      pdpHeaderCartBadge.textContent = cartTotalQty;
      pdpHeaderCartBadge.style.display = "flex";
    }
  } else {
    cartBadgeBottom.style.display = "none";
    if (headerCartBadge) headerCartBadge.style.display = "none";
    if (pdpHeaderCartBadge) pdpHeaderCartBadge.style.display = "none";
  }
  
  if (cartCountHeader) {
    cartCountHeader.textContent = `${cartTotalQty} Item${cartTotalQty !== 1 ? 's' : ''}`;
  }
  
  const wishlistCount = Store.wishlist.size;
  if (wishlistCount > 0) {
    wishlistBadgeHeader.textContent = wishlistCount;
    wishlistBadgeHeader.style.display = "flex";
  } else {
    wishlistBadgeHeader.style.display = "none";
  }

  // Update notification badge count
  const unreadNotifications = Store.notifications.filter(n => n.unread).length;
  if (notificationBadge) {
    if (unreadNotifications > 0) {
      notificationBadge.textContent = unreadNotifications;
      notificationBadge.style.display = "flex";
    } else {
      notificationBadge.style.display = "none";
    }
  }
}


// --- 5. SYSTEM FUNCTIONAL FLOWS ---

// --- 4.5 USER DATABASE SYSTEM ---
function initUserDatabase() {
  let users = JSON.parse(localStorage.getItem("nexcart_users") || "{}");
  if (!users["user@nexcart.com"]) {
    users["user@nexcart.com"] = {
      name: "Anonymous User",
      email: "user@nexcart.com",
      password: "password123",
      phone: "+91 9090909090",
      language: "English",
      state: "Kerala",
      city: "Trivandrum",
      pincode: "695001",
      address: "My House, Neyyattinkara, Trivandrum Kerala",
      interests: ["Fashion", "Gadgets"],
      completedDetails: true,
      completedInterests: true,
      addresses: [
        {
          id: "addr-1",
          tag: "Home",
          name: "Anonymous User",
          street: "My House, Neyyattinkara, Trivandrum Kerala",
          city: "Trivandrum",
          state: "Kerala",
          pincode: "695001",
          phone: "+91 9090909090"
        }
      ]
    };
    localStorage.setItem("nexcart_users", JSON.stringify(users));
  }
  
  // Initialize normalized relational DBMS tables
  initRelationalTables();
}

// AUTH SCREEN CONTROLS
function initAuth() {
  const loginTab = document.getElementById("btn-tab-login");
  const regTab = document.getElementById("btn-tab-register");
  const loginForm = document.getElementById("form-login");
  const regForm = document.getElementById("form-register");
  
  loginTab.addEventListener("click", () => {
    loginTab.classList.add("active");
    regTab.classList.remove("active");
    loginForm.classList.add("active");
    regForm.classList.remove("active");
  });
  
  regTab.addEventListener("click", () => {
    regTab.classList.add("active");
    loginTab.classList.remove("active");
    regForm.classList.add("active");
    loginForm.classList.remove("active");
  });
  
  // Password Visibility Eye Buttons
  const loginPassInput = document.getElementById("login-password");
  const loginPassToggle = document.getElementById("login-password-toggle");
  if (loginPassInput && loginPassToggle) {
    loginPassToggle.addEventListener("click", () => {
      const isPass = loginPassInput.type === "password";
      loginPassInput.type = isPass ? "text" : "password";
      loginPassToggle.innerHTML = `<i data-lucide="${isPass ? 'eye-off' : 'eye'}" style="width: 18px; height: 18px;"></i>`;
      if (window.lucide) window.lucide.createIcons();
    });
  }

  const regPassInput = document.getElementById("register-password");
  const regPassToggle = document.getElementById("register-password-toggle");
  if (regPassInput && regPassToggle) {
    regPassToggle.addEventListener("click", () => {
      const isPass = regPassInput.type === "password";
      regPassInput.type = isPass ? "text" : "password";
      regPassToggle.innerHTML = `<i data-lucide="${isPass ? 'eye-off' : 'eye'}" style="width: 18px; height: 18px;"></i>`;
      if (window.lucide) window.lucide.createIcons();
    });
  }
  
  // Submit Login
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    
    const users = JSON.parse(localStorage.getItem("nexcart_users") || "{}");
    const user = users[email];
    
    if (!user) {
      // User doesn't exist, show warning alert and redirect to register tab
      showAlert("Sign In Error", "You're new here, please sign up.", "error", () => {
        regTab.click();
        document.getElementById("register-email").value = email;
      });
      return;
    }
    
    if (user.password !== password) {
      showAlert("Auth Failed", "Incorrect password. Please try again.", "error");
      return;
    }
    
    // Save Active User Session
    Store.currentUser = user;
    localStorage.setItem("nexcart_active_user", email);
    
    // Check flow logic redirects
    if (!user.completedDetails) {
      document.getElementById("onboard-name").value = user.name || "";
      document.getElementById("onboard-email").value = user.email || "";
      document.getElementById("onboard-address").value = user.address || "";
      showAlert("Login Successful", "Signed in successfully. Please complete your onboarding details.", "success", () => {
        routeTo("screen-onboarding");
      });
    } else if (!user.completedInterests) {
      showAlert("Welcome Back", "Please select your category interests to customize your dashboard.", "info", () => {
        renderInterestsGrid();
        routeTo("screen-interests");
      });
    } else {
      showAlert("Welcome Back", `Successfully signed in as ${user.name}!`, "success", () => {
        renderHomeScreen();
        routeTo("screen-home");
      });
    }
  });
  
  // Submit Register
  regForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("register-name").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const address = document.getElementById("register-address").value.trim();
    const password = document.getElementById("register-password").value;
    
    const users = JSON.parse(localStorage.getItem("nexcart_users") || "{}");
    if (users[email]) {
      showAlert("Account Exists", "This email address is already registered. Please Sign In.", "warning", () => {
        loginTab.click();
        document.getElementById("login-email").value = email;
      });
      return;
    }
    
    // Create new account
    const newUser = {
      name: name,
      email: email,
      password: password,
      address: address,
      phone: "",
      language: "English",
      state: "",
      city: "",
      pincode: "",
      interests: [],
      completedDetails: false,
      completedInterests: false
    };
    
    users[email] = newUser;
    localStorage.setItem("nexcart_users", JSON.stringify(users));
    
    // Auto log in session
    Store.currentUser = newUser;
    localStorage.setItem("nexcart_active_user", email);
    
    // Auto pre-populate onboarding form fields
    document.getElementById("onboard-name").value = name;
    document.getElementById("onboard-email").value = email;
    document.getElementById("onboard-address").value = address;
    
    showAlert("Success", "signup successfully", "success", () => {
      routeTo("screen-onboarding");
    });
  });
}

// ONBOARDING FORM
function initOnboarding() {
  const form = document.getElementById("form-onboarding");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const email = document.getElementById("onboard-email").value;
    const name = document.getElementById("onboard-name").value;
    const phone = document.getElementById("onboard-phone").value;
    const language = document.getElementById("onboard-lang").value;
    const state = document.getElementById("onboard-state").value;
    const city = document.getElementById("onboard-city").value;
    const pincode = document.getElementById("onboard-pincode").value;
    const address = document.getElementById("onboard-address").value;
    
    const users = JSON.parse(localStorage.getItem("nexcart_users") || "{}");
    if (users[email]) {
      users[email].name = name;
      users[email].phone = phone;
      users[email].language = language;
      users[email].state = state;
      users[email].city = city;
      users[email].pincode = pincode;
      users[email].address = address;
      users[email].completedDetails = true;
      users[email].addresses = [
        {
          id: "addr-" + Date.now(),
          tag: "Home",
          name: name,
          street: address,
          state: state,
          city: city,
          pincode: pincode,
          phone: phone
        }
      ];
      
      localStorage.setItem("nexcart_users", JSON.stringify(users));
      Store.currentUser = users[email];
      Store.savedAddresses = users[email].addresses;
    }
    
    showAlert("Profile Completed", "Your details have been saved successfully.", "success", () => {
      renderInterestsGrid();
      routeTo("screen-interests");
    });
  });
}

// INTERESTS SCREEN
function renderInterestsGrid() {
  const container = document.getElementById("interest-chips-container");
  container.innerHTML = INTEREST_CATEGORIES.map(cat => {
    const isSelected = Store.currentUser.interests.includes(cat.label);
    return `
      <div class="interest-card ${isSelected ? 'selected' : ''}" data-label="${cat.label}">
        <div class="interest-icon-wrap">
          <i data-lucide="${cat.icon}"></i>
        </div>
        <span class="interest-label">${cat.label}</span>
      </div>
    `;
  }).join('');
  
  // Add listeners
  document.querySelectorAll(".interest-card").forEach(card => {
    card.addEventListener("click", () => {
      const label = card.getAttribute("data-label");
      const index = Store.currentUser.interests.indexOf(label);
      if (index === -1) {
        Store.currentUser.interests.push(label);
        card.classList.add("selected");
      } else {
        Store.currentUser.interests.splice(index, 1);
        card.classList.remove("selected");
      }
    });
  });
  
  if (window.lucide) window.lucide.createIcons();
}

function initInterests() {
  const continueBtn = document.getElementById("btn-interests-continue");
  continueBtn.addEventListener("click", () => {
    const email = Store.currentUser.email;
    
    const users = JSON.parse(localStorage.getItem("nexcart_users") || "{}");
    if (users[email]) {
      users[email].interests = Store.currentUser.interests;
      users[email].completedInterests = true;
      
      localStorage.setItem("nexcart_users", JSON.stringify(users));
      Store.currentUser = users[email];
    }
    
    showAlert("Preferences Saved", "Your feed is now fully customized based on your interests.", "success", () => {
      renderHomeScreen();
      routeTo("screen-home");
    });
  });
}

// HOME SCREEN VIEW
function renderHomeScreen() {
  // 1. Carousel Slides
  const carousel = document.getElementById("home-carousel");
  
  // Render slide items
  let slidesHTML = BANNER_SLIDES.map((slide, index) => `
    <div class="hero-slide ${index === 0 ? 'active' : ''}" style="background-image: linear-gradient(rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.75)), url('${slide.image}'); cursor: pointer;" data-category="${slide.category || ''}">
      <span class="hero-tag">${slide.tag}</span>
      <h3 class="hero-title">${slide.title}</h3>
      <p class="hero-desc">${slide.desc}</p>
      <button class="btn btn-accent btn-sm" style="width: auto; align-self: flex-start;">Shop Now</button>
    </div>
  `).join('');
  
  // Render slide indicator dots
  let indicatorsHTML = `<div class="carousel-indicators">` + BANNER_SLIDES.map((_, index) => `
    <span class="indicator-dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></span>
  `).join('') + `</div>`;
  
  carousel.innerHTML = slidesHTML + indicatorsHTML;
  
  // Initialize slider interval
  let activeSlide = 0;
  const slides = carousel.querySelectorAll(".hero-slide");
  const dots = carousel.querySelectorAll(".indicator-dot");
  
  function setSlide(index) {
    slides[activeSlide].classList.remove("active");
    dots[activeSlide].classList.remove("active");
    activeSlide = index;
    slides[activeSlide].classList.add("active");
    dots[activeSlide].classList.add("active");
  }
  
  // Auto Rotate
  let slideInterval = setInterval(() => {
    let next = (activeSlide + 1) % BANNER_SLIDES.length;
    setSlide(next);
  }, 5000);
  
  // Indicator Click
  dots.forEach(dot => {
    dot.addEventListener("click", (e) => {
      e.stopPropagation();
      clearInterval(slideInterval);
      const target = parseInt(dot.getAttribute("data-slide"));
      setSlide(target);
    });
  });
  
  // Carousel click action (entire slide redirects to category)
  slides.forEach((slide) => {
    slide.addEventListener("click", () => {
      const cat = slide.getAttribute("data-category");
      if (cat) {
        showCategoryProducts(cat);
        routeTo("screen-categories");
      }
    });
  });

  // 2. Trending Products
  const trendingContainer = document.getElementById("row-trending");
  const trendingProducts = PRODUCT_CATALOG.filter(p => p.trending);
  trendingContainer.innerHTML = trendingProducts.map(p => createProductCardHTML(p)).join('');

  // 3. Suggestions Section (Interest based matches)
  const suggestionsSection = document.getElementById("suggestions-section");
  const suggestionsContainer = document.getElementById("row-suggestions");
  
  if (Store.currentUser.interests.length > 0) {
    const suggestedProducts = PRODUCT_CATALOG.filter(p => 
      Store.currentUser.interests.includes(p.interestGroup)
    );
    
    if (suggestedProducts.length > 0) {
      suggestionsSection.style.display = "block";
      suggestionsContainer.innerHTML = suggestedProducts.map(p => createProductCardHTML(p)).join('');
    } else {
      suggestionsSection.style.display = "none";
    }
  } else {
    suggestionsSection.style.display = "none";
  }

  // 4. Recently Watched Section
  const recentlyWatchedSection = document.getElementById("recently-watched-section");
  const recentlyWatchedContainer = document.getElementById("row-recently-watched");
  
  if (Store.recentlyWatched.length > 0) {
    recentlyWatchedSection.style.display = "block";
    recentlyWatchedContainer.innerHTML = Store.recentlyWatched.map(p => createProductCardHTML(p)).join('');
  } else {
    recentlyWatchedSection.style.display = "none";
  }

  // 5. Explore Products Grid View (with active filters)
  applyHomeFiltersAndRender();
}

// HOME SCREEN DYNAMIC FILTERS & SORT
let homeFilters = {
  price: 130000,
  rating: 0,
  sort: "default"
};

function applyHomeFiltersAndRender() {
  const homeGridContainer = document.getElementById("home-product-grid");
  if (!homeGridContainer) return;

  // Skeletal loader
  homeGridContainer.innerHTML = Array(4).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-img skeleton"></div>
      <div class="skeleton-text title skeleton"></div>
      <div class="skeleton-text price skeleton"></div>
    </div>
  `).join('');

  setTimeout(() => {
    let products = [...PRODUCT_CATALOG];

    // Apply Price Filter
    products = products.filter(p => p.price <= homeFilters.price);

    // Apply Rating Filter
    if (homeFilters.rating > 0) {
      products = products.filter(p => p.rating >= homeFilters.rating);
    }

    // Apply Sorting
    if (homeFilters.sort === "price-asc") {
      products.sort((a, b) => a.price - b.price);
    } else if (homeFilters.sort === "price-desc") {
      products.sort((a, b) => b.price - a.price);
    } else if (homeFilters.sort === "rating") {
      products.sort((a, b) => b.rating - a.rating);
    }

    // Update summary label
    const activeFiltersLbl = document.getElementById("lbl-home-active-filters-count");
    if (activeFiltersLbl) {
      let activeCountText = "All Products";
      if (homeFilters.price < 130000 || homeFilters.rating > 0 || homeFilters.sort !== "default") {
        let filters = [];
        if (homeFilters.price < 130000) filters.push(`Under ₹${homeFilters.price.toLocaleString("en-IN")}`);
        if (homeFilters.rating > 0) filters.push(`${homeFilters.rating}★+`);
        if (homeFilters.sort !== "default") filters.push("Sorted");
        activeCountText = filters.join(" | ");
      }
      activeFiltersLbl.textContent = `${activeCountText} (${products.length} found)`;
    }

    if (products.length > 0) {
      homeGridContainer.innerHTML = products.map(p => createProductCardHTML(p)).join('');
    } else {
      homeGridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: var(--text-secondary);">
          <i data-lucide="frown" style="width: 48px; height: 48px; stroke-width: 1.5px; color: var(--text-light); margin-bottom: 8px;"></i>
          <p style="font-weight: 600;">No items found matching the selected filters.</p>
        </div>
      `;
    }

    attachProductCardEvents();
    if (window.lucide) window.lucide.createIcons();
  }, 300);
}

function initHomeScreenFilters() {
  const toggleBtn = document.getElementById("btn-home-toggle-filters");
  const filtersContent = document.getElementById("home-filters-content");
  if (toggleBtn && filtersContent) {
    filtersContent.style.display = "none";
    toggleBtn.addEventListener("click", () => {
      if (filtersContent.style.display === "none") {
        filtersContent.style.display = "flex";
      } else {
        filtersContent.style.display = "none";
      }
    });
  }

  const priceSlider = document.getElementById("home-filter-price-slider");
  const priceLabel = document.getElementById("lbl-home-max-price-filter");
  if (priceSlider && priceLabel) {
    priceSlider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      priceLabel.textContent = `₹${val.toLocaleString("en-IN")}`;
      homeFilters.price = val;
      applyHomeFiltersAndRender();
    });
  }

  document.querySelectorAll(".home-rating-filter-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".home-rating-filter-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      
      const ratingVal = parseFloat(chip.getAttribute("data-rating"));
      homeFilters.rating = ratingVal;
      applyHomeFiltersAndRender();
    });
  });

  const sortSelect = document.getElementById("home-sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      homeFilters.sort = e.target.value;
      applyHomeFiltersAndRender();
    });
  }

  const resetBtn = document.getElementById("btn-home-reset-filters");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      homeFilters = {
        price: 130000,
        rating: 0,
        sort: "default"
      };
      
      if (priceSlider) priceSlider.value = 130000;
      if (priceLabel) priceLabel.textContent = "₹1,30,000";
      if (sortSelect) sortSelect.value = "default";
      
      document.querySelectorAll(".home-rating-filter-chip").forEach(c => {
        if (parseFloat(c.getAttribute("data-rating")) === 0) {
          c.classList.add("active");
        } else {
          c.classList.remove("active");
        }
      });
      
      applyHomeFiltersAndRender();
    });
  }
}


// CATEGORIES SCREEN VIEW & DYNAMIC FILTERS
let activeCategoryId = "Fashion";
let categoryFilters = {
  price: 130000,
  rating: 0,
  sort: "default"
};

function showCategoryProducts(catId) {
  activeCategoryId = catId;
  
  // Reset filter values
  categoryFilters = {
    price: 130000,
    rating: 0,
    sort: "default"
  };

  // Sync UI controls
  const priceSlider = document.getElementById("filter-price-slider");
  if (priceSlider) priceSlider.value = 130000;
  
  const priceLabel = document.getElementById("lbl-max-price-filter");
  if (priceLabel) priceLabel.textContent = "₹1,30,000";
  
  const sortSelect = document.getElementById("category-sort-select");
  if (sortSelect) sortSelect.value = "default";
  
  document.querySelectorAll(".rating-filter-chip").forEach(chip => {
    if (chip.getAttribute("data-rating") === "0") {
      chip.classList.add("active");
    } else {
      chip.classList.remove("active");
    }
  });

  applyCategoryFiltersAndRender();
}

function applyCategoryFiltersAndRender() {
  const headerTitle = document.getElementById("category-content-title");
  if (headerTitle) headerTitle.textContent = activeCategoryId;
  
  // Highlight correct tab in sidebar
  document.querySelectorAll(".sidebar-tab").forEach(tab => {
    if (tab.getAttribute("data-cat") === activeCategoryId) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  const gridContainer = document.getElementById("category-product-grid");
  if (!gridContainer) return;

  // Skeletal loader
  gridContainer.innerHTML = Array(4).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-img skeleton"></div>
      <div class="skeleton-text title skeleton"></div>
      <div class="skeleton-text price skeleton"></div>
    </div>
  `).join('');

  setTimeout(() => {
    let products = PRODUCT_CATALOG.filter(p => p.category === activeCategoryId);

    // Apply Price Filter
    products = products.filter(p => p.price <= categoryFilters.price);

    // Apply Rating Filter
    if (categoryFilters.rating > 0) {
      products = products.filter(p => p.rating >= categoryFilters.rating);
    }

    // Apply Sorting
    if (categoryFilters.sort === "price-asc") {
      products.sort((a, b) => a.price - b.price);
    } else if (categoryFilters.sort === "price-desc") {
      products.sort((a, b) => b.price - a.price);
    } else if (categoryFilters.sort === "rating") {
      products.sort((a, b) => b.rating - a.rating);
    }

    // Update summary label
    const activeFiltersLbl = document.getElementById("lbl-active-filters-count");
    if (activeFiltersLbl) {
      let activeCountText = "All Products";
      if (categoryFilters.price < 130000 || categoryFilters.rating > 0 || categoryFilters.sort !== "default") {
        let filters = [];
        if (categoryFilters.price < 130000) filters.push(`Under ₹${categoryFilters.price.toLocaleString("en-IN")}`);
        if (categoryFilters.rating > 0) filters.push(`${categoryFilters.rating}★+`);
        if (categoryFilters.sort !== "default") filters.push("Sorted");
        activeCountText = filters.join(" | ");
      }
      activeFiltersLbl.textContent = `${activeCountText} (${products.length} found)`;
    }

    if (products.length > 0) {
      gridContainer.innerHTML = products.map(p => createProductCardHTML(p)).join('');
    } else {
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: var(--text-secondary);">
          <i data-lucide="frown" style="width: 48px; height: 48px; stroke-width: 1.5px; color: var(--text-light); margin-bottom: 8px;"></i>
          <p style="font-weight: 600;">No items found matching the selected filters.</p>
        </div>
      `;
    }

    attachProductCardEvents();
    if (window.lucide) window.lucide.createIcons();
  }, 300);
}

function initCategories() {
  const sidebar = document.getElementById("categories-sidebar");
  
  // Render sidebar tabs
  sidebar.innerHTML = CATEGORY_TABS.map(tab => `
    <div class="sidebar-tab" data-cat="${tab.id}">
      <i data-lucide="${tab.icon}"></i>
      <span>${tab.label}</span>
    </div>
  `).join('');
  
  // Sidebar tab click
  sidebar.querySelectorAll(".sidebar-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const catId = tab.getAttribute("data-cat");
      showCategoryProducts(catId);
    });
  });

  // Expandable filters panel toggle
  const toggleBtn = document.getElementById("btn-toggle-filters");
  const filtersContent = document.getElementById("category-filters-content");
  if (toggleBtn && filtersContent) {
    // Hidden by default to keep screen neat
    filtersContent.style.display = "none";
    toggleBtn.addEventListener("click", () => {
      if (filtersContent.style.display === "none") {
        filtersContent.style.display = "flex";
      } else {
        filtersContent.style.display = "none";
      }
    });
  }

  // Price slider change listener
  const priceSlider = document.getElementById("filter-price-slider");
  const priceLabel = document.getElementById("lbl-max-price-filter");
  if (priceSlider && priceLabel) {
    priceSlider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      priceLabel.textContent = `₹${val.toLocaleString("en-IN")}`;
      categoryFilters.price = val;
      applyCategoryFiltersAndRender();
    });
  }

  // Rating Filter Chips
  document.querySelectorAll(".rating-filter-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".rating-filter-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      
      const ratingVal = parseFloat(chip.getAttribute("data-rating"));
      categoryFilters.rating = ratingVal;
      applyCategoryFiltersAndRender();
    });
  });

  // Sort dropdown change listener
  const sortSelect = document.getElementById("category-sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      categoryFilters.sort = e.target.value;
      applyCategoryFiltersAndRender();
    });
  }

  // Reset button
  const resetBtn = document.getElementById("btn-reset-filters");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      showCategoryProducts(activeCategoryId);
    });
  }
  
  // Default to first category
  showCategoryProducts("Fashion");
}

// PRODUCT DETAILS SCREEN (PDP)
let pdpSelectedSize = "";
let pdpSelectedColor = "";
let pdpCarouselInterval = null;
let pdpActiveSlide = 0;

let activeHistoryPage = 1;

function renderBrowsingHistory(currentProductId) {
  const section = document.querySelector(".browsing-history-section");
  const track = document.getElementById("history-carousel-slider-track");
  const leftBtn = document.getElementById("btn-history-scroll-left");
  const rightBtn = document.getElementById("btn-history-scroll-right");
  const label = document.getElementById("browsing-history-pages-lbl");
  
  if (!track || !leftBtn || !rightBtn || !label) return;

  // Use real recently-watched list, exclude the currently open product
  const historyProducts = Store.recentlyWatched.filter(p => p.id !== currentProductId);

  // Hide section if no history
  if (!historyProducts.length) {
    if (section) section.style.display = "none";
    return;
  }
  if (section) section.style.display = "block";

  const CARDS_PER_PAGE = 4;
  const totalHistoryPages = Math.ceil(historyProducts.length / CARDS_PER_PAGE);

  track.innerHTML = historyProducts.map(p => {
    const discount = p.mrp ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
    return `
    <div class="history-card" data-history-id="${p.id}" style="cursor: pointer; flex-shrink: 0; width: 140px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 8px; background-color: var(--bg-primary); text-align: center; display: flex; flex-direction: column; gap: 6px; transition: box-shadow 0.2s, transform 0.2s;" onmouseover="this.style.boxShadow='var(--shadow-md)';this.style.transform='translateY(-2px)'" onmouseout="this.style.boxShadow='none';this.style.transform='translateY(0)'">
      <div style="width: 100%; height: 100px; display: flex; align-items: center; justify-content: center; background-color: var(--bg-secondary); border-radius: var(--radius-sm); overflow: hidden;">
        <img src="${p.image}" alt="${p.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
      </div>
      <div style="font-size: 11px; font-weight: 700; color: var(--text-primary); text-align: left; height: 32px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.3;">${p.name}</div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="font-size: 11px; font-weight: 800; color: var(--accent-hover);">₹${p.price.toLocaleString("en-IN")}</span>
        ${discount > 0 ? `<span style="font-size: 10px; font-weight: 700; color: var(--danger);">${discount}% off</span>` : ''}
      </div>
    </div>
  `;
  }).join('');

  // Attach click events to open product details
  track.querySelectorAll(".history-card").forEach(card => {
    card.addEventListener("click", () => {
      const pid = card.getAttribute("data-history-id");
      openProductDetails(pid);
    });
  });

  function updateHistoryCarousel() {
    const cardWidth = 140 + 12; // card width + gap
    const shiftPx = (activeHistoryPage - 1) * CARDS_PER_PAGE * cardWidth;
    track.style.transform = `translateX(-${shiftPx}px)`;
    label.textContent = `Page ${activeHistoryPage} of ${totalHistoryPages}`;
    
    leftBtn.style.opacity = activeHistoryPage === 1 ? "0.4" : "1";
    leftBtn.style.pointerEvents = activeHistoryPage === 1 ? "none" : "auto";
    
    rightBtn.style.opacity = activeHistoryPage >= totalHistoryPages ? "0.4" : "1";
    rightBtn.style.pointerEvents = activeHistoryPage >= totalHistoryPages ? "none" : "auto";
  }

  leftBtn.onclick = (e) => {
    e.preventDefault();
    if (activeHistoryPage > 1) {
      activeHistoryPage--;
      updateHistoryCarousel();
    }
  };

  rightBtn.onclick = (e) => {
    e.preventDefault();
    if (activeHistoryPage < totalHistoryPages) {
      activeHistoryPage++;
      updateHistoryCarousel();
    }
  };

  activeHistoryPage = 1;
  updateHistoryCarousel();
}

function initPDPSlider(product) {
  const thumbsContainer = document.getElementById("pdp-vertical-thumbnails");
  const mainImage = document.getElementById("pdp-main-gallery-image");
  const mainTrigger = document.getElementById("pdp-main-image-trigger");
  
  if (!thumbsContainer || !mainImage || !mainTrigger) return;
  
  if (pdpCarouselInterval) {
    clearInterval(pdpCarouselInterval);
    pdpCarouselInterval = null;
  }
  
  pdpActiveSlide = 0;
  
  // Render thumbnails
  thumbsContainer.innerHTML = product.images.map((img, idx) => `
    <div class="pdp-thumbnail-card ${idx === 0 ? 'active' : ''}" data-thumb-idx="${idx}">
      <img src="${img}" alt="${product.name} Thumbnail">
    </div>
  `).join('');
  
  mainImage.src = product.images[0];
  mainImage.alt = product.name;
  
  const totalSlides = product.images.length;
  
  function showSlide(index) {
    pdpActiveSlide = (index + totalSlides) % totalSlides;
    mainImage.src = product.images[pdpActiveSlide];
    
    thumbsContainer.querySelectorAll(".pdp-thumbnail-card").forEach((card, idx) => {
      if (idx === pdpActiveSlide) {
        card.classList.add("active");
        
        // Custom container-relative scrolling instead of browser-level scrollIntoView
        const containerTop = thumbsContainer.scrollTop;
        const containerHeight = thumbsContainer.clientHeight;
        const cardTop = card.offsetTop;
        const cardHeight = card.offsetHeight;
        
        if (cardTop < containerTop) {
          thumbsContainer.scrollTop = cardTop;
        } else if (cardTop + cardHeight > containerTop + containerHeight) {
          thumbsContainer.scrollTop = cardTop + cardHeight - containerHeight;
        }
        
        const containerLeft = thumbsContainer.scrollLeft;
        const containerWidth = thumbsContainer.clientWidth;
        const cardLeft = card.offsetLeft;
        const cardWidth = card.offsetWidth;
        
        if (cardLeft < containerLeft) {
          thumbsContainer.scrollLeft = cardLeft;
        } else if (cardLeft + cardWidth > containerLeft + containerWidth) {
          thumbsContainer.scrollLeft = cardLeft + cardWidth - containerWidth;
        }
      } else {
        card.classList.remove("active");
      }
    });
  }
  
  pdpCarouselInterval = setInterval(() => {
    showSlide(pdpActiveSlide + 1);
  }, 3000);
  
  thumbsContainer.querySelectorAll(".pdp-thumbnail-card").forEach(card => {
    card.addEventListener("click", () => {
      clearInterval(pdpCarouselInterval);
      const idx = parseInt(card.getAttribute("data-thumb-idx"));
      showSlide(idx);
      pdpCarouselInterval = setInterval(() => {
        showSlide(pdpActiveSlide + 1);
      }, 3000);
    });
  });
  
  mainTrigger.onclick = () => {
    const lightboxModal = document.getElementById("pdp-lightbox-modal");
    const lightboxImg = document.getElementById("pdp-lightbox-img");
    if (lightboxModal && lightboxImg) {
      lightboxImg.src = product.images[pdpActiveSlide];
      lightboxModal.style.display = "flex";
    }
  };
  
  const closeLightboxBtn = document.getElementById("btn-close-lightbox");
  if (closeLightboxBtn) {
    closeLightboxBtn.onclick = () => {
      document.getElementById("pdp-lightbox-modal").style.display = "none";
    };
  }
  
  let startX = 0;
  let isDragging = false;
  
  mainImage.addEventListener("touchstart", (e) => {
    clearInterval(pdpCarouselInterval);
    startX = e.touches[0].clientX;
    isDragging = true;
  }, { passive: true });
  
  mainImage.addEventListener("touchend", (e) => {
    if (!isDragging) return;
    isDragging = false;
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    
    if (diff > 50) {
      showSlide(pdpActiveSlide + 1);
    } else if (diff < -50) {
      showSlide(pdpActiveSlide - 1);
    }
    
    pdpCarouselInterval = setInterval(() => {
      showSlide(pdpActiveSlide + 1);
    }, 3000);
  });
  
  mainImage.addEventListener("pointerdown", (e) => {
    clearInterval(pdpCarouselInterval);
    startX = e.clientX;
    isDragging = true;
    mainImage.setPointerCapture(e.pointerId);
  });
  
  mainImage.addEventListener("pointerup", (e) => {
    if (!isDragging) return;
    isDragging = false;
    const endX = e.clientX;
    const diff = startX - endX;
    
    if (diff > 50) {
      showSlide(pdpActiveSlide + 1);
    } else if (diff < -50) {
      showSlide(pdpActiveSlide - 1);
    }
    
    pdpCarouselInterval = setInterval(() => {
      showSlide(pdpActiveSlide + 1);
    }, 3000);
  });
}

function getProductReviews(productId) {
  const allReviews = JSON.parse(localStorage.getItem("nexcart_reviews") || "{}");
  if (!allReviews[productId]) {
    allReviews[productId] = [
      { name: "Siddharth P.", rating: 5, date: "2026-06-18", text: "Exceptional quality! Completely satisfied with the performance and premium materials." },
      { name: "Rohit K.", rating: 4, date: "2026-06-22", text: "Great value for money. Minor delays in shipping but the product itself is outstanding." }
    ];
    localStorage.setItem("nexcart_reviews", JSON.stringify(allReviews));
  }
  return allReviews[productId];
}

function openProductDetails(productId) {
  const product = PRODUCT_CATALOG.find(p => p.id === productId);
  if (!product) return;
  
  const index = Store.recentlyWatched.findIndex(p => p.id === productId);
  if (index !== -1) Store.recentlyWatched.splice(index, 1);
  Store.recentlyWatched.unshift(product);
  if (Store.recentlyWatched.length > 6) Store.recentlyWatched.pop();

  if (document.getElementById("pdp-nav-title")) document.getElementById("pdp-nav-title").textContent = product.name;
  if (document.getElementById("pdp-cat-label")) document.getElementById("pdp-cat-label").textContent = product.category;
  if (document.getElementById("pdp-name-label")) document.getElementById("pdp-name-label").textContent = product.name;
  if (document.getElementById("pdp-rating-val")) document.getElementById("pdp-rating-val").textContent = product.rating;
  if (document.getElementById("pdp-reviews-label")) document.getElementById("pdp-reviews-label").textContent = `${product.reviews.toLocaleString()} ratings`;
  
  if (document.getElementById("pdp-price-current-label")) document.getElementById("pdp-price-current-label").textContent = `₹${product.price.toLocaleString("en-IN")}`;
  if (document.getElementById("pdp-price-mrp-label")) document.getElementById("pdp-price-mrp-label").textContent = `₹${product.mrp.toLocaleString("en-IN")}`;
  
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  if (document.getElementById("pdp-discount-label")) document.getElementById("pdp-discount-label").textContent = `${discount}% OFF`;
  if (document.getElementById("pdp-desc-text")) document.getElementById("pdp-desc-text").textContent = product.description;

  // Initialize carousel swiper & thumbs gallery
  initPDPSlider(product);

  document.getElementById("pdp-warranty-text").textContent = product.warranty;
  document.getElementById("pdp-stars-container").innerHTML = getStarsHTML(product.rating);

  const highlightsSec = document.getElementById("pdp-highlights-section");
  const highlightsList = document.getElementById("pdp-highlights-list");
  if (highlightsSec && highlightsList) {
    if (product.highlights && product.highlights.length > 0) {
      highlightsSec.style.display = "flex";
      highlightsList.innerHTML = product.highlights.map(hl => `<li>${hl}</li>`).join('');
    } else {
      highlightsSec.style.display = "none";
    }
  }

  // Related Products Grid View
  const relatedGrid = document.getElementById("pdp-related-products-grid");
  if (relatedGrid) {
    const related = PRODUCT_CATALOG.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
    if (related.length > 0) {
      relatedGrid.innerHTML = related.map(p => createProductCardHTML(p)).join('');
    } else {
      relatedGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-light); font-size: 12px; padding: 20px;">No related products found.</div>`;
    }
  }

  const pdpWishBtn = document.getElementById("pdp-wishlist-btn");
  pdpWishBtn.setAttribute("data-product-id", product.id);
  if (Store.wishlist.has(product.id)) {
    pdpWishBtn.classList.add("active");
    pdpWishBtn.style.color = "var(--danger)";
    pdpWishBtn.innerHTML = '<i data-lucide="heart" style="fill: currentColor;"></i>';
  } else {
    pdpWishBtn.classList.remove("active");
    pdpWishBtn.style.color = "var(--text-secondary)";
    pdpWishBtn.innerHTML = '<i data-lucide="heart"></i>';
  }

  // Set Right Column Sticky card values
  document.getElementById("pdp-checkout-panel-price").textContent = `₹${product.price.toLocaleString("en-IN")}`;
  
  const delivDate = new Date();
  delivDate.setDate(delivDate.getDate() + 3);
  const options = { weekday: 'long', day: 'numeric', month: 'long' };
  document.getElementById("pdp-checkout-deliv-date").textContent = delivDate.toLocaleDateString("en-US", options);

  // Default quantity selector reset
  document.getElementById("pdp-qty-select").value = "1";

  // Hook up right column checkout buttons
  document.getElementById("btn-pdp-right-add-cart").onclick = () => {
    const qty = parseInt(document.getElementById("pdp-qty-select").value);
    addToCart(product, qty, pdpSelectedSize, pdpSelectedColor);
    showToast(`Added ${qty} item(s) to Cart!`, "success");
    updateBadges();
  };

  document.getElementById("btn-pdp-right-buy-now").onclick = () => {
    const qty = parseInt(document.getElementById("pdp-qty-select").value);
    Store.checkoutSingleItem = {
      product: product,
      quantity: qty,
      size: pdpSelectedSize || "M",
      color: pdpSelectedColor || "Black"
    };
    initiateCheckout();
  };

  // Render Conditional Selectors
  const attributesContainer = document.getElementById("pdp-conditional-attributes-container");
  attributesContainer.innerHTML = "";
  
  pdpSelectedSize = "";
  pdpSelectedColor = "";
  
  if (product.category === "Fashion") {
    pdpSelectedSize = product.sizes[0];
    pdpSelectedColor = product.colors[0].name;
    
    let sizesHTML = product.sizes.map((size, idx) => `
      <button class="size-chip ${idx === 0 ? 'selected' : ''}" data-size="${size}">${size}</button>
    `).join('');
    
    let colorsHTML = product.colors.map((color, idx) => `
      <button class="color-chip ${idx === 0 ? 'selected' : ''}" data-color="${color.name}" style="background-color: ${color.hex};" title="${color.name}"></button>
    `).join('');
    
    attributesContainer.innerHTML = `
      <div class="pdp-variants-container">
        <div>
          <h4 class="variant-title" style="font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px;">Select Size:</h4>
          <div class="size-chips" style="display: flex; gap: 8px;">${sizesHTML}</div>
        </div>
        <div style="margin-top: 10px;">
          <h4 class="variant-title" style="font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px;">Select Color:</h4>
          <div class="color-chips" style="display: flex; gap: 8px;">${colorsHTML}</div>
        </div>
      </div>
    `;
    
    attributesContainer.querySelectorAll(".size-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        attributesContainer.querySelectorAll(".size-chip").forEach(c => c.classList.remove("selected"));
        chip.classList.add("selected");
        pdpSelectedSize = chip.getAttribute("data-size");
      });
    });
    
    attributesContainer.querySelectorAll(".color-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        attributesContainer.querySelectorAll(".color-chip").forEach(c => c.classList.remove("selected"));
        chip.classList.add("selected");
        pdpSelectedColor = chip.getAttribute("data-color");
      });
    });
    
  } else if (product.specs) {
    let specsRows = Object.entries(product.specs).map(([key, val]) => `
      <tr>
        <td style="font-size: 11px; font-weight: 700; color: var(--text-secondary); padding: 4px 8px; border: 1px solid var(--border-color);">${key}</td>
        <td style="font-size: 11px; color: var(--text-primary); padding: 4px 8px; border: 1px solid var(--border-color);">${val}</td>
      </tr>
    `).join('');
    
    attributesContainer.innerHTML = `
      <div>
        <h4 class="variant-title" style="font-size: 12px; font-weight: 800; margin-bottom: 6px;">Technical Specifications</h4>
        <table class="specs-table" style="width: 100%; border-collapse: collapse; border: 1px solid var(--border-color);">
          <tbody>${specsRows}</tbody>
        </table>
      </div>
    `;
  }
  
  // 1. Technical Specifications Table
  const specsTableContainer = document.getElementById("pdp-specs-table-container");
  const specsSec = document.getElementById("pdp-specs-section");
  if (specsTableContainer && specsSec) {
    if (product.specs && Object.keys(product.specs).length > 0) {
      specsSec.style.display = "block";
      specsTableContainer.innerHTML = Object.entries(product.specs).map(([key, val]) => `
        <div style="display: grid; grid-template-columns: 1fr 2fr; padding: 10px 14px; border-bottom: 1px solid var(--border-color); font-size: 12px; line-height: 1.4;">
          <span style="font-weight: 700; color: var(--text-secondary);">${key}</span>
          <span style="color: var(--text-primary); font-weight: 600;">${val}</span>
        </div>
      `).join('');
    } else {
      specsSec.style.display = "none";
    }
  }

  // 2. Customer Reviews System
  function renderProductReviewsList() {
    const reviews = getProductReviews(product.id);
    const totalRatingSum = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = (totalRatingSum / reviews.length).toFixed(1);
    
    const summaryRow = document.getElementById("pdp-reviews-summary-row");
    if (summaryRow) {
      summaryRow.innerHTML = `
        <div style="display: flex; color: var(--warning); gap: 2px;">
          ${getStarsHTML(parseFloat(avgRating))}
        </div>
        <span style="font-size: 14px; font-weight: 800; color: var(--text-primary);">${avgRating} out of 5</span>
        <span style="font-size: 11px; color: var(--text-light); font-weight: 700;">(${reviews.length} customer reviews)</span>
      `;
    }

    const listContainer = document.getElementById("pdp-reviews-list");
    if (listContainer) {
      listContainer.innerHTML = reviews.map(r => `
        <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: 800; color: var(--text-primary);">${r.name}</span>
            <span style="font-size: 10px; color: var(--text-light); font-weight: 700;">${r.date}</span>
          </div>
          <div style="display: flex; color: var(--warning); gap: 2px; font-size: 12px;">
            ${getStarsHTML(r.rating)}
          </div>
          <p style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.4; margin: 2px 0 0 0;">${r.text}</p>
        </div>
      `).join('');
    }
  }

  renderProductReviewsList();

  // Reset Review Form State
  let chosenReviewRating = 5;
  const reviewStars = document.querySelectorAll(".review-star-select");
  
  function highlightStars(rating) {
    reviewStars.forEach(star => {
      const starVal = parseInt(star.getAttribute("data-rating"));
      if (starVal <= rating) {
        star.style.color = "var(--warning)";
        star.style.fill = "currentColor";
      } else {
        star.style.color = "var(--text-light)";
        star.style.fill = "none";
      }
    });
  }
  
  highlightStars(chosenReviewRating);
  
  reviewStars.forEach(star => {
    star.onclick = () => {
      chosenReviewRating = parseInt(star.getAttribute("data-rating"));
      highlightStars(chosenReviewRating);
    };
  });

  const addReviewForm = document.getElementById("form-pdp-add-review");
  if (addReviewForm) {
    addReviewForm.onsubmit = (e) => {
      e.preventDefault();
      const nameInput = document.getElementById("pdp-review-name-input");
      const textInput = document.getElementById("pdp-review-text-input");
      
      const newReview = {
        name: nameInput.value.trim(),
        rating: chosenReviewRating,
        date: new Date().toISOString().split('T')[0],
        text: textInput.value.trim()
      };
      
      const allReviews = JSON.parse(localStorage.getItem("nexcart_reviews") || "{}");
      if (!allReviews[product.id]) allReviews[product.id] = [];
      allReviews[product.id].push(newReview);
      localStorage.setItem("nexcart_reviews", JSON.stringify(allReviews));
      
      const catalogProd = PRODUCT_CATALOG.find(p => p.id === product.id);
      if (catalogProd) {
        const prodReviews = allReviews[product.id];
        const sum = prodReviews.reduce((s, r) => s + r.rating, 0);
        catalogProd.rating = parseFloat((sum / prodReviews.length).toFixed(1));
        catalogProd.reviews = prodReviews.length;
      }
      
      nameInput.value = "";
      textInput.value = "";
      chosenReviewRating = 5;
      highlightStars(5);
      
      showToast("Review submitted successfully!", "success");
      renderProductReviewsList();
      
      if (document.getElementById("pdp-rating-val")) document.getElementById("pdp-rating-val").textContent = catalogProd.rating;
      if (document.getElementById("pdp-reviews-label")) document.getElementById("pdp-reviews-label").textContent = `${catalogProd.reviews.toLocaleString()} ratings`;
      document.getElementById("pdp-stars-container").innerHTML = getStarsHTML(catalogProd.rating);
    };
  }

  // Render Browsing History track (pass current product to exclude it)
  renderBrowsingHistory(productId);
  
  setTimeout(() => attachProductCardEvents(), 50);

  if (window.lucide) window.lucide.createIcons();
  
  // Scroll PDP content area back to top every time a product is opened
  const pdpScrollArea = document.querySelector(".pdp-scrollable-content");
  if (pdpScrollArea) pdpScrollArea.scrollTop = 0;
  
  routeTo("screen-pdp");
}

function initPDP() {
  // Back Button
  document.getElementById("btn-pdp-back").addEventListener("click", () => {
    if (Store.activeTab === "categories") {
      routeTo("screen-categories");
    } else {
      routeTo("screen-home");
    }
  });

  // PDP Navbar Cart Button
  document.getElementById("pdp-header-cart-btn").addEventListener("click", () => {
    renderCartScreen();
    routeTo("screen-cart");
  });
  
  // Wishlist toggle on PDP
  const wishBtn = document.getElementById("pdp-wishlist-btn");
  wishBtn.addEventListener("click", () => {
    const id = wishBtn.getAttribute("data-product-id");
    toggleWishlist(id, wishBtn);
  });

  // PDP Navbar Share Button
  document.getElementById("btn-pdp-share").addEventListener("click", () => {
    const id = wishBtn.getAttribute("data-product-id");
    shareProduct(id);
  });
  
}

// Relational DB Order Placement Helper
function placeOrderInRelationalDB(orderId, itemsToOrder, promoCode = "None", discountAmount = 0) {
  const orders = JSON.parse(localStorage.getItem("nexcart_orders") || "[]");
  const orderItems = JSON.parse(localStorage.getItem("nexcart_order_items") || "[]");
  
  // Calculate total amount
  const itemTotal = itemsToOrder.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalAmount = Math.max(itemTotal - discountAmount, 0);

  // 1. Insert into nexcart_orders
  const newOrder = {
    id: orderId,
    user_email: Store.currentUser.email,
    date: new Date().toISOString().split('T')[0],
    total_amount: totalAmount,
    promo_code: promoCode,
    discount: discountAmount,
    status: "processing"
  };
  orders.unshift(newOrder);
  localStorage.setItem("nexcart_orders", JSON.stringify(orders));

  // 2. Insert into nexcart_order_items
  itemsToOrder.forEach((item, index) => {
    const newOrderItem = {
      id: `oi-${orderId}-${index}`,
      order_id: orderId,
      product_id: item.product.id,
      quantity: item.quantity,
      price_per_unit: item.product.price,
      size: item.size || "",
      color: item.color || ""
    };
    orderItems.push(newOrderItem);
  });
  localStorage.setItem("nexcart_order_items", JSON.stringify(orderItems));
  
  // 3. Subtract product stock in nexcart_products (Inventory Adjustment!)
  const products = JSON.parse(localStorage.getItem("nexcart_products") || "[]");
  itemsToOrder.forEach(item => {
    const prodIdx = products.findIndex(p => p.id === item.product.id);
    if (prodIdx > -1) {
      if (products[prodIdx].stock === undefined) {
        products[prodIdx].stock = 50; // default initial stock
      }
      products[prodIdx].stock = Math.max(products[prodIdx].stock - item.quantity, 0);
    }
  });
  localStorage.setItem("nexcart_products", JSON.stringify(products));

  // Sync memory catalog
  if (typeof PRODUCT_CATALOG !== "undefined") {
    products.forEach(p => {
      const idx = PRODUCT_CATALOG.findIndex(pc => pc.id === p.id);
      if (idx > -1) {
        PRODUCT_CATALOG[idx].stock = p.stock;
      }
    });
  }
}

// CART & CHECKOUT CONTROLS
function addToCart(product, quantity = 1, size = "", color = "") {
  // Search if item with same details already exists in cart
  const itemIndex = Store.cart.findIndex(item => 
    item.product.id === product.id && item.size === size && item.color === color
  );
  
  if (itemIndex > -1) {
    const newQty = Store.cart[itemIndex].quantity + quantity;
    if (newQty > 10) {
      Store.cart[itemIndex].quantity = 10;
      showToast("Maximum limit of 10 units reached per variant!", "warning");
    } else {
      Store.cart[itemIndex].quantity = newQty;
    }
  } else {
    Store.cart.push({
      product: product,
      quantity: Math.min(quantity, 10),
      size: size,
      color: color
    });
  }
  updateBadges();
}

function updateCartQuantity(cartIndex, change) {
  const item = Store.cart[cartIndex];
  if (!item) return;
  
  const newQty = item.quantity + change;
  if (newQty > 10) {
    showToast("Maximum limit of 10 units reached per variant!", "warning");
    return;
  }
  
  item.quantity = newQty;
  if (item.quantity <= 0) {
    Store.cart.splice(cartIndex, 1);
    showToast("Item removed from Cart");
  }
  saveUserToDatabase();
  renderCartScreen();
  updateBadges();
}

function removeCartItem(cartIndex) {
  Store.cart.splice(cartIndex, 1);
  showToast("Item removed from Cart");
  saveUserToDatabase();
  renderCartScreen();
  updateBadges();
}

function renderCartScreen() {
  const listContainer = document.getElementById("cart-items-container");
  const footerBar = document.getElementById("cart-footer-bar");
  
  if (Store.cart.length === 0) {
    footerBar.style.display = "none";
    listContainer.innerHTML = `
      <div class="empty-cart-state">
        <div class="empty-cart-icon">
          <i data-lucide="shopping-cart" style="width: 36px; height: 36px;"></i>
        </div>
        <h3 class="empty-cart-title">Your Cart is Empty</h3>
        <p class="empty-cart-text">Looks like you haven't added anything to your cart yet.</p>
        <button class="btn btn-primary btn-sm" id="btn-empty-cart-shop" style="width: auto;">Shop Now</button>
      </div>
    `;
    
    document.getElementById("btn-empty-cart-shop").addEventListener("click", () => {
      showCategoryProducts("Fashion");
      routeTo("screen-categories");
    });
  } else {
    footerBar.style.display = "flex";
    
    listContainer.innerHTML = Store.cart.map((item, index) => {
      const discount = Math.round(((item.product.mrp - item.product.price) / item.product.mrp) * 100);
      const variantText = item.product.category === "Fashion" ? `Size: ${item.size} | Color: ${item.color}` : "";
      
      return `
        <div class="cart-item-card">
          <div class="cart-item-img-wrap">
            <img src="${item.product.image}" alt="${item.product.name}" class="cart-item-img">
          </div>
          
          <div class="cart-item-info">
            <h4 class="cart-item-title">${item.product.name}</h4>
            ${variantText ? `<div class="cart-item-variants">${variantText}</div>` : ''}
            
            <div class="cart-item-price-row">
              <span class="cart-item-price">₹${(item.product.price * item.quantity).toLocaleString("en-IN")}</span>
              
              <div class="quantity-controller">
                <button class="qty-btn" data-index="${index}" data-change="-1">-</button>
                <div class="qty-number">${item.quantity}</div>
                <button class="qty-btn" data-index="${index}" data-change="1">+</button>
              </div>
            </div>
            
            <div class="cart-item-actions">
              <button class="cart-action-btn remove" data-index="${index}">
                <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                <span>Remove</span>
              </button>
              <button class="cart-action-btn buy-now" data-index="${index}">
                <i data-lucide="zap" style="width: 12px; height: 12px;"></i>
                <span>Buy Now</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    // Add quantity click events
    listContainer.querySelectorAll(".qty-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(btn.getAttribute("data-index"));
        const change = parseInt(btn.getAttribute("data-change"));
        updateCartQuantity(idx, change);
      });
    });
    
    // Add remove events
    listContainer.querySelectorAll(".cart-action-btn.remove").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(btn.getAttribute("data-index"));
        removeCartItem(idx);
      });
    });
    
    // Add Buy Now click events
    listContainer.querySelectorAll(".cart-action-btn.buy-now").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(btn.getAttribute("data-index"));
        const item = Store.cart[idx];
        Store.checkoutSingleItem = {
          product: item.product,
          quantity: item.quantity,
          size: item.size,
          color: item.color
        };
        initiateCheckout();
      });
    });
    
    // Update total price
    const subtotal = Store.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    document.getElementById("cart-subtotal-val").textContent = `₹${subtotal.toLocaleString("en-IN")}`;
  }
  
  if (window.lucide) window.lucide.createIcons();
}

function initCart() {
  document.getElementById("btn-cart-place-order").addEventListener("click", () => {
    Store.checkoutSingleItem = null; // checkout whole cart
    initiateCheckout();
  });
}

// CHECKOUT SCREEN FLOW
function initiateCheckout() {
  // Ensure checkoutActiveAddress is set
  if (!checkoutActiveAddress) {
    if (Store.currentUser.addresses && Store.currentUser.addresses.length > 0) {
      checkoutActiveAddress = Store.currentUser.addresses[0];
    } else {
      checkoutActiveAddress = {
        id: "addr-1",
        tag: "Home",
        name: Store.currentUser.name,
        street: Store.currentUser.address,
        city: Store.currentUser.city || "Trivandrum",
        state: Store.currentUser.state || "Kerala",
        pincode: Store.currentUser.pincode || "695001",
        phone: Store.currentUser.phone
      };
      Store.currentUser.addresses = [checkoutActiveAddress];
      saveUserToDatabase();
    }
  }

  // Address card fill
  const addressBox = document.getElementById("checkout-address-box");
  addressBox.innerHTML = `
    <div class="address-name">${checkoutActiveAddress.name}</div>
    <div>${checkoutActiveAddress.street}</div>
    <div>State: ${checkoutActiveAddress.state}, City: ${checkoutActiveAddress.city}, Pincode: ${checkoutActiveAddress.pincode}</div>
    <div style="margin-top: 6px; font-weight: 600; color: var(--text-primary);">Mobile: ${checkoutActiveAddress.phone}</div>
  `;
  
  // Get items list for checkout
  let items = [];
  if (Store.checkoutSingleItem) {
    items = [Store.checkoutSingleItem];
  } else {
    items = Store.cart;
  }
  
  if (items.length === 0) {
    showToast("No products to check out!", "error");
    return;
  }
  
  // Render Checkout Items List
  const itemsContainer = document.getElementById("checkout-items-preview-list");
  itemsContainer.innerHTML = items.map((item, index) => {
    const metaText = item.product.category === "Fashion" ? `(${item.size}, ${item.color})` : "";
    return `
      <div class="checkout-item-preview" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="${item.product.image}" alt="${item.product.name}" class="checkout-preview-img" style="width: 48px; height: 48px; border-radius: var(--radius-sm); object-fit: contain; background-color: var(--bg-secondary);">
          <div class="checkout-preview-info">
            <div class="checkout-preview-name" style="font-size: 13px; font-weight: 700; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.product.name}</div>
            <div class="checkout-preview-meta" style="font-size: 11px; color: var(--text-secondary);">₹${item.product.price.toLocaleString("en-IN")} ${metaText}</div>
          </div>
        </div>
        
        <!-- Interactive quantity editor -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <button class="btn-checkout-qty-minus" data-checkout-idx="${index}" style="width: 24px; height: 24px; border-radius: 50%; border: 1.5px solid var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; cursor: pointer; color: var(--text-primary); background-color: var(--bg-primary);">-</button>
          <span style="font-size: 13px; font-weight: 700; min-width: 14px; text-align: center;">${item.quantity}</span>
          <button class="btn-checkout-qty-plus" data-checkout-idx="${index}" style="width: 24px; height: 24px; border-radius: 50%; border: 1.5px solid var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; cursor: pointer; color: var(--text-primary); background-color: var(--bg-primary);">+</button>
        </div>
      </div>
    `;
  }).join('');

  // Attach click listeners to checkout quantity buttons
  itemsContainer.querySelectorAll(".btn-checkout-qty-minus").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-checkout-idx"));
      const isSingle = !!Store.checkoutSingleItem;
      let targetItem = isSingle ? Store.checkoutSingleItem : Store.cart[idx];
      
      if (targetItem.quantity > 1) {
        targetItem.quantity--;
      } else {
        // Remove item
        if (isSingle) {
          Store.checkoutSingleItem = null;
          routeTo("screen-cart");
          return;
        } else {
          Store.cart.splice(idx, 1);
        }
      }
      saveUserToDatabase();
      updateBadges();
      initiateCheckout();
    });
  });

  itemsContainer.querySelectorAll(".btn-checkout-qty-plus").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-checkout-idx"));
      const isSingle = !!Store.checkoutSingleItem;
      let targetItem = isSingle ? Store.checkoutSingleItem : Store.cart[idx];
      
      targetItem.quantity++;
      saveUserToDatabase();
      updateBadges();
      initiateCheckout();
    });
  });
  
  // Calculate Totals
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const mrpTotal = items.reduce((sum, item) => sum + (item.product.mrp * item.quantity), 0);
  const finalTotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const discountTotal = mrpTotal - finalTotal;
  
  document.getElementById("checkout-total-items-qty").textContent = totalItemsCount;
  document.getElementById("checkout-mrp-total").textContent = `₹${mrpTotal.toLocaleString("en-IN")}`;
  document.getElementById("checkout-discount-total").textContent = `-₹${discountTotal.toLocaleString("en-IN")}`;
  document.getElementById("checkout-final-amount").textContent = `₹${finalTotal.toLocaleString("en-IN")}`;
  
  // Set total in next step (Payment screen)
  document.getElementById("payment-pay-amount").textContent = `₹${finalTotal.toLocaleString("en-IN")}`;
  
  // Toggle EMI payment method visibility
  const emiCard = document.getElementById("payment-option-emi");
  if (finalTotal > 3000) {
    emiCard.classList.remove("disabled");
    emiCard.style.pointerEvents = "auto";
    emiCard.querySelector(".payment-option-sub").textContent = "Available for your order total!";
  } else {
    emiCard.classList.add("disabled");
    emiCard.style.pointerEvents = "none";
    emiCard.querySelector(".payment-option-sub").textContent = "Only available on orders above ₹3,000";
    if (emiCard.classList.contains("selected")) {
      // Shift default selection to UPI if EMI was active
      selectPaymentMethod("UPI");
    }
  }

  routeTo("screen-checkout");
}

function initCheckoutScreen() {
  document.getElementById("btn-checkout-back").addEventListener("click", () => {
    if (Store.checkoutSingleItem) {
      openProductDetails(Store.checkoutSingleItem.product.id);
    } else {
      routeTo("screen-cart");
    }
  });

  document.getElementById("btn-checkout-change-address").addEventListener("click", () => {
    openAddressManagementSheet(selectedAddr => {
      checkoutActiveAddress = selectedAddr;
      
      const addressBox = document.getElementById("checkout-address-box");
      addressBox.innerHTML = `
        <div class="address-name">${selectedAddr.name}</div>
        <div>${selectedAddr.street}</div>
        <div>State: ${selectedAddr.state}, City: ${selectedAddr.city}, Pincode: ${selectedAddr.pincode}</div>
        <div style="margin-top: 6px; font-weight: 600; color: var(--text-primary);">Mobile: ${selectedAddr.phone}</div>
      `;
      
      showAlert("Address Updated", `Delivery address changed to: ${selectedAddr.tag}`, "success");
    });
  });

  // Promo code is now handled on Payment screen via Gift Card / Promo Coupon option
  
  document.getElementById("btn-checkout-continue").addEventListener("click", () => {
    routeTo("screen-payment");
  });
}

// PAYMENT SCREEN FLOW
let selectedPaymentMethod = "UPI";

function selectPaymentMethod(methodName) {
  selectedPaymentMethod = methodName;
  document.querySelectorAll(".payment-option-card").forEach(card => {
    if (card.getAttribute("data-method") === methodName) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });
}

function initPaymentScreen() {
  document.getElementById("btn-payment-back").addEventListener("click", () => {
    routeTo("screen-checkout");
  });
  
  // Select method clicks
  document.querySelectorAll(".payment-option-card").forEach(card => {
    card.addEventListener("click", () => {
      if (card.classList.contains("disabled")) return;
      const method = card.getAttribute("data-method");
      
      if (method === "GiftCard") {
        // Gift Card / Promo Coupon -> open the promo code modal
        const modal = document.getElementById("promo-modal-overlay");
        const input = document.getElementById("promo-code-input");
        const errorMsg = document.getElementById("promo-error-msg");
        if (modal && input && errorMsg) {
          input.value = "";
          errorMsg.style.display = "none";
          modal.style.display = "flex";
        }
        return; // don't highlight as a payment radio selection
      }
      
      selectPaymentMethod(method);
    });
  });

  // Close promo modal button
  const closePromoBtn = document.getElementById("btn-close-promo-modal");
  if (closePromoBtn) {
    closePromoBtn.onclick = () => {
      document.getElementById("promo-modal-overlay").style.display = "none";
    };
  }

  // Coupon items click listener
  document.querySelectorAll(".coupon-item").forEach(item => {
    item.addEventListener("click", () => {
      const code = item.getAttribute("data-code");
      const input = document.getElementById("promo-code-input");
      if (input) {
        input.value = code;
        // Auto trigger submit
        const submitPromoBtn = document.getElementById("btn-promo-apply-submit");
        if (submitPromoBtn) submitPromoBtn.click();
      }
    });
  });

  // Submit promo verification (from payment screen)
  const submitPromoBtn = document.getElementById("btn-promo-apply-submit");
  if (submitPromoBtn) {
    submitPromoBtn.onclick = () => {
      const input = document.getElementById("promo-code-input");
      const errorMsg = document.getElementById("promo-error-msg");
      const modal = document.getElementById("promo-modal-overlay");
      
      const codeVal = input.value.trim().toUpperCase();
      if (codeVal === "UDHAYA" || codeVal === "FESTIVE20") {
        modal.style.display = "none";
        
        // Add to orders
        let itemsToOrder = [];
        if (Store.checkoutSingleItem) {
          itemsToOrder = [Store.checkoutSingleItem];
        } else {
          itemsToOrder = [...Store.cart];
        }
        const newOrderId = `NX-${Math.floor(1000 + Math.random() * 9000)}-2026`;
        
        // Calculate dynamic discounts
        const itemTotal = itemsToOrder.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        let discountVal = 0;
        if (codeVal === "UDHAYA") {
          discountVal = 2000;
        } else if (codeVal === "FESTIVE20") {
          discountVal = Math.round(itemTotal * 0.2);
        }

        // Place order in relational tables
        placeOrderInRelationalDB(newOrderId, itemsToOrder, codeVal, discountVal);
        
        // Empty memory cart
        if (!Store.checkoutSingleItem) {
          Store.cart = [];
        }
        Store.checkoutSingleItem = null;
        updateBadges();
        saveUserToDatabase();
        
        // Show order success modal
        document.getElementById("success-order-id").textContent = newOrderId;
        const successModal = document.getElementById("success-modal-overlay");
        successModal.style.display = "flex";
        successModal.offsetHeight;
        successModal.classList.add("active");
      } else {
        // Show inline error
        errorMsg.style.display = "block";
      }
    };
  }
  
  // Proceed to Pay
  document.getElementById("btn-payment-proceed").addEventListener("click", () => {
    // Show a micro-interaction skeleton loading effect on the button
    const btn = document.getElementById("btn-payment-proceed");
    const originalText = btn.innerHTML;
    btn.innerHTML = `<span class="skeleton" style="width: 100px; height: 16px; border-radius: 4px; display: inline-block;"></span>`;
    btn.disabled = true;
    
    // Simulate transaction delay
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
      
      // Add items to Ordered List
      let itemsToOrder = [];
      if (Store.checkoutSingleItem) {
        itemsToOrder = [Store.checkoutSingleItem];
      } else {
        itemsToOrder = [...Store.cart];
      }
      
      const newOrderId = `NX-${Math.floor(1000 + Math.random() * 9000)}-2026`;
      
      // Place order in relational tables
      placeOrderInRelationalDB(newOrderId, itemsToOrder, "None", 0);
      
      // Clear Cart if not checkout single item
      if (!Store.checkoutSingleItem) {
        Store.cart = [];
        renderCartScreen();
        updateBadges();
      }
      Store.checkoutSingleItem = null;
      
      // Open animated success dialog modal
      document.getElementById("success-order-id").textContent = newOrderId;
      const modal = document.getElementById("success-modal-overlay");
      modal.style.display = "flex";
      modal.offsetHeight; // trigger reflow
      modal.classList.add("active");
      
    }, 1800);
  });
  
  // Close success modal & go to My Orders
  document.getElementById("btn-success-modal-close").addEventListener("click", () => {
    const modal = document.getElementById("success-modal-overlay");
    modal.classList.remove("active");
    setTimeout(() => {
      modal.style.display = "none";
      renderOrdersList();
      routeTo("screen-orders");
    }, 200);
  });
}

// ACCOUNT SCREEN TAB
function renderAccountScreen() {
  document.getElementById("account-avatar-char").textContent = Store.currentUser.name.charAt(0).toUpperCase();
  document.getElementById("account-user-name").textContent = Store.currentUser.name;
  document.getElementById("account-user-email").textContent = Store.currentUser.email;
  document.getElementById("account-language-val").textContent = Store.currentUser.language;
}

function initAccountScreen() {
  // Grid Menu buttons
  document.getElementById("btn-acc-orders").addEventListener("click", () => {
    renderOrdersList();
    routeTo("screen-orders");
  });
  
  document.getElementById("btn-acc-wishlist").addEventListener("click", () => {
    // Show a list of wishlisted products
    const wishlistIds = Array.from(Store.wishlist);
    if (wishlistIds.length === 0) {
      showToast("Your Wishlist is empty!", "error");
      return;
    }
    
    // Render wishlist products as a dynamic categories category
    const wishlistProducts = PRODUCT_CATALOG.filter(p => wishlistIds.includes(p.id));
    
    // Switch to Categories View and load wishlisted items
    document.querySelectorAll(".sidebar-tab").forEach(tab => tab.classList.remove("active"));
    document.getElementById("category-content-title").textContent = "My Wishlist";
    document.getElementById("category-product-grid").innerHTML = wishlistProducts.map(p => createProductCardHTML(p)).join('');
    
    attachProductCardEvents();
    if (window.lucide) window.lucide.createIcons();
    routeTo("screen-categories");
  });
  
  document.getElementById("btn-acc-cart").addEventListener("click", () => {
    renderCartScreen();
    routeTo("screen-cart");
  });
  
  document.getElementById("btn-acc-help").addEventListener("click", () => {
    routeTo("screen-helpdesk");
  });

  // Settings click listeners
  document.getElementById("btn-acc-edit-profile").addEventListener("click", () => {
    // Fill edit profile form with current values
    document.getElementById("edit-profile-name").value = Store.currentUser.name || "";
    document.getElementById("edit-profile-email").value = Store.currentUser.email || "";
    document.getElementById("edit-profile-phone").value = Store.currentUser.phone || "";
    document.getElementById("edit-profile-language").value = Store.currentUser.language || "English";
    document.getElementById("edit-profile-state").value = Store.currentUser.state || "";
    document.getElementById("edit-profile-city").value = Store.currentUser.city || "";
    document.getElementById("edit-profile-pincode").value = Store.currentUser.pincode || "";
    document.getElementById("edit-profile-address").value = Store.currentUser.address || "";
    routeTo("screen-edit-profile");
  });
  
  document.getElementById("btn-acc-saved-address").addEventListener("click", () => {
    openAddressManagementSheet();
  });
  
  document.getElementById("btn-acc-language").addEventListener("click", () => {
    openLanguageSelectionSheet();
  });
  
  document.getElementById("btn-acc-logout").addEventListener("click", () => {
    // Reset session states
    localStorage.removeItem("nexcart_active_user");
    Store.currentUser = {
      name: "Anonymous User",
      email: "user@nexcart.com",
      phone: "+91 9090909090",
      language: "English",
      state: "Kerala",
      city: "Trivandrum",
      pincode: "695001",
      address: "My House, Neyyattinkara, Trivandrum Kerala",
      interests: ["Fashion", "Gadgets"]
    };
    Store.cart = [];
    Store.wishlist.clear();
    showAlert("Logged Out", "You have been safely signed out.", "info", () => {
      routeTo("screen-auth");
    });
  });
}

// ORDERS SUB-PAGE
function renderOrdersList() {
  const container = document.getElementById("orders-items-container");
  const userOrders = getOrdersByUser(Store.currentUser.email);
  
  if (userOrders.length === 0) {
    container.innerHTML = `
      <div style="padding: 60px 20px; text-align: center; color: var(--text-secondary);">
        <i data-lucide="package" style="width: 48px; height: 48px; stroke-width: 1.5px; color: var(--text-light); margin-bottom: 8px;"></i>
        <p style="font-weight: 600;">You haven't placed any orders yet.</p>
      </div>
    `;
  } else {
    container.innerHTML = userOrders.map(order => {
      const dateFormatted = new Date(order.date).toLocaleDateString("en-IN", {
        year: 'numeric', month: 'short', day: 'numeric'
      });
      
      let statusLabel = "Processing";
      let progressWidth = "0%";
      
      let shippedColor = "var(--bg-tertiary)";
      let shippedTextColor = "var(--text-light)";
      let shippedIcon = `<span style="font-size: 10px; font-weight: 800;">2</span>`;
      let shippedLabelColor = "var(--text-light)";
      
      let deliveredColor = "var(--bg-tertiary)";
      let deliveredTextColor = "var(--text-light)";
      let deliveredIcon = `<span style="font-size: 10px; font-weight: 800;">3</span>`;
      let deliveredLabelColor = "var(--text-light)";
      
      let actionButtonHTML = "";

      if (order.status === "shipped") {
        statusLabel = "Shipped";
        progressWidth = "50%";
        shippedColor = "var(--accent)";
        shippedTextColor = "white";
        shippedIcon = `<i data-lucide="truck" style="width: 12px; height: 12px;"></i>`;
        shippedLabelColor = "var(--text-primary)";
        actionButtonHTML = `
          <button class="btn btn-secondary btn-simulate-status" data-order-id="${order.id}" data-next-status="delivered" style="width: auto; padding: 4px 10px; font-size: 10px; height: 26px; font-weight: 800; border-radius: var(--radius-sm); display: inline-flex; align-items: center; gap: 4px;">
            <i data-lucide="package" style="width: 12px; height: 12px;"></i>
            <span>Simulate Delivery</span>
          </button>
        `;
      } else if (order.status === "delivered") {
        statusLabel = "Delivered";
        progressWidth = "100%";
        shippedColor = "var(--accent)";
        shippedTextColor = "white";
        shippedIcon = `<i data-lucide="check" style="width: 12px; height: 12px;"></i>`;
        shippedLabelColor = "var(--text-primary)";
        
        deliveredColor = "var(--accent)";
        deliveredTextColor = "white";
        deliveredIcon = `<i data-lucide="package" style="width: 12px; height: 12px;"></i>`;
        deliveredLabelColor = "var(--text-primary)";
      } else {
        // processing
        actionButtonHTML = `
          <button class="btn btn-secondary btn-simulate-status" data-order-id="${order.id}" data-next-status="shipped" style="width: auto; padding: 4px 10px; font-size: 10px; height: 26px; font-weight: 800; border-radius: var(--radius-sm); display: inline-flex; align-items: center; gap: 4px;">
            <i data-lucide="truck" style="width: 12px; height: 12px;"></i>
            <span>Simulate Shipping</span>
          </button>
        `;
      }
      
      return `
        <div class="order-history-card" style="display: flex; flex-direction: column; background: var(--bg-primary); border: 1.5px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; gap: 12px; margin-bottom: 16px; box-shadow: var(--shadow-sm);">
          <div class="order-card-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; flex-wrap: wrap; gap: 8px;">
            <span style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">Order ID: <strong style="color: var(--text-primary);">${order.id}</strong> | Date: ${dateFormatted}</span>
            <div style="display: flex; align-items: center; gap: 6px;">
              <button class="btn btn-secondary btn-view-invoice" data-order-id="${order.id}" style="width: auto; padding: 4px 10px; font-size: 10px; height: 26px; font-weight: 800; border-radius: var(--radius-sm); display: inline-flex; align-items: center; gap: 4px; border: 1px solid var(--primary-light); color: var(--primary);">
                <i data-lucide="receipt" style="width: 12px; height: 12px;"></i>
                <span>Invoice</span>
              </button>
              ${actionButtonHTML}
              <span class="order-status-chip ${order.status}">${statusLabel}</span>
            </div>
          </div>
          
          <div class="order-product-row" style="display: flex; gap: 14px; align-items: center;">
            <img src="${order.image}" alt="${order.productName}" class="order-product-img" style="width: 60px; height: 60px; object-fit: contain; border-radius: var(--radius-sm); border: 1px solid var(--border-color); padding: 4px; background: var(--bg-secondary);">
            <div class="order-product-details" style="display: flex; flex-direction: column; gap: 4px;">
              <span class="order-product-name" style="font-size: 13px; font-weight: 800; color: var(--text-primary);">${order.productName}</span>
              <span class="order-product-price" style="font-size: 13px; font-weight: 700; color: var(--primary);">₹${order.price.toLocaleString("en-IN")}</span>
            </div>
          </div>
 
          <!-- Live Progress Stepper -->
          <div class="order-tracker" style="margin-top: 6px; padding: 10px 0; border-top: 1px dashed var(--border-color); display: flex; flex-direction: column; gap: 8px;">
            <div style="font-size: 10px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Live Order Tracking:</div>
            <div class="tracker-steps" style="display: flex; justify-content: space-between; position: relative; margin-top: 4px;">
              <!-- connecting progress line background -->
              <div style="position: absolute; top: 12px; left: 16%; right: 16%; height: 3px; background-color: var(--border-color); z-index: 1;"></div>
              <!-- active progress line color -->
              <div style="position: absolute; top: 12px; left: 16%; width: calc(${progressWidth} * 0.68); height: 3px; background-color: var(--accent); z-index: 2; transition: width 0.4s ease;"></div>
              
              <!-- Step 1: Confirmed -->
              <div class="tracker-step" style="display: flex; flex-direction: column; align-items: center; z-index: 3; flex: 1;">
                <div style="width: 26px; height: 26px; border-radius: 50%; background-color: var(--accent); color: white; display: flex; align-items: center; justify-content: center; border: 3px solid var(--bg-primary);">
                  <i data-lucide="check" style="width: 12px; height: 12px;"></i>
                </div>
                <span style="font-size: 9px; font-weight: 800; color: var(--text-primary); margin-top: 4px;">Confirmed</span>
              </div>
 
              <!-- Step 2: Shipped -->
              <div class="tracker-step" style="display: flex; flex-direction: column; align-items: center; z-index: 3; flex: 1;">
                <div style="width: 26px; height: 26px; border-radius: 50%; background-color: ${shippedColor}; color: ${shippedTextColor}; display: flex; align-items: center; justify-content: center; border: 3px solid var(--bg-primary); transition: all 0.3s ease;">
                  ${shippedIcon}
                </div>
                <span style="font-size: 9px; font-weight: 800; color: ${shippedLabelColor}; margin-top: 4px;">Shipped</span>
              </div>
 
              <!-- Step 3: Delivered -->
              <div class="tracker-step" style="display: flex; flex-direction: column; align-items: center; z-index: 3; flex: 1;">
                <div style="width: 26px; height: 26px; border-radius: 50%; background-color: ${deliveredColor}; color: ${deliveredTextColor}; display: flex; align-items: center; justify-content: center; border: 3px solid var(--bg-primary); transition: all 0.3s ease;">
                  ${deliveredIcon}
                </div>
                <span style="font-size: 9px; font-weight: 800; color: ${deliveredLabelColor}; margin-top: 4px;">Delivered</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
 
    // Attach click listeners to simulate button clicks
    container.querySelectorAll(".btn-simulate-status").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const orderId = btn.getAttribute("data-order-id");
        const nextStatus = btn.getAttribute("data-next-status");
        
        // Find order and update its status inside nexcart_orders
        const orders = JSON.parse(localStorage.getItem("nexcart_orders") || "[]");
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex > -1) {
          orders[orderIndex].status = nextStatus;
          localStorage.setItem("nexcart_orders", JSON.stringify(orders));
          renderOrdersList(); // refresh UI
        }
      });
    });

    // Attach click listeners to view invoice modal
    container.querySelectorAll(".btn-view-invoice").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const orderId = btn.getAttribute("data-order-id");
        openInvoiceModal(orderId);
      });
    });
  }
  
  if (window.lucide) window.lucide.createIcons();
}

// ── Invoice Dialog Modal Render Function (jsPDF to New Tab) ──
function openInvoiceModal(orderId) {
  const invoice = getOrderInvoiceSummary(orderId);
  if (!invoice) {
    showToast("Invoice data not found!", "error");
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Brand theme styling palette
    const primaryColor = [79, 70, 229]; // #4f46e5 (Indigo)
    const secondaryColor = [71, 85, 105]; // #475569
    const lightGray = [241, 245, 249]; // #f1f5f9
    const darkGray = [30, 41, 59]; // #1e293b

    // Document header background band
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 35, "F");

    // Corporate Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("NexCart E-Commerce", 15, 22);

    // Document Designation
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("TAX INVOICE", 150, 22);

    // Reset fonts for customer/billing section
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Invoice Metadata:", 15, 48);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice ID:  ${invoice.order_id}`, 15, 54);
    doc.text(`Order Date:  ${invoice.order_date}`, 15, 60);
    doc.text(`Status:      ${invoice.order_status.toUpperCase()}`, 15, 66);

    // Billed to Info
    doc.setFont("helvetica", "bold");
    doc.text("Billed To (Customer):", 120, 48);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Name:    ${invoice.customer.name}`, 120, 54);
    doc.text(`Email:   ${invoice.customer.email}`, 120, 60);
    doc.text(`Phone:   ${invoice.customer.phone}`, 120, 66);
    
    // Split long addresses cleanly
    const addressStr = `${invoice.customer.address}, ${invoice.customer.city}, ${invoice.customer.state} - ${invoice.customer.pincode}`;
    const wrappedAddr = doc.splitTextToSize(addressStr, 75);
    doc.text("Address: ", 120, 72);
    doc.text(wrappedAddr, 138, 72);

    // Section line divider
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 88, 195, 88);

    // Table Header Row Background
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(15, 94, 180, 8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Product Item Name", 18, 99);
    doc.text("Qty", 120, 99, { align: "center" });
    doc.text("Unit Price", 155, 99, { align: "right" });
    doc.text("Subtotal", 190, 99, { align: "right" });

    // Table Rows Render
    let itemY = 108;
    doc.setFont("helvetica", "normal");

    invoice.items.forEach(item => {
      if (itemY > 260) {
        doc.addPage();
        itemY = 20;
      }
      
      const itemNameTrunc = item.product_name.length > 50 ? item.product_name.substring(0, 47) + "..." : item.product_name;
      doc.text(itemNameTrunc, 18, itemY);
      doc.text(item.quantity.toString(), 120, itemY, { align: "center" });
      doc.text(`INR ${item.price_per_unit.toLocaleString("en-IN")}`, 155, itemY, { align: "right" });
      doc.text(`INR ${item.subtotal.toLocaleString("en-IN")}`, 190, itemY, { align: "right" });

      doc.setDrawColor(241, 245, 249);
      doc.line(15, itemY + 2, 195, itemY + 2);
      itemY += 10;
    });

    // Total section details
    itemY += 2;
    doc.setDrawColor(226, 232, 240);
    doc.line(15, itemY, 195, itemY);

    itemY += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Promo Code Applied:", 120, itemY);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.promo_code, 190, itemY, { align: "right" });

    itemY += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Discount Applied:", 120, itemY);
    doc.setFont("helvetica", "normal");
    doc.text(`- INR ${invoice.discount.toLocaleString("en-IN")}`, 190, itemY, { align: "right" });

    itemY += 8;
    // Final payable background box
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(115, itemY - 5, 80, 9, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(11);
    doc.text("Total Payable:", 120, itemY + 1);
    doc.text(`INR ${invoice.total_amount.toLocaleString("en-IN")}`, 190, itemY + 1, { align: "right" });

    // Footer note
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("Thank you for choosing NexCart! This document is a system-generated relational invoice.", 105, 285, { align: "center" });

    // Output Blob and Open
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, "_blank");
    showToast("Invoice PDF generated and opened in new tab!", "success");
  } catch (err) {
    console.error("PDF generation failed:", err);
    showToast("Could not generate PDF: " + err.message, "error");
  }
}

function initOrdersScreen() {
  document.getElementById("btn-orders-back").addEventListener("click", () => {
    routeTo("screen-account");
  });
}


// --- 6. EVENT ATTACHMENTS & INTERACTION HANDLERS ---

function shareProduct(productId) {
  const products = getProducts();
  const prod = products.find(p => p.id === productId);
  if (!prod) return;

  const shareUrl = window.location.origin + window.location.pathname + "?product=" + productId;
  const shareTitle = `Check out this ${prod.name} on NexCart!`;
  
  if (navigator.share) {
    navigator.share({
      title: shareTitle,
      text: `Look at this amazing ${prod.name} at ₹${prod.price.toLocaleString("en-IN")}`,
      url: shareUrl
    }).then(() => {
      showToast("Shared successfully!", "success");
    }).catch(err => {
      copyShareLinkToClipboard(shareUrl);
    });
  } else {
    copyShareLinkToClipboard(shareUrl);
  }
}

function copyShareLinkToClipboard(url) {
  navigator.clipboard.writeText(url).then(() => {
    showToast("Product link copied to clipboard!", "success");
  }).catch(err => {
    showToast("Could not copy link!", "error");
  });
}

function toggleWishlist(productId, element) {
  const isWish = Store.wishlist.has(productId);
  
  if (isWish) {
    Store.wishlist.delete(productId);
    showToast("Removed from Wishlist");
    if (element) {
      element.classList.remove("active");
      if (element.id === "pdp-wishlist-btn") {
        element.style.color = "var(--text-secondary)";
        element.innerHTML = '<i data-lucide="heart"></i>';
      }
    }
  } else {
    Store.wishlist.add(productId);
    showToast("Saved to Wishlist!");
    if (element) {
      element.classList.add("active");
      if (element.id === "pdp-wishlist-btn") {
        element.style.color = "var(--danger)";
        element.innerHTML = '<i data-lucide="heart" style="fill: currentColor;"></i>';
      }
    }
  }
  
  // Re-sync all wishlist icons on screens
  document.querySelectorAll(`.wishlist-toggle-btn[data-product-id="${productId}"]`).forEach(btn => {
    if (Store.wishlist.has(productId)) {
      btn.classList.add("active");
      btn.innerHTML = `<i data-lucide="heart" style="width: 16px; height: 16px; fill: currentColor;"></i>`;
    } else {
      btn.classList.remove("active");
      btn.innerHTML = `<i data-lucide="heart" style="width: 16px; height: 16px;"></i>`;
    }
  });

  updateBadges();
  if (window.lucide) window.lucide.createIcons();
}

function attachProductCardEvents() {
  // Product Detail opens when card is clicked (except wishlist, share or quick add buttons)
  document.querySelectorAll(".product-card").forEach(card => {
    card.onclick = (e) => {
      // Stop if click is inside wishlist toggle button, share button, or quick add cart button
      if (e.target.closest(".wishlist-toggle-btn") || e.target.closest(".quick-add-btn") || e.target.closest(".share-toggle-btn")) return;
      
      const id = card.getAttribute("data-product-id");
      openProductDetails(id);
    };
  });

  // Product card wishlist buttons
  document.querySelectorAll(".wishlist-toggle-btn").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-product-id");
      toggleWishlist(id, btn);
    };
  });

  // Product card share buttons
  document.querySelectorAll(".share-toggle-btn").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-product-id");
      shareProduct(id);
    };
  });

  // Product card Quick Add buttons
  document.querySelectorAll(".quick-add-btn").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-product-id");
      const product = PRODUCT_CATALOG.find(p => p.id === id);
      
      // Default sizes/colors for quick add if Fashion
      const size = product.category === "Fashion" ? product.sizes[0] : "";
      const color = product.category === "Fashion" ? product.colors[0].name : "";
      
      addToCart(product, 1, size, color);
      showToast("Added to Cart!");
      updateBadges();
    };
  });
}

// TOP LEVEL SPA STICKY NAV TABS
function initNavigationTabs() {
  document.querySelectorAll(".nav-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const targetTab = tab.getAttribute("data-tab");
      
      if (targetTab === "home") {
        renderHomeScreen();
        routeTo("screen-home");
      } else if (targetTab === "categories") {
        routeTo("screen-categories");
      } else if (targetTab === "account") {
        renderAccountScreen();
        routeTo("screen-account");
      } else if (targetTab === "cart") {
        renderCartScreen();
        routeTo("screen-cart");
      }
    });
  });
}

// SEARCH FUNCTIONALITY & SUGGESTIONS DROPDOWN
function initSearch() {
  const searchInput = document.getElementById("search-input");
  const suggestionsBox = document.getElementById("search-suggestions-box");
  
  if (!searchInput || !suggestionsBox) return;

  searchInput.addEventListener("input", (e) => {
    const rawVal = e.target.value;
    const query = rawVal.toLowerCase().trim();
    
    if (!query) {
      suggestionsBox.style.display = "none";
      suggestionsBox.innerHTML = "";
      
      // Restore default category view if cleared
      const activeTabCat = document.querySelector(".sidebar-tab.active");
      if (activeTabCat) {
        showCategoryProducts(activeTabCat.getAttribute("data-cat"));
      } else {
        showCategoryProducts("Fashion");
      }
      return;
    }
    
    // Find up to 5 matching products
    const matches = PRODUCT_CATALOG.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.category.toLowerCase().includes(query)
    ).slice(0, 5);
    
    if (matches.length > 0) {
      suggestionsBox.innerHTML = matches.map(p => `
        <div class="suggestion-item" data-id="${p.id}" style="padding: 10px 14px; cursor: pointer; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--border-color); font-size: 12px; font-weight: 700; color: var(--text-primary); transition: background 0.2s;">
          <img src="${p.image}" style="width: 28px; height: 28px; object-fit: contain; border-radius: 4px; background: var(--bg-secondary); padding: 2px; border: 1px solid var(--border-color);">
          <div style="display: flex; flex-direction: column;">
            <span>${p.name}</span>
            <span style="font-size: 10px; color: var(--text-light); font-weight: 500;">${p.category} • ₹${p.price.toLocaleString("en-IN")}</span>
          </div>
        </div>
      `).join('');
      suggestionsBox.style.display = "block";
      
      // Suggestion click listener
      suggestionsBox.querySelectorAll(".suggestion-item").forEach(item => {
        item.addEventListener("click", () => {
          const pid = item.getAttribute("data-id");
          searchInput.value = "";
          suggestionsBox.style.display = "none";
          openProductDetails(pid);
          routeTo("screen-pdp");
        });
      });
    } else {
      suggestionsBox.style.display = "none";
    }
  });

  // Handle enter key to execute full search
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const query = searchInput.value.toLowerCase().trim();
      if (!query) return; // Ignore empty queries
      
      suggestionsBox.style.display = "none";
      routeTo("screen-categories");
      document.querySelectorAll(".sidebar-tab").forEach(tab => tab.classList.remove("active"));
      
      const title = document.getElementById("category-content-title");
      title.textContent = `Search results for "${query}"`;
      
      const matches = PRODUCT_CATALOG.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
      
      const gridContainer = document.getElementById("category-product-grid");
      if (matches.length > 0) {
        gridContainer.innerHTML = matches.map(p => createProductCardHTML(p)).join('');
      } else {
        gridContainer.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: var(--text-secondary);">
            <i data-lucide="search" style="width: 48px; height: 48px; stroke-width: 1.5px; color: var(--text-light); margin-bottom: 8px;"></i>
            <p style="font-weight: 600;">No products matched your search.</p>
          </div>
        `;
      }
      
      attachProductCardEvents();
      if (window.lucide) window.lucide.createIcons();
    }
  });

  // Click outside listener to hide suggestions
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
      suggestionsBox.style.display = "none";
    }
  });
}

// HEADER & FLOATING HELPERS
function renderNotificationsScreen() {
  const container = document.getElementById("notifications-list-container");
  if (!container) return;
  
  if (Store.notifications.length === 0) {
    container.innerHTML = `
      <div style="padding: 60px 20px; text-align: center; color: var(--text-secondary);">
        <i data-lucide="bell-off" style="width: 48px; height: 48px; stroke-width: 1.5px; color: var(--text-light); margin-bottom: 8px;"></i>
        <p style="font-weight: 600;">You have no new notifications.</p>
      </div>
    `;
    const badge = document.getElementById("notification-badge");
    if (badge) badge.style.display = "none";
    return;
  }
  
  container.innerHTML = Store.notifications.map(not => `
    <div class="notification-card" style="background-color: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; display: flex; gap: 12px; box-shadow: var(--shadow-sm); position: relative; ${not.unread ? 'border-left: 3px solid var(--primary);' : ''}">
      <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background-color: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <i data-lucide="${not.icon}" style="width: 18px; height: 18px;"></i>
      </div>
      <div style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-size: 13px; font-weight: 700; color: var(--text-primary);">${not.title}</span>
          <span style="font-size: 10px; color: var(--text-light);">${not.time}</span>
        </div>
        <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.4;">${not.content}</p>
      </div>
    </div>
  `).join('');
  
  // Mark all notifications as read upon opening
  Store.notifications.forEach(n => n.unread = false);
  updateBadges();
  
  if (window.lucide) window.lucide.createIcons();
}

// --- 5.5 TRANSLATIONS & MULTI-LANGUAGE SYSTEM ---
const TRANSLATIONS = {
  English: {
    home: "Home",
    categories: "Categories",
    account: "Account",
    cart: "Cart",
    search_placeholder: "Search products, brands and more...",
    saved_addresses: "Saved Addresses",
    select_language: "Select Language",
    edit_profile: "Edit Profile",
    logout: "Logout",
    trending: "Trending Products",
    suggestions: "Suggestions For You",
    recently_watched: "Recently Watched",
    explore: "Explore NexCart",
    add_to_cart: "Add to Cart",
    buy_now: "Buy Now",
    product_highlights: "Product Highlights",
    product_description: "Product Description",
    related_products: "Related Products",
    notifications: "Notifications",
    clear_all: "Clear All"
  },
  Hindi: {
    home: "होम",
    categories: "श्रेणियाँ",
    account: "खाता",
    cart: "कार्ट",
    search_placeholder: "उत्पाद, ब्रांड और बहुत कुछ खोजें...",
    saved_addresses: "सहेजे गए पते",
    select_language: "भाषा चुनें",
    edit_profile: "प्रोफ़ाइल संपादित करें",
    logout: "लॉग आउट",
    trending: "ट्रेंडिंग उत्पाद",
    suggestions: "आपके लिए सुझाव",
    recently_watched: "हाल ही में देखे गए",
    explore: "नेक्सकार्ट का अन्वेषण करें",
    add_to_cart: "कार्ट में जोड़ें",
    buy_now: "अभी खरीदें",
    product_highlights: "उत्पाद की मुख्य विशेषताएं",
    product_description: "उत्पाद का विवरण",
    related_products: "संबंधित उत्पाद",
    notifications: "सूचनाएं",
    clear_all: "सभी साफ़ करें"
  },
  Malayalam: {
    home: "ഹോം",
    categories: "വിഭാഗങ്ങൾ",
    account: "അക്കൗണ്ട്",
    cart: "കാർട്ട്",
    search_placeholder: "ഉൽപ്പന്നങ്ങൾ, ബ്രാൻഡുകൾ എന്നിവ തിരയുക...",
    saved_addresses: "സംരക്ഷിച്ച വിലാസങ്ങൾ",
    select_language: "ഭാഷ തിരഞ്ഞെടുക്കുക",
    edit_profile: "പ്രൊഫൈൽ തിരുത്തുക",
    logout: "ലോഗൗട്ട്",
    trending: "ട്രെൻഡിംഗ് ഉൽപ്പന്നങ്ങൾ",
    suggestions: "നിങ്ങൾക്കായി നിർദ്ദേശിക്കുന്നവ",
    recently_watched: "അടുത്തിടെ കണ്ടവ",
    explore: "നെക്സ്കാർട്ട് പര്യവേക്ഷണം ചെയ്യുക",
    add_to_cart: "കാർട്ടിലേക്ക് ചേർക്കുക",
    buy_now: "ഇപ്പോൾ വാങ്ങുക",
    product_highlights: "ഉൽപ്പന്ന സവിശേഷതകൾ",
    product_description: "ഉൽപ്പന്ന വിവരണം",
    related_products: "ബന്ധപ്പെട്ട ഉൽപ്പന്നങ്ങൾ",
    notifications: "അറിയിപ്പുകൾ",
    clear_all: "എല്ലാം മായ്ക്കുക"
  },
  Japanese: {
    home: "ホーム",
    categories: "カテゴリ",
    account: "アカウント",
    cart: "カート",
    search_placeholder: "製品やブランドを検索...",
    saved_addresses: "保存された住所",
    select_language: "言語の選択",
    edit_profile: "プロフィール編集",
    logout: "ログアウト",
    trending: "トレンド商品",
    suggestions: "あなたへのおすすめ",
    recently_watched: "最近チェックした商品",
    explore: "ネクスカートを探索",
    add_to_cart: "カートに追加",
    buy_now: "今すぐ購入",
    product_highlights: "製品のハイライト",
    product_description: "製品の説明",
    related_products: "関連商品",
    notifications: "通知",
    clear_all: "すべてクリア"
  },
  Spanish: {
    home: "Inicio",
    categories: "Categorías",
    account: "Cuenta",
    cart: "Carrito",
    search_placeholder: "Buscar productos, marcas...",
    saved_addresses: "Direcciones Guardadas",
    select_language: "Seleccionar Idioma",
    edit_profile: "Editar Perfil",
    logout: "Cerrar Sesión",
    trending: "Productos de Tendencia",
    suggestions: "Sugerencias Para Ti",
    recently_watched: "Visto Recientemente",
    explore: "Explorar NexCart",
    add_to_cart: "Añadir al Carrito",
    buy_now: "Comprar Ahora",
    product_highlights: "Aspectos Destacados",
    product_description: "Descripción del Producto",
    related_products: "Productos Relacionados",
    notifications: "Notificaciones",
    clear_all: "Borrar Todo"
  },
  German: {
    home: "Startseite",
    categories: "Kategorien",
    account: "Konto",
    cart: "Warenkorb",
    search_placeholder: "Produkte, Marken suchen...",
    saved_addresses: "Gespeicherte Adressen",
    select_language: "Sprache auswählen",
    edit_profile: "Profil bearbeiten",
    logout: "Abmelden",
    trending: "Beliebte Produkte",
    suggestions: "Empfehlungen für Sie",
    recently_watched: "Zuletzt angesehen",
    explore: "NexCart erkunden",
    add_to_cart: "In den Warenkorb",
    buy_now: "Jetzt kaufen",
    product_highlights: "Produkt-Highlights",
    product_description: "Produktbeschreibung",
    related_products: "Ähnliche Produkte",
    notifications: "Benachrichtigungen",
    clear_all: "Alle löschen"
  },
  French: {
    home: "Accueil",
    categories: "Catégories",
    account: "Compte",
    cart: "Panier",
    search_placeholder: "Rechercher des produits...",
    saved_addresses: "Adresses Enregistrées",
    select_language: "Choisir la Langue",
    edit_profile: "Modifier le Profil",
    logout: "Se déconnecter",
    trending: "Produits Tendance",
    suggestions: "Suggestions pour vous",
    recently_watched: "Récemment consultés",
    explore: "Explorer NexCart",
    add_to_cart: "Ajouter au Panier",
    buy_now: "Acheter Maintenant",
    product_highlights: "Points Forts",
    product_description: "Description du Produit",
    related_products: "Produits Associés",
    notifications: "Notifications",
    clear_all: "Tout effacer"
  }
};

function applyLanguageTranslations(lang) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;
  
  // Navigation Tabs text
  const tabs = document.getElementById("app-bottom-nav");
  if (tabs) {
    const tabHomeSpan = tabs.querySelector('[data-tab="home"] span');
    if (tabHomeSpan) tabHomeSpan.textContent = t.home;
    const tabCatSpan = tabs.querySelector('[data-tab="categories"] span');
    if (tabCatSpan) tabCatSpan.textContent = t.categories;
    const tabAccSpan = tabs.querySelector('[data-tab="account"] span');
    if (tabAccSpan) tabAccSpan.textContent = t.account;
    const tabCartSpan = tabs.querySelector('[data-tab="cart"] span');
    if (tabCartSpan) tabCartSpan.textContent = t.cart;
  }
  
  // Search Placeholder
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.placeholder = t.search_placeholder;
  
  // Home headers
  const lblTrending = document.getElementById("lbl-home-trending");
  if (lblTrending) lblTrending.textContent = t.trending;
  const lblSuggestions = document.getElementById("lbl-home-suggestions");
  if (lblSuggestions) lblSuggestions.textContent = t.suggestions;
  const lblRecently = document.getElementById("lbl-home-recently");
  if (lblRecently) lblRecently.textContent = t.recently_watched;
  const lblExplore = document.getElementById("lbl-home-explore");
  if (lblExplore) lblExplore.textContent = t.explore;
  
  // Account settings titles
  const btnSavedAddresses = document.getElementById("btn-acc-saved-address");
  if (btnSavedAddresses) btnSavedAddresses.querySelector("span").textContent = t.saved_addresses;
  const btnLang = document.getElementById("btn-acc-language");
  if (btnLang) btnLang.querySelector("span").textContent = t.select_language;
  const btnEditProfile = document.getElementById("btn-acc-edit-profile");
  if (btnEditProfile) btnEditProfile.querySelector("span").textContent = t.edit_profile;
  const btnLogout = document.getElementById("btn-acc-logout");
  if (btnLogout) btnLogout.querySelector("span").textContent = t.logout;

  // Language sheet headers
  const lblLangTitle = document.getElementById("lbl-language-sheet-title");
  if (lblLangTitle) lblLangTitle.textContent = t.select_language;
  const lblLangDesc = document.getElementById("lbl-language-sheet-desc");
  if (lblLangDesc) lblLangDesc.textContent = lang === "English" ? "Choose your preferred language for the entire shopping experience." : `${t.select_language}`;
  const lblLangBtn = document.getElementById("lbl-lang-apply-btn");
  if (lblLangBtn) lblLangBtn.textContent = t.select_language;


  // Edit profile form labels
  const epTitle = document.getElementById("lbl-edit-profile-title");
  if (epTitle) epTitle.textContent = t.edit_profile;
  const epSubmit = document.getElementById("btn-ep-submit");
  if (epSubmit) epSubmit.querySelector("span").textContent = t.edit_profile;
}

// --- 5.6 SAVED ADDRESS CRUD CONTROLLER ---
let checkoutActiveAddress = null; // Track selected address for Order Summary checkout

function openAddressManagementSheet(onSelectAddressCallback = null) {
  const overlay = document.getElementById("address-sheet-overlay");
  const body = document.getElementById("address-sheet-body");
  if (!overlay || !body) return;

  // Ensure user has addresses array in Store
  if (!Store.currentUser.addresses || Store.currentUser.addresses.length === 0) {
    Store.currentUser.addresses = [
      {
        id: "addr-1",
        tag: "Home",
        name: Store.currentUser.name,
        street: Store.currentUser.address,
        city: Store.currentUser.city || "Trivandrum",
        state: Store.currentUser.state || "Kerala",
        pincode: Store.currentUser.pincode || "695001",
        phone: Store.currentUser.phone
      }
    ];
  }

  function renderAddressesList() {
    body.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${Store.currentUser.addresses.map(addr => {
          const isSelectedForCheckout = checkoutActiveAddress && checkoutActiveAddress.id === addr.id;
          return `
            <div class="address-item-card ${isSelectedForCheckout ? 'selected' : ''}" data-addr-id="${addr.id}">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="address-tag-badge">${addr.tag}</span>
                ${isSelectedForCheckout ? '<span style="font-size: 11px; font-weight: 700; color: var(--primary);">Selected for delivery</span>' : ''}
              </div>
              <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-top: 4px;">${addr.name}</div>
              <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.4;">${addr.street}</div>
              <div style="font-size: 12px; color: var(--text-light);">State: ${addr.state}, City: ${addr.city}, Pincode: ${addr.pincode}</div>
              <div style="font-size: 12px; font-weight: 600; color: var(--text-primary); margin-top: 2px;">Mobile: ${addr.phone}</div>
              <div class="address-card-actions">
                <button class="address-btn edit" data-edit-id="${addr.id}">
                  <i data-lucide="edit-3" style="width: 13px;"></i>
                  <span>Edit</span>
                </button>
                <button class="address-btn delete" data-delete-id="${addr.id}">
                  <i data-lucide="trash-2" style="width: 13px;"></i>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          `;
        }).join('')}
        
        <button class="btn btn-secondary btn-sm" id="btn-add-new-address" style="width: 100%; border-style: dashed; margin-top: 8px;">
          <i data-lucide="plus" style="width: 16px;"></i>
          <span>Add New Address</span>
        </button>
      </div>
    `;

    // Click cards to select them for checkout
    body.querySelectorAll(".address-item-card").forEach(card => {
      card.addEventListener("click", (e) => {
        // Skip clicking callback if action buttons are targeted
        if (e.target.closest("button") || e.target.closest(".address-card-actions")) return;
        const addrId = card.getAttribute("data-addr-id");
        const selectedAddr = Store.currentUser.addresses.find(a => a.id === addrId);
        if (selectedAddr) {
          if (onSelectAddressCallback) {
            onSelectAddressCallback(selectedAddr);
            overlay.classList.remove("active");
          }
        }
      });
    });

    // Edit button listeners
    body.querySelectorAll("[data-edit-id]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-edit-id");
        const addr = Store.currentUser.addresses.find(a => a.id === id);
        if (addr) renderAddressForm(addr);
      });
    });

    // Delete button listeners
    body.querySelectorAll("[data-delete-id]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-delete-id");
        if (Store.currentUser.addresses.length <= 1) {
          showAlert("Error", "You must keep at least one saved address.", "error");
          return;
        }
        Store.currentUser.addresses = Store.currentUser.addresses.filter(a => a.id !== id);
        
        // If we deleted the active checkout address, re-bind it to default
        if (checkoutActiveAddress && checkoutActiveAddress.id === id) {
          checkoutActiveAddress = Store.currentUser.addresses[0];
        }

        saveUserToDatabase();
        renderAddressesList();
        showAlert("Success", "Address deleted successfully.", "success");
      });
    });

    // Add New button listener
    document.getElementById("btn-add-new-address").addEventListener("click", () => {
      renderAddressForm();
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function renderAddressForm(existingAddress = null) {
    const isEditing = !!existingAddress;
    body.innerHTML = `
      <form id="form-sheet-address" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h4 style="font-size: 14px; font-weight: 800;">${isEditing ? 'Edit Address' : 'Add New Address'}</h4>
          <button type="button" class="btn btn-sm" id="btn-back-to-addresses" style="width: auto; padding: 4px 8px; color: var(--primary);">
            Cancel
          </button>
        </div>

        <div class="form-group">
          <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px; display: block;">Address Tag (e.g. Home, Work, Office)</label>
          <input type="text" id="sheet-addr-tag" class="form-input" style="height: 38px;" required value="${isEditing ? existingAddress.tag : 'Home'}">
        </div>

        <div class="form-group">
          <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px; display: block;">Contact Person Name</label>
          <input type="text" id="sheet-addr-name" class="form-input" style="height: 38px;" required value="${isEditing ? existingAddress.name : Store.currentUser.name}">
        </div>

        <div class="form-group">
          <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px; display: block;">Street Address details</label>
          <textarea id="sheet-addr-street" class="form-input" style="min-height: 50px; padding: 8px;" required>${isEditing ? existingAddress.street : ''}</textarea>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group">
            <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px; display: block;">State</label>
            <input type="text" id="sheet-addr-state" class="form-input" style="height: 38px;" required value="${isEditing ? existingAddress.state : ''}">
          </div>
          <div class="form-group">
            <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px; display: block;">City</label>
            <input type="text" id="sheet-addr-city" class="form-input" style="height: 38px;" required value="${isEditing ? existingAddress.city : ''}">
          </div>
        </div>

        <div class="form-group">
          <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px; display: block;">Pincode</label>
          <input type="text" id="sheet-addr-pincode" class="form-input" style="height: 38px;" required value="${isEditing ? (existingAddress.pincode || '') : ''}" pattern="[0-9]{6}" title="Six digit pincode">
        </div>

        <div class="form-group">
          <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px; display: block;">Contact Mobile Number</label>
          <input type="tel" id="sheet-addr-phone" class="form-input" style="height: 38px;" required value="${isEditing ? existingAddress.phone : Store.currentUser.phone}">
        </div>

        <button type="submit" class="btn btn-primary btn-sm" style="width: 100%; margin-top: 8px;">
          <span>${isEditing ? 'Save Address' : 'Add Address'}</span>
          <i data-lucide="check" style="width: 16px;"></i>
        </button>
      </form>
    `;

    document.getElementById("btn-back-to-addresses").addEventListener("click", () => {
      renderAddressesList();
    });

    document.getElementById("form-sheet-address").addEventListener("submit", (e) => {
      e.preventDefault();
      
      const tag = document.getElementById("sheet-addr-tag").value.trim();
      const name = document.getElementById("sheet-addr-name").value.trim();
      const street = document.getElementById("sheet-addr-street").value.trim();
      const state = document.getElementById("sheet-addr-state").value.trim();
      const city = document.getElementById("sheet-addr-city").value.trim();
      const pincode = document.getElementById("sheet-addr-pincode").value.trim();
      const phone = document.getElementById("sheet-addr-phone").value.trim();

      if (isEditing) {
        existingAddress.tag = tag;
        existingAddress.name = name;
        existingAddress.street = street;
        existingAddress.state = state;
        existingAddress.city = city;
        existingAddress.pincode = pincode;
        existingAddress.phone = phone;
        
        if (checkoutActiveAddress && checkoutActiveAddress.id === existingAddress.id) {
          checkoutActiveAddress = existingAddress;
        }
      } else {
        const newAddr = {
          id: "addr-" + Date.now(),
          tag,
          name,
          street,
          state,
          city,
          pincode,
          phone
        };
        Store.currentUser.addresses.push(newAddr);
        if (!checkoutActiveAddress) checkoutActiveAddress = newAddr;
      }

      saveUserToDatabase();
      renderAddressesList();
      showAlert("Success", isEditing ? "Address updated successfully!" : "New Address added successfully!", "success");
    });

    if (window.lucide) window.lucide.createIcons();
  }

  document.getElementById("btn-close-address-sheet").onclick = () => {
    overlay.classList.remove("active");
  };

  renderAddressesList();
  overlay.classList.add("active");
}



// --- 5.7 LANGUAGE MODAL DROPDOWN SHEET CONTROLLER ---
function openLanguageSelectionSheet() {
  const overlay = document.getElementById("language-dialog-overlay");
  const activeLabel = document.getElementById("lang-active-label");
  const menu = document.getElementById("lang-dropdown-menu");
  const applyBtn = document.getElementById("btn-language-apply-changes");
  
  if (!overlay || !activeLabel || !menu) return;

  const languages = [
    { code: "English", native: "English" },
    { code: "Hindi", native: "Hindi (हिन्दी)" },
    { code: "Malayalam", native: "Malayalam (മലയാളം)" },
    { code: "Japanese", native: "Japanese (日本語)" },
    { code: "Spanish", native: "Spanish (Español)" },
    { code: "German", native: "German (Deutsch)" },
    { code: "French", native: "French (Français)" }
  ];

  let selectedLang = Store.currentUser.language || "English";
  activeLabel.textContent = selectedLang;

  menu.innerHTML = languages.map(lang => `
    <div class="lang-option-item ${lang.code === selectedLang ? 'selected' : ''}" data-lang-code="${lang.code}">
      <span>${lang.native}</span>
      ${lang.code === selectedLang ? '<i data-lucide="check" style="width: 14px; color: var(--primary);"></i>' : ''}
    </div>
  `).join('');

  const selectBox = document.getElementById("lang-active-box");
  selectBox.onclick = (e) => {
    e.stopPropagation();
    menu.classList.toggle("open");
  };

  menu.querySelectorAll("[data-lang-code]").forEach(item => {
    item.addEventListener("click", () => {
      selectedLang = item.getAttribute("data-lang-code");
      activeLabel.textContent = selectedLang;
      
      menu.querySelectorAll(".lang-option-item").forEach(i => i.classList.remove("selected"));
      item.classList.add("selected");
      
      menu.classList.remove("open");
      
      menu.innerHTML = languages.map(lang => `
        <div class="lang-option-item ${lang.code === selectedLang ? 'selected' : ''}" data-lang-code="${lang.code}">
          <span>${lang.native}</span>
          ${lang.code === selectedLang ? '<i data-lucide="check" style="width: 14px; color: var(--primary);"></i>' : ''}
        </div>
      `).join('');
      if (window.lucide) window.lucide.createIcons();
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".lang-dropdown-wrapper")) {
      menu.classList.remove("open");
    }
  });

  applyBtn.onclick = () => {
    Store.currentUser.language = selectedLang;
    saveUserToDatabase();
    
    applyLanguageTranslations(selectedLang);
    
    renderAccountScreen();
    overlay.style.display = "none";
    showAlert("Success", "Language changed successfully!", "success");
  };

  document.getElementById("btn-close-language-dialog").onclick = () => {
    overlay.style.display = "none";
  };

  if (window.lucide) window.lucide.createIcons();
  overlay.style.display = "flex";
}

// --- 5.8 EDIT PROFILE VIEW SCREEN FLOW ---
function initEditProfileScreen() {
  const backBtn = document.getElementById("btn-edit-profile-back");
  const form = document.getElementById("form-edit-profile");
  
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      routeTo("screen-account");
    });
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const name = document.getElementById("edit-profile-name").value.trim();
      const phone = document.getElementById("edit-profile-phone").value.trim();
      const language = document.getElementById("edit-profile-language").value;
      const state = document.getElementById("edit-profile-state").value.trim();
      const city = document.getElementById("edit-profile-city").value.trim();
      const pincode = document.getElementById("edit-profile-pincode").value.trim();
      const address = document.getElementById("edit-profile-address").value.trim();

      // Save user details
      Store.currentUser.name = name;
      Store.currentUser.phone = phone;
      Store.currentUser.language = language;
      Store.currentUser.state = state;
      Store.currentUser.city = city;
      Store.currentUser.pincode = pincode;
      Store.currentUser.address = address;

      // Update address list defaults
      if (Store.currentUser.addresses && Store.currentUser.addresses.length > 0) {
        Store.currentUser.addresses[0].name = name;
        Store.currentUser.addresses[0].street = address;
        Store.currentUser.addresses[0].phone = phone;
        Store.currentUser.addresses[0].state = state;
        Store.currentUser.addresses[0].city = city;
        Store.currentUser.addresses[0].pincode = pincode;
      }

      saveUserToDatabase();
      applyLanguageTranslations(language);
      renderAccountScreen();
      
      showAlert("Profile Updated", "Your profile details have been saved successfully.", "success", () => {
        routeTo("screen-account");
      });
    });
  }
}

function initHeaderAndFAB() {
  // Wishlist Header Button -> Switches to Categories tab displaying wishlist
  document.getElementById("header-wishlist-btn").addEventListener("click", () => {
    const wishlistIds = Array.from(Store.wishlist);
    if (wishlistIds.length === 0) {
      showAlert("Wishlist Empty", "Your Wishlist is empty!", "warning");
      return;
    }
    const wishlistProducts = PRODUCT_CATALOG.filter(p => wishlistIds.includes(p.id));
    
    document.querySelectorAll(".sidebar-tab").forEach(tab => tab.classList.remove("active"));
    document.getElementById("category-content-title").textContent = "My Wishlist";
    document.getElementById("category-product-grid").innerHTML = wishlistProducts.map(p => createProductCardHTML(p)).join('');
    
    attachProductCardEvents();
    if (window.lucide) window.lucide.createIcons();
    routeTo("screen-categories");
  });

  // Header Cart Icon Button
  document.getElementById("header-cart-btn").addEventListener("click", () => {
    renderCartScreen();
    routeTo("screen-cart");
  });

  // Header Notifications Icon Button
  document.getElementById("header-notification-btn").addEventListener("click", () => {
    renderNotificationsScreen();
    routeTo("screen-notifications");
  });

  // Notifications Page Actions
  document.getElementById("btn-notifications-back").addEventListener("click", () => {
    if (Store.activeTab === "categories") {
      routeTo("screen-categories");
    } else if (Store.activeTab === "account") {
      routeTo("screen-account");
    } else if (Store.activeTab === "cart") {
      routeTo("screen-cart");
    } else {
      routeTo("screen-home");
    }
  });

  document.getElementById("btn-notifications-clear-all").addEventListener("click", () => {
    Store.notifications = [];
    renderNotificationsScreen();
    updateBadges();
    showAlert("Notifications Cleared", "All notifications have been cleared successfully.", "success");
  });
  
  // FAB customer support simulation
  document.getElementById("fab-support-btn").addEventListener("click", () => {
    routeTo("screen-helpdesk");
  });
}

function initHelpdeskSystem() {
  const backBtn = document.getElementById("btn-helpdesk-back");
  if (backBtn) {
    backBtn.onclick = () => {
      routeTo("screen-account");
    };
  }

  const form = document.getElementById("form-helpdesk-chat");
  const input = document.getElementById("helpdesk-chat-input");
  const chatBody = document.getElementById("helpdesk-chat-body");

  function appendMessage(text, isBot) {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${isBot ? 'bot' : 'user'}`;
    bubble.style.alignSelf = isBot ? "flex-start" : "flex-end";
    bubble.style.backgroundColor = isBot ? "var(--bg-primary)" : "var(--primary)";
    bubble.style.border = isBot ? "1.5px solid var(--border-color)" : "none";
    bubble.style.borderRadius = isBot ? "16px 16px 16px 4px" : "16px 16px 4px 16px";
    bubble.style.padding = "12px 16px";
    bubble.style.maxWidth = "80%";
    bubble.style.fontSize = "12px";
    bubble.style.fontWeight = "600";
    bubble.style.color = isBot ? "var(--text-primary)" : "white";
    bubble.style.lineHeight = "1.5";
    bubble.style.boxShadow = "var(--shadow-sm)";
    bubble.textContent = text;
    
    chatBody.appendChild(bubble);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function getBotReply(userMsg) {
    const msg = userMsg.toLowerCase();
    if (msg.includes("order") || msg.includes("where")) {
      return "You can view all order statuses on the 'My Orders' screen under the Account section. You can simulate shipping updates using the tracking stepper there!";
    } else if (msg.includes("promo") || msg.includes("coupon") || msg.includes("code")) {
      return "To apply a promo code, proceed to the payment stage of checkout, select 'Gift Card / Promo Coupon', and click on any available coupon card!";
    } else if (msg.includes("track") || msg.includes("shipment")) {
      return "Live tracking is active! Head to Account -> My Orders -> View Details to view the confirmation stepper progress bar.";
    } else if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
      return "Hi there! I am here to help you navigate NexCart. Ask me anything about orders, coupons, or tracking!";
    } else {
      return "Thank you for reaching out. A support representative will review your message shortly. In the meantime, you can check the 'My Orders' section for delivery updates!";
    }
  }

  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const val = input.value.trim();
      if (!val) return;
      
      appendMessage(val, false);
      input.value = "";
      
      setTimeout(() => {
        const reply = getBotReply(val);
        appendMessage(reply, true);
      }, 800);
    };
  }

  // Quick reply tags click
  document.querySelectorAll(".quick-reply-tag").forEach(tag => {
    tag.onclick = () => {
      const msg = tag.getAttribute("data-msg");
      appendMessage(msg, false);
      setTimeout(() => {
        const reply = getBotReply(msg);
        appendMessage(reply, true);
      }, 800);
    };
  });
}

function initThemeToggle() {
  const toggleBtn = document.getElementById("header-theme-toggle");
  if (!toggleBtn) return;
  
  const savedTheme = localStorage.getItem("nexcart_theme") || "light";
  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
    toggleBtn.innerHTML = '<i data-lucide="sun"></i>';
  } else {
    document.body.classList.remove("dark-theme");
    toggleBtn.innerHTML = '<i data-lucide="moon"></i>';
  }
  if (window.lucide) window.lucide.createIcons();

  toggleBtn.onclick = () => {
    if (document.body.classList.contains("dark-theme")) {
      document.body.classList.remove("dark-theme");
      localStorage.setItem("nexcart_theme", "light");
      toggleBtn.innerHTML = '<i data-lucide="moon"></i>';
    } else {
      document.body.classList.add("dark-theme");
      localStorage.setItem("nexcart_theme", "dark");
      toggleBtn.innerHTML = '<i data-lucide="sun"></i>';
    }
    if (window.lucide) window.lucide.createIcons();
  };
}


// --- 7. LIFE-CYCLE CONSTRUCTOR ON LOAD ---
window.addEventListener("DOMContentLoaded", () => {
  console.log("NexCart SPA Engine Initializing...");
  
  // Seed default recently watched from PRODUCT_CATALOG (data loaded before app.js)
  seedRecentlyWatched();
  
  // Initialize Database
  initUserDatabase();
  
  // Bind all dynamic modules
  initAuth();
  initOnboarding();
  initInterests();
  initCategories();
  initHomeScreenFilters(); // Initialize home screen filters panel
  initPDP();
  initCart();
  initCheckoutScreen();
  initPaymentScreen();
  initAccountScreen();
  initOrdersScreen();
  initEditProfileScreen(); // Edit Profile Initializer
  initHelpdeskSystem(); // Initialize chat support bot
  initThemeToggle(); // Initialize dark mode theme system
  initAdminDashboard(); // Initialize relational Admin Dashboard system
  
  initNavigationTabs();
  initSearch();
  initHeaderAndFAB();
  
  // Set badges initially
  updateBadges();
  
  // Check active user session (with security fallback validation check)
  const activeEmail = localStorage.getItem("nexcart_active_user");
  if (activeEmail) {
    const users = JSON.parse(localStorage.getItem("nexcart_users") || "{}");
    const user = users[activeEmail];
    if (user) {
      Store.currentUser = user;
      
      // Ensure addresses exist
      if (!Store.currentUser.addresses || Store.currentUser.addresses.length === 0) {
        Store.currentUser.addresses = [
          {
            id: "addr-1",
            tag: "Home",
            name: Store.currentUser.name || "User",
            street: Store.currentUser.address || "",
            city: Store.currentUser.city || "Trivandrum",
            state: Store.currentUser.state || "Kerala",
            pincode: Store.currentUser.pincode || "695001",
            phone: Store.currentUser.phone || ""
          }
        ];
        saveUserToDatabase();
      }

      // Apply language translation
      applyLanguageTranslations(user.language || "English");
      
      if (!user.completedDetails) {
        document.getElementById("onboard-name").value = user.name || "";
        document.getElementById("onboard-email").value = user.email || "";
        document.getElementById("onboard-address").value = user.address || "";
        routeTo("screen-onboarding");
      } else if (!user.completedInterests) {
        renderInterestsGrid();
        routeTo("screen-interests");
      } else {
        renderHomeScreen();
        routeTo("screen-home");
      }
      return;
    } else {
      // Invalid active user token fallback check (fixes Active Session State Bug)
      localStorage.removeItem("nexcart_active_user");
    }
  }
  
  // Apply default English translation if no active user session
  applyLanguageTranslations("English");
  
  // Route to auth screen if no active session
  routeTo("screen-auth");
});

// ============================================================
// ADMIN RELATIONAL DASHBOARD CONTROLLER MODULE
// ============================================================

function renderAdminKPIs() {
  const analytics = getAdminAnalytics();
  document.getElementById("admin-kpi-revenue").textContent = `₹${analytics.totalRevenue.toLocaleString("en-IN")}`;
  document.getElementById("admin-kpi-orders").textContent = analytics.totalOrders;

  // Render Category Breakdown (GROUP BY)
  const catContainer = document.getElementById("admin-category-breakdown");
  catContainer.innerHTML = Object.entries(analytics.categoryRevenue).map(([cat, rev]) => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px dashed var(--border-color);">
      <span style="font-weight: 700; color: var(--text-primary);">${cat}</span>
      <span style="font-weight: 700; color: var(--primary);">₹${rev.toLocaleString("en-IN")}</span>
    </div>
  `).join('');

  // Render Top 5 Best Sellers
  const sellersContainer = document.getElementById("admin-best-sellers");
  if (analytics.topProducts.length === 0) {
    sellersContainer.innerHTML = `<div style="color: var(--text-light); text-align: center; padding: 10px;">No transaction history yet.</div>`;
  } else {
    sellersContainer.innerHTML = analytics.topProducts.map(p => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed var(--border-color);">
        <div style="display: flex; align-items: center; gap: 8px;">
          <img src="${p.image}" alt="" style="width: 24px; height: 24px; object-fit: contain; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-secondary);">
          <span style="font-weight: 700; color: var(--text-primary); max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.name}</span>
        </div>
        <span style="font-weight: 800; color: var(--accent-hover);">${p.sold} units</span>
      </div>
    `).join('');
  }

  // ── 1. Category Reviews (Circular Graph) ──
  const products = getProducts();
  const cats = getCategories();
  const categoryReviews = {};
  cats.forEach(c => { categoryReviews[c.name] = 0; });
  products.forEach(p => {
    const cat = p.category;
    if (categoryReviews[cat] === undefined) {
      categoryReviews[cat] = 0;
    }
    categoryReviews[cat] += (p.reviews || 0);
  });

  const reviewsCanvas = document.getElementById("chart-admin-category-reviews");
  if (reviewsCanvas) {
    if (chartCategoryReviews) {
      chartCategoryReviews.destroy();
    }
    
    const labels = Object.keys(categoryReviews);
    const data = Object.values(categoryReviews);
    const isDark = document.body.classList.contains("dark-theme");
    const textColor = isDark ? "#ffffff" : "#1e1e1e";

    chartCategoryReviews = new Chart(reviewsCanvas, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            "#6366f1", "#10b981", "#ef4444", "#f59e0b", 
            "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e"
          ],
          borderWidth: isDark ? 2 : 1,
          borderColor: isDark ? "#121222" : "#ffffff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: textColor,
              font: { size: 9, weight: "bold", family: "'Plus Jakarta Sans', sans-serif" },
              boxWidth: 8
            }
          }
        }
      }
    });
  }

  // ── 2. Monthly and Yearly Sales Breakdown Details ──
  const orders = JSON.parse(localStorage.getItem("nexcart_orders") || "[]");
  const monthlySales = {};
  const yearlySales = {};

  orders.forEach(o => {
    if (!o.date) return;
    const parts = o.date.split("-");
    if (parts.length < 2) return;
    const year = parts[0];
    const month = parts[1];
    const yearMonth = `${year}-${month}`;

    if (!monthlySales[yearMonth]) {
      monthlySales[yearMonth] = { count: 0, revenue: 0, year: year };
    }
    monthlySales[yearMonth].count++;
    monthlySales[yearMonth].revenue += o.total_amount;

    if (!yearlySales[year]) {
      yearlySales[year] = 0;
    }
    yearlySales[year] += o.total_amount;
  });

  const breakdownRows = [];
  const sortedPeriods = Object.keys(monthlySales).sort();
  
  sortedPeriods.forEach(period => {
    const data = monthlySales[period];
    const yearlyTotal = yearlySales[data.year] || 1;
    const percent = ((data.revenue / yearlyTotal) * 100).toFixed(1);
    breakdownRows.push({
      period: period,
      count: data.count,
      revenue: data.revenue,
      percentage: percent
    });
  });

  const salesTableBody = document.getElementById("admin-sales-breakdown-body");
  if (salesTableBody) {
    if (breakdownRows.length === 0) {
      salesTableBody.innerHTML = `<tr><td colspan="4" style="padding: 16px; text-align: center; color: var(--text-light);">No sales transactions available.</td></tr>`;
    } else {
      salesTableBody.innerHTML = breakdownRows.map(row => `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 10px 12px; font-weight: 700; color: var(--text-primary);">${row.period}</td>
          <td style="padding: 10px 12px; text-align: center; color: var(--text-secondary); font-weight: 700;">${row.count}</td>
          <td style="padding: 10px 12px; text-align: right; color: var(--primary); font-weight: 800;">₹${row.revenue.toLocaleString("en-IN")}</td>
          <td style="padding: 10px 12px; text-align: right; color: var(--accent); font-weight: 800;">${row.percentage}%</td>
        </tr>
      `).join('');
    }
  }

  // ── 3. Sales Trend & Percentage Contribution (Bar Graph) ──
  const salesCanvas = document.getElementById("chart-admin-sales-trend");
  if (salesCanvas) {
    if (chartSalesTrend) {
      chartSalesTrend.destroy();
    }

    const isDark = document.body.classList.contains("dark-theme");
    const gridColor = isDark ? "#23233c" : "#e2e8f0";
    const textColor = isDark ? "#ffffff" : "#1e1e1e";

    const labels = breakdownRows.map(r => r.period);
    const dataVals = breakdownRows.map(r => r.revenue);

    chartSalesTrend = new Chart(salesCanvas, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Sales (₹)",
          data: dataVals,
          backgroundColor: isDark ? "rgba(99, 102, 241, 0.75)" : "rgba(79, 70, 229, 0.8)",
          hoverBackgroundColor: isDark ? "#6366f1" : "#4f46e5",
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { size: 9, family: "'Plus Jakarta Sans', sans-serif" }
            }
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { size: 9, family: "'Plus Jakarta Sans', sans-serif" },
              callback: function(value) { return "₹" + value.toLocaleString("en-IN"); }
            }
          }
        }
      }
    });
  }
}

function renderAdminProductsTable() {
  const products = getProducts();
  const tbody = document.getElementById("admin-products-table-body");
  
  tbody.innerHTML = products.map(p => `
    <tr style="border-bottom: 1px solid var(--border-color);">
      <td style="padding: 10px 8px; font-weight: 800; color: var(--text-secondary);">${p.id}</td>
      <td style="padding: 10px 8px; font-weight: 700; color: var(--text-primary); max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.name}</td>
      <td style="padding: 10px 8px; color: var(--text-secondary); font-weight: 700;">${p.category}</td>
      <td style="padding: 10px 8px; text-align: right; font-weight: 800; color: var(--primary);">₹${p.price.toLocaleString("en-IN")}</td>
      <td style="padding: 10px 8px; text-align: center;">
        <input type="number" class="admin-stock-input" data-prod-id="${p.id}" value="${p.stock !== undefined ? p.stock : 50}" style="width: 55px; height: 26px; font-size: 11px; text-align: center; border-radius: var(--radius-sm); border: 1.5px solid var(--border-color); background-color: var(--bg-primary); color: var(--text-primary); font-weight: 800;">
      </td>
      <td style="padding: 10px 8px; text-align: center; white-space: nowrap;">
        <button class="btn btn-secondary btn-sm btn-admin-edit-prod" data-prod-id="${p.id}" style="width: auto; height: 24px; padding: 0 8px; font-size: 10px; font-weight: 700; border-radius: var(--radius-sm); display: inline-flex; align-items: center; justify-content: center; margin-right: 4px;">Edit</button>
        <button class="btn btn-secondary btn-sm btn-admin-del-prod" data-prod-id="${p.id}" style="width: auto; height: 24px; padding: 0 8px; font-size: 10px; font-weight: 700; border-radius: var(--radius-sm); display: inline-flex; align-items: center; justify-content: center; color: var(--danger); border-color: var(--danger-light);">Delete</button>
      </td>
    </tr>
  `).join('');

  // Handle stock adjustments
  tbody.querySelectorAll(".admin-stock-input").forEach(input => {
    input.addEventListener("change", () => {
      const pid = input.getAttribute("data-prod-id");
      const newStock = parseInt(input.value);
      if (!isNaN(newStock) && newStock >= 0) {
        const prods = getProducts();
        const idx = prods.findIndex(p => p.id === pid);
        if (idx > -1) {
          prods[idx].stock = newStock;
          localStorage.setItem("nexcart_products", JSON.stringify(prods));
          
          if (typeof PRODUCT_CATALOG !== "undefined") {
            const pcIdx = PRODUCT_CATALOG.findIndex(pc => pc.id === pid);
            if (pcIdx > -1) PRODUCT_CATALOG[pcIdx].stock = newStock;
          }
          showToast(`Stock updated for ${pid} to ${newStock}`, "success");
        }
      }
    });
  });

  // Handle Edit Product clicks
  tbody.querySelectorAll(".btn-admin-edit-prod").forEach(btn => {
    btn.addEventListener("click", () => {
      const pid = btn.getAttribute("data-prod-id");
      const prod = products.find(p => p.id === pid);
      if (prod) {
        document.getElementById("admin-prod-screen-title").textContent = "Edit Product Details";
        document.getElementById("admin-prod-id").value = prod.id;
        document.getElementById("admin-prod-key").value = prod.id;
        document.getElementById("admin-prod-key").readOnly = true; // PK cannot be updated
        document.getElementById("admin-prod-name").value = prod.name;
        document.getElementById("admin-prod-category").value = prod.category;
        document.getElementById("admin-prod-price").value = prod.price;
        document.getElementById("admin-prod-mrp").value = prod.mrp || prod.price;
        document.getElementById("admin-prod-stock").value = prod.stock !== undefined ? prod.stock : 50;
        document.getElementById("admin-prod-image").value = prod.image;
        document.getElementById("admin-prod-desc").value = prod.description || "";

        routeTo("screen-admin-product-form");
      }
    });
  });

  // Handle Delete Product clicks (DBMS constraint verification)
  tbody.querySelectorAll(".btn-admin-del-prod").forEach(btn => {
    btn.addEventListener("click", () => {
      const pid = btn.getAttribute("data-prod-id");
      const res = deleteProduct(pid);
      if (res.success) {
        showToast("Product deleted successfully!", "success");
        renderAdminProductsTable();
        renderAdminKPIs();
      } else {
        showAlert("DBMS Integrity Constraint Restriction", res.reason, "danger");
      }
    });
  });
}

function renderAdminCategoriesTable() {
  const cats = getCategories();
  const tbody = document.getElementById("admin-categories-table-body");
  
  tbody.innerHTML = cats.map(c => `
    <tr style="border-bottom: 1px solid var(--border-color);">
      <td style="padding: 10px 8px; font-weight: 800; color: var(--primary);">${c.id}</td>
      <td style="padding: 10px 8px; font-weight: 700; color: var(--text-primary);">${c.name}</td>
      <td style="padding: 10px 8px; color: var(--text-light);"><i data-lucide="${c.icon}" style="width: 14px; height: 14px;"></i></td>
      <td style="padding: 10px 8px; text-align: center;">
        <button class="btn btn-secondary btn-sm btn-admin-del-cat" data-cat-id="${c.id}" style="width: auto; height: 24px; padding: 0 8px; font-size: 10px; font-weight: 700; border-radius: var(--radius-sm); display: inline-flex; align-items: center; justify-content: center; color: var(--danger); border-color: var(--danger-light);">Delete</button>
      </td>
    </tr>
  `).join('');

  if (window.lucide) window.lucide.createIcons();

  // Handle Category Deletion
  tbody.querySelectorAll(".btn-admin-del-cat").forEach(btn => {
    btn.addEventListener("click", () => {
      const cid = btn.getAttribute("data-cat-id");
      const res = deleteCategory(cid);
      if (res.success) {
        showToast("Category deleted successfully!", "success");
        renderAdminCategoriesTable();
        populateAdminCategorySelect();
      } else {
        showAlert("DBMS Integrity Constraint Restriction", res.reason, "danger");
      }
    });
  });
}

function renderAdminOrdersTable() {
  const orders = JSON.parse(localStorage.getItem("nexcart_orders") || "[]");
  const tbody = document.getElementById("admin-orders-table-body");
  
  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding: 16px; text-align: center; color: var(--text-light);">No client transactions found.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(order => {
    const dateFormatted = new Date(order.date).toLocaleDateString("en-IN", {
      year: 'numeric', month: 'short', day: 'numeric'
    });
    return `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 10px 8px; font-weight: 800; color: var(--text-primary);">${order.id}</td>
        <td style="padding: 10px 8px; font-weight: 700; color: var(--text-secondary); max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${order.user_email}</td>
        <td style="padding: 10px 8px; color: var(--text-light); font-weight: 700;">${dateFormatted}</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: 800; color: var(--primary);">₹${order.total_amount.toLocaleString("en-IN")}</td>
        <td style="padding: 10px 8px; text-align: center;">
          <select class="admin-order-status-select" data-order-id="${order.id}" style="font-size: 11px; padding: 2px 6px; font-weight: 700; border-radius: var(--radius-sm); border: 1.5px solid var(--border-color); background-color: var(--bg-primary); color: var(--text-primary); outline: none;">
            <option value="processing" ${order.status === "processing" ? "selected" : ""}>Processing</option>
            <option value="confirmed" ${order.status === "confirmed" ? "selected" : ""}>Confirmed</option>
            <option value="shipped" ${order.status === "shipped" ? "selected" : ""}>Shipped</option>
            <option value="delivered" ${order.status === "delivered" ? "selected" : ""}>Delivered</option>
          </select>
        </td>
        <td style="padding: 10px 8px; text-align: center;">
          <button class="btn btn-secondary btn-sm btn-admin-view-invoice" data-order-id="${order.id}" style="width: auto; height: 24px; padding: 0 8px; font-size: 10px; font-weight: 700; border-radius: var(--radius-sm);">Invoice</button>
        </td>
      </tr>
    `;
  }).join('');

  // Handle Order Status Modifications
  tbody.querySelectorAll(".admin-order-status-select").forEach(select => {
    select.addEventListener("change", () => {
      const oid = select.getAttribute("data-order-id");
      const nextStatus = select.value;
      
      const ords = JSON.parse(localStorage.getItem("nexcart_orders") || "[]");
      const idx = ords.findIndex(o => o.id === oid);
      if (idx > -1) {
        ords[idx].status = nextStatus;
        localStorage.setItem("nexcart_orders", JSON.stringify(ords));
        showToast(`Order status updated to ${nextStatus}`, "success");
        renderAdminOrdersTable();
        renderAdminKPIs();
      }
    });
  });

  // Handle Invoice click listeners
  tbody.querySelectorAll(".btn-admin-view-invoice").forEach(btn => {
    btn.addEventListener("click", () => {
      const oid = btn.getAttribute("data-order-id");
      openInvoiceModal(oid);
    });
  });
}

function populateAdminCategorySelect() {
  const cats = getCategories();
  const select = document.getElementById("admin-prod-category");
  select.innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function initAdminDashboard() {
  // Account settings Switch Toggle
  const accAdminBtn = document.getElementById("btn-acc-admin");
  if (accAdminBtn) {
    accAdminBtn.onclick = () => {
      renderAdminKPIs();
      renderAdminProductsTable();
      renderAdminCategoriesTable();
      renderAdminOrdersTable();
      populateAdminCategorySelect();
      routeTo("screen-admin");
    };
  }

  // Dashboard Back Button
  const adminBackBtn = document.getElementById("btn-admin-back");
  if (adminBackBtn) {
    adminBackBtn.onclick = () => {
      routeTo("screen-account");
    };
  }

  // Add Product screen triggers
  const addProdBtn = document.getElementById("btn-admin-add-product");
  if (addProdBtn) {
    addProdBtn.onclick = () => {
      document.getElementById("admin-prod-screen-title").textContent = "Add New Product";
      document.getElementById("admin-prod-id").value = "";
      
      // Auto-generate a random, unique Product ID
      const prods = getProducts();
      let uid = "";
      let exists = true;
      while (exists) {
        uid = "prod-" + Math.random().toString(36).substring(2, 8);
        exists = prods.some(p => p.id === uid);
      }
      
      document.getElementById("admin-prod-key").value = uid;
      document.getElementById("admin-prod-key").readOnly = true;
      document.getElementById("form-admin-product").reset();
      
      // Reset after form.reset() clears it
      document.getElementById("admin-prod-key").value = uid;
      
      populateAdminCategorySelect();
      routeTo("screen-admin-product-form");
    };
  }

  // Back and Cancel triggers for Product Form
  const backProdBtn = document.getElementById("btn-admin-prod-back");
  if (backProdBtn) {
    backProdBtn.onclick = () => {
      routeTo("screen-admin");
    };
  }

  const cancelProdBtn = document.getElementById("btn-admin-prod-cancel");
  if (cancelProdBtn) {
    cancelProdBtn.onclick = () => {
      routeTo("screen-admin");
    };
  }

  // Add Category screen triggers
  const addCatBtn = document.getElementById("btn-admin-add-category");
  if (addCatBtn) {
    addCatBtn.onclick = () => {
      document.getElementById("admin-cat-screen-title").textContent = "Add New Category";
      document.getElementById("form-admin-category").reset();
      routeTo("screen-admin-category-form");
    };
  }

  // Back and Cancel triggers for Category Form
  const backCatBtn = document.getElementById("btn-admin-cat-back");
  if (backCatBtn) {
    backCatBtn.onclick = () => {
      routeTo("screen-admin");
    };
  }

  const cancelCatBtn = document.getElementById("btn-admin-cat-cancel");
  if (cancelCatBtn) {
    cancelCatBtn.onclick = () => {
      routeTo("screen-admin");
    };
  }

  // Product Form CRUD Submissions
  const prodForm = document.getElementById("form-admin-product");
  if (prodForm) {
    prodForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const pid = document.getElementById("admin-prod-key").value.trim();
      const pName = document.getElementById("admin-prod-name").value.trim();
      const pCat = document.getElementById("admin-prod-category").value;
      const pPrice = parseInt(document.getElementById("admin-prod-price").value);
      const pMrp = parseInt(document.getElementById("admin-prod-mrp").value);
      const pStock = parseInt(document.getElementById("admin-prod-stock").value);
      const pImg = document.getElementById("admin-prod-image").value.trim();
      const pDesc = document.getElementById("admin-prod-desc").value.trim();

      const productObject = {
        id: pid,
        name: pName,
        category: pCat,
        price: pPrice,
        mrp: pMrp,
        stock: pStock,
        rating: 4.5,
        reviews: 1,
        image: pImg,
        description: pDesc
      };

      const res = saveProduct(productObject);
      if (res.success) {
        showToast("Product saved successfully!", "success");
        routeTo("screen-admin");
        renderAdminProductsTable();
        renderAdminKPIs();
      } else {
        showAlert("DBMS FK Check Error", res.reason, "danger");
      }
    });
  }

  // Category Form CRUD Submissions
  const catForm = document.getElementById("form-admin-category");
  if (catForm) {
    catForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const cid = document.getElementById("admin-cat-id").value.trim();
      const cName = document.getElementById("admin-cat-name").value.trim();
      const cIcon = document.getElementById("admin-cat-icon").value.trim();

      const catObj = { id: cid, name: cName, icon: cIcon };
      const res = saveCategory(catObj);
      if (res.success) {
        showToast("Category saved successfully!", "success");
        routeTo("screen-admin");
        renderAdminCategoriesTable();
        populateAdminCategorySelect();
      }
    });
  }
}

// ── HTML5 History Navigation State Sync (Back Button Support) ──
window.addEventListener("popstate", (event) => {
  if (event.state && event.state.screenId) {
    routeTo(event.state.screenId, true);
  } else {
    // Default fallback
    if (localStorage.getItem("nexcart_active_user")) {
      routeTo("screen-home", true);
    } else {
      routeTo("screen-auth", true);
    }
  }
});

// Initialize first history frame
window.addEventListener("load", () => {
  setTimeout(() => {
    // Check if there is a shared product parameter in URL query or hash
    const urlParams = new URLSearchParams(window.location.search);
    let shareProductId = urlParams.get("product");
    
    if (!shareProductId) {
      const hash = window.location.hash;
      if (hash.includes("product=")) {
        const match = hash.match(/product=([^&]+)/);
        if (match) {
          shareProductId = match[1];
        }
      }
    }
    
    if (shareProductId) {
      const products = getProducts();
      const found = products.find(p => p.id === shareProductId);
      if (found) {
        openProductDetails(found.id);
        return; // Skip replacing state with home/auth if shared product PDP loaded
      }
    }
    
    window.history.replaceState({ screenId: Store.activeScreen }, "", "#" + Store.activeScreen);
  }, 500);
});



