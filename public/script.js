// State Aplikasi
let listPerusahaan = [];
let deleteTargetId = null;

// Filter, Sort & Pagination State
let searchTerm = "";
let selectedWilayah = "";
let sortOption = ""; // Format: okt-desc, okt-asc, etc.
let currentPage = 1;
const itemsPerPage = 10;

// DOM Elements
const currentDateInfo = document.getElementById('current-date-info');

// Cards DOM
const cardTotalPerusahaan = document.getElementById('card-total-perusahaan');
const cardAsetOktober = document.getElementById('card-aset-oktober');
const cardAsetNovember = document.getElementById('card-aset-november');
const cardAsetDesember = document.getElementById('card-aset-desember');
const cardTotalKantor = document.getElementById('card-total-kantor');
const cardRataRataAset = document.getElementById('card-rata-rata-aset');

// Table & Control DOM
const tableBody = document.getElementById('table-body');
const filterSearch = document.getElementById('filter-search');
const filterWilayah = document.getElementById('filter-wilayah');
const sortAset = document.getElementById('sort-aset');
const paginationInfo = document.getElementById('pagination-info');
const paginationControls = document.getElementById('pagination-controls');

// Form Input DOM
const formTitle = document.getElementById('form-title');
const formPerusahaan = document.getElementById('form-perusahaan');
const formId = document.getElementById('form-id');
const formPerusahaanName = document.getElementById('form-perusahaan-name');
const formWilayah = document.getElementById('form-wilayah');
const formAsetOktober = document.getElementById('form-aset-oktober');
const formAsetNovember = document.getElementById('form-aset-november');
const formAsetDesember = document.getElementById('form-aset-desember');
const formJumlahKantor = document.getElementById('form-jumlah-kantor');
const formError = document.getElementById('form-error');

// Form Buttons DOM
const btnSubmitSimpan = document.getElementById('btn-submit-simpan');
const btnSubmitUpdate = document.getElementById('btn-submit-update');
const btnReset = document.getElementById('btn-reset');

// Modal Confirm DOM
const modalConfirm = document.getElementById('modal-confirm');
const btnCancelDelete = document.getElementById('btn-cancel-delete');
const btnConfirmDelete = document.getElementById('btn-confirm-delete');

// --- Helper Functions ---

// Memformat angka ke format mata uang Rupiah
function formatRupiah(value) {
  const formatter = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  return 'Rp ' + formatter.format(value);
}

function hitungGrowth(awal, akhir) {
  awal = Number(awal) || 0;
  akhir = Number(akhir) || 0;

  if (awal === 0) return null;

  return ((akhir - awal) / awal) * 100;
}

function kategoriGrowth(growth) {

  if (growth === null) return "-";

  if (growth > 5) return "Sangat Baik";

  if (growth >= 2) return "Baik";

  if (growth >= 0) return "Stabil";

  return "Menurun";

}

// Menghapus karakter non-digit untuk konversi input ke angka
function cleanNumber(str) {
  if (!str) return 0;
  return parseInt(str.toString().replace(/\D/g, '')) || 0;
}

// Mengatur format ribuan otomatis pada input aset saat mengetik
function setupCurrencyInput(inputEl) {
  inputEl.addEventListener('input', (e) => {
    let clean = cleanNumber(e.target.value);
    if (clean === 0) {
      e.target.value = '';
    } else {
      e.target.value = new Intl.NumberFormat('id-ID').format(clean);
    }
  });
}

// Update tanggal hari ini di topbar
function updateDateDisplay() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const today = new Date();
  currentDateInfo.textContent = today.toLocaleDateString('id-ID', options);
}

// --- Modals Controller ---
function showModal(modalEl) {
  modalEl.classList.remove('pointer-events-none');
  modalEl.classList.remove('opacity-0');
  const box = modalEl.firstElementChild;
  if (box) {
    box.classList.remove('scale-95');
    box.classList.add('scale-100');
  }
}

function hideModal(modalEl) {
  modalEl.classList.add('pointer-events-none');
  modalEl.classList.add('opacity-0');
  const box = modalEl.firstElementChild;
  if (box) {
    box.classList.remove('scale-100');
    box.classList.add('scale-95');
  }
}

// --- API Calls & Core Actions ---

