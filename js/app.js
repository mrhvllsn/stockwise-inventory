const NAV = [
  ["dashboard", "layout-dashboard", "Dashboard"],
  ["products", "package", "Products"],
  ["stockin", "package-plus", "Stock In"],
  ["stockout", "package-minus", "Stock Out"],
  ["categories", "tags", "Categories"],
  ["suppliers", "truck", "Suppliers"],
  ["transactions", "history", "Transaction History"],
  ["reports", "file-bar-chart", "Reports"],
  ["settings", "settings", "Settings"],
  ["signout", "log-out", "Sign Out"],
];

let state = {
  page: "dashboard",
  products: [],
  categories: [],
  suppliers: [],
  transactions: [],
  charts: [],
};

const $ = (selector) => document.querySelector(selector);
const content = $("#content");

/* =========================================================
   GENERAL DATA FUNCTIONS
========================================================= */

function load() {
  state.products = readStore(KEYS.products, []);
  state.categories = readStore(KEYS.categories, []);
  state.suppliers = readStore(KEYS.suppliers, []);
  state.transactions = readStore(KEYS.transactions, []);
}

function persist(type) {
  saveStore(KEYS[type], state[type]);
}

function refresh() {
  load();
  render();
  updateChrome();
}

/* =========================================================
   GENERAL UI FUNCTIONS
========================================================= */

function icon(name) {
  return `<i data-lucide="${name}"></i>`;
}

function toast(message, type = "success") {
  const notification = document.createElement("div");

  notification.className = `toast ${type}`;
  notification.textContent = message;

  $("#toastBox").append(notification);

  setTimeout(() => {
    notification.remove();
  }, 3200);
}

function openModal(html) {
  $("#modalBody").innerHTML = html;
  $("#modal").classList.add("open");
  $("#modal").setAttribute("aria-hidden", "false");

  lucide.createIcons();
}

function closeModal() {
  $("#modal").classList.remove("open");
  $("#modal").setAttribute("aria-hidden", "true");
}

function confirmAction(message, action) {
  openModal(`
    <h2>Confirm Action</h2>

    <p>${safeText(message)}</p>

    <div class="form-actions">
      <button
        class="secondary"
        type="button"
        data-close
      >
        Cancel
      </button>

      <button
        class="danger"
        id="confirmBtn"
        type="button"
      >
        Confirm
      </button>
    </div>
  `);

  $("#confirmBtn").onclick = () => {
    closeModal();
    action();
  };
}

function empty(text) {
  return `
    <div class="empty">
      ${icon("inbox")}
      <div>${safeText(text)}</div>
    </div>
  `;
}

function statusBadge(status) {
  const className = status
    .toLowerCase()
    .replaceAll(" ", "-");

  return `
    <span class="badge ${className}">
      ${safeText(status)}
    </span>
  `;
}

function pageHead(title, subtitle, actions = "") {
  return `
    <div class="page-head">
      <div>
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </div>

      <div class="actions no-print">
        ${actions}
      </div>
    </div>
  `;
}

function opts(items, value, label = "name") {
  return items
    .map(
      (item) => `
        <option
          value="${item.id}"
          ${item.id === value ? "selected" : ""}
        >
          ${safeText(item[label])}
        </option>
      `,
    )
    .join("");
}

function catName(id) {
  return (
    state.categories.find(
      (category) => category.id === id,
    )?.name || "Unassigned"
  );
}

function supName(id) {
  return (
    state.suppliers.find(
      (supplier) => supplier.id === id,
    )?.name || "Unassigned"
  );
}

function avatarData(name) {
  const initials = (name || "A")
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("");

  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="80"
      height="80"
    >
      <rect
        width="100%"
        height="100%"
        fill="#2563eb"
      />

      <text
        x="50%"
        y="55%"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="Arial"
        font-size="30"
        fill="white"
      >
        ${safeText(initials)}
      </text>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function updateChrome() {
  const settings = getSettings();

  $("#sideName").textContent = settings.adminName;

  $("#sideAvatar").src =
    settings.profile ||
    avatarData(settings.adminName);

  const alerts = state.products.filter((product) =>
    ["Low Stock", "Out of Stock", "Expired"].includes(
      productStatus(product),
    ),
  ).length;

  $("#alertCount").textContent = alerts;

  document.title =
    `${settings.businessName} Inventory`;
}

/* =========================================================
   PAGE RENDERING
========================================================= */

function render() {
  state.charts.forEach((chartInstance) => {
    chartInstance.destroy();
  });

  state.charts = [];

  document
    .querySelectorAll(".nav-btn")
    .forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.page === state.page,
      );
    });

  const pages = {
    dashboard: renderDashboard,
    products: renderProducts,
    stockin: () => renderStock("in"),
    stockout: () => renderStock("out"),
    categories: renderCategories,
    suppliers: renderSuppliers,
    transactions: renderTransactions,
    reports: renderReports,
    settings: renderSettings,
  };

  const pageFunction =
    pages[state.page] || renderDashboard;

  pageFunction();

  lucide.createIcons();
}

