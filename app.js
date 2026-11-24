/**
 * Sri Vignasewra Saree House - Core Interactive App Logic
 * E-Commerce Shopping, Filtering, WhatsApp Checkout & Modals
 */

// Global State
let currentCategory = "all";
let currentSort = "featured";
let currentSearch = "";
let selectedFabrics = [];
let selectedOccasions = [];
let maxPrice = 50000;
let selectedColor = "";

// Cart & Wishlist State
let cart = JSON.parse(localStorage.getItem("svsh_cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("svsh_wishlist")) || [];
let appliedCoupon = null;
let addStitchingService = false;

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  initUI();
  renderProducts();
  updateCartUI();
  updateWishlistUI();
  setupEventListeners();
});

// Setup All UI Listeners
function setupEventListeners() {
  // Search input
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearch = e.target.value.trim().toLowerCase();
      renderProducts();
    });
  }

  // Price slider
  const priceRange = document.getElementById("price-range");
  const priceDisplay = document.getElementById("price-display");
  if (priceRange) {
    priceRange.addEventListener("input", (e) => {
      maxPrice = parseInt(e.target.value);
      if (priceDisplay) priceDisplay.textContent = `₹${maxPrice.toLocaleString('en-IN')}`;
      renderProducts();
    });
  }

  // Sort dropdown
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      renderProducts();
    });
  }
}

// Initialize UI elements
function initUI() {
  // Setup Style Guide tabs
  setupStyleGuideTabs();
}

