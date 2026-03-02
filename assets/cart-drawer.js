class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Close on overlay click or close button
    this.addEventListener("click", (event) => {
      if (
        event.target.classList.contains("side-cart__overlay") ||
        event.target.closest(".drawer__close")
      ) {
        this.close();
      }
    });

    // Handle internal actions (remove, qty)
    this.addEventListener("click", (event) => {
      const removeBtn = event.target.closest(".drawer__item-remove");
      if (removeBtn) {
        const line = removeBtn.getAttribute("data-line");
        this.updateItem(line, 0);
      }

      const qtyBtn = event.target.closest(".drawer__qty-btn");
      if (qtyBtn) {
        const line = qtyBtn.getAttribute("data-line");
        const qty = parseInt(qtyBtn.getAttribute("data-qty"));
        this.updateItem(line, qty);
      }
    });
  }

  connectedCallback() {
    this.update();
  }

  open() {
    document.body.classList.add("side-cart-open");
    this.update();
  }

  close() {
    document.body.classList.remove("side-cart-open");
  }

  async update() {
    const loader = this.querySelector(".side-cart__loader");
    const container = this.querySelector("#SideCartContent");
    const errorContainer = this.querySelector(".side-cart__error");

    if (errorContainer) errorContainer.classList.add("hidden");
    if (loader) loader.classList.add("opacity-100");

    try {
      const response = await fetch("/?section_id=cart-drawer");
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");
      const newContent =
        doc.querySelector("#shopify-section-cart-drawer") ||
        doc.querySelector(".drawer") ||
        doc.body.firstElementChild;

      if (container && newContent) {
        container.innerHTML = newContent.outerHTML;
      }
    } catch (error) {
      console.error("Cart Drawer Update Error:", error);
    } finally {
      if (loader) loader.classList.remove("opacity-100");
    }

    this.updateCartCount();
  }

  async updateCartCount() {
    try {
      const response = await fetch("/cart.js");
      const cart = await response.json();
      const cartCount = document.getElementById("CartCount");
      if (cartCount) {
        cartCount.innerText = cart.item_count;
        cart.item_count > 0
          ? cartCount.classList.remove("hidden")
          : cartCount.classList.add("hidden");
      }
    } catch (e) {}
  }

  async updateItem(line, quantity) {
    if (quantity < 0) return;

    const loader = this.querySelector(".side-cart__loader");
    if (loader) loader.classList.add("opacity-100");

    try {
      const response = await fetch("/cart/change.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line, quantity }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.description || data.message || "Failed to update cart"
        );
      }
      this.update();
    } catch (error) {
      this.showError(error.message);
    }
  }

  showError(message) {
    const errorContainer = this.querySelector(".side-cart__error");
    const errorMessageEl = this.querySelector("#CartErrorMessage");
    const loader = this.querySelector(".side-cart__loader");

    if (loader) loader.classList.remove("opacity-100");

    if (errorContainer && errorMessageEl) {
      errorMessageEl.innerText =
        message || "An unexpected error occurred. Please try again.";
      errorContainer.classList.remove("hidden");
    } else {
      alert(message);
    }
  }
}

if (!customElements.get("cart-drawer")) {
  customElements.define("cart-drawer", CartDrawer);
}
