// GitHub Pages repo path (update this!)
const repoPath = 'sotuonunyo/candle-shop'; // ← Your repo name with leading slash

// Load all data on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    await loadProducts();
    await loadSlideshow();
    updateCartUI();
    updateBankDetails();
    updateContactInfo();
});

// Load Settings (WhatsApp, Bank Info, Theme)
async function loadSettings() {
    try {
        const res = await fetch(`${repoPath}/_data/settings.json`);
        settings = await res.json();
        if(settings.theme) {
            document.body.className = `theme-${settings.theme}`;
        }
    } catch(e) {
        console.log('Settings not loaded yet');
        settings = { whatsapp: '1234567890', theme: 'default' };
    }
}

// Load Products
async function loadProducts() {
    try {
        const res = await fetch(`${repoPath}/_data/products.json`);
        products = await res.json();
        renderProducts();
    } catch(e) {
        console.log('No products yet');
        products = [];
    }
}

// Load Slideshow
async function loadSlideshow() {
    try {
        const res = await fetch(`${repoPath}/_data/slideshow.json`);
        slideshowProducts = await res.json();
        renderSlideshow();
    } catch(e) {
        console.log('No slideshow yet');
        slideshowProducts = [];
    }
}
let cart = [];
let products = [];
let slideshowProducts = [];
let settings = {};

// Load all data on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    await loadProducts();
    await loadSlideshow();
    updateCartUI();
    updateBankDetails();
    updateContactInfo();
});

// Load Settings (WhatsApp, Bank Info, Theme)
async function loadSettings() {
    try {
        const res = await fetch('/_data/settings.json');
        settings = await res.json();
        // Apply theme
        if(settings.theme) {
            document.body.className = `theme-${settings.theme}`;
        }
    } catch(e) {
        console.log('Settings not loaded yet');
        settings = { whatsapp: '1234567890', theme: 'default' };
    }
}

// Load Products
async function loadProducts() {
    try {
        const res = await fetch('/_data/products.json');
        products = await res.json();
        renderProducts();
    } catch(e) {
        console.log('No products yet');
        products = [];
    }
}

// Load Slideshow
async function loadSlideshow() {
    try {
        const res = await fetch('/_data/slideshow.json');
        slideshowProducts = await res.json();
        renderSlideshow();
    } catch(e) {
        console.log('No slideshow yet');
        slideshowProducts = [];
    }
}

// Render Products Grid
function renderProducts() {
    const grid = document.getElementById('products-grid');
    if(!grid) return;
    
    grid.innerHTML = '';
    products.forEach(product => {
        grid.innerHTML += `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}">
                <button class="add-to-cart-btn" onclick="addToCart('${product.name}', ${product.price})">
                    Add to Cart
                </button>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="product-price">$${product.price}</div>
                    <div class="product-ingredients">${product.ingredients || 'Natural ingredients'}</div>
                    <p>${product.description}</p>
                </div>
            </div>
        `;
    });
}

// Render Slideshow
let currentSlide = 0;
let slideInterval;

function renderSlideshow() {
    const slideshow = document.getElementById('slideshow');
    const dots = document.getElementById('slide-dots');
    if(!slideshow) return;
    
    slideshow.innerHTML = '';
    dots.innerHTML = '';
    
    slideshowProducts.forEach((prod, index) => {
        slideshow.innerHTML += `
            <div class="slide">
                <img src="${prod.image}" alt="${prod.name}">
                <div class="slide-info">
                    <h2>${prod.name}</h2>
                    <p>${prod.description}</p>
                    <button class="checkout-btn" onclick="addToCart('${prod.name}', ${prod.price})">
                        Add to Cart - $${prod.price}
                    </button>
                </div>
            </div>
        `;
        
        dots.innerHTML += `<span class="dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></span>`;
    });
    
    if(slideshowProducts.length > 0) {
        startSlideShow();
    }
}