// Render Products based on active filters
function renderProducts() {
  const container = document.getElementById("products-container");
  const countDisplay = document.getElementById("products-count");
  if (!container) return;

  let filtered = PRODUCTS_DATA.filter(item => {
    // Category check
    if (currentCategory !== "all") {
      if (currentCategory === "silk") {
        if (item.subCategory !== "Silk Sarees") return false;
      } else if (item.category !== currentCategory) {
        return false;
      }
    }

    // Search query check
    if (currentSearch) {
      const matchName = item.name.toLowerCase().includes(currentSearch);
      const matchDesc = item.description.toLowerCase().includes(currentSearch);
      const matchFabric = item.fabric.toLowerCase().includes(currentSearch);
      const matchCategory = item.category.toLowerCase().includes(currentSearch);
      if (!matchName && !matchDesc && !matchFabric && !matchCategory) return false;
    }

    // Fabric filter
    if (selectedFabrics.length > 0) {
      const hasFabric = selectedFabrics.some(fab => item.fabric.toLowerCase().includes(fab.toLowerCase()));
      if (!hasFabric) return false;
    }

    // Occasion filter
    if (selectedOccasions.length > 0) {
      const hasOccasion = selectedOccasions.some(occ => item.occasion.toLowerCase().includes(occ.toLowerCase()));
      if (!hasOccasion) return false;
    }

    // Color filter
    if (selectedColor && !item.color.toLowerCase().includes(selectedColor.toLowerCase())) {
      return false;
    }

    // Price filter
    if (item.price > maxPrice) return false;

    return true;
  });

  // Sorting
  if (currentSort === "price-low") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (currentSort === "price-high") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (currentSort === "rating") {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (currentSort === "newest") {
    filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  }

  // Update counter
  if (countDisplay) {
    countDisplay.textContent = `Showing ${filtered.length} elegant styles`;
  }

  // If no products matched
  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #FFF; border-radius: 12px; border: 1px dashed var(--border-gold);">
        <div style="font-size: 3rem; margin-bottom: 12px;">🥻</div>
        <h3 style="color: var(--color-primary); font-size: 1.4rem; margin-bottom: 8px;">No matching outfits found</h3>
        <p style="color: var(--text-muted); margin-bottom: 20px;">Try adjusting your filters or price range to discover more collections.</p>
        <button class="btn-gold" onclick="resetAllFilters()">Clear All Filters</button>
      </div>
    `;
    return;
  }

  // Render product cards
  container.innerHTML = filtered.map(item => {
    const isWishlisted = wishlist.includes(item.id);
    const discount = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);

    return `
      <div class="product-card" data-id="${item.id}">
        <div class="product-thumb-wrap">
          <img src="${item.image}" alt="${item.name}" loading="lazy">
          <span class="product-badge ${item.badge.includes('Silk') ? 'gold' : ''}">${item.badge}</span>
          <button class="wishlist-heart-btn ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist('${item.id}')" title="Save to Wishlist">
            <svg width="18" height="18" fill="${isWishlisted ? '#E53E3E' : 'none'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </button>
          <div class="product-quick-actions">
            <button class="quick-action-btn" onclick="openQuickView('${item.id}')">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              Quick View
            </button>
          </div>
        </div>
        <div class="product-info">
          <span class="product-category-tag">${item.subCategory} • ${item.occasion}</span>
          <h4 class="product-title" onclick="openQuickView('${item.id}')" style="cursor: pointer;">${item.name}</h4>
          <p class="product-fabric-meta">Fabric: <strong>${item.fabric}</strong></p>
          <div class="product-rating">
            <span>★ ${item.rating}</span>
            <span class="count">(${item.reviewsCount} reviews)</span>
          </div>
          <div class="product-pricing-row">
            <span class="product-price">₹${item.price.toLocaleString('en-IN')}</span>
            <span class="product-original-price">₹${item.originalPrice.toLocaleString('en-IN')}</span>
            <span class="product-discount-pill">${discount}% OFF</span>
          </div>
          <div class="product-actions-bar">
            <button class="btn-add-cart" onclick="addToCart('${item.id}')">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              Add to Cart
            </button>
            <button class="btn-wa-order" onclick="orderItemOnWhatsApp('${item.id}')" title="Buy Directly via WhatsApp">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.771.82 2.791.82 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.806-5.768-5.806zm3.393 8.232c-.146.415-.747.781-1.037.83-.284.048-.654.08-1.895-.436-1.587-.66-2.614-2.28-2.693-2.385-.078-.105-.637-.848-.637-1.614 0-.766.402-1.144.545-1.299.143-.155.312-.195.416-.195.104 0 .208.002.299.007.095.006.223-.036.35.27.13.313.442 1.077.481 1.155.039.078.065.17.013.273-.052.104-.078.169-.156.26-.078.091-.163.203-.234.273-.078.077-.16.16-.069.317.091.156.403.666.865 1.077.595.53 1.097.694 1.253.772.156.078.247.065.338-.039.091-.104.39-.455.494-.611.104-.156.208-.13.351-.078.143.052.91.429 1.066.507.156.078.26.117.299.182.039.065.039.377-.107.792z"/></svg>
              WhatsApp
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// Category filter tabs
function filterByCategory(cat, element) {
  currentCategory = cat;
  document.querySelectorAll(".catalog-tab").forEach(tab => tab.classList.remove("active"));
  if (element) element.classList.add("active");
  renderProducts();
}

// Fabric checkbox toggle
function toggleFabricFilter(fabricName) {
  const index = selectedFabrics.indexOf(fabricName);
  if (index > -1) {
    selectedFabrics.splice(index, 1);
  } else {
    selectedFabrics.push(fabricName);
  }
  renderProducts();
}

// Occasion checkbox toggle
function toggleOccasionFilter(occasionName) {
  const index = selectedOccasions.indexOf(occasionName);
  if (index > -1) {
    selectedOccasions.splice(index, 1);
  } else {
    selectedOccasions.push(occasionName);
  }
  renderProducts();
}

// Color filter toggle
function filterByColor(colorName, el) {
  if (selectedColor === colorName) {
    selectedColor = "";
    if (el) el.classList.remove("active");
  } else {
    selectedColor = colorName;
    document.querySelectorAll(".color-swatch-item").forEach(item => item.classList.remove("active"));
    if (el) el.classList.add("active");
  }
  renderProducts();
}

// Reset all filters
function resetAllFilters() {
  currentCategory = "all";
  currentSort = "featured";
  currentSearch = "";
  selectedFabrics = [];
  selectedOccasions = [];
  maxPrice = 50000;
  selectedColor = "";

  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";

  const priceRange = document.getElementById("price-range");
  if (priceRange) priceRange.value = 50000;

  const priceDisplay = document.getElementById("price-display");
  if (priceDisplay) priceDisplay.textContent = "₹50,000";

  document.querySelectorAll(".filter-checkbox-label input").forEach(cb => cb.checked = false);
  document.querySelectorAll(".color-swatch-item").forEach(item => item.classList.remove("active"));
  document.querySelectorAll(".catalog-tab").forEach((tab, i) => {
    if (i === 0) tab.classList.add("active");
    else tab.classList.remove("active");
  });

  renderProducts();
  showToast("All filters cleared", "info");
}

// ================= CART OPERATIONS =================
function addToCart(productId, size = null) {
  const product = PRODUCTS_DATA.find(p => p.id === productId);
  if (!product) return;

  const chosenSize = size || product.sizes[0];
  const existing = cart.find(item => item.id === productId && item.selectedSize === chosenSize);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      fabric: product.fabric,
      selectedSize: chosenSize,
      quantity: 1
    });
  }

  saveCart();
  updateCartUI();
  openCartDrawer();
  showToast(`Added "${product.name.slice(0, 24)}..." to cart!`, "success");
}

