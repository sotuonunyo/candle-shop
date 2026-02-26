// ⚠️ CONFIGURATION - UPDATE THESE VALUES
const GITHUB_USERNAME = 'sotuonunyo'; // ← CHANGE THIS
const REPO_NAME = 'candle-shop'; // ← CHANGE THIS if different
const BRANCH = 'main';

// GitHub API base URL
const API_BASE = `https://api.github.com/repos/${sotuonunyo}/${candle-shop}`;

// Check if admin is logged in
if(localStorage.getItem('adminLoggedIn') !== 'true') {
  window.location.href = 'index.html';
}

// Logout function
function logout() {
  localStorage.removeItem('adminLoggedIn');
  window.location.href = '../index.html';
}

// Load products on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  await loadSettings();
  await loadMailingList();
});

// Load Products from GitHub
async function loadProducts() {
  try {
    const response = await fetch(`https://${sotuonunyo}.github.io/${candle-shop}/_data/products.json`);
    const products = await response.json();
    renderProductList(products);
  } catch(error) {
    document.getElementById('product-list').innerHTML = '<p>No products yet. Add your first product above!</p>';
  }
}

// Render Product List in Admin
function renderProductList(products) {
  const container = document.getElementById('product-list');
  
  if(products.length === 0) {
    container.innerHTML = '<p>No products yet. Add your first product above!</p>';
    return;
  }
  
  container.innerHTML = products.map((prod, index) => `
    <div class="product-item">
      <img src="${prod.image || 'https://via.placeholder.com/80'}" alt="${prod.name}">
      <div class="product-item-info">
        <strong>${prod.name}</strong><br>
        $${prod.price} | ${prod.inSlideshow ? '✨ In Slideshow' : ''}
      </div>
      <div class="product-item-actions">
        <button class="edit-btn" onclick="editProduct(${index})">Edit</button>
        <button class="delete-btn" onclick="deleteProduct(${index})">Delete</button>
      </div>
    </div>
  `).join('');
}

// Save Product (Create or Update)
async function saveProduct(event) {
  event.preventDefault();
  
  const editIndex = document.getElementById('edit-index').value;
  const name = document.getElementById('prod-name').value;
  const price = parseFloat(document.getElementById('prod-price').value);
  const description = document.getElementById('prod-desc').value;
  const ingredients = document.getElementById('prod-ingredients').value;
  let image = document.getElementById('prod-image').value;
  const inSlideshow = document.getElementById('prod-slideshow').checked;
  
  // Handle image upload (simple base64 for now)
  const imageFile = document.getElementById('prod-image-upload').files[0];
  if(imageFile) {
    image = await uploadImageToGitHub(imageFile);
  }
  
  const newProduct = { name, price, description, ingredients, image, inSlideshow };
  
  try {
    // Load existing products
    const response = await fetch(`https://${sotuonunyo}.github.io/${candle-shop}/_data/products.json`);
    let products = await response.json();
    
    if(editIndex !== '') {
      // Update existing product
      products[editIndex] = newProduct;
    } else {
      // Add new product
      products.push(newProduct);
    }
    
    // Save to GitHub via API
    await saveToGitHub('_data/products.json', JSON.stringify(products, null, 2), 'Update products');
    
    // Show success & reset form
    document.getElementById('form-success').style.display = 'block';
    setTimeout(() => document.getElementById('form-success').style.display = 'none', 3000);
    document.getElementById('product-form').reset();
    document.getElementById('edit-index').value = '';
    document.getElementById('form-title').textContent = '➕ Add New Product';
    document.getElementById('save-btn').textContent = '💾 Save Product';
    document.getElementById('image-preview').style.display = 'none';
    
    // Reload products
    await loadProducts();
    
  } catch(error) {
    console.error('Error saving product:', error);
    document.getElementById('form-error').style.display = 'block';
    setTimeout(() => document.getElementById('form-error').style.display = 'none', 3000);
  }
}

// Edit Product (fill form)
function editProduct(index) {
  fetch(`https://${sotuonunyo}.github.io/${candle-shop}/_data/products.json`)
    .then(res => res.json())
    .then(products => {
      const prod = products[index];
      document.getElementById('edit-index').value = index;
      document.getElementById('prod-name').value = prod.name;
      document.getElementById('prod-price').value = prod.price;
      document.getElementById('prod-desc').value = prod.description;
      document.getElementById('prod-ingredients').value = prod.ingredients || '';
      document.getElementById('prod-image').value = prod.image || '';
      document.getElementById('prod-slideshow').checked = prod.inSlideshow || false;
      
      if(prod.image) {
        document.getElementById('image-preview').src = prod.image;
        document.getElementById('image-preview').style.display = 'block';
      }
      
      document.getElementById('form-title').textContent = '✏️ Edit Product';
      document.getElementById('save-btn').textContent = '💾 Update Product';
      window.scrollTo(0, 0);
    });
}

// Delete Product
async function deleteProduct(index) {
  if(!confirm('Are you sure you want to delete this product?')) return;
  
  try {
    const response = await fetch(`https://${sotuonunyo}.github.io/${candle-shop}/_data/products.json`);
    let products = await response.json();
    products.splice(index, 1);
    
    await saveToGitHub('_data/products.json', JSON.stringify(products, null, 2), 'Delete product');
    await loadProducts();
  } catch(error) {
    alert('Error deleting product');
  }
}

