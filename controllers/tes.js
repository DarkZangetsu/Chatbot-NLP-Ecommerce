<!-- product section -->
<script>
    document.addEventListener("DOMContentLoaded", function () {
        // Fonction pour charger les produits
        const loadProducts = async () => {
            try {
                console.log("Début du chargement des produits");
                const response = await fetch('http://localhost:3000/api/products');
                const products = await response.json();

                console.log("Produits reçus de l'API:", products);

                const productsContainer = document.querySelector('.products-row');
                const recentSalesTableBody = document.querySelector('.recent-sales tbody');

                if (!products || products.length === 0) {
                    productsContainer.innerHTML = '<div class="col-12 text-center">Aucun produit disponible</div>';
                    return;
                }

                productsContainer.innerHTML = '';
                recentSalesTableBody.innerHTML = '';

                products.forEach(product => {
                    console.log("Traitement du produit:", product);
                    const recentSaleRow = createRecentSaleRow(product);
                    recentSalesTableBody.insertAdjacentHTML('beforeend', recentSaleRow);
                });

                console.log("Initialisation des boutons");
                initializeCartButtons();
            } catch (error) {
                console.error('Erreur détaillée lors du chargement des produits:', error);
                const productsContainer = document.querySelector('.products-row');
                productsContainer.innerHTML = `
                    <div class="col-12 text-center text-danger">
                        Une erreur est survenue lors du chargement des produits.
                        <br>
                        Détails: ${error.message}
                    </div>`;
            }
        };

        // Fonction pour créer une ligne HTML pour "Recent Sales"
        const createRecentSaleRow = (product) => {
            const imagePath = product.image
                ? `/images/product/${product.image}`
                : '/assets/img/products/product-img-1.jpg';

            console.log('Creating row with category_id:', product.category_id);

            return `
                <tr class="product-row" 
                    data-product-id="${product.product_id}"
                    data-product-name="${product.name}"
                    data-product-price="${product.price}"
                    data-product-stock="${product.stock_quantity}"
                    data-product-description="${product.description || ''}"
                    data-product-category="${product.category_id || ''}"
                    data-product-unity="${product.unit_of_mesurement || ''}"
                    data-product-image="${imagePath}">
                    <td><input class="form-check-input" type="checkbox"></td>
                    <td><img class="flex-shrink-0" src="${imagePath}" alt="${product.name}" style="width: 40px; height: 40px;"></td>
                    <td>${product.name}</td>
                    <td>${product.price}€</td>
                    <td>${product.stock_quantity}</td>
                </tr>
            `;
        };

        // Fonction pour initialiser les événements des boutons du panier
        const initializeCartButtons = () => {
            const cartBtns = document.querySelectorAll('.cart-btn');
            console.log("Nombre de boutons trouvés:", cartBtns.length);

            cartBtns.forEach(cartBtn => {
                const quantity = cartBtn.previousElementSibling;
                const cartText = cartBtn.querySelector('.cart-text');

                cartBtn.addEventListener('mouseover', function () {
                    cartText.textContent = 'Add to Cart';
                    quantity.style.display = 'none';
                });

                cartBtn.addEventListener('mouseout', function () {
                    cartText.textContent = '';
                    quantity.style.display = 'inline';
                });

                cartBtn.addEventListener('click', async function (e) {
                    e.preventDefault();
                    const productId = this.dataset.productId;
                    const quantityInput = document.querySelector(`.quantity[data-product-id="${productId}"]`);
                    const userIdInput = document.querySelector('.user_id');
                    const priceElement = this.closest('.single-product-item').querySelector('.product-price');
                    const price = parseFloat(priceElement.textContent.split('€')[0]);

                    const cartData = {
                        user_id: userIdInput.value,
                        items: [{
                            product_id: parseInt(productId),
                            quantity: parseInt(quantityInput.value),
                            price: price
                        }]
                    };

                    try {
                        const response = await fetch('http://localhost:3000/api/carts', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(cartData)
                        });

                        if (!response.ok) {
                            throw new Error('Erreur lors de l\'ajout au panier');
                        }

                        const result = await response.json();
                        window.location.reload();
                        alert('Produit ajouté au panier avec succès!');

                    } catch (error) {
                        console.error('Erreur:', error);
                        alert('Erreur lors de l\'ajout au panier');
                    }
                });
            });
        };

        // Fonction pour charger les catégories
        const loadCategories = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/categories');
                const categories = await response.json();
                console.log('Loaded categories:', categories);

                const categorySelect = document.getElementById('category_id');
                categorySelect.innerHTML = '<option selected disabled>Sélectionnez une catégorie</option>';

                categories.forEach(category => {
                    console.log('Adding category:', category);
                    const option = document.createElement('option');
                    option.value = category.category_id;
                    option.textContent = category.category_name;
                    categorySelect.appendChild(option);
                });
            } catch (error) {
                console.error('Erreur lors du chargement des catégories:', error);
            }
        };

        // Fonction pour mettre à jour un produit
        async function updateProduct(productId, formData) {
            try {
                const response = await fetch(`http://localhost:3000/api/products/${productId}`, {
                    method: 'PUT',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('Erreur lors de la mise à jour du produit');
                }

                const result = await response.json();
                return result;
            } catch (error) {
                throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
            }
        }

        // Fonction pour réinitialiser le formulaire
        function resetForm() {
            document.getElementById('image').value = '';
            document.getElementById('name').value = '';
            document.getElementById('price').value = '';
            document.querySelector('input[name="stock_quantity"]').value = '';
            document.getElementById('description').value = '';
            document.getElementById('category_id').value = 'Sélectionnez une catégorie';
            const checkedRadio = document.querySelector('input[name="unity"]:checked');
            if (checkedRadio) {
                checkedRadio.checked = false;
            }
        }

        // Fonction pour gérer le clic sur une ligne
        const handleRowClick = (event) => {
            const row = event.target.closest('.product-row');
            if (!row) return;

            console.log('Raw row dataset:', row.dataset);

            const productData = {
                id: row.dataset.productId,
                name: row.dataset.productName,
                price: row.dataset.productPrice,
                stock_quantity: row.dataset.productStock,
                description: row.dataset.productDescription,
                category_id: row.dataset.productCategory,
                unit_of_mesurement: row.dataset.productUnity,
                image: row.dataset.productImage
            };

            console.log('Parsed product data:', productData);

            // Afficher le formulaire
            const productFormContainer = document.getElementById('productFormContainer');
            const salesContainer = document.getElementById('tableProduct');
            const addProductForm = document.getElementById('addProductForm');

            productFormContainer.classList.remove('d-none');
            salesContainer.classList.remove('col-lg-12');
            salesContainer.classList.add('col-lg-8');
            addProductForm.classList.add('d-none');

            // Pré-remplir les champs du formulaire
            document.getElementById('name').value = productData.name;
            document.getElementById('price').value = productData.price;
            document.querySelector('input[name="stock_quantity"]').value = productData.stock_quantity;
            document.getElementById('description').value = productData.description;

            // Gérer la sélection de la catégorie
            const categorySelect = document.getElementById('category_id');
            if (productData.category_id && productData.category_id !== 'undefined') {
                const categoryId = parseInt(productData.category_id);
                console.log('Attempting to set category_id:', categoryId);

                const options = Array.from(categorySelect.options);
                const option = options.find(opt => parseInt(opt.value) === categoryId);

                if (option) {
                    categorySelect.value = categoryId;
                    console.log('Category set successfully to:', categoryId);
                } else {
                    console.warn('Category not found in options. Available options:', options.map(opt => opt.value));
                    categorySelect.selectedIndex = 0;
                }
            } else {
                console.warn('Invalid category_id:', productData.category_id);
                categorySelect.selectedIndex = 0;
            }

            // Gérer la sélection de l'unité
            if (productData.unit_of_mesurement) {
                const unityRadio = document.querySelector(`input[name="unity"][value="${productData.unit_of_mesurement}"]`);
                if (unityRadio) {
                    unityRadio.checked = true;
                } else {
                    console.warn('Unity radio button not found for value:', productData.unit_of_mesurement);
                }
            }

            // Modifier le bouton
            const addButton = document.querySelector('.secondChamp .btn-primary');
            addButton.textContent = 'Update';
            addButton.dataset.productId = productData.id;

            // Ajouter le bouton de suppression
            if (!document.querySelector('.btn-danger')) {
                const deleteButton = document.createElement('button');
                deleteButton.className = 'btn btn-danger ms-2';
                deleteButton.textContent = 'Delete';
                addButton.parentElement.appendChild(deleteButton);

                // Gestionnaire d'événements pour le bouton de suppression
                deleteButton.addEventListener('click', async function (e) {
                    e.preventDefault();

                    const productId = addButton.dataset.productId;
                    if (!productId) return;

                    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
                        return;
                    }

                    try {
                        const response = await fetch(`http://localhost:3000/api/products/${productId}`, {
                            method: 'DELETE'
                        });

                        if (!response.ok) {
                            throw new Error('Erreur lors de la suppression du produit');
                        }

                        alert('Produit supprimé avec succès!');

                        resetForm();
                        await loadProducts();

                        const closeButton = document.getElementById('closeButton');
                        closeButton.click();

                    } catch (error) {
                        console.error('Erreur:', error);
                        alert('Erreur lors de la suppression: ' + error.message);
                    }
                });
            }
        };

        // Gestionnaire d'événements pour le tbody
        const tbody = document.querySelector('.recent-sales tbody');
        
        tbody.addEventListener('click', (event) => {
            const row = event.target.closest('.product-row');
            if (!row) return;
            
            const checkbox = row.querySelector('.form-check-input');
            
            // Si on clique sur la checkbox elle-même, on ne fait rien d'autre
            if (event.target === checkbox) {
                return;
            }
            
            // Vérifier si la checkbox est cochée avant d'exécuter handleRowClick
            if (checkbox.checked) {
                handleRowClick(event);
            } else {
                alert('Veuillez d\'abord cocher la case avant de modifier le produit');
            }
        });
        
        // Gestionnaire pour les checkboxes
        tbody.addEventListener('change', (event) => {
            if (event.target.classList.contains('form-check-input')) {
                const allCheckboxes = tbody.querySelectorAll('.form-check-input');
                
                // Décocher toutes les autres checkboxes
                allCheckboxes.forEach(cb => {
                    if (cb !== event.target) {
                        cb.checked = false;
                    }
                });
                
                // Si on décoche la case, réinitialiser le formulaire
                if (!event.target.checked) {
                    resetForm();
                    const productFormContainer = document.getElementById('productFormContainer');
                    const salesContainer = document.getElementById('tableProduct');
                    const addProductForm = document.getElementById('addProductForm');
                    
                    productFormContainer.classList.add('d-none');
                    salesContainer.classList.remove('col-lg-8');
                    salesContainer.classList.add('col-lg-12');
                    addProductForm.classList.remove('d-none');
                }
            }
        });

        // Gestionnaire pour le formulaire
        const submitButton = document.querySelector('.secondChamp .btn-primary');
        submitButton.addEventListener('click', async function (e) {
            e.preventDefault();

            const imageInput = document.getElementById('image');
            const nameInput = document.getElementById('name');
            const priceInput = document.getElementById('price');
            const stockInput = document.querySelector('input[name="stock_quantity"]');
            const descriptionInput = document.getElementById('description');
            const categoryInput = document.getElementById('category_id');
            const unityInput = document.querySelector('input[name="unity"]:checked');

            if (!nameInput.value || !priceInput.value || !stockInput.value ||
                !descriptionInput.value || !categoryInput.value || !unityInput) {
                alert('Veuillez remplir tous les champs obligatoires');
                return;
            }

            const formData = new FormData();
            formData.append('name', nameInput.value);
            formData.append('price', priceInput.value);
            formData.append('stock_quantity', stockInput.value);
            formData.append('description', descriptionInput.value);
            formData.append('category_id', categoryInput.value);
            formData.append('unity', unityInput.value);

            if (imageInput.files.length > 0) {
                formData.append('image', imageInput.files[0]);
            }

            try {
                if (this.dataset.productId) {
                    const result = await updateProduct(this.dataset.productId, formData);
                    alert('Produit mis à jour avec succès!');
                } else {
                    formData.append('entity', nameInput.value);
                    formData.append('entityType', 'ProductType');