function updateCartQty(productId, size, delta) {
  const item = cart.find(i => i.id === productId && i.selectedSize === size);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(i => !(i.id === productId && i.selectedSize === size));
  }

  saveCart();
  updateCartUI();
}

function removeCartItem(productId, size) {
  cart = cart.filter(i => !(i.id === productId && i.selectedSize === size));
  saveCart();
  updateCartUI();
  showToast("Item removed from cart", "info");
}

function saveCart() {
  localStorage.setItem("svsh_cart", JSON.stringify(cart));
}

function updateCartUI() {
  const badge = document.getElementById("cart-count-badge");
  const subtotalEl = document.getElementById("cart-subtotal");
  const totalEl = document.getElementById("cart-total");
  const discountEl = document.getElementById("cart-discount");
  const itemsContainer = document.getElementById("cart-items-list");
  const freeShippingBar = document.getElementById("free-shipping-bar");
  const freeShippingText = document.getElementById("free-shipping-text");

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (badge) badge.textContent = totalCount;

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Free shipping progress
  const threshold = STORE_INFO.shippingThreshold;
  if (freeShippingBar && freeShippingText) {
    if (subtotal >= threshold) {
      freeShippingBar.style.width = "100%";
      freeShippingText.innerHTML = "🎉 Congratulations! You have unlocked <strong>FREE Pan-India Express Shipping</strong>!";
    } else {
      const remaining = threshold - subtotal;
      const pct = Math.min(100, Math.round((subtotal / threshold) * 100));
      freeShippingBar.style.width = `${pct}%`;
      freeShippingText.innerHTML = `Add ₹${remaining.toLocaleString('en-IN')} more to unlock <strong>FREE Shipping</strong>!`;
    }
  }

  // Calculate discount
  let discountAmount = 0;
  if (appliedCoupon && subtotal > 0) {
    if (appliedCoupon.type === "percent") {
      discountAmount = Math.round((subtotal * appliedCoupon.discount) / 100);
    } else if (appliedCoupon.type === "flat") {
      discountAmount = appliedCoupon.discount;
    }
  }

  const stitchingFee = addStitchingService ? 499 : 0;
  const shippingFee = (subtotal >= threshold || subtotal === 0) ? 0 : 150;
  const grandTotal = Math.max(0, subtotal - discountAmount + stitchingFee + shippingFee);

  if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  if (discountEl) discountEl.textContent = discountAmount > 0 ? `-₹${discountAmount.toLocaleString('en-IN')}` : "₹0";
  if (totalEl) totalEl.textContent = `₹${grandTotal.toLocaleString('en-IN')}`;

  // Render items in drawer
  if (itemsContainer) {
    if (cart.length === 0) {
      itemsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 10px; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">🛍️</div>
          <h4 style="color: var(--color-primary); margin-bottom: 6px;">Your cart is empty</h4>
          <p style="font-size: 0.85rem;">Discover our exquisite sarees and festive dresses to fill your wardrobe.</p>
        </div>
      `;
    } else {
      itemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
          <div class="cart-item-thumb">
            <img src="${item.image}" alt="${item.name}">
          </div>
          <div class="cart-item-details">
            <h5 class="cart-item-title">${item.name}</h5>
            <div class="cart-item-meta">Size: ${item.selectedSize}</div>
            <div class="cart-item-price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</div>
            <div class="cart-qty-ctrl">
              <button class="qty-btn" onclick="updateCartQty('${item.id}', '${item.selectedSize}', -1)">-</button>
              <span class="qty-val">${item.quantity}</span>
              <button class="qty-btn" onclick="updateCartQty('${item.id}', '${item.selectedSize}', 1)">+</button>
              <button class="item-remove-btn" onclick="removeCartItem('${item.id}', '${item.selectedSize}')" title="Remove">✕</button>
            </div>
          </div>
        </div>
      `).join("");
    }
  }
}

// Apply Promo Coupon
function applyCoupon() {
  const input = document.getElementById("coupon-input");
  if (!input) return;

  const code = input.value.trim().toUpperCase();
  if (PROMO_CODES[code]) {
    appliedCoupon = PROMO_CODES[code];
    updateCartUI();
    showToast(`Coupon "${code}" applied successfully!`, "success");
  } else {
    showToast("Invalid coupon code. Try 'VIGNASEWRA20'", "error");
  }
}

