(function () {
  if (window.Swiper) {
    return;
  }



  // Inject Swiper JS
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.js";
  script.defer = true;

  script.onload = function () {
    console.log("Swiper CDN loaded");
  };

  script.onerror = function () {
    console.error("Failed to load Swiper CDN");
  };

  document.body.appendChild(script);

    document.addEventListener('DOMContentLoaded', function () {
    const initSwiper = () => {
      if (typeof Swiper !== 'undefined') {
        const thumbSwiper = new Swiper('.product-thumb-swiper', {
          spaceBetween: 12,
          slidesPerView: 5,
          watchSlidesProgress: true,
          centeredSlides: false,
          slideToClickedSlide: true,
        });

        const mainSwiper = new Swiper('.product-main-swiper', {
          spaceBetween: 0,
          loop: false,
          navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          },
          thumbs: {
            swiper: thumbSwiper,
          },
        });

        // Store instances for variant switching
        window.productThumbSwiper = thumbSwiper;
        window.productMainSwiper = mainSwiper;



      } else {
        setTimeout(initSwiper, 50);
      }
    };
    initSwiper();
  });
})();
