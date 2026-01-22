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
  // Fetch cart drawer HTML
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

  // Update cart badge
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

/**
 * Update cart item quantity (used by + / − counter)
 */
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

/**
 * Remove item from cart
 */
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
});
