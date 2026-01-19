
const Wishlist = {
  key: 'shopify-wishlist',
  
  init() {
    this.updateUI();
    this.bindEvents();
  },

  get() {
    const stored = localStorage.getItem(this.key);
    return stored ? JSON.parse(stored) : [];
  },

  add(product) {
    const wishlist = this.get();
    if (!wishlist.some(item => item.handle === product.handle)) {
      wishlist.push(product);
      localStorage.setItem(this.key, JSON.stringify(wishlist));
      this.updateUI();
    }
  },

  remove(handle) {
    let wishlist = this.get();
    wishlist = wishlist.filter(item => item.handle !== handle);
    localStorage.setItem(this.key, JSON.stringify(wishlist));
    this.updateUI();
  },

  toggle(product) {
    const wishlist = this.get();
    if (wishlist.some(item => item.handle === product.handle)) {
      this.remove(product.handle);
    } else {
      this.add(product);
    }
  },

  updateUI() {
    const wishlist = this.get();
    
    // Update Counts
    const counts = document.querySelectorAll('.wishlist-count');
    counts.forEach(el => el.textContent = wishlist.length);

    // Update Buttons on page
    const buttons = document.querySelectorAll('.btn-wishlist');
    buttons.forEach(btn => {
      const handle = btn.dataset.productHandle;
      if (wishlist.some(item => item.handle === handle)) {
        btn.classList.add('active');
        btn.querySelector('svg').style.fill = '#ff3333'; // Or checks logic/class
        btn.querySelector('svg').style.stroke = '#ff3333'; 
      } else {
        btn.classList.remove('active');
        btn.querySelector('svg').style.fill = 'transparent'; // Reset to default
        btn.querySelector('svg').style.stroke = 'currentColor'; 
      }
    });

    // Render Dropdown
    this.renderDropdown(wishlist);
  },

  renderDropdown(wishlist) {
    const container = document.getElementById('wishlist-dropdown-container');
    if (!container) return;

    if (wishlist.length === 0) {
      container.innerHTML = '<div class="p-3 text-center">Your wishlist is empty.</div>';
      return;
    }

    const html = wishlist.map(item => `
      <div class="wishlist-item d-flex align-items-center mb-3">
        <a href="${item.url}" class="me-3">
          <img src="${item.image}" alt="${item.title}" width="50" height="50" style="object-fit: cover;">
        </a>
        <div class="flex-grow-1">
          <h6 class="m-0 fs-6"><a href="${item.url}" class="text-decoration-none text-dark">${item.title}</a></h6>
          <small class="text-muted">${item.price}</small>
        </div>
        <button class="btn btn-sm text-danger remove-wishlist-item" data-handle="${item.handle}">&times;</button>
      </div>
    `).join('');

    container.innerHTML = `<div class="p-3">${html}</div><div class="p-3 border-top text-center"><a href="/pages/wishlist" class="btn btn-outline-primary btn-sm w-100">View Wishlist</a></div>`;

    // Bind remove buttons in dropdown
    container.querySelectorAll('.remove-wishlist-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            this.remove(btn.dataset.handle);
        });
    });
  },

  bindEvents() {
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-wishlist');
      if (btn) {
        e.preventDefault();
        const product = {
            handle: btn.dataset.productHandle,
            title: btn.dataset.productTitle,
            image: btn.dataset.productImage,
            price: btn.dataset.productPrice,
            url: btn.dataset.productUrl
        };
        this.toggle(product);
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Wishlist.init();
});
