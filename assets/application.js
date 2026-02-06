/**
 * Side Cart Functionality
 */

window.openSideCart = function () {
  document.body.classList.add("side-cart-open");
};

window.closeSideCart = function () {
  document.body.classList.remove("side-cart-open");
};

window.updateSideCart = function () {
  fetch("/?section_id=cart-drawer")
    .then((response) => response.text())
    .then((text) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");
      const newContent = doc.querySelector("#shopify-section-cart-drawer");

      if (newContent) {
        document.getElementById("SideCartContent").innerHTML =
          newContent.innerHTML;
      } else {
        document.getElementById("SideCartContent").innerHTML = text;
      }
    })
    .catch((error) => {
      console.error("Error updating side cart:", error);
    });

  fetch("/cart.js")
    .then((response) => response.json())
    .then((cart) => {
      const cartCount = document.getElementById("CartCount");
      if (cartCount) {
        cartCount.innerText = cart.item_count;
        cart.item_count > 0
          ? cartCount.classList.remove("hidden")
          : cartCount.classList.add("hidden");
      }
    })
    .catch((error) => {
      console.error("Error updating cart count:", error);
    });
};

window.updateCartQty = function (lineIndex, quantity) {
  if (quantity < 1) return;

  fetch("/cart/change.js", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      line: lineIndex,
      quantity: quantity,
    }),
  })
    .then((response) => response.json())
    .then(() => {
      updateSideCart();
    })
    .catch((error) => {
      console.error("Error updating quantity:", error);
    });
};

window.removeCartItem = function (lineIndex) {
  fetch("/cart/change.js", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      line: lineIndex,
      quantity: 0,
    }),
  })
    .then((response) => response.json())
    .then(() => {
      updateSideCart();
    })
    .catch((error) => {
      console.error("Error removing item from cart:", error);
      alert("There was an error removing the item.");
    });
};

/**
 * Wishlist Functionality
 */
window.updateWishlistBadge = function () {
  const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
  const countBadge = document.getElementById("WishlistCount");
  if (countBadge) {
    countBadge.innerText = wishlist.length;
    wishlist.length > 0
      ? countBadge.classList.remove("hidden")
      : countBadge.classList.add("hidden");
  }
};

window.toggleWishlist = function (handle, element) {
  let wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
  const index = wishlist.indexOf(handle);

  if (index === -1) {
    wishlist.push(handle);
    if (element) element.classList.add("wishlist-active");
  } else {
    wishlist.splice(index, 1);
    if (element) element.classList.remove("wishlist-active");
  }

  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  updateWishlistBadge();
  updateWishlistHeartStates();
};

window.updateWishlistHeartStates = function () {
  const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
  document.querySelectorAll("[data-wishlist-handle]").forEach((btn) => {
    const handle = btn.getAttribute("data-wishlist-handle");
    if (wishlist.includes(handle)) {
      btn.classList.add("text-red-500", "border-red-100", "bg-red-50");
      btn.querySelector("svg").setAttribute("fill", "currentColor");
    } else {
      btn.classList.remove("text-red-500", "border-red-100", "bg-red-50");
      btn.querySelector("svg").setAttribute("fill", "none");
    }
  });
};