// Cancel Edit
function cancelEdit() {
  document.getElementById('product-form').reset();
  document.getElementById('edit-index').value = '';
  document.getElementById('form-title').textContent = '➕ Add New Product';
  document.getElementById('save-btn').textContent = '💾 Save Product';
  document.getElementById('image-preview').style.display = 'none';
}

// Preview Image Upload
function previewImage(event) {
  const file = event.target.files[0];
  if(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('image-preview').src = e.target.result;
      document.getElementById('image-preview').style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
}

// Upload Image to GitHub (Simple Base64 Method)
async function uploadImageToGitHub(file) {
  const fileName = `images/${Date.now()}-${file.name.replace(/\s/g, '-')}`;
  
  // Convert to base64
  const base64 = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });
  
  // Get GitHub token from localStorage (user must set this once)
  const token = localStorage.getItem('githubToken');
  if(!token) {
    alert('Please set your GitHub Personal Access Token first in browser console:\nlocalStorage.setItem("githubToken", "your_token_here")');
    return '';
  }
  
  try {
    const response = await fetch(`${API_BASE}/contents/${fileName}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Upload image: ${file.name}`,
        content: base64,
        branch: BRANCH
      })
    });
    
    if(response.ok) {
      // Return the public URL
      return `https://${sotuonunyo}.github.io/${candle-shop}/${fileName}`;
    } else {
      throw new Error('Upload failed');
    }
  } catch(error) {
    console.error('Image upload error:', error);
    alert('Image upload failed. Try again or use an external image URL.');
    return '';
  }
}

// Load Settings
async function loadSettings() {
  try {
    const response = await fetch(`https://${sotuonunyo}.github.io/${candle-shop}/_data/settings.json`);
    const settings = await response.json();
    
    document.getElementById('set-whatsapp').value = settings.whatsapp || '';
    document.getElementById('set-bank').value = settings.bankName || '';
    document.getElementById('set-account-num').value = settings.accountNumber || '';
    document.getElementById('set-account-name').value = settings.accountName || '';
    document.getElementById('set-address').value = settings.address || '';
    document.getElementById('set-phone').value = settings.phone || '';
    document.getElementById('set-email').value = settings.email || '';
    document.getElementById('set-hours').value = settings.hours || '';
    document.getElementById('set-theme').value = settings.theme || 'default';
  } catch(error) {
    console.log('No settings file yet');
  }
}

// Save Settings
async function saveSettings(event) {
  event.preventDefault();
  
  const settings = {
    whatsapp: document.getElementById('set-whatsapp').value,
    bankName: document.getElementById('set-bank').value,
    accountNumber: document.getElementById('set-account-num').value,
    accountName: document.getElementById('set-account-name').value,
    address: document.getElementById('set-address').value,
    phone: document.getElementById('set-phone').value,
    email: document.getElementById('set-email').value,
    hours: document.getElementById('set-hours').value,
    theme: document.getElementById('set-theme').value
  };
  
  try {
    await saveToGitHub('_data/settings.json', JSON.stringify(settings, null, 2), 'Update business settings');
    document.getElementById('settings-success').style.display = 'block';
    setTimeout(() => document.getElementById('settings-success').style.display = 'none', 3000);
  } catch(error) {
    alert('Error saving settings');
  }
}

// Load Mailing List
async function loadMailingList() {
  try {
    const response = await fetch(`https://${sotuonunyo}.github.io/${candle-shop}/_data/mailing-list.json`);
    const list = await response.json();
    
    const container = document.getElementById('mailing-list');
    if(list.length === 0) {
      container.innerHTML = '<p>No subscribers yet.</p>';
      return;
    }
    
    container.innerHTML = list.map(sub => `
      <div class="mailing-item">
        <span>${sub.name} - ${sub.email}</span>
        <small style="color: #999">${new Date(sub.date).toLocaleDateString()}</small>
      </div>
    `).join('');
  } catch(error) {
    document.getElementById('mailing-list').innerHTML = '<p>No subscribers yet.</p>';
  }
}

// Save Data to GitHub via API
async function saveToGitHub(filePath, content, message) {
  const token = localStorage.getItem('githubToken');
  if(!token) {
    throw new Error('GitHub token not set');
  }
  
  // First, get the current file SHA (if it exists)
  let sha = '';
  try {
    const response = await fetch(`${API_BASE}/contents/${filePath}?ref=${BRANCH}`, {
      headers: { 'Authorization': `token ${token}` }
    });
    if(response.ok) {
      const data = await response.json();
      sha = data.sha;
    }
  } catch(e) {
    // File doesn't exist yet, that's ok
  }
  
  // Save the file
  const body = {
    message: message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch: BRANCH
  };
  if(sha) body.sha = sha;
  
  const response = await fetch(`${API_BASE}/contents/${filePath}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  if(!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Save failed');
  }
  
  return true;
}

// Helper: Set GitHub Token (run once in browser console)
// localStorage.setItem('githubToken', 'ghp_your_personal_access_token_here')
