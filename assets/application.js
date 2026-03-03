(function () {
  "use strict";

  /**
   * Helper: Cart Drawer Component Access
   */
  const getCartDrawer = () => document.querySelector("cart-drawer");

  const openSideCart = () => {
    const cartDrawer = getCartDrawer();
    if (cartDrawer) {
      cartDrawer.open();
    } else {
      document.body.classList.add("side-cart-open");
    }
  };

  const closeSideCart = () => {
    const cartDrawer = getCartDrawer();
    if (cartDrawer) {
      cartDrawer.close();
    } else {
      document.body.classList.remove("side-cart-open");
    }
  };

  const updateSideCart = () => {
    const cartDrawer = getCartDrawer();
    if (cartDrawer) cartDrawer.update();
  };

  /**
   * Wishlist Functionality (Private)
   */
  const updateWishlistBadge = () => {
    const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    const countBadge = document.getElementById("WishlistCount");
    if (countBadge) {
      countBadge.innerText = wishlist.length;
      wishlist.length > 0
        ? countBadge.classList.remove("hidden")
        : countBadge.classList.add("hidden");
    }
  };

  const updateWishlistHeartStates = () => {
    const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    document.querySelectorAll("[data-wishlist-toggle]").forEach((btn) => {
      const handle = btn.getAttribute("data-wishlist-toggle");
      if (wishlist.includes(handle)) {
        btn.classList.add("wishlist-active");
      } else {
        btn.classList.remove("wishlist-active");
      }
    });
  };

  const toggleWishlist = (handle, element) => {
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

  const updateWishlistDrawer = async () => {
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
      } catch (e) {}
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
            <button data-action="quick-add" data-variant-id="${product.variants[0].id}" class="text-[9px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 transition">Add to Cart</button>
            <button data-wishlist-toggle="${product.handle}" data-action="wishlist-remove" class="text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:text-red-400 transition">Remove</button>
          </div>
        </div>
      </div>
    `,
      )
      .join("");
  };

  const quickAddToCart = (variantId) => {
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

  const initProductPage = (sectionContainer) => {
    if (!sectionContainer) return;

    const sectionId = sectionContainer.dataset.sectionId;
    if (!sectionId) return;

    const swiperContainer = sectionContainer.querySelector(
      `#ProductMedia-${sectionId}`,
    );
    const swiperVarName = `productMainSwiper_${sectionId.replace(/-/g, "_")}`;

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
        // We avoid putting swiper on window, but keeping it for internal sync if needed
        sectionContainer._swiper = swiperInstance;
      } else if (swiperContainer) {
        setTimeout(initProductSwiper, 100);
      }
    }
    initProductSwiper();

    sectionContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".thumb-btn");
      if (btn && sectionContainer._swiper) {
        const index = parseInt(btn.dataset.index);
        sectionContainer._swiper.slideTo(index);
      }
    });

    const countdownEl = sectionContainer.querySelector("#delivery-countdown");
    if (countdownEl) {
      const updateCountdown = () => {
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(now.getDate() + 1);
        tomorrow.setHours(18, 0, 0, 0);

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
      };
      setInterval(updateCountdown, 1000);
      updateCountdown();
    }

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
            const hiddenInput = sectionContainer.querySelector(
              "#AddToCartForm input[name='id']",
            );
            if (hiddenInput) hiddenInput.value = matchedVariant.id;

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

            const url = new URL(window.location);
            url.searchParams.set("variant", matchedVariant.id);
            window.history.replaceState({}, "", url);

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

            const featuredMedia =
              matchedVariant.featured_media || matchedVariant.featured_image;
            if (featuredMedia && sectionContainer._swiper) {
              const mediaId = featuredMedia.id;
              const slides = sectionContainer.querySelectorAll(".swiper-slide");
              const targetIndex = Array.from(slides).findIndex(
                (s) => s.dataset.mediaId == mediaId,
              );
              if (targetIndex !== -1) {
                sectionContainer._swiper.slideTo(targetIndex);
              }
            }
          }
        });
      });
    }
  };

  /**
   * Event Delegation System
   */
  document.addEventListener("click", (e) => {
    // 1. Cart Actions
    if (e.target.closest('[data-action="open-cart"]')) {
      e.preventDefault();
      openSideCart();
    }
    if (e.target.closest('[data-action="close-cart"]')) {
      const cta = e.target.closest('[data-action="close-cart"]');
      const href = cta.getAttribute("href");

      closeSideCart();

      if (href && href !== "#") {
        window.location.href = href;
      } else {
        e.preventDefault();
      }
    }
    if (e.target.closest('[data-action="close-wishlist"]')) {
      e.preventDefault();
      document.body.classList.remove("wishlist-open");
      const wishlistPanel = document.getElementById("SideWishlist");
      if (wishlistPanel) wishlistPanel.classList.add("hidden");
    }


    const wishlistToggle = e.target.closest("[data-wishlist-toggle]");
    if (wishlistToggle) {
      e.preventDefault();
      const handle = wishlistToggle.dataset.wishlistToggle;
      toggleWishlist(handle, wishlistToggle);
      if (wishlistToggle.dataset.action === "wishlist-remove") {
        updateWishlistDrawer();
      }
    }

    // 3. Quick Add Actions
    const quickAdd = e.target.closest('[data-action="quick-add"]');
    if (quickAdd) {
      e.preventDefault();
      const variantId = quickAdd.dataset.variantId;
      quickAddToCart(variantId);
    }

    // 4. Quantity Actions

    const qtyBtn = e.target.closest('[data-action^="qty-"]');
    if (qtyBtn) {
      e.preventDefault();
      const input = qtyBtn.parentNode.querySelector('input[type="number"]');
      if (input) {
        if (qtyBtn.dataset.action === "qty-up") input.stepUp();
        if (qtyBtn.dataset.action === "qty-down") input.stepDown();
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    // 5. Product Thumbnail Click
    const thumbBtn = e.target.closest(".thumb-btn");
    if (thumbBtn) {
      const section = thumbBtn.closest('[data-section-type="main-product-redesign"]');
      if (section && section._swiper) {
        const index = parseInt(thumbBtn.dataset.index);
        section._swiper.slideTo(index);
      }
    }
  });


  /**
   * Global Observers / Custom Events
   * Allow other scripts to trigger cart updates without window functions
   */
  document.addEventListener("theme:cart:update", () => updateSideCart());
  document.addEventListener("theme:cart:open", () => openSideCart());
  document.addEventListener("theme:wishlist:update", () => {
    updateWishlistDrawer();
    updateWishlistHeartStates();
  });

  /**
   * DOM Content Loaded Init
   */
  document.addEventListener("DOMContentLoaded", () => {
    updateSideCart();

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
          .catch(() => {
            alert("There was an error adding the item to your cart.");
          })
          .finally(() => {
            submitButton.disabled = false;
            submitButton.innerText = originalText;
          });
      });
    }

    updateWishlistBadge();
    updateWishlistHeartStates();

    const productSections = document.querySelectorAll(
      '[data-section-type="main-product-redesign"]',
    );
    productSections.forEach((section) => initProductPage(section));

    // Support for Alpine.js integration if needed (Wishlist MouseEnter)
    document.querySelectorAll('[data-trigger="wishlist-drawer"]').forEach(el => {
      el.addEventListener('mouseenter', updateWishlistDrawer);
    });
  });
})();