window.updateWishlistDrawer = async function () {
  const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
  const container = document.getElementById("WishlistContent");
  if (!container) return;

  if (wishlist.length === 0) {
    container.innerHTML =
      '<div class="text-center py-10 text-slate-400 text-xs"><p>Your wishlist is empty</p></div>';
    return;
  }

  if (
    container.children.length <= 1 ||
    container.querySelector(".text-slate-400")
  ) {
    container.innerHTML =
      '<div class="flex justify-center py-10"><div class="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-400"></div></div>';
  }

  const products = [];
  for (const handle of wishlist) {
    try {
      const response = await fetch(`/products/${handle}.js`);
      if (response.ok) {
        const product = await response.json();
        products.push(product);
      }
    } catch (e) {
      console.error("Error fetching wishlisted product:", e);
    }
  }

  if (products.length === 0) {
    container.innerHTML =
      '<div class="text-center py-10 text-slate-400 text-xs"><p>Could not load products</p></div>';
    return;
  }

  const countBadge = document.getElementById("WishlistCount");
  const currency = countBadge ? countBadge.dataset.currency : "USD";

  container.innerHTML = products
    .map(
      (product) => `
    <div class="flex gap-3 p-2 hover:bg-slate-700/50 transition border-b border-slate-700/50 last:border-0 rounded-sm">
      <a href="${product.url}" class="w-12 h-16 rounded overflow-hidden bg-slate-900 flex-shrink-0">
        <img src="${product.featured_image}" alt="${product.title}" class="w-full h-full object-cover">
      </a>
      <div class="flex-1 min-w-0 flex flex-col justify-center">
        <a href="${product.url}" class="text-[11px] font-bold text-slate-100 hover:text-white transition truncate block uppercase tracking-tight">${product.title}</a>
        <p class="text-[10px] text-slate-400 mt-0.5">${(product.price / 100).toLocaleString("en-US", { style: "currency", currency: currency })}</p>
        <div class="mt-2 flex gap-3">
          <button onclick="quickAddToCart(${product.variants[0].id})" class="text-[9px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 transition">Add to Cart</button>
          <button onclick="toggleWishlist('${product.handle}'); updateWishlistDrawer();" class="text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:text-red-400 transition">Remove</button>
        </div>
      </div>
    </div>
  `,
    )
    .join("");
};

window.quickAddToCart = function (variantId) {
  fetch("/cart/add.js", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: [{ id: variantId, quantity: 1 }] }),
  })
    .then((res) => res.json())
    .then(() => {
      updateSideCart();
      openSideCart();
    });
};