/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {
  const totalQuantity = state.products.reduce(
    (total, product) =>
      total + Number(product.quantity),
    0,
  );

  const inventoryCost = state.products.reduce(
    (total, product) =>
      total + product.quantity * product.cost,
    0,
  );

  const expectedSales = state.products.reduce(
    (total, product) =>
      total + product.quantity * product.price,
    0,
  );

  const lowStockProducts = state.products.filter(
    (product) =>
      productStatus(product) === "Low Stock",
  );

  const outOfStockProducts = state.products.filter(
    (product) =>
      productStatus(product) === "Out of Stock",
  );

  const expiredProducts = state.products.filter(
    (product) =>
      productStatus(product) === "Expired",
  );

  const nearExpirationProducts =
    state.products.filter((product) => {
      if (!product.expiration) {
        return false;
      }

      const remainingDays =
        (new Date(product.expiration) -
          new Date()) /
        86400000;

      return (
        product.expiration >= today() &&
        remainingDays <= 30
      );
    });

  const cards = [
    [
      "Total Products",
      state.products.length,
      "package",
    ],
    [
      "Available Quantity",
      totalQuantity,
      "boxes",
    ],
    [
      "Low Stock",
      lowStockProducts.length,
      "triangle-alert",
    ],
    [
      "Out of Stock",
      outOfStockProducts.length,
      "circle-x",
    ],
    [
      "Categories",
      state.categories.length,
      "tags",
    ],
    [
      "Suppliers",
      state.suppliers.length,
      "truck",
    ],
    [
      "Inventory Cost",
      money(inventoryCost),
      "wallet",
    ],
    [
      "Expected Sales",
      money(expectedSales),
      "badge-dollar-sign",
    ],
  ];

  content.innerHTML =
    pageHead(
      "Dashboard",
      "A live overview of your inventory",
    ) +
    `
      <div class="stats">
        ${cards
          .map(
            (card) => `
              <div class="stat">
                <div class="stat-top">
                  <span>${card[0]}</span>

                  <span class="stat-icon">
                    ${icon(card[2])}
                  </span>
                </div>

                <b>${card[1]}</b>
              </div>
            `,
          )
          .join("")}
      </div>

      <div class="dashboard-grid">
        <div class="panel">
          <h2>Products by Category</h2>

          <div class="chart-wrap">
            <canvas id="catChart"></canvas>
          </div>
        </div>

        <div class="panel">
          <h2>Stock Status</h2>

          <div class="chart-wrap">
            <canvas id="statusChart"></canvas>
          </div>
        </div>

        <div class="panel full">
          <h2>Stock Activity (Last 7 Days)</h2>

          <div class="chart-wrap">
            <canvas id="activityChart"></canvas>
          </div>
        </div>

        ${dashList(
          "Recently Added",
          state.products
            .slice()
            .sort((first, second) =>
              second.dateAdded.localeCompare(
                first.dateAdded,
              ),
            )
            .slice(0, 5),
          (product) =>
            `${product.name} — ${product.quantity} ${product.unit}`,
        )}

        ${dashList(
          "Recent Transactions",
          state.transactions
            .slice()
            .sort(
              (first, second) =>
                new Date(second.date) -
                new Date(first.date),
            )
            .slice(0, 5),
          (transaction) =>
            `${transaction.type}: ${transaction.productName} (${transaction.quantity})`,
        )}

        ${dashList(
          "Low Stock Products",
          [
            ...lowStockProducts,
            ...outOfStockProducts,
          ],
          (product) =>
            `${product.name} — ${product.quantity} left`,
        )}

        ${dashList(
          "Near Expiration",
          [
            ...expiredProducts,
            ...nearExpirationProducts,
          ],
          (product) =>
            `${product.name} — ${formatDate(product.expiration)}`,
        )}
      </div>
    `;

  const categoryLabels =
    state.categories.map(
      (category) => category.name,
    );

  const categoryData =
    state.categories.map(
      (category) =>
        state.products.filter(
          (product) =>
            product.category === category.id,
        ).length,
    );

  chart(
    "catChart",
    "bar",
    categoryLabels,
    categoryData,
    "Products",
  );

  const statuses = [
    "Available",
    "Low Stock",
    "Out of Stock",
    "Expired",
  ];

  chart(
    "statusChart",
    "doughnut",
    statuses,
    statuses.map(
      (status) =>
        state.products.filter(
          (product) =>
            productStatus(product) === status,
        ).length,
    ),
    "Products",
  );

  const days = [...Array(7)].map(
    (_, index) => {
      const date = new Date();

      date.setDate(
        date.getDate() - 6 + index,
      );

      return date
        .toISOString()
        .slice(0, 10);
    },
  );

  const stockInData = days.map((day) =>
    state.transactions
      .filter(
        (transaction) =>
          transaction.type === "Stock In" &&
          transaction.date.slice(0, 10) === day,
      )
      .reduce(
        (total, transaction) =>
          total + transaction.quantity,
        0,
      ),
  );

  const stockOutData = days.map((day) =>
    state.transactions
      .filter(
        (transaction) =>
          transaction.type === "Stock Out" &&
          transaction.date.slice(0, 10) === day,
      )
      .reduce(
        (total, transaction) =>
          total + transaction.quantity,
        0,
      ),
  );

  chart(
    "activityChart",
    "line",
    days.map((day) => formatDate(day)),
    stockInData,
    "Stock In",
    stockOutData,
  );
}

function dashList(title, items, line) {
  return `
    <div class="panel">
      <h2>${title}</h2>

      ${
        items.length
          ? items
              .map(
                (item) => `
                  <div
                    style="
                      padding: 9px 0;
                      border-bottom: 1px solid var(--border);
                    "
                  >
                    ${safeText(line(item))}
                  </div>
                `,
              )
              .join("")
          : empty("No records to show")
      }
    </div>
  `;
}

function chart(
  id,
  type,
  labels,
  data,
  label,
  secondData,
) {
  const datasets = [
    {
      label,
      data,
      backgroundColor:
        type === "doughnut"
          ? [
              "#10b981",
              "#f59e0b",
              "#ef4444",
              "#7c3aed",
            ]
          : "#3b82f6aa",
      borderColor: "#2563eb",
      tension: 0.3,
    },
  ];

  if (secondData) {
    datasets.push({
      label: "Stock Out",
      data: secondData,
      borderColor: "#ef4444",
      backgroundColor: "#ef444455",
      tension: 0.3,
    });
  }

  const chartInstance = new Chart(
    document.getElementById(id),
    {
      type,
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: type !== "bar",
          },
        },
      },
    },
  );

  state.charts.push(chartInstance);
}

/* =========================================================
   PRODUCTS
========================================================= */

function renderProducts() {
  content.innerHTML =
    pageHead(
      "Products",
      "Manage all inventory products",
      `
        <button
          class="primary"
          id="addProduct"
          type="button"
        >
          ${icon("plus")}
          Add Product
        </button>
      `,
    ) +
    `
      <div class="panel">
        <div class="toolbar">
          <input
            id="pSearch"
            type="search"
            placeholder="Search name or SKU"
          />

          <select id="pCat">
            <option value="">
              All categories
            </option>

            ${opts(state.categories)}
          </select>

          <select id="pSup">
            <option value="">
              All suppliers
            </option>

            ${opts(state.suppliers)}
          </select>

          <select id="pStatus">
            <option value="">
              All statuses
            </option>

            <option>Available</option>
            <option>Low Stock</option>
            <option>Out of Stock</option>
            <option>Expired</option>
          </select>

          <select id="pSort">
            <option value="name">
              Sort: Name
            </option>

            <option value="quantity">
              Quantity
            </option>

            <option value="dateAdded">
              Date Added
            </option>

            <option value="cost">
              Cost
            </option>

            <option value="price">
              Price
            </option>
          </select>
        </div>

        <div id="productTable"></div>
      </div>
    `;

  $("#addProduct").onclick = () => {
    productForm();
  };

  [
    "pSearch",
    "pCat",
    "pSup",
    "pStatus",
    "pSort",
  ].forEach((id) => {
    $(`#${id}`).oninput = productTable;
  });

  productTable();
}

