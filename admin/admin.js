// ⚠️ CONFIGURATION - PLAIN STRINGS
var GITHUB_USERNAME = 'sotuonunyo';
var REPO_NAME = 'candle-shop';
var BRANCH = 'main';

// ✅ Safe URL construction using + instead of template literals
var API_BASE = 'https://api.github.com/repos/' + GITHUB_USERNAME + '/' + REPO_NAME;
var SITE_URL = 'https://' + GITHUB_USERNAME + '.github.io/' + REPO_NAME;

// Check login
if(localStorage.getItem('adminLoggedIn') !== 'true') {
  window.location.href = 'index.html';
}

function logout() {
  localStorage.removeItem('adminLoggedIn');
  window.location.href = '../index.html';
}

document.addEventListener('DOMContentLoaded', async function() {
  await loadProducts();
  await loadSettings();
  await loadMailingList();
});

async function loadProducts() {
  try {
    var res = await fetch(SITE_URL + '/_data/products.json');
    var products = await res.json();
    renderProductList(products);
  } catch(e) {
    var el = document.getElementById('product-list');
    if(el) el.innerHTML = '<p>No products yet.</p>';
  }
}

function renderProductList(products) {
  var container = document.getElementById('product-list');
  if(!container) return;
  if(!products || products.length === 0) {
    container.innerHTML = '<p>No products yet. Add your first product above!</p>';
    return;
  }
  container.innerHTML = products.map(function(prod, index) {
    return '<div class="product-item">' +
      '<img src="' + (prod.image || 'https://via.placeholder.com/80') + '" alt="' + prod.name + '">' +
      '<div class="product-item-info"><strong>' + prod.name + '</strong><br>$' + prod.price + 
      (prod.inSlideshow ? ' | ✨ In Slideshow' : '') + '</div>' +
      '<div class="product-item-actions">' +
      '<button class="edit-btn" onclick="editProduct(' + index + ')">Edit</button>' +
      '<button class="delete-btn" onclick="deleteProduct(' + index + ')">Delete</button>' +
      '</div></div>';
  }).join('');
}

async function saveProduct(event) {
  event.preventDefault();
  var editIndex = document.getElementById('edit-index').value;
  var name = document.getElementById('prod-name').value;
  var price = parseFloat(document.getElementById('prod-price').value);
  var description = document.getElementById('prod-desc').value;
  var ingredients = document.getElementById('prod-ingredients').value;
  var image = document.getElementById('prod-image').value;
  var inSlideshow = document.getElementById('prod-slideshow').checked;
  
  var imageFile = document.getElementById('prod-image-upload').files[0];
  if(imageFile) {
    image = await uploadImageToGitHub(imageFile);
    if(!image) return;
  }
  
  var newProduct = { name: name, price: price, description: description, ingredients: ingredients, image: image, inSlideshow: inSlideshow };
  
  try {
    var res = await fetch(SITE_URL + '/_data/products.json');
    var products = await res.json();
    if(!Array.isArray(products)) products = [];
    
    if(editIndex !== '') products[editIndex] = newProduct;
    else products.push(newProduct);
    
    await saveToGitHub('_data/products.json', JSON.stringify(products, null, 2), 'Update products');
    
    var successEl = document.getElementById('form-success');
    if(successEl) { successEl.style.display = 'block'; setTimeout(function(){ successEl.style.display = 'none'; }, 3000); }
    document.getElementById('product-form').reset();
    document.getElementById('edit-index').value = '';
    document.getElementById('form-title').textContent = '➕ Add New Product';
    document.getElementById('save-btn').textContent = '💾 Save Product';
    document.getElementById('image-preview').style.display = 'none';
    await loadProducts();
  } catch(error) {
    console.error('Error:', error);
    var errEl = document.getElementById('form-error');
    if(errEl) { errEl.textContent = 'Error: ' + error.message; errEl.style.display = 'block'; setTimeout(function(){ errEl.style.display = 'none'; }, 5000); }
  }
}

function editProduct(index) {
  fetch(SITE_URL + '/_data/products.json')
    .then(function(res){ return res.json(); })
    .then(function(products) {
      var prod = products[index];
      document.getElementById('edit-index').value = index;
      document.getElementById('prod-name').value = prod.name;
      document.getElementById('prod-price').value = prod.price;
      document.getElementById('prod-desc').value = prod.description;
      document.getElementById('prod-ingredients').value = prod.ingredients || '';
      document.getElementById('prod-image').value = prod.image || '';
      document.getElementById('prod-slideshow').checked = prod.inSlideshow || false;
      if(prod.image) { document.getElementById('image-preview').src = prod.image; document.getElementById('image-preview').style.display = 'block'; }
      document.getElementById('form-title').textContent = '✏️ Edit Product';
      document.getElementById('save-btn').textContent = '💾 Update Product';
      window.scrollTo(0, 0);
    });
}

async function deleteProduct(index) {
  if(!confirm('Delete this product?')) return;
  try {
    var res = await fetch(SITE_URL + '/_data/products.json');
    var products = await res.json();
    products.splice(index, 1);
    await saveToGitHub('_data/products.json', JSON.stringify(products, null, 2), 'Delete product');
    await loadProducts();
  } catch(e) { alert('Error: ' + e.message); }
}

function cancelEdit() {
  document.getElementById('product-form').reset();
  document.getElementById('edit-index').value = '';
  document.getElementById('form-title').textContent = '➕ Add New Product';
  document.getElementById('save-btn').textContent = '💾 Save Product';
  document.getElementById('image-preview').style.display = 'none';
}

function previewImage(event) {
  var file = event.target.files[0];
  if(file) {
    var reader = new FileReader();
    reader.onload = function(e) { document.getElementById('image-preview').src = e.target.result; document.getElementById('image-preview').style.display = 'block'; };
    reader.readAsDataURL(file);
  }
}