// Fetch data dari server
async function fetchPerusahaan() {
  try {
    tableBody.innerHTML = `<tr><td colspan="8" class="py-8 text-center text-slate-400 font-semibold"><span class="inline-block animate-spin mr-2 border-2 border-t-blue-600 border-slate-200 w-4 h-4 rounded-full"></span>Memproses data...</td></tr>`;
    const res = await fetch('/api/perusahaan');
    if (!res.ok) throw new Error("Gagal memuat data dari database");
    listPerusahaan = await res.json();
    
    // Perbarui dropdown filter wilayah secara dinamis
    populateWilayahDropdown();
    
    // Render Dashboard dan Data Tabel
    renderDashboard();
    renderProcessedData();
  } catch (err) {
    console.error(err);
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="py-8 text-center text-red-500 font-semibold">
          <p class="mb-2">Gagal menyambung ke server database.</p>
          <button onclick="fetchPerusahaan()" class="px-4 py-2 bg-blue-600 hover:bg-blue-750 text-white rounded-lg text-xs font-bold transition-all shadow-md">Coba Lagi</button>
        </td>
      </tr>`;
  }
}

// Isi opsi filter wilayah berdasarkan database secara dinamis
function populateWilayahDropdown() {
  const currentSelected = filterWilayah.value;
  const wilayahSet = new Set();
  
  listPerusahaan.forEach(p => {
    if (p.wilayah && p.wilayah.trim()) {
      wilayahSet.add(p.wilayah.trim());
    }
  });

  const sortedWilayah = Array.from(wilayahSet).sort();
  
  filterWilayah.innerHTML = '<option value="">Semua Wilayah</option>' + 
    sortedWilayah.map(w => `<option value="${w}">${w}</option>`).join('');

  // Kembalikan seleksi jika wilayah tersebut masih ada
  if (wilayahSet.has(currentSelected)) {
    filterWilayah.value = currentSelected;
  } else {
    selectedWilayah = "";
    filterWilayah.value = "";
  }
}

// Hitung data dan render Dashboard Cards
function renderDashboard() {
  const totalPerusahaan = listPerusahaan.length;
  
  let totalOkt = 0;
  let totalNov = 0;
  let totalDes = 0;
  let totalKantor = 0;

  listPerusahaan.forEach(p => {
    totalOkt += Number(p.asetOktober) || 0;
    totalNov += Number(p.asetNovember) || 0;
    totalDes += Number(p.asetDesember) || 0;
    totalKantor += Number(p.jumlahKantor) || 0;
  });

  const totalAsetSemua = totalOkt + totalNov + totalDes;
  const rataRata = totalPerusahaan > 0 ? totalAsetSemua / totalPerusahaan : 0;

  // Update DOM Cards
  cardTotalPerusahaan.textContent = `${totalPerusahaan} Perusahaan`;
  cardAsetOktober.textContent = formatRupiah(totalOkt);
  cardAsetNovember.textContent = formatRupiah(totalNov);
  cardAsetDesember.textContent = formatRupiah(totalDes);
  cardTotalKantor.textContent = `${totalKantor} Kantor`;
  cardRataRataAset.textContent = formatRupiah(rataRata);
}

// Proses pemrosesan data: Search -> Filter -> Sort -> Paginate
function renderProcessedData() {
  let processed = [...listPerusahaan];

  // 1. SEARCH: Filter berdasarkan nama perusahaan (Case-insensitive)
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    processed = processed.filter(p => p.perusahaan && p.perusahaan.toLowerCase().includes(term));
  }

  // 2. FILTER WILAYAH: Saring berdasarkan wilayah terpilih
  if (selectedWilayah) {
    processed = processed.filter(p => p.wilayah === selectedWilayah);
  }

  // 3. SORTING: Urutkan berdasarkan opsi terpilih
  if (sortOption) {
    const [column, direction] = sortOption.split('-');
    const multiplier = direction === 'asc' ? 1 : -1;

    processed.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (column === 'okt') {
        valA = a.asetOktober || 0;
        valB = b.asetOktober || 0;
      } else if (column === 'nov') {
        valA = a.asetNovember || 0;
        valB = b.asetNovember || 0;
      } else if (column === 'des') {
        valA = a.asetDesember || 0;
        valB = b.asetDesember || 0;
      }

      return (valA - valB) * multiplier;
    });
  }

  const totalFilteredItems = processed.length;
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage) || 1;

  // Sesuaikan halaman aktif jika berada di luar batas
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  // 4. PAGINATION: Ambil potongan data (10 data per halaman)
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalFilteredItems);
  const paginatedData = processed.slice(startIndex, endIndex);

  // Render baris tabel
  renderTableRows(paginatedData, startIndex);
  

  // Render info & kontrol pagination
  renderPaginationInfo(startIndex, endIndex, totalFilteredItems);
  renderPaginationControls(totalPages);
}

// Render baris data tabel ke DOM
function renderTableRows(data, startIndex) {
  if (data.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="py-12 text-center text-slate-400">
          <div class="flex flex-col items-center justify-center space-y-2">
            <svg class="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p class="font-medium text-sm">Data tidak ditemukan.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = data.map((p, idx) => {
    const globalIndex = startIndex + idx + 1;
    return `
      <tr class="hover:bg-slate-50 transition-colors duration-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}">
        <td class="py-4 px-6 text-center font-semibold text-slate-500">${globalIndex}</td>
        <td class="py-4 px-6 font-bold text-slate-800">${p.perusahaan}</td>
        <td class="py-4 px-6 text-slate-650">${p.wilayah}</td>
        <td class="py-4 px-6 text-right font-semibold text-slate-700">${formatRupiah(p.asetOktober)}</td>
        <td class="py-4 px-6 text-right font-semibold text-slate-700">${formatRupiah(p.asetNovember)}</td>
        <td class="py-4 px-6 text-right font-semibold text-slate-700">${formatRupiah(p.asetDesember)}</td>
        <td class="py-4 px-6 text-center">
${(() => {

    const growth = hitungGrowth(
        p.asetOktober,
        p.asetNovember
    );

    if(growth === null) return "-";

    const warna =
        growth > 5 ? "text-green-600" :
        growth >= 2 ? "text-blue-600" :
        growth >= 0 ? "text-yellow-600" :
        "text-red-600";

    return `
        <div class="${warna} font-bold">
            ${growth.toFixed(2)}%
        </div>

        <div class="text-xs text-slate-500">
            ${kategoriGrowth(growth)}
        </div>
    `;

})()}
</td>
</td>
        <td class="py-4 px-6 text-center font-semibold text-slate-700">${p.jumlahKantor}</td>
        <td class="py-4 px-6 text-center">
          <div class="flex items-center justify-center space-x-2">
            <button onclick="editData(${p.id})" class="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors text-xs font-semibold">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              <span>Edit</span>
            </button>
            <button onclick="confirmHapus(${p.id})" class="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-650 hover:bg-red-50 transition-colors text-xs font-semibold">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              <span>Hapus</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Render teks info pagination di bawah tabel
function renderPaginationInfo(start, end, total) {
  if (total === 0) {
    paginationInfo.textContent = "Menampilkan 0–0 dari 0 data";
  } else {
    paginationInfo.textContent = `Menampilkan ${start + 1}–${end} dari ${total} data`;
  }
}

// Render tombol navigasi halaman pagination
function renderPaginationControls(totalPages) {
  let html = "";

  // Tombol Previous
  html += `
    <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${currentPage === 1 ? 'text-slate-300 border-slate-100 bg-slate-50 cursor-not-allowed' : 'text-slate-650 border-slate-200 hover:bg-slate-50'}">
      Sebelumnya
    </button>
  `;

  // Tombol Halaman Angka
  for (let i = 1; i <= totalPages; i++) {
    const isActive = i === currentPage;
    html += `
      <button onclick="changePage(${i})" class="w-8 h-8 rounded-lg text-xs font-bold transition-all ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'border border-slate-200 text-slate-650 hover:bg-slate-50'}">
        ${i}
      </button>
    `;
  }

  // Tombol Next
  html += `
    <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${currentPage === totalPages ? 'text-slate-300 border-slate-100 bg-slate-50 cursor-not-allowed' : 'text-slate-650 border-slate-200 hover:bg-slate-50'}">
      Berikutnya
    </button>
  `;

  paginationControls.innerHTML = html;
}

// Mengubah halaman pagination
window.changePage = function(targetPage) {
  currentPage = targetPage;
  renderProcessedData();
};

// --- CRUD Form Actions ---

// Bersihkan isian form dan reset status
function resetForm() {
  formPerusahaan.reset();
  formId.value = "";
  formTitle.textContent = "Tambah Data Perusahaan";
  formError.classList.add('hidden');
  formError.textContent = "";

  // Ubah visibilitas tombol
  btnSubmitSimpan.classList.remove('hidden');
  btnSubmitUpdate.classList.add('hidden');
}

// Fungsi pembantu untuk mengumpulkan dan memvalidasi data form
function getFormData() {
  const name = formPerusahaanName.value.trim();
  const wilayah = formWilayah.value.trim();
  const okt = cleanNumber(formAsetOktober.value);
  const nov = cleanNumber(formAsetNovember.value);
  const des = cleanNumber(formAsetDesember.value);
  const kantor = parseInt(formJumlahKantor.value) || 0;

  if (!name || !wilayah) {
    formError.textContent = "Nama perusahaan dan wilayah wajib diisi!";
    formError.classList.remove('hidden');
    return null;
  }

  return {
    perusahaan: name,
    wilayah: wilayah,
    asetOktober: okt,
    asetNovember: nov,
    asetDesember: des,
    jumlahKantor: kantor
  };
}

// Jalankan Tambah Data (POST)
async function submitSimpan() {
  const payload = getFormData();
  if (!payload) return;

  try {
    const res = await fetch('/api/perusahaan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errRes = await res.json();
      throw new Error(errRes.error || "Gagal menyimpan data ke server");
    }

    resetForm();
    await fetchPerusahaan();
  } catch (err) {
    formError.textContent = err.message;
    formError.classList.remove('hidden');
  }
}

// Jalankan Update Data (PUT)
async function submitUpdate() {
  const id = formId.value;
  const payload = getFormData();
  if (!payload || !id) return;

  try {
    const res = await fetch(`/api/perusahaan/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errRes = await res.json();
      throw new Error(errRes.error || "Gagal memperbarui data");
    }

    resetForm();
    await fetchPerusahaan();
  } catch (err) {
    formError.textContent = err.message;
    formError.classList.remove('hidden');
  }
}

// Klik edit di tabel
window.editData = function(id) {
  const item = listPerusahaan.find(p => p.id === id);
  if (!item) return;

  formTitle.textContent = "Edit Data Perusahaan";
  formId.value = item.id;
  formPerusahaanName.value = item.perusahaan;
  formWilayah.value = item.wilayah;
  formAsetOktober.value = item.asetOktober ? new Intl.NumberFormat('id-ID').format(item.asetOktober) : '';
  formAsetNovember.value = item.asetNovember ? new Intl.NumberFormat('id-ID').format(item.asetNovember) : '';
  formAsetDesember.value = item.asetDesember ? new Intl.NumberFormat('id-ID').format(item.asetDesember) : '';
  formJumlahKantor.value = item.jumlahKantor;

  formError.classList.add('hidden');
  
  // Tukar visibilitas tombol
  btnSubmitSimpan.classList.add('hidden');
  btnSubmitUpdate.classList.remove('hidden');
  
  // Scroll form ke tampilan pada layar mobile
  formPerusahaan.scrollIntoView({ behavior: 'smooth' });
};

// Klik Hapus di tabel
window.confirmHapus = function(id) {
  deleteTargetId = id;
  showModal(modalConfirm);
};

// --- Event Listeners ---

// Input Search
filterSearch.addEventListener('input', (e) => {
  searchTerm = e.target.value;
  currentPage = 1; // reset ke halaman pertama saat melakukan pencarian
  renderProcessedData();
});

// Dropdown Wilayah
filterWilayah.addEventListener('change', (e) => {
  selectedWilayah = e.target.value;
  currentPage = 1; // reset ke halaman pertama
  renderProcessedData();
});

// Dropdown Sorting
sortAset.addEventListener('change', (e) => {
  sortOption = e.target.value;
  renderProcessedData();
});

// Tombol Form
btnSubmitSimpan.addEventListener('click', submitSimpan);
btnSubmitUpdate.addEventListener('click', submitUpdate);
btnReset.addEventListener('click', resetForm);

// Modal Hapus Actions
btnCancelDelete.addEventListener('click', () => {
  deleteTargetId = null;
  hideModal(modalConfirm);
});

btnConfirmDelete.addEventListener('click', async () => {
  if (!deleteTargetId) return;
  try {
    const res = await fetch(`/api/perusahaan/${deleteTargetId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Gagal menghapus data dari database");
    
    hideModal(modalConfirm);
    deleteTargetId = null;
    await fetchPerusahaan();
  } catch (err) {
    alert(err.message);
  }
});

// Inisialisasi format mata uang saat mengetik
setupCurrencyInput(formAsetOktober);
setupCurrencyInput(formAsetNovember);
setupCurrencyInput(formAsetDesember);

// Inisialisasi Awal Halaman
updateDateDisplay();
fetchPerusahaan();