function productTable() {
  let rows = [...state.products];

  const search =
    $("#pSearch").value.toLowerCase();

  rows = rows.filter((product) => {
    const matchesSearch =
      `${product.name} ${product.sku}`
        .toLowerCase()
        .includes(search);

    const matchesCategory =
      !$("#pCat").value ||
      product.category === $("#pCat").value;

    const matchesSupplier =
      !$("#pSup").value ||
      product.supplier === $("#pSup").value;

    const matchesStatus =
      !$("#pStatus").value ||
      productStatus(product) ===
        $("#pStatus").value;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesSupplier &&
      matchesStatus
    );
  });

  const sort = $("#pSort").value;

  rows.sort((first, second) => {
    if (
      ["quantity", "cost", "price"].includes(
        sort,
      )
    ) {
      return (
        Number(first[sort]) -
        Number(second[sort])
      );
    }

    return String(first[sort]).localeCompare(
      String(second[sort]),
    );
  });

  if (!rows.length) {
    $("#productTable").innerHTML =
      empty("No products found");

    lucide.createIcons();
    return;
  }

  $("#productTable").innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Cost</th>
            <th>Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${rows
            .map(
              (product) => `
                <tr>
                  <td>
                    <div class="product-cell">
                      <img
                        class="thumb"
                        src="${
                          product.image ||
                          avatarData(product.name)
                        }"
                        alt="${safeText(product.name)}"
                      />

                      <b>${safeText(product.name)}</b>
                    </div>
                  </td>

                  <td>${safeText(product.sku)}</td>

                  <td>
                    ${safeText(
                      catName(product.category),
                    )}
                  </td>

                  <td>
                    ${product.quantity}
                    ${safeText(product.unit)}
                  </td>

                  <td>${money(product.cost)}</td>
                  <td>${money(product.price)}</td>

                  <td>
                    ${statusBadge(
                      productStatus(product),
                    )}
                  </td>

                  <td>
                    <div class="row-actions">
                      <button
                        class="icon-btn"
                        type="button"
                        title="View"
                        onclick="viewProduct('${product.id}')"
                      >
                        ${icon("eye")}
                      </button>

                      <button
                        class="icon-btn"
                        type="button"
                        title="Edit"
                        onclick="productForm('${product.id}')"
                      >
                        ${icon("pencil")}
                      </button>

                      <button
                        class="icon-btn"
                        type="button"
                        title="Delete"
                        onclick="deleteProduct('${product.id}')"
                      >
                        ${icon("trash-2")}
                      </button>
                    </div>
                  </td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  lucide.createIcons();
}

function productForm(id) {
  const product =
    state.products.find(
      (item) => item.id === id,
    ) || {
      name: "",
      sku: "",
      category: "",
      description: "",
      quantity: 0,
      unit: "Piece",
      cost: 0,
      price: 0,
      supplier: "",
      minimum: 0,
      dateAdded: today(),
      expiration: "",
      image: "",
      notes: "",
    };

  const supportedUnits = [
    "Piece",
    "Box",
    "Pack",
    "Bottle",
    "Sachet",
    "Kilogram",
    "Gram",
    "Liter",
    "Milliliter",
    "Ream",
  ];

  openModal(`
    <h2>${id ? "Edit" : "Add"} Product</h2>

    <form id="productForm">
      <div class="field-grid">
        <label>
          Product Name *

          <input
            name="name"
            required
            value="${safeText(product.name)}"
          />
        </label>

        <label>
          SKU / Product Code *

          <input
            name="sku"
            required
            value="${safeText(product.sku)}"
          />
        </label>

        <label>
          Category *

          <select name="category" required>
            <option value="">Choose...</option>

            ${opts(
              state.categories,
              product.category,
            )}
          </select>
        </label>

        <label>
          Supplier *

          <select name="supplier" required>
            <option value="">Choose...</option>

            ${opts(
              state.suppliers,
              product.supplier,
            )}
          </select>
        </label>

        <label>
          Current Quantity *

          <input
            name="quantity"
            type="number"
            min="0"
            required
            value="${product.quantity}"
          />
        </label>

        <label>
          Unit *

          <select name="unit">
            ${supportedUnits
              .map(
                (unit) => `
                  <option
                    ${unit === product.unit ? "selected" : ""}
                  >
                    ${unit}
                  </option>
                `,
              )
              .join("")}
          </select>
        </label>

        <label>
          Cost Per Unit *

          <input
            name="cost"
            type="number"
            min="0"
            step="0.01"
            required
            value="${product.cost}"
          />
        </label>

        <label>
          Selling Price *

          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            value="${product.price}"
          />
        </label>

        <label>
          Minimum Stock *

          <input
            name="minimum"
            type="number"
            min="0"
            required
            value="${product.minimum}"
          />
        </label>

        <label>
          Date Added *

          <input
            name="dateAdded"
            type="date"
            required
            value="${product.dateAdded}"
          />
        </label>

        <label>
          Expiration Date

          <input
            name="expiration"
            type="date"
            value="${product.expiration}"
          />
        </label>

        <label>
          Product Image

          <input
            id="productImage"
            type="file"
            accept="image/png,image/jpeg,image/webp"
          />
        </label>

        <label class="span-2">
          Description

          <textarea name="description">${safeText(
            product.description,
          )}</textarea>
        </label>

        <label class="span-2">
          Notes

          <textarea name="notes">${safeText(
            product.notes,
          )}</textarea>
        </label>
      </div>

      <div class="form-actions">
        <button
          type="button"
          class="secondary"
          data-close
        >
          Cancel
        </button>

        <button
          class="primary"
          type="submit"
        >
          Save Product
        </button>
      </div>
    </form>
  `);

  $("#productForm").onsubmit =
    async (event) => {
      event.preventDefault();

      const formData = new FormData(
        event.target,
      );

      const sku = formData
        .get("sku")
        .trim();

      const duplicateSku =
        state.products.some(
          (item) =>
            item.sku.toLowerCase() ===
              sku.toLowerCase() &&
            item.id !== id,
        );

      if (duplicateSku) {
        toast(
          "SKU already exists.",
          "error",
        );

        return;
      }

      const imageFile =
        $("#productImage").files[0];

      let image = product.image;

      if (imageFile) {
        const validImageTypes = [
          "image/jpeg",
          "image/png",
          "image/webp",
        ];

        if (
          !validImageTypes.includes(
            imageFile.type,
          ) ||
          imageFile.size > 500 * 1024
        ) {
          toast(
            "Use JPG, PNG, or WebP under 500 KB.",
            "error",
          );

          return;
        }

        image = await fileData(imageFile);
      }

      const productData = {
        ...product,
        id: id || uid("PRD"),
        name: formData
          .get("name")
          .trim(),
        sku,
        category:
          formData.get("category"),
        supplier:
          formData.get("supplier"),
        description: formData
          .get("description")
          .trim(),
        quantity: Number(
          formData.get("quantity"),
        ),
        unit: formData.get("unit"),
        cost: Number(
          formData.get("cost"),
        ),
        price: Number(
          formData.get("price"),
        ),
        minimum: Number(
          formData.get("minimum"),
        ),
        dateAdded:
          formData.get("dateAdded"),
        expiration:
          formData.get("expiration"),
        image,
        notes: formData
          .get("notes")
          .trim(),
      };

      if (id) {
        const productIndex =
          state.products.findIndex(
            (item) => item.id === id,
          );

        state.products[productIndex] =
          productData;
      } else {
        state.products.push(productData);
      }

      persist("products");
      closeModal();

      toast(
        `Product ${id ? "updated" : "added"}.`,
      );

      refresh();
    };
}

function fileData(file) {
  return new Promise(
    (resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result);
      };

      reader.onerror = reject;

      reader.readAsDataURL(file);
    },
  );
}

function viewProduct(id) {
  const product = state.products.find(
    (item) => item.id === id,
  );

  if (!product) {
    toast(
      "Product not found.",
      "error",
    );

    return;
  }

  const details = [
    ["Product ID", product.id],
    ["SKU", product.sku],
    [
      "Category",
      catName(product.category),
    ],
    [
      "Supplier",
      supName(product.supplier),
    ],
    [
      "Quantity",
      `${product.quantity} ${product.unit}`,
    ],
    ["Minimum", product.minimum],
    ["Cost", money(product.cost)],
    [
      "Selling Price",
      money(product.price),
    ],
    [
      "Status",
      productStatus(product),
    ],
    [
      "Date Added",
      formatDate(product.dateAdded),
    ],
    [
      "Expiration",
      formatDate(product.expiration),
    ],
    [
      "Description",
      product.description || "—",
    ],
    ["Notes", product.notes || "—"],
  ];

  openModal(`
    <h2>${safeText(product.name)}</h2>

    <div class="detail-list">
      ${details
        .map(
          (detail) => `
            <div>
              <span>${detail[0]}</span>
              <b>${safeText(detail[1])}</b>
            </div>
          `,
        )
        .join("")}
    </div>
  `);
}

function deleteProduct(id) {
  confirmAction(
    "Delete this product? Its transaction history will remain.",
    () => {
      state.products =
        state.products.filter(
          (product) => product.id !== id,
        );

      persist("products");

      toast("Product deleted.");

      refresh();
    },
  );
}

/* =========================================================
   STOCK IN AND STOCK OUT
========================================================= */

function renderStock(mode) {
  const incoming = mode === "in";

  content.innerHTML =
    pageHead(
      incoming ? "Stock In" : "Stock Out",
      incoming
        ? "Add received stock to a product"
        : "Remove stock from a product",
    ) +
    `
      <div
        class="panel"
        style="max-width: 800px;"
      >
        <form id="stockForm">
          <div class="field-grid">
            <label>
              Product *

              <select name="product" required>
                <option value="">
                  Choose product...
                </option>

                ${state.products
                  .map(
                    (product) => `
                      <option value="${product.id}">
                        ${safeText(product.name)}
                        (${product.quantity} ${product.unit})
                      </option>
                    `,
                  )
                  .join("")}
              </select>
            </label>

            <label>
              Quantity
              ${incoming ? "Received" : "Removed"} *

              <input
                name="quantity"
                type="number"
                min="1"
                required
              />
            </label>

            ${
              incoming
                ? `
                  <label>
                    Cost Per Unit *

                    <input
                      name="cost"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                    />
                  </label>

                  <label>
                    Supplier *

                    <select name="supplier" required>
                      <option value="">
                        Choose...
                      </option>

                      ${opts(state.suppliers)}
                    </select>
                  </label>
                `
                : `
                  <label>
                    Reason *

                    <select name="reason" required>
                      <option>Sold</option>
                      <option>Damaged</option>
                      <option>Expired</option>
                      <option>Returned to supplier</option>
                      <option>Used internally</option>
                      <option>Other</option>
                    </select>
                  </label>
                `
            }

            <label>
              Date *

              <input
                name="date"
                type="date"
                value="${today()}"
                required
              />
            </label>

            <label>
              Reference Number

              <input name="reference" />
            </label>

            <label class="span-2">
              Notes

              <textarea name="notes"></textarea>
            </label>
          </div>

          <div class="form-actions">
            <button
              class="primary"
              type="submit"
            >
              Record
              ${incoming ? "Stock In" : "Stock Out"}
            </button>
          </div>
        </form>
      </div>
    `;

  $("#stockForm").onsubmit = (event) => {
    event.preventDefault();

    const formData = new FormData(
      event.target,
    );

    const product =
      state.products.find(
        (item) =>
          item.id ===
          formData.get("product"),
      );

    const quantity = Number(
      formData.get("quantity"),
    );

    if (!product || quantity <= 0) {
      toast(
        "Enter a valid product and quantity.",
        "error",
      );

      return;
    }

    if (
      !incoming &&
      quantity > product.quantity
    ) {
      toast(
        `Only ${product.quantity} ${product.unit} available.`,
        "error",
      );

      return;
    }

    const quantityBefore =
      product.quantity;

    product.quantity = incoming
      ? quantityBefore + quantity
      : quantityBefore - quantity;

    if (incoming) {
      product.cost = Number(
        formData.get("cost"),
      );

      product.supplier =
        formData.get("supplier");
    }

    const selectedDate =
      formData.get("date");

    const currentTime = new Date()
      .toTimeString()
      .slice(0, 8);

    state.transactions.push({
      id: uid("TXN"),
      productId: product.id,
      productName: product.name,
      type: incoming
        ? "Stock In"
        : "Stock Out",
      quantity,
      before: quantityBefore,
      after: product.quantity,
      reason: incoming
        ? "Received"
        : formData.get("reason"),
      reference: formData
        .get("reference")
        .trim(),
      date: new Date(
        `${selectedDate}T${currentTime}`,
      ).toISOString(),
      notes: formData
        .get("notes")
        .trim(),
    });

    persist("products");
    persist("transactions");

    toast(
      "Stock movement recorded.",
    );

    event.target.reset();

    refresh();
  };
}

/* =========================================================
   CATEGORIES
========================================================= */

function renderCategories() {
  content.innerHTML =
    pageHead(
      "Categories",
      "Organize products into categories",
      `
        <button
          class="primary"
          id="addCategory"
          type="button"
        >
          ${icon("plus")}
          Add Category
        </button>
      `,
    ) +
    `
      <div class="panel">
        <div class="toolbar">
          <input
            id="cSearch"
            type="search"
            placeholder="Search categories"
          />
        </div>

        <div id="categoryTable"></div>
      </div>
    `;

  $("#addCategory").onclick = () => {
    categoryForm();
  };

  $("#cSearch").oninput =
    categoryTable;

  categoryTable();
}

function categoryTable() {
  const search =
    $("#cSearch").value.toLowerCase();

  const categories =
    state.categories.filter(
      (category) =>
        `${category.name} ${category.description}`
          .toLowerCase()
          .includes(search),
    );

  if (!categories.length) {
    $("#categoryTable").innerHTML =
      empty("No categories found");

    lucide.createIcons();
    return;
  }

  $("#categoryTable").innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Description</th>
            <th>Products</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${categories
            .map(
              (category) => `
                <tr>
                  <td>${category.id}</td>

                  <td>
                    <b>${safeText(category.name)}</b>
                  </td>

                  <td>
                    ${safeText(category.description)}
                  </td>

                  <td>
                    ${
                      state.products.filter(
                        (product) =>
                          product.category ===
                          category.id,
                      ).length
                    }
                  </td>

                  <td>
                    <div class="row-actions">
                      <button
                        class="icon-btn"
                        type="button"
                        title="Edit"
                        onclick="categoryForm('${category.id}')"
                      >
                        ${icon("pencil")}
                      </button>

                      <button
                        class="icon-btn"
                        type="button"
                        title="Delete"
                        onclick="deleteCategory('${category.id}')"
                      >
                        ${icon("trash-2")}
                      </button>
                    </div>
                  </td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  lucide.createIcons();
}

function categoryForm(id) {
  const category =
    state.categories.find(
      (item) => item.id === id,
    ) || {
      name: "",
      description: "",
    };

  openModal(`
    <h2>
      ${id ? "Edit" : "Add"} Category
    </h2>

    <form id="categoryForm">
      <label>
        Name *

        <input
          name="name"
          required
          value="${safeText(category.name)}"
        />
      </label>

      <label>
        Description

        <textarea name="description">${safeText(
          category.description,
        )}</textarea>
      </label>

      <div class="form-actions">
        <button
          type="button"
          class="secondary"
          data-close
        >
          Cancel
        </button>

        <button
          class="primary"
          type="submit"
        >
          Save
        </button>
      </div>
    </form>
  `);

  $("#categoryForm").onsubmit = (
    event,
  ) => {
    event.preventDefault();

    const formData = new FormData(
      event.target,
    );

    const name = formData
      .get("name")
      .trim();

    const duplicateName =
      state.categories.some(
        (item) =>
          item.name.toLowerCase() ===
            name.toLowerCase() &&
          item.id !== id,
      );

    if (duplicateName) {
      toast(
        "Category name already exists.",
        "error",
      );

      return;
    }

    const categoryData = {
      id: id || uid("CAT"),
      name,
      description: formData
        .get("description")
        .trim(),
    };

    if (id) {
      const categoryIndex =
        state.categories.findIndex(
          (item) => item.id === id,
        );

      state.categories[categoryIndex] =
        categoryData;
    } else {
      state.categories.push(categoryData);
    }

    persist("categories");
    closeModal();

    toast("Category saved.");

    refresh();
  };
}

function deleteCategory(id) {
  const categoryIsUsed =
    state.products.some(
      (product) =>
        product.category === id,
    );

  if (categoryIsUsed) {
    toast(
      "Reassign products before deleting this category.",
      "error",
    );

    return;
  }

  confirmAction(
    "Delete this category?",
    () => {
      state.categories =
        state.categories.filter(
          (category) =>
            category.id !== id,
        );

      persist("categories");

      toast("Category deleted.");

      refresh();
    },
  );
}

/* =========================================================
   SUPPLIERS
========================================================= */

function renderSuppliers() {
  content.innerHTML =
    pageHead(
      "Suppliers",
      "Manage supplier records",
      `
        <button
          class="primary"
          id="addSupplier"
          type="button"
        >
          ${icon("plus")}
          Add Supplier
        </button>
      `,
    ) +
    `
      <div class="panel">
        <div class="toolbar">
          <input
            id="sSearch"
            type="search"
            placeholder="Search suppliers"
          />
        </div>

        <div id="supplierTable"></div>
      </div>
    `;

  $("#addSupplier").onclick = () => {
    supplierForm();
  };

  $("#sSearch").oninput =
    supplierTable;

  supplierTable();
}

function supplierTable() {
  const search =
    $("#sSearch").value.toLowerCase();

  const suppliers =
    state.suppliers.filter((supplier) =>
      Object.values(supplier)
        .join(" ")
        .toLowerCase()
        .includes(search),
    );

  if (!suppliers.length) {
    $("#supplierTable").innerHTML =
      empty("No suppliers found");

    lucide.createIcons();
    return;
  }

  $("#supplierTable").innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Supplier</th>
            <th>Contact</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${suppliers
            .map(
              (supplier) => `
                <tr>
                  <td>
                    <b>${safeText(supplier.name)}</b>
                    <br />
                    <small>${supplier.id}</small>
                  </td>

                  <td>
                    ${safeText(supplier.contact)}
                  </td>

                  <td>
                    ${safeText(supplier.phone)}
                  </td>

                  <td>
                    ${safeText(supplier.email)}
                  </td>

                  <td>
                    ${statusBadge(supplier.status)}
                  </td>

                  <td>
                    <div class="row-actions">
                      <button
                        class="icon-btn"
                        type="button"
                        title="View"
                        onclick="viewSupplier('${supplier.id}')"
                      >
                        ${icon("eye")}
                      </button>

                      <button
                        class="icon-btn"
                        type="button"
                        title="Edit"
                        onclick="supplierForm('${supplier.id}')"
                      >
                        ${icon("pencil")}
                      </button>

                      <button
                        class="icon-btn"
                        type="button"
                        title="Delete"
                        onclick="deleteSupplier('${supplier.id}')"
                      >
                        ${icon("trash-2")}
                      </button>
                    </div>
                  </td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  lucide.createIcons();
}

function supplierForm(id) {
  const supplier =
    state.suppliers.find(
      (item) => item.id === id,
    ) || {
      name: "",
      contact: "",
      phone: "",
      email: "",
      address: "",
      products: "",
      notes: "",
      status: "Active",
    };

  openModal(`
    <h2>
      ${id ? "Edit" : "Add"} Supplier
    </h2>

    <form id="supplierForm">
      <div class="field-grid">
        <label>
          Supplier Name *

          <input
            name="name"
            required
            value="${safeText(supplier.name)}"
          />
        </label>

        <label>
          Contact Person *

          <input
            name="contact"
            required
            value="${safeText(supplier.contact)}"
          />
        </label>

        <label>
          Phone Number *

          <input
            name="phone"
            required
            value="${safeText(supplier.phone)}"
          />
        </label>

        <label>
          Email Address *

          <input
            name="email"
            type="email"
            required
            value="${safeText(supplier.email)}"
          />
        </label>

        <label class="span-2">
          Business Address *

          <input
            name="address"
            required
            value="${safeText(supplier.address)}"
          />
        </label>

        <label>
          Products Supplied

          <input
            name="products"
            value="${safeText(supplier.products)}"
          />
        </label>

        <label>
          Status

          <select name="status">
            <option
              ${
                supplier.status === "Active"
                  ? "selected"
                  : ""
              }
            >
              Active
            </option>

            <option
              ${
                supplier.status === "Inactive"
                  ? "selected"
                  : ""
              }
            >
              Inactive
            </option>
          </select>
        </label>

        <label class="span-2">
          Notes

          <textarea name="notes">${safeText(
            supplier.notes,
          )}</textarea>
        </label>
      </div>

      <div class="form-actions">
        <button
          type="button"
          class="secondary"
          data-close
        >
          Cancel
        </button>

        <button
          class="primary"
          type="submit"
        >
          Save
        </button>
      </div>
    </form>
  `);

  $("#supplierForm").onsubmit = (
    event,
  ) => {
    event.preventDefault();

    const formData =
      Object.fromEntries(
        new FormData(event.target),
      );

    const supplierData = {
      ...formData,
      id: id || uid("SUP"),
    };

    if (id) {
      const supplierIndex =
        state.suppliers.findIndex(
          (item) => item.id === id,
        );

      state.suppliers[supplierIndex] =
        supplierData;
    } else {
      state.suppliers.push(supplierData);
    }

    persist("suppliers");
    closeModal();

    toast("Supplier saved.");

    refresh();
  };
}

function viewSupplier(id) {
  const supplier =
    state.suppliers.find(
      (item) => item.id === id,
    );

  if (!supplier) {
    toast(
      "Supplier not found.",
      "error",
    );

    return;
  }

  openModal(`
    <h2>${safeText(supplier.name)}</h2>

    <div class="detail-list">
      ${Object.entries(supplier)
        .map(
          ([key, value]) => `
            <div>
              <span>
                ${safeText(
                  key.replace(
                    /([A-Z])/g,
                    " $1",
                  ),
                )}
              </span>

              <b>
                ${safeText(value || "—")}
              </b>
            </div>
          `,
        )
        .join("")}
    </div>
  `);
}

function deleteSupplier(id) {
  const supplierIsUsed =
    state.products.some(
      (product) =>
        product.supplier === id,
    );

  const message = supplierIsUsed
    ? "This supplier is assigned to products. Deleting it will leave those products unassigned. Continue?"
    : "Delete this supplier?";

  confirmAction(message, () => {
    state.suppliers =
      state.suppliers.filter(
        (supplier) =>
          supplier.id !== id,
      );

    if (supplierIsUsed) {
      state.products.forEach(
        (product) => {
          if (product.supplier === id) {
            product.supplier = "";
          }
        },
      );

      persist("products");
    }

    persist("suppliers");

    toast("Supplier deleted.");

    refresh();
  });
}

/* =========================================================
   TRANSACTION HISTORY
========================================================= */

function renderTransactions() {
  content.innerHTML =
    pageHead(
      "Transaction History",
      "Permanent stock movement records",
    ) +
    `
      <div class="panel">
        <div class="toolbar">
          <input
            id="tSearch"
            type="search"
            placeholder="Search product or reference"
          />

          <select id="tType">
            <option value="">All types</option>
            <option>Stock In</option>
            <option>Stock Out</option>
          </select>

          <select id="tProduct">
            <option value="">All products</option>

            ${state.products
              .map(
                (product) => `
                  <option value="${product.id}">
                    ${safeText(product.name)}
                  </option>
                `,
              )
              .join("")}
          </select>

          <input
            id="tFrom"
            type="date"
            title="From"
          />

          <input
            id="tTo"
            type="date"
            title="To"
          />

          <select id="tSort">
            <option value="new">
              Newest first
            </option>

            <option value="old">
              Oldest first
            </option>

            <option value="qty">
              Highest quantity
            </option>
          </select>
        </div>

        <div id="txnTable"></div>
      </div>
    `;

  [
    "tSearch",
    "tType",
    "tProduct",
    "tFrom",
    "tTo",
    "tSort",
  ].forEach((id) => {
    $(`#${id}`).oninput =
      transactionTable;
  });

  transactionTable();
}

function transactionTable() {
  let rows = [...state.transactions];

  const search =
    $("#tSearch").value.toLowerCase();

  const fromDate = $("#tFrom").value;
  const toDate = $("#tTo").value;

  rows = rows.filter((transaction) => {
    const searchableText = `
      ${transaction.productName}
      ${transaction.reference}
      ${transaction.id}
    `.toLowerCase();

    const matchesSearch =
      searchableText.includes(search);

    const matchesType =
      !$("#tType").value ||
      transaction.type ===
        $("#tType").value;

    const matchesProduct =
      !$("#tProduct").value ||
      transaction.productId ===
        $("#tProduct").value;

    const matchesFromDate =
      !fromDate ||
      transaction.date.slice(0, 10) >=
        fromDate;

    const matchesToDate =
      !toDate ||
      transaction.date.slice(0, 10) <=
        toDate;

    return (
      matchesSearch &&
      matchesType &&
      matchesProduct &&
      matchesFromDate &&
      matchesToDate
    );
  });

  const sort = $("#tSort").value;

  rows.sort((first, second) => {
    if (sort === "qty") {
      return (
        second.quantity -
        first.quantity
      );
    }

    if (sort === "old") {
      return (
        new Date(first.date) -
        new Date(second.date)
      );
    }

    return (
      new Date(second.date) -
      new Date(first.date)
    );
  });

  if (!rows.length) {
    $("#txnTable").innerHTML =
      empty("No transactions found");

    lucide.createIcons();
    return;
  }

  $("#txnTable").innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Product</th>
            <th>Type</th>
            <th>Quantity</th>
            <th>Before → After</th>
            <th>Reason</th>
            <th>Date</th>
            <th>Details</th>
          </tr>
        </thead>

        <tbody>
          ${rows
            .map((transaction) => {
              const badgeStatus =
                transaction.type === "Stock In"
                  ? "Available"
                  : "Low Stock";

              const badge = statusBadge(
                badgeStatus,
              ).replace(
                badgeStatus,
                transaction.type,
              );

              return `
                <tr>
                  <td>${transaction.id}</td>

                  <td>
                    ${safeText(
                      transaction.productName,
                    )}
                  </td>

                  <td>${badge}</td>

                  <td>
                    ${transaction.quantity}
                  </td>

                  <td>
                    ${transaction.before}
                    →
                    ${transaction.after}
                  </td>

                  <td>
                    ${safeText(
                      transaction.reason,
                    )}
                  </td>

                  <td>
                    ${formatDate(
                      transaction.date,
                      true,
                    )}
                  </td>

                  <td>
                    <button
                      class="icon-btn"
                      type="button"
                      title="View details"
                      onclick="viewTransaction('${transaction.id}')"
                    >
                      ${icon("eye")}
                    </button>
                  </td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  lucide.createIcons();
}

function viewTransaction(id) {
  const transaction =
    state.transactions.find(
      (item) => item.id === id,
    );

  if (!transaction) {
    toast(
      "Transaction not found.",
      "error",
    );

    return;
  }

  openModal(`
    <h2>Transaction Details</h2>

    <div class="detail-list">
      ${Object.entries(transaction)
        .map(([key, value]) => {
          const displayedValue =
            key === "date"
              ? formatDate(value, true)
              : value;

          return `
            <div>
              <span>
                ${safeText(
                  key.replace(
                    /([A-Z])/g,
                    " $1",
                  ),
                )}
              </span>

              <b>
                ${safeText(displayedValue)}
              </b>
            </div>
          `;
        })
        .join("")}
    </div>
  `);
}

/* =========================================================
   REPORTS
========================================================= */

const REPORTS = {
  inventory: "Complete Inventory",
  low: "Low Stock",
  out: "Out of Stock",
  expired: "Expired Products",
  near: "Nearing Expiration",
  stockin: "Stock In",
  stockout: "Stock Out",
  valuation: "Inventory Valuation",
  suppliers: "Supplier",
};

function renderReports() {
  content.innerHTML =
    pageHead(
      "Reports",
      "Filter, print, and export inventory information",
      `
        <button
          class="secondary"
          type="button"
          onclick="window.print()"
        >
          ${icon("printer")}
          Print
        </button>

        <button
          class="secondary"
          id="csvBtn"
          type="button"
        >
          ${icon("file-down")}
          Export CSV
        </button>

        <button
          class="primary"
          type="button"
          onclick="downloadBackup()"
        >
          ${icon("download")}
          JSON Backup
        </button>
      `,
    ) +
    `
      <div class="panel">
        <div class="toolbar no-print">
          <select id="reportType">
            ${Object.entries(REPORTS)
              .map(
                ([value, label]) => `
                  <option value="${value}">
                    ${label} Report
                  </option>
                `,
              )
              .join("")}
          </select>

          <select id="rCat">
            <option value="">
              All categories
            </option>

            ${opts(state.categories)}
          </select>

          <select id="rSup">
            <option value="">
              All suppliers
            </option>

            ${opts(state.suppliers)}
          </select>

          <select id="rStatus">
            <option value="">
              All statuses
            </option>

            <option>Available</option>
            <option>Low Stock</option>
            <option>Out of Stock</option>
            <option>Expired</option>
          </select>

          <input
            id="rFrom"
            type="date"
            title="From date"
          />

          <input
            id="rTo"
            type="date"
            title="To date"
          />
        </div>

        <div id="reportTable"></div>
      </div>
    `;

  [
    "reportType",
    "rCat",
    "rSup",
    "rStatus",
    "rFrom",
    "rTo",
  ].forEach((id) => {
    $(`#${id}`).oninput =
      reportTable;
  });

  $("#csvBtn").onclick =
    exportReportCSV;

  reportTable();
}

function reportRows() {
  const reportType =
    $("#reportType").value;

  const fromDate = $("#rFrom").value;
  const toDate = $("#rTo").value;

  if (
    reportType === "stockin" ||
    reportType === "stockout"
  ) {
    const transactionType =
      reportType === "stockin"
        ? "Stock In"
        : "Stock Out";

    return state.transactions
      .filter(
        (transaction) =>
          transaction.type ===
            transactionType &&
          (!fromDate ||
            transaction.date.slice(
              0,
              10,
            ) >= fromDate) &&
          (!toDate ||
            transaction.date.slice(
              0,
              10,
            ) <= toDate),
      )
      .map((transaction) => ({
        ID: transaction.id,
        Product:
          transaction.productName,
        Type: transaction.type,
        Quantity:
          transaction.quantity,
        Before: transaction.before,
        After: transaction.after,
        Reason: transaction.reason,
        Reference:
          transaction.reference,
        Date: formatDate(
          transaction.date,
          true,
        ),
      }));
  }

  if (reportType === "suppliers") {
    return state.suppliers.map(
      (supplier) => ({
        ID: supplier.id,
        Supplier: supplier.name,
        Contact: supplier.contact,
        Phone: supplier.phone,
        Email: supplier.email,
        Address: supplier.address,
        Status: supplier.status,
      }),
    );
  }

  let rows = state.products.filter(
    (product) => {
      const matchesCategory =
        !$("#rCat").value ||
        product.category ===
          $("#rCat").value;

      const matchesSupplier =
        !$("#rSup").value ||
        product.supplier ===
          $("#rSup").value;

      const matchesStatus =
        !$("#rStatus").value ||
        productStatus(product) ===
          $("#rStatus").value;

      return (
        matchesCategory &&
        matchesSupplier &&
        matchesStatus
      );
    },
  );

  if (reportType === "low") {
    rows = rows.filter(
      (product) =>
        productStatus(product) ===
        "Low Stock",
    );
  }

  if (reportType === "out") {
    rows = rows.filter(
      (product) =>
        productStatus(product) ===
        "Out of Stock",
    );
  }

  if (reportType === "expired") {
    rows = rows.filter(
      (product) =>
        productStatus(product) ===
        "Expired",
    );
  }

  if (reportType === "near") {
    rows = rows.filter((product) => {
      if (!product.expiration) {
        return false;
      }

      const remainingDays =
        (new Date(product.expiration) -
          new Date()) /
        86400000;

      return (
        product.expiration >= today() &&
        remainingDays <= 30
      );
    });
  }

  return rows.map((product) => ({
    ID: product.id,
    Product: product.name,
    SKU: product.sku,
    Category: catName(
      product.category,
    ),
    Supplier: supName(
      product.supplier,
    ),
    Quantity: product.quantity,
    Unit: product.unit,
    Cost: product.cost,
    Price: product.price,
    Status: productStatus(product),
    Expiration:
      product.expiration || "",
    Value: (
      product.quantity *
      product.cost
    ).toFixed(2),
  }));
}

function reportTable() {
  const rows = reportRows();

  const reportName =
    REPORTS[$("#reportType").value];

  if (!rows.length) {
    $("#reportTable").innerHTML = `
      <h2>${reportName} Report</h2>

      <p class="report-summary">
        Generated
        ${formatDate(
          new Date().toISOString(),
          true,
        )}
        • 0 record(s)
      </p>

      ${empty(
        "No data matches this report",
      )}
    `;

    lucide.createIcons();
    return;
  }

  const columns = Object.keys(rows[0]);

  $("#reportTable").innerHTML = `
    <h2>${reportName} Report</h2>

    <p class="report-summary">
      Generated
      ${formatDate(
        new Date().toISOString(),
        true,
      )}
      • ${rows.length} record(s)
    </p>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            ${columns
              .map(
                (column) =>
                  `<th>${column}</th>`,
              )
              .join("")}
          </tr>
        </thead>

        <tbody>
          ${rows
            .map(
              (row) => `
                <tr>
                  ${columns
                    .map(
                      (column) => `
                        <td>
                          ${safeText(
                            row[column],
                          )}
                        </td>
                      `,
                    )
                    .join("")}
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  lucide.createIcons();
}

function exportReportCSV() {
  const rows = reportRows();

  if (!rows.length) {
    toast(
      "No report data to export.",
      "warning",
    );

    return;
  }

  const columns = Object.keys(rows[0]);

  const escapeCsvValue = (value) =>
    `"${String(value ?? "").replaceAll(
      '"',
      '""',
    )}"`;

  const csv = [
    columns
      .map(escapeCsvValue)
      .join(","),

    ...rows.map((row) =>
      columns
        .map((column) =>
          escapeCsvValue(row[column]),
        )
        .join(","),
    ),
  ].join("\n");

  const reportType =
    $("#reportType").value;

  downloadBlob(
    csv,
    `${reportType}-report.csv`,
    "text/csv",
  );
}

/* =========================================================
   BACKUP AND FILE DOWNLOADS
========================================================= */

function backup() {
  return {
    version: 1,
    exportedAt:
      new Date().toISOString(),
    products: state.products,
    categories: state.categories,
    suppliers: state.suppliers,
    transactions:
      state.transactions,
    settings: getSettings(),
    theme:
      localStorage.getItem(
        KEYS.theme,
      ) || "light",
  };
}

function downloadBackup() {
  const backupData = JSON.stringify(
    backup(),
    null,
    2,
  );

  downloadBlob(
    backupData,
    `inventory-backup-${today()}.json`,
    "application/json",
  );
}

function downloadBlob(
  data,
  filename,
  type,
) {
  const blob = new Blob([data], {
    type,
  });

  const objectUrl =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = objectUrl;
  link.download = filename;

  document.body.append(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(objectUrl);
}

/* =========================================================
   SETTINGS
========================================================= */

function renderSettings() {
  const settings = getSettings();

  content.innerHTML =
    pageHead(
      "Settings",
      "Customize and protect your local inventory",
    ) +
    `
      <div
        class="panel"
        style="max-width: 850px;"
      >
        <form id="settingsForm">
          <div class="settings-profile">
            <img
              class="avatar"
              src="${
                settings.profile ||
                avatarData(
                  settings.adminName,
                )
              }"
              alt="Administrator profile"
            />

            <label>
              Profile Picture

              <input
                id="profileInput"
                type="file"
                accept="image/png,image/jpeg,image/webp"
              />
            </label>
          </div>

          <div
            class="field-grid"
            style="margin-top: 18px;"
          >
            <label>
              Business Name *

              <input
                name="businessName"
                required
                value="${safeText(
                  settings.businessName,
                )}"
              />
            </label>

            <label>
              Administrator Name *

              <input
                name="adminName"
                required
                value="${safeText(
                  settings.adminName,
                )}"
              />
            </label>

            <label>
              Username *

              <input
                name="username"
                required
                value="${safeText(
                  settings.username,
                )}"
              />
            </label>

            <label>
              New Password

              <input
                name="password"
                type="password"
                minlength="6"
                placeholder="Leave blank to keep current"
              />
            </label>

            <label>
              Preferred Currency

              <select name="currency">
                ${[
                  "PHP",
                  "USD",
                  "EUR",
                  "JPY",
                  "SGD",
                ]
                  .map(
                    (currency) => `
                      <option
                        ${
                          currency ===
                          settings.currency
                            ? "selected"
                            : ""
                        }
                      >
                        ${currency}
                      </option>
                    `,
                  )
                  .join("")}
              </select>
            </label>

            <label>
              Theme

              <select name="theme">
                <option value="light">
                  Light
                </option>

                <option
                  value="dark"
                  ${
                    document.body.classList.contains(
                      "dark",
                    )
                      ? "selected"
                      : ""
                  }
                >
                  Dark
                </option>
              </select>
            </label>
          </div>

          <div class="form-actions">
            <button
              class="primary"
              type="submit"
            >
              Save Settings
            </button>
          </div>
        </form>

        <hr
          style="
            border: 0;
            border-top: 1px solid var(--border);
            margin: 25px 0;
          "
        />

        <div class="actions">
          <button
            class="secondary"
            type="button"
            onclick="downloadBackup()"
          >
            ${icon("download")}
            Export Backup
          </button>

          <button
            class="secondary"
            type="button"
            onclick="$('#importFile').click()"
          >
            ${icon("upload")}
            Import Backup
          </button>

          <button
            class="danger"
            id="resetBtn"
            type="button"
          >
            ${icon("trash-2")}
            Reset System
          </button>
        </div>
      </div>
    `;

  $("#settingsForm").onsubmit =
    async (event) => {
      event.preventDefault();

      const formData = new FormData(
        event.target,
      );

      const profileFile =
        $("#profileInput").files[0];

      let profile =
        settings.profile;

      if (profileFile) {
        const validImageTypes = [
          "image/jpeg",
          "image/png",
          "image/webp",
        ];

        if (
          !validImageTypes.includes(
            profileFile.type,
          ) ||
          profileFile.size >
            500 * 1024
        ) {
          toast(
            "Use JPG, PNG, or WebP under 500 KB.",
            "error",
          );

          return;
        }

        profile =
          await fileData(profileFile);
      }

      const updatedSettings = {
        businessName: formData
          .get("businessName")
          .trim(),
        adminName: formData
          .get("adminName")
          .trim(),
        username: formData
          .get("username")
          .trim(),
        password:
          formData.get("password") ||
          settings.password,
        currency:
          formData.get("currency"),
        profile,
      };

      saveStore(
        KEYS.settings,
        updatedSettings,
      );

      setTheme(
        formData.get("theme"),
      );

      toast("Settings saved.");

      refresh();
    };

  $("#resetBtn").onclick = () => {
    confirmAction(
      "WARNING: This permanently deletes all products, suppliers, categories, transactions, and settings. Export a backup first. Reset now?",
      () => {
        Object.values(KEYS).forEach(
          (key) => {
            localStorage.removeItem(key);
          },
        );

        window.location.replace(
          "login.html",
        );
      },
    );
  };
}

function importBackup(file) {
  const reader = new FileReader();

  reader.onload = () => {
    try {
      const data = JSON.parse(
        reader.result,
      );

      const validBackup =
        data &&
        Array.isArray(data.products) &&
        Array.isArray(data.categories) &&
        Array.isArray(data.suppliers) &&
        Array.isArray(
          data.transactions,
        ) &&
        data.settings &&
        typeof data.settings ===
          "object";

      if (!validBackup) {
        throw new Error(
          "Invalid backup structure.",
        );
      }

      confirmAction(
        "Replace all current system data with this valid backup?",
        () => {
          saveStore(
            KEYS.products,
            data.products,
          );

          saveStore(
            KEYS.categories,
            data.categories,
          );

          saveStore(
            KEYS.suppliers,
            data.suppliers,
          );

          saveStore(
            KEYS.transactions,
            data.transactions,
          );

          saveStore(
            KEYS.settings,
            data.settings,
          );

          localStorage.setItem(
            KEYS.theme,
            data.theme === "dark"
              ? "dark"
              : "light",
          );

          localStorage.setItem(
            KEYS.initialized,
            "true",
          );

          toast(
            "Backup imported successfully.",
          );

          refresh();
          applyTheme();
        },
      );
    } catch (error) {
      console.error(
        "Backup import failed:",
        error,
      );

      toast(
        "Invalid backup file. Current data was not changed.",
        "error",
      );
    }
  };

  reader.readAsText(file);
}

/* =========================================================
   THEME
========================================================= */

function setTheme(theme) {
  localStorage.setItem(
    KEYS.theme,
    theme,
  );

  applyTheme();
}

function applyTheme() {
  const darkMode =
    localStorage.getItem(
      KEYS.theme,
    ) === "dark";

  document.body.classList.toggle(
    "dark",
    darkMode,
  );

  $("#themeBtn").innerHTML = icon(
    darkMode ? "sun" : "moon",
  );

  lucide.createIcons();
}

/* =========================================================
   SIDEBAR NAVIGATION
========================================================= */

$("#nav").innerHTML = NAV.map(
  ([page, iconName, label]) => `
    <button
      class="nav-btn"
      type="button"
      data-page="${page}"
    >
      ${icon(iconName)}
      <span>${label}</span>
    </button>
  `,
).join("");

$("#nav").onclick = (event) => {
  const button =
    event.target.closest(".nav-btn");

  if (!button) {
    return;
  }

  if (
    button.dataset.page === "signout"
  ) {
    confirmAction(
      "Sign out of the system?",
      signOut,
    );

    return;
  }

  state.page = button.dataset.page;

  render();

  $("#sidebar").classList.remove(
    "open",
  );

  $("#overlay").classList.remove(
    "show",
  );
};

/* =========================================================
   MOBILE SIDEBAR
========================================================= */

$("#menuBtn").onclick = () => {
  $("#sidebar").classList.toggle(
    "open",
  );

  $("#overlay").classList.toggle(
    "show",
  );
};

$("#overlay").onclick = () => {
  $("#sidebar").classList.remove(
    "open",
  );

  $("#overlay").classList.remove(
    "show",
  );
};

/* =========================================================
   MODAL EVENTS
========================================================= */

$("#modal").onclick = (event) => {
  const clickedModalBackground =
    event.target.matches("#modal");

  const clickedCloseButton =
    event.target.matches(
      "[data-close]",
    ) ||
    event.target.closest(
      "[data-close]",
    );

  if (
    clickedModalBackground ||
    clickedCloseButton
  ) {
    closeModal();
  }
};

/* =========================================================
   HEADER EVENTS
========================================================= */

$("#themeBtn").onclick = () => {
  const nextTheme =
    document.body.classList.contains(
      "dark",
    )
      ? "light"
      : "dark";

  setTheme(nextTheme);
};

$("#globalSearch").onkeydown = (
  event,
) => {
  if (event.key !== "Enter") {
    return;
  }

  state.page = "products";

  render();

  $("#pSearch").value =
    event.target.value;

  productTable();
};

/* =========================================================
   BACKUP IMPORT
========================================================= */

$("#importFile").onchange = (
  event,
) => {
  const file =
    event.target.files[0];

  if (file) {
    importBackup(file);
  }

  event.target.value = "";
};

/* =========================================================
   INITIALIZE APPLICATION
========================================================= */

applyTheme();
load();
updateChrome();
render();