function changeSlide(n) {
    if(slideshowProducts.length === 0) return;
    currentSlide += n;
    if(currentSlide >= slideshowProducts.length) currentSlide = 0;
    if(currentSlide < 0) currentSlide = slideshowProducts.length - 1;
    updateSlideDisplay();
}

function goToSlide(n) {
    currentSlide = n;
    updateSlideDisplay();
}

function updateSlideDisplay() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    slides.forEach((slide, i) => {
        slide.style.display = i === currentSlide ? 'flex' : 'none';
    });
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });
}

function startSlideShow() {
    clearInterval(slideInterval);
    slideInterval = setInterval(() => changeSlide(1), 5000);
}

// Cart Functions
function addToCart(name, price) {
    cart.push({ name, price });
    updateCartUI();
    alert(`${name} added to cart!`);
}

function updateCartUI() {
    document.getElementById('cart-count').innerText = cart.length;
    const cartItems = document.getElementById('cart-items');
    if(!cartItems) return;
    
    cartItems.innerHTML = '';
    let total = 0;
    cart.forEach(item => {
        total += item.price;
        cartItems.innerHTML += `
            <div class="cart-item">
                <span>${item.name}</span>
                <span>$${item.price}</span>
            </div>
        `;
    });
    document.getElementById('cart-total').innerText = total;
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}

function updateBankDetails() {
    const bankDiv = document.getElementById('bank-details');
    if(!bankDiv) return;
    
    bankDiv.innerHTML = `
        <strong>Bank:</strong> ${settings.bankName || 'Example Bank'}<br>
        <strong>Account:</strong> ${settings.accountNumber || '1234567890'}<br>
        <strong>Name:</strong> ${settings.accountName || 'Business Name'}
    `;
}

function updateContactInfo() {
    const contactDiv = document.getElementById('contact-info');
    if(!contactDiv) return;
    
    contactDiv.innerHTML = `
        <p><strong>📍 Address:</strong> ${settings.address || '123 Main Street'}</p>
        <p><strong>📞 Phone:</strong> ${settings.phone || '+1 234 567 890'}</p>
        <p><strong>📧 Email:</strong> ${settings.email || 'info@scentdecor.com'}</p>
        <p><strong>⏰ Hours:</strong> ${settings.hours || 'Mon-Sat: 9AM-6PM'}</p>
    `;
}

function checkoutWhatsApp() {
    if(cart.length === 0) return alert("Cart is empty");
    
    let message = "Hello, I would like to order:%0A";
    let total = 0;
    cart.forEach(item => {
        message += `- ${item.name} ($${item.price})%0A`;
        total += item.price;
    });
    message += `%0ATotal: $${total}%0A%0AI will send payment proof shortly.`;
    
    window.open(`https://wa.me/${settings.whatsapp}?text=${message}`, '_blank');
}

// Mailing List
async function submitMailing(event) {
    event.preventDefault();
    
    const name = document.getElementById('mail-name').value;
    const email = document.getElementById('mail-email').value;
    
    try {
        const res = await fetch(`${repoPath}/_data/mailing-list.json`);
        const mailingList = await res.json().catch(() => []);
        mailingList.push({ name, email, date: new Date().toISOString() });
        
        document.getElementById('mail-success').style.display = 'block';
        document.getElementById('mailing-form').reset();
        setTimeout(() => {
            document.getElementById('mail-success').style.display = 'none';
        }, 3000);
    } catch(e) {
        console.log('Mailing list save pending');
    }
}

// Hidden Admin Link (click 5 times to reveal)
let adminClicks = 0;
const adminLink = document.getElementById('hidden-admin');
if(adminLink) {
    adminLink.addEventListener('click', (e) => {
        adminClicks++;
        if(adminClicks >= 5) {
            adminLink.style.color = 'var(--primary)';
            adminClicks = 0;
        }
        e.preventDefault();
    });
}


