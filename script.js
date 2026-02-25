let cart = [];
let products = [];

// 1. Fetch Products from CMS Data
async function loadProducts() {
    try {
        // In a real Decap CMS setup, this fetches from the git branch
        // For simplicity in this demo, we will look for a generated 'products.json' 
        // OR we can fetch the markdown files directly if configured. 
        // To keep this no-backend simple, we will use a specific Decap CMS data file approach.
        
        const response = await fetch('/admin/config.yml'); 
        // Note: In production with Decap, products are usually stored in _data/products.json 
        // or as markdown files. For this specific code to work without a build step, 
        // we will assume you create a 'products.json' in the root via the CMS.
        
        // SIMPLIFIED FOR YOU: 
        // We will fetch a products.json file that the CMS will update.
        const prodResponse = await fetch('/products.json');
        if(!prodResponse.ok) throw new Error("No products yet");
        products = await prodResponse.json();
        renderProducts();
    } catch (error) {
        document.getElementById('product-grid').innerHTML = "<p>Store is currently updating. Check back soon!</p>";
        console.log("Waiting for CMS to publish products.json");
    }
}

function renderProducts() {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';
    products.forEach(product => {
        grid.innerHTML += `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <div class="product-price">$${product.price}</div>
                    <button class="add-btn" onclick="addToCart('${product.name}', ${product.price})">Add to Cart</button>
                </div>
            </div>
        `;
    });
}

function addToCart(name, price) {
    cart.push({ name, price });
    updateCartUI();
}

function updateCartUI() {
    document.getElementById('cart-count').innerText = cart.length;
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = '';
    let total = 0;
    cart.forEach((item, index) => {
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

function checkoutWhatsApp() {
    if(cart.length === 0) return alert("Cart is empty");
    
    let message = "Hello, I would like to order:%0A";
    let total = 0;
    cart.forEach(item => {
        message += `- ${item.name} ($${item.price})%0A`;
        total += item.price;
    });
    message += `%0ATotal: $${total}%0A%0AI will send payment proof shortly.`;
    
    // Replace with your friend's WhatsApp number
    window.open(`https://wa.me/1234567890?text=${message}`, '_blank');
}

loadProducts();