// Cart Drawer open/close
function openCartDrawer() {
  document.getElementById("cart-drawer")?.classList.add("active");
  document.getElementById("cart-backdrop")?.classList.add("active");
}

function closeCartDrawer() {
  document.getElementById("cart-drawer")?.classList.remove("active");
  document.getElementById("cart-backdrop")?.classList.remove("active");
}

// ================= WISHLIST =================
function toggleWishlist(productId) {
  const index = wishlist.indexOf(productId);
  if (index > -1) {
    wishlist.splice(index, 1);
    showToast("Removed from Wishlist", "info");
  } else {
    wishlist.push(productId);
    showToast("Added to Wishlist ❤️", "success");
  }
  localStorage.setItem("svsh_wishlist", JSON.stringify(wishlist));
  updateWishlistUI();
  renderProducts();
}

function updateWishlistUI() {
  const badge = document.getElementById("wishlist-count-badge");
  if (badge) badge.textContent = wishlist.length;
}

// ================= WHATSAPP ORDER GENERATOR =================
// Generates a pre-formatted message for instant store order
function checkoutViaWhatsApp() {
  if (cart.length === 0) {
    showToast("Your cart is empty!", "error");
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let discountAmount = 0;
  if (appliedCoupon) {
    discountAmount = appliedCoupon.type === "percent" ? Math.round((subtotal * appliedCoupon.discount) / 100) : appliedCoupon.discount;
  }
  const grandTotal = Math.max(0, subtotal - discountAmount);

  let message = `*Namaste Sri Vignasewra Saree House!* 🙏\n`;
  message += `I would like to place an order from your website:\n\n`;
  message += `*ORDER DETAILS:*\n`;

  cart.forEach((item, idx) => {
    message += `${idx + 1}. *${item.name}*\n`;
    message += `   Size/Type: ${item.selectedSize}\n`;
    message += `   Qty: ${item.quantity} x ₹${item.price.toLocaleString('en-IN')}\n`;
  });

  message += `\n*Subtotal:* ₹${subtotal.toLocaleString('en-IN')}\n`;
  if (discountAmount > 0) {
    message += `*Discount Applied:* -₹${discountAmount.toLocaleString('en-IN')}\n`;
  }
  message += `*Total Amount:* ₹${grandTotal.toLocaleString('en-IN')}\n`;
  message += `*Shipping:* Free Pan-India Express\n\n`;
  message += `Please confirm availability and share payment details (UPI/Google Pay/Bank Transfer). Thank you!`;

  const encodedUrl = `https://wa.me/${STORE_INFO.whatsapp}?text=${encodeURIComponent(message)}`;
  window.open(encodedUrl, "_blank");
}

// Single item quick WhatsApp order
function orderItemOnWhatsApp(productId) {
  const item = PRODUCTS_DATA.find(p => p.id === productId);
  if (!item) return;

  let message = `*Namaste Sri Vignasewra Saree House!* 🙏\n\n`;
  message += `I am interested in purchasing:\n`;
  message += `*Product:* ${item.name}\n`;
  message += `*Price:* ₹${item.price.toLocaleString('en-IN')} (MRP: ₹${item.originalPrice})\n`;
  message += `*Fabric:* ${item.fabric}\n`;
  message += `*Color:* ${item.color}\n`;
  message += `*Product Code:* ${item.id.toUpperCase()}\n\n`;
  message += `Please share real photos/video and payment options.`;

  const encodedUrl = `https://wa.me/${STORE_INFO.whatsapp}?text=${encodeURIComponent(message)}`;
  window.open(encodedUrl, "_blank");
}

// Direct Checkout Modal
function openDirectCheckout() {
  if (cart.length === 0) {
    showToast("Your cart is empty!", "error");
    return;
  }
  closeCartDrawer();
  const modal = document.getElementById("checkout-modal");
  if (modal) modal.classList.add("active");
}

function closeCheckoutModal() {
  document.getElementById("checkout-modal")?.classList.remove("active");
}

function handleCheckoutSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("cust-name")?.value;
  const phone = document.getElementById("cust-phone")?.value;
  const address = document.getElementById("cust-address")?.value;
  const pincode = document.getElementById("cust-pincode")?.value;

  closeCheckoutModal();
  cart = [];
  saveCart();
  updateCartUI();

  // Show order success modal
  const orderSuccess = document.getElementById("order-success-modal");
  if (orderSuccess) {
    document.getElementById("success-cust-name").textContent = name;
    document.getElementById("success-order-id").textContent = `SVSH-${Math.floor(100000 + Math.random() * 900000)}`;
    orderSuccess.classList.add("active");
  }
  showToast("Order placed successfully! 🎉", "success");
}