// ✅ SAFE UPLOAD FUNCTION
async function uploadImageToGitHub(file) {
  var token = localStorage.getItem('githubToken');
  if(!token) { alert('Token not set. Paste it at the top.'); return ''; }
  
  var safeName = file.name.replace(/\s/g, '-').replace(/[^a-zA-Z0-9.-]/g, '');
  var fileName = 'images/' + Date.now() + '-' + safeName;
  
  var base64 = await new Promise(function(resolve) {
    var reader = new FileReader();
    reader.onload = function() { resolve(reader.result.split(',')[1]); };
    reader.readAsDataURL(file);
  });
  
  try {
    // Using simple string concatenation for URL
    var uploadUrl = 'https://api.github.com/repos/' + GITHUB_USERNAME + '/' + REPO_NAME + '/contents/' + fileName;
    
    var response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Authorization': 'token ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Upload: ' + file.name, content: base64, branch: BRANCH })
    });
    
    var data = await response.json();
    if(response.ok) {
      return SITE_URL + '/' + fileName;
    } else {
      var msg = data.message || 'Upload failed';
      if(response.status === 401) msg = 'Invalid token';
      else if(response.status === 403) msg = 'Token needs "repo" scope';
      else if(response.status === 404) msg = 'Repo/branch not found';
      
      if(confirm('Upload failed: ' + msg + '\nUse manual image URL instead?')) {
        return prompt('Paste image URL:') || '';
      }
      return '';
    }
  } catch(e) {
    console.error('Network Error:', e);
    if(confirm('Network error: ' + e.message + '\nTry manual image URL?')) {
      return prompt('Paste image URL:') || '';
    }
    return '';
  }
}

async function loadSettings() {
  try {
    var res = await fetch(SITE_URL + '/_data/settings.json');
    var s = await res.json();
    var fields = ['whatsapp','bank','account-num','account-name','address','phone','email','hours','theme'];
    var keys = ['whatsapp','bankName','accountNumber','accountName','address','phone','email','hours','theme'];
    for(var i=0; i<fields.length; i++) {
      var el = document.getElementById('set-' + fields[i]);
      if(el && s[keys[i]]) el.value = s[keys[i]];
    }
  } catch(e) { console.log('No settings yet'); }
}

async function saveSettings(event) {
  event.preventDefault();
  var settings = {
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
    await saveToGitHub('_data/settings.json', JSON.stringify(settings, null, 2), 'Update settings');
    var el = document.getElementById('settings-success');
    if(el) { el.style.display = 'block'; setTimeout(function(){ el.style.display = 'none'; }, 3000); }
  } catch(e) { alert('Error: ' + e.message); }
}

async function loadMailingList() {
  try {
    var res = await fetch(SITE_URL + '/_data/mailing-list.json');
    var list = await res.json();
    var container = document.getElementById('mailing-list');
    if(!container) return;
    if(!list || list.length === 0) { container.innerHTML = '<p>No subscribers yet.</p>'; return; }
    container.innerHTML = list.map(function(sub) {
      return '<div class="mailing-item"><span>' + sub.name + ' - ' + sub.email + '</span><small style="color:#999">' + new Date(sub.date).toLocaleDateString() + '</small></div>';
    }).join('');
  } catch(e) { var c = document.getElementById('mailing-list'); if(c) c.innerHTML = '<p>No subscribers yet.</p>'; }
}

async function saveToGitHub(filePath, content, message) {
  var token = localStorage.getItem('githubToken');
  if(!token) throw new Error('Token not set');
  
  var sha = '';
  try {
    var checkUrl = 'https://api.github.com/repos/' + GITHUB_USERNAME + '/' + REPO_NAME + '/contents/' + filePath + '?ref=' + BRANCH;
    var res = await fetch(checkUrl, { headers: { 'Authorization': 'token ' + token } });
    if(res.ok) { var d = await res.json(); sha = d.sha; }
  } catch(e) { /* file doesn't exist */ }
  
  var body = { message: message, content: btoa(unescape(encodeURIComponent(content))), branch: BRANCH };
  if(sha) body.sha = sha;
  
  var saveUrl = 'https://api.github.com/repos/' + GITHUB_USERNAME + '/' + REPO_NAME + '/contents/' + filePath;
  var res = await fetch(saveUrl, {
    method: 'PUT',
    headers: { 'Authorization': 'token ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  if(!res.ok) { var err = await res.json(); throw new Error(err.message || 'Save failed'); }
  return true;
}

function saveToken() {
  var token = document.getElementById('github-token-input').value.trim();
  if(!token) { alert('Enter token'); return; }
  if(token.indexOf('ghp_') !== 0) { alert('Token must start with ghp_'); return; }
  localStorage.setItem('githubToken', token);
  document.getElementById('github-token-input').value = '';
  var el = document.getElementById('token-status');
  if(el) { el.style.display = 'block'; el.textContent = '✅ Token saved!'; el.style.background = '#e8f5e9'; el.style.color = '#2e7d32'; setTimeout(function(){ el.style.display = 'none'; }, 3000); }
}

document.addEventListener('DOMContentLoaded', function() {
  var token = localStorage.getItem('githubToken');
  var el = document.getElementById('token-status');
  if(!el) return;
  if(token && token.indexOf('ghp_') === 0) {
    el.style.display = 'block'; el.textContent = '✅ Token is set.'; el.style.background = '#e8f5e9'; el.style.color = '#2e7d32';
  } else {
    el.style.display = 'block'; el.textContent = '⚠️ Token not set. Paste above.'; el.style.background = '#fff3e0'; el.style.color = '#ef6c00';
  }
});