window.initProductPage = function (sectionContainer) {
  if (!sectionContainer) return;

  const sectionId = sectionContainer.dataset.sectionId;
  if (!sectionId) return;

  const swiperContainer = sectionContainer.querySelector(
    `#ProductMedia-${sectionId}`,
  );
  const swiperVarName = `productMainSwiper_${sectionId.replace(/-/g, "_")}`;

  // 1. Swiper Init with Polling
  function initProductSwiper() {
    if (typeof Swiper !== "undefined" && swiperContainer) {
      const swiperInstance = new Swiper(swiperContainer, {
        slidesPerView: 1,
        grabCursor: true,
        observer: true,
        observeParents: true,
        navigation: {
          nextEl: swiperContainer.querySelector(".swiper-button-next"),
          prevEl: swiperContainer.querySelector(".swiper-button-prev"),
        },
        on: {
          slideChange: function () {
            const index = this.activeIndex;
            const btns = sectionContainer.querySelectorAll(".thumb-btn");
            btns.forEach((btn, i) => {
              if (i === index) {
                btn.classList.add("border-black", "opacity-100");
                btn.classList.remove("border-transparent", "opacity-60");
              } else {
                btn.classList.add("border-transparent", "opacity-60");
                btn.classList.remove("border-black", "opacity-100");
              }
            });
          },
        },
      });
      window[swiperVarName] = swiperInstance;
    } else if (swiperContainer) {
      setTimeout(initProductSwiper, 100);
    }
  }
  initProductSwiper();

  // 1.1 Thumbnail Click Listeners
  sectionContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".thumb-btn");
    const swiperInstance = window[swiperVarName];
    if (btn && swiperInstance) {
      const index = parseInt(btn.dataset.index);
      swiperInstance.slideTo(index);
    }
  });

  // 2. Countdown Timer
  const countdownEl = sectionContainer.querySelector("#delivery-countdown");
  if (countdownEl) {
    function updateCountdown() {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0); // Cutoff 6 PM

      let diff = tomorrow - now;
      if (diff < 0) diff = 0;

      const h = Math.floor(diff / 3600000)
        .toString()
        .padStart(2, "0");
      const m = Math.floor((diff % 3600000) / 60000)
        .toString()
        .padStart(2, "0");
      const s = Math.floor((diff % 60000) / 1000)
        .toString()
        .padStart(2, "0");

      if (countdownEl) countdownEl.innerText = `${h}:${m}:${s}`;
    }
    const timer = setInterval(updateCountdown, 1000);
    updateCountdown();
  }

  // 3. Variant Selection
  const variantSelectContainer =
    sectionContainer.querySelector(".variant-selects");
  const variantDataScript = sectionContainer.querySelector(
    `#VariantData-${sectionId}`,
  );

  if (variantSelectContainer && variantDataScript) {
    const variantData = JSON.parse(variantDataScript.textContent);
    const inputs = variantSelectContainer.querySelectorAll(
      ".variant-option-input",
    );
    const cartCurrency = sectionContainer.dataset.cartCurrency || "USD";

    inputs.forEach((input) => {
      input.addEventListener("change", () => {
        const selectedOptions = Array.from(
          variantSelectContainer.querySelectorAll(
            ".variant-option-input:checked",
          ),
        ).map((i) => i.value);
        const matchedVariant = variantData.find((v) =>
          v.options.every((opt, idx) => opt === selectedOptions[idx]),
        );

        if (matchedVariant) {
          // Update hidden input
          const hiddenInput = sectionContainer.querySelector(
            "#AddToCartForm input[name='id']",
          );
          if (hiddenInput) hiddenInput.value = matchedVariant.id;

          // Update Price
          const priceContainer = sectionContainer.querySelector(
            `#ProductPrice-${sectionId}`,
          );
          if (priceContainer) {
            priceContainer.innerText = (
              matchedVariant.price / 100
            ).toLocaleString("en-US", {
              style: "currency",
              currency: cartCurrency,
            });
          }

          // Update Compare Price & Discount
          const compareContainer = sectionContainer.querySelector(
            `#ComparePrice-${sectionId}`,
          );
          const discountBadge = sectionContainer.querySelector(
            `#DiscountBadge-${sectionId}`,
          );

          if (matchedVariant.compare_at_price > matchedVariant.price) {
            if (compareContainer) {
              compareContainer.classList.remove("hidden");
              compareContainer.innerText = (
                matchedVariant.compare_at_price / 100
              ).toLocaleString("en-US", {
                style: "currency",
                currency: cartCurrency,
              });
            }
            if (discountBadge) {
              discountBadge.classList.remove("hidden");
              const savings = Math.round(
                ((matchedVariant.compare_at_price - matchedVariant.price) *
                  100) /
                  matchedVariant.compare_at_price,
              );
              discountBadge.innerText = `${savings}%`;
            }
          } else {
            if (compareContainer) compareContainer.classList.add("hidden");
            if (discountBadge) discountBadge.classList.add("hidden");
          }

          // Update URL
          const url = new URL(window.location);
          url.searchParams.set("variant", matchedVariant.id);
          window.history.replaceState({}, "", url);

          // Button State
          const addButton = sectionContainer.querySelector(
            `#AddToCart-${sectionId}`,
          );
          if (addButton) {
            if (matchedVariant.available) {
              addButton.disabled = false;
              addButton.innerText = "Add to Cart";
            } else {
              addButton.disabled = true;
              addButton.innerText = "Sold Out";
            }
          }

          // Swiper sync
          const featuredMedia =
            matchedVariant.featured_media || matchedVariant.featured_image;
          const swiperInstance = window[swiperVarName];
          if (featuredMedia && swiperInstance) {
            const mediaId = featuredMedia.id;
            const slides = sectionContainer.querySelectorAll(".swiper-slide");
            const targetIndex = Array.from(slides).findIndex(
              (s) => s.dataset.mediaId == mediaId,
            );
            if (targetIndex !== -1) {
              swiperInstance.slideTo(targetIndex);
            }
          }
        }
      });
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // Initialize the side cart
  updateSideCart();

  // Handle Add to Cart form submission
  const addToCartForm = document.getElementById("AddToCartForm");

  if (addToCartForm) {
    addToCartForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const submitButton = addToCartForm.querySelector('[type="submit"]');
      const originalText = submitButton.innerText;

      submitButton.disabled = true;
      submitButton.innerText = "Adding...";

      const formData = new FormData(addToCartForm);

      fetch("/cart/add.js", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then(() => {
          updateSideCart();
          openSideCart();
        })
        .catch((error) => {
          console.error("Error adding to cart:", error);
          alert("There was an error adding the item to your cart.");
        })
        .finally(() => {
          submitButton.disabled = false;
          submitButton.innerText = originalText;
        });
    });
  }

  // Wishlist initial state
  updateWishlistBadge();
  updateWishlistHeartStates();

  // Initialize product redesigned sections
  const productSections = document.querySelectorAll(
    '[data-section-type="main-product-redesign"]',
  );
  productSections.forEach((section) => initProductPage(section));
});