// ================= QUICK VIEW MODAL =================
function openQuickView(productId) {
  const item = PRODUCTS_DATA.find(p => p.id === productId);
  if (!item) return;

  const modal = document.getElementById("quickview-modal");
  const content = document.getElementById("quickview-content");
  if (!modal || !content) return;

  const discount = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);

  content.innerHTML = `
    <div class="modal-product-layout">
      <div class="modal-gallery-col">
        <div class="modal-gallery-main">
          <img id="qv-main-img" src="${item.image}" alt="${item.name}">
        </div>
        <div style="display: flex; gap: 10px; margin-top: 12px; overflow-x: auto;">
          ${item.gallery.map((img, i) => `
            <img src="${img}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 2px solid ${i === 0 ? 'var(--color-gold)' : '#DDD'};" onclick="document.getElementById('qv-main-img').src='${img}'">
          `).join("")}
        </div>
      </div>
      <div class="modal-product-details">
        <span class="product-category-tag">${item.subCategory} • ${item.occasion}</span>
        <h3>${item.name}</h3>
        <div class="product-rating" style="margin-bottom: 8px;">
          <span>★ ${item.rating} Rating</span>
          <span class="count">(${item.reviewsCount} customer reviews)</span>
        </div>
        <div class="product-pricing-row" style="margin-bottom: 14px;">
          <span class="product-price" style="font-size: 1.6rem;">₹${item.price.toLocaleString('en-IN')}</span>
          <span class="product-original-price">₹${item.originalPrice.toLocaleString('en-IN')}</span>
          <span class="product-discount-pill">${discount}% OFF</span>
        </div>
        <p class="modal-product-desc">${item.description}</p>
        
        <div class="modal-spec-grid">
          <div class="spec-item"><span class="label">Fabric:</span> ${item.fabric}</div>
          <div class="spec-item"><span class="label">Zari / Work:</span> ${item.zari}</div>
          <div class="spec-item"><span class="label">Color:</span> ${item.color}</div>
          <div class="spec-item"><span class="label">Blouse:</span> ${item.includesBlouse}</div>
          <div class="spec-item" style="grid-column: 1 / -1;"><span class="label">Wash Care:</span> ${item.care}</div>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="font-size: 0.85rem; font-weight: 700; display: block; margin-bottom: 6px;">Available Sizes / Drapes:</label>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${item.sizes.map((s, idx) => `
              <button class="style-tab-btn ${idx === 0 ? 'active' : ''}" style="padding: 6px 14px; font-size: 0.8rem;" onclick="selectQuickViewSize(this, '${s}')">${s}</button>
            `).join("")}
          </div>
        </div>

        <div class="pincode-checker-wrap">
          <label style="font-size: 0.85rem; font-weight: 700; display: block; margin-bottom: 4px;">Check Delivery Availability (Pincode):</label>
          <div class="pincode-checker">
            <input type="text" id="qv-pincode-input" placeholder="e.g. 500001" maxlength="6">
            <button onclick="checkPincode()">Check</button>
          </div>
          <div id="qv-pincode-status" class="pincode-result"></div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px;">
          <button class="btn-gold" style="justify-content: center;" onclick="addToCart('${item.id}'); closeQuickView();">
            Add To Cart
          </button>
          <button class="btn-whatsapp-direct" style="justify-content: center;" onclick="orderItemOnWhatsApp('${item.id}')">
            Buy on WhatsApp
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.add("active");
}

function selectQuickViewSize(btn, size) {
  btn.parentElement.querySelectorAll("button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

function closeQuickView() {
  document.getElementById("quickview-modal")?.classList.remove("active");
}

// Pincode validation helper
function checkPincode() {
  const pinInput = document.getElementById("qv-pincode-input");
  const statusEl = document.getElementById("qv-pincode-status");
  if (!pinInput || !statusEl) return;

  const pin = pinInput.value.trim();
  if (/^[1-9][0-9]{5}$/.test(pin)) {
    statusEl.innerHTML = `✓ Delivery available! Free Express delivery to <strong>${pin}</strong> within 2-4 business days.`;
    statusEl.style.color = "#15803D";
  } else {
    statusEl.innerHTML = `✗ Please enter a valid 6-digit Indian Postal Code.`;
    statusEl.style.color = "#DC2626";
  }
}

// ================= STYLE GUIDE INTERACTIVE TABS =================
const STYLE_DATA = {
  nivi: {
    title: "Classic South Indian Nivi Drape",
    steps: [
      { num: 1, title: "Tuck & Complete First Round", desc: "Start from the right side, tuck the upper edge into the petticoat/shapewear and make one full clockwise tuck." },
      { num: 2, title: "Pleat the Pallu", desc: "Measure the pallu over your left shoulder down to your knee. Create neat 5-inch pleats and pin firmly." },
      { num: 3, title: "Form Front Pleats", desc: "Make 6 to 8 even pleats from the remaining fabric, adjust length, and tuck cleanly inside the navel center." },
      { num: 4, title: "Final Royal Pin-Up", desc: "Secure pallu with an antique gold brooch. Pair with traditional temple jewellery for a regal look." }
    ],
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"
  },
  bengali: {
    title: "Royal Bengali Traditional Atpoure Drape",
    steps: [
      { num: 1, title: "Two-Fold Base Tuck", desc: "Tuck anti-clockwise from right to left around the waist twice to form an uninterrupted smooth base." },
      { num: 2, title: "Broad Box Pleats", desc: "Fold broad box pleats in front and tuck them into the waistline with clean symmetry." },
      { num: 3, title: "Left Shoulder Drape", desc: "Pleat the rich zari pallu and rest it on the left shoulder, letting the ornamental corner hang down." },
      { num: 4, title: "Key Bunch Pallu Accent", desc: "Bring the remaining pallu edge under the right arm and toss it over the right shoulder with an ornate keyring (chaabi-guchha)." }
    ],
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80"
  },
  gujarati: {
    title: "Seedha Pallu (Gujarati Front Pallu)",
    steps: [
      { num: 1, title: "Basic Waist Tuck", desc: "Wrap basic round around waist and tuck firmly into petticoat." },
      { num: 2, title: "Front Pallu Pull", desc: "Bring the pallu from behind over the right shoulder towards the front, showcasing the full ornate zari work." },
      { num: 3, title: "Chest Fan Spread", desc: "Fan out the pallu corner across the chest and pin securely at the left waist." },
      { num: 4, title: "Center Pleats", desc: "Tuck front pleats facing towards the right side for classic grace." }
    ],
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80"
  },
  modern: {
    title: "Contemporary Belted Saree Drape",
    steps: [
      { num: 1, title: "Slim Mermaid Tuck", desc: "Create a body-hugging sleek base tuck with an inner contour silhouette." },
      { num: 2, title: "Diagonal Neck Pallu", desc: "Drape the pallu tightly diagonally across the bodice or wrap around the neck like a scarf." },
      { num: 3, title: "Metallic Kamarbandh / Belt", desc: "Fasten a gold metallic waist belt over the pleats to cinch the waist and keep the drape razor sharp." },
      { num: 4, title: "Stiletto & Cocktail Styling", desc: "Pair with a sleeveless designer crop top blouse and statement chandeliers." }
    ],
    image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80"
  }
};

function setupStyleGuideTabs() {
  const container = document.getElementById("style-guide-content");
  if (!container) return;
  loadStyleGuide("nivi");
}

function loadStyleGuide(key) {
  const data = STYLE_DATA[key];
  if (!data) return;

  document.querySelectorAll(".style-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.style === key);
  });

  const content = document.getElementById("style-guide-content");
  if (!content) return;

  content.innerHTML = `
    <div class="style-steps-list">
      <h3 style="font-size: 1.5rem; color: var(--color-primary); margin-bottom: 12px;">${data.title}</h3>
      ${data.steps.map(step => `
        <div class="style-step-item">
          <div class="step-num">${step.num}</div>
          <div class="step-info">
            <h4>${step.title}</h4>
            <p>${step.desc}</p>
          </div>
        </div>
      `).join("")}
    </div>
    <div class="style-image-wrap">
      <img src="${data.image}" alt="${data.title}">
    </div>
  `;
}

// Toast Notifications
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  const icons = {
    success: "✓",
    error: "✕",
    info: "ℹ"
  };

  toast.innerHTML = `<span style="font-weight: 800; font-size: 1.1rem; color: var(--color-gold-bright);">${icons[type] || '•'}</span> <span>${message}</span>`;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}
