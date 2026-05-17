import { productAPI } from '../api.js';
import { showToast, formatCurrency, escapeHtml, getImageUrl, fileToBase64 } from '../utils.js';

let productsMap = new Map();

export async function renderSell(container) {
  container.innerHTML = `
    <div class="section-card">
      <div class="section-header"><h3>📸 Post New Product</h3></div>
      <form id="productForm">
        <div class="form-group"><label>Product Name *</label><input type="text" id="productName" required></div>
        <div class="form-group"><label>Price (₦) *</label><input type="number" id="productPrice" required></div>
        <div class="form-group"><label>Stock</label><input type="number" id="productStock" value="1" min="1"></div>
        <div class="form-group"><label>Category</label><input type="text" id="productCategory" value="General"></div>
        <div class="form-group"><label>Description</label><textarea id="productDesc" rows="2"></textarea></div>
        <div class="form-group"><label>Product Image</label><div class="image-upload-area" id="imageUploadArea"><i class="fas fa-cloud-arrow-up"></i><p>Click to upload</p></div><input type="file" id="productImageFile" accept="image/*" style="display:none;"><div class="image-preview-container" id="imagePreview"></div></div>
        <button type="submit" class="btn-primary">Post Advertisement</button>
      </form>
    </div>
    <div class="section-card"><div class="section-header"><h3>📋 My Listings</h3></div><div id="myProductsList"></div></div>
  `;

  // image preview
  const uploadArea = document.getElementById('imageUploadArea');
  const fileInput = document.getElementById('productImageFile');
  const preview = document.getElementById('imagePreview');
  uploadArea.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => preview.innerHTML = `<img src="${e.target.result}" class="image-preview-thumb" style="width:100px;height:100px;">`;
      reader.readAsDataURL(fileInput.files[0]);
    } else preview.innerHTML = '';
  });

  document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', document.getElementById('productName').value.trim());
    formData.append('price', parseFloat(document.getElementById('productPrice').value));
    formData.append('stock', parseInt(document.getElementById('productStock').value) || 1);
    formData.append('category', document.getElementById('productCategory').value.trim() || 'General');
    formData.append('description', document.getElementById('productDesc').value.trim());
    const file = fileInput.files[0];
    if (!file) { showToast('Please select an image', 'error'); return; }
    formData.append('images', file);
    try {
      await productAPI.create(formData);
      showToast('✅ Product posted!');
      document.getElementById('productForm').reset();
      preview.innerHTML = '';
      await loadMyProducts();
    } catch (err) { showToast(err.message, 'error'); }
  });

  await loadMyProducts();
}

async function loadMyProducts() {
  const listDiv = document.getElementById('myProductsList');
  try {
    const data = await productAPI.getMyProducts();
    if (!data.data?.length) {
      listDiv.innerHTML = '<div class="empty-state"><i class="fas fa-store-slash"></i><p>No products yet. Create one above.</p></div>';
      productsMap.clear();
      return;
    }
    productsMap = new Map(data.data.map(p => [p.id, p]));
    listDiv.innerHTML = data.data.map(p => {
      const imgUrl = getImageUrl(p);
      return `
        <div class="list-item" data-product-id="${p.id}">
          <div class="list-item-left">
            <div class="list-item-thumb">${imgUrl ? `<img src="${imgUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">` : '<i class="fas fa-box"></i>'}</div>
            <div><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.category)} · Stock: ${p.stock}</small></div>
          </div>
          <strong>${formatCurrency(p.price)}</strong>
          <div class="list-item-actions">
            <button class="action-btn edit" data-action="edit"><i class="fas fa-pen"></i></button>
            <button class="action-btn delete" data-action="delete"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `;
    }).join('');

    listDiv.onclick = async (e) => {
      const btn = e.target.closest('.action-btn');
      if (!btn) return;
      const item = btn.closest('.list-item');
      const id = item.dataset.productId;
      if (btn.classList.contains('edit')) {
        const product = productsMap.get(id);
        if (product) openEditModal(product);
      } else if (btn.classList.contains('delete')) {
        if (confirm('Delete this product?')) {
          try {
            await productAPI.delete(id);
            showToast('Deleted');
            await loadMyProducts();
          } catch (err) { showToast(err.message, 'error'); }
        }
      }
    };
  } catch (e) { showToast(e.message, 'error'); }
}

function openEditModal(product) {
  // Simple modal injection – you can improve this
  const modalHtml = `
    <div class="modal-overlay show" id="editModal">
      <div class="modal">
        <h3>✏️ Edit Product</h3>
        <form id="editProductForm">
          <input type="hidden" id="editProductId" value="${product.id}">
          <div class="form-group"><label>Product Name</label><input type="text" id="editProductName" value="${escapeHtml(product.name)}" required></div>
          <div class="form-group"><label>Price (₦)</label><input type="number" id="editProductPrice" value="${product.price}" required></div>
          <div class="form-group"><label>Stock</label><input type="number" id="editProductStock" value="${product.stock || 1}" min="1"></div>
          <div class="form-group"><label>Category</label><input type="text" id="editProductCategory" value="${escapeHtml(product.category || 'General')}"></div>
          <div class="form-group"><label>Description</label><textarea id="editProductDesc" rows="2">${escapeHtml(product.description || '')}</textarea></div>
          <div class="form-group"><label>New Image (optional)</label><input type="file" id="editProductImageFile" accept="image/*"></div>
          <div class="image-preview-container" id="editImagePreview">${getImageUrl(product) ? `<img src="${getImageUrl(product)}" class="image-preview-thumb" style="width:100px;height:100px;">` : ''}</div>
          <div style="display:flex; gap:0.6rem; justify-content:flex-end; margin-top:1rem;">
            <button type="button" class="btn-logout" id="closeEditModalBtn">Cancel</button>
            <button type="submit" class="btn-primary">Update Product</button>
          </div>
        </form>
      </div>
    </div>
  `;
  let modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.id = 'modalRoot';
    document.body.appendChild(modalRoot);
  }
  modalRoot.innerHTML = modalHtml;
  document.getElementById('closeEditModalBtn').addEventListener('click', () => modalRoot.innerHTML = '');
  document.getElementById('editModal').addEventListener('click', (e) => { if (e.target === e.currentTarget) modalRoot.innerHTML = ''; });
  document.getElementById('editProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editProductId').value;
    const formData = new FormData();
    formData.append('name', document.getElementById('editProductName').value.trim());
    formData.append('price', parseFloat(document.getElementById('editProductPrice').value));
    formData.append('stock', parseInt(document.getElementById('editProductStock').value) || 1);
    formData.append('category', document.getElementById('editProductCategory').value.trim());
    formData.append('description', document.getElementById('editProductDesc').value.trim());
    const newImg = document.getElementById('editProductImageFile').files[0];
    if (newImg) {
      formData.append('replaceImages', 'true');
      formData.append('images', newImg);
    }
    try {
      await productAPI.update(id, formData);
      showToast('✅ Updated');
      modalRoot.innerHTML = '';
      await loadMyProducts();
    } catch (err) { showToast(err.message, 'error'); }
  });
}