const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Path file database.txt di root folder
const dbFile = path.join(__dirname, 'database.txt');

// Inisialisasi database.txt dengan data default dalam format JSON jika belum ada
if (!fs.existsSync(dbFile)) {
  const initialData = [
    {
      id: 1,
      perusahaan: "PT ABC",
      wilayah: "DKI Jakarta",
      asetOktober: 100000000,
      asetNovember: 120000000,
      asetDesember: 130000000,
      jumlahKantor: 12
    },
    {
      id: 2,
      perusahaan: "PT DEF",
      wilayah: "Jawa Timur",
      asetOktober: 150000000,
      asetNovember: 160000000,
      asetDesember: 180000000,
      jumlahKantor: 8
    },
    {
      id: 3,
      perusahaan: "PT GHI",
      wilayah: "Jawa Barat",
      asetOktober: 80000000,
      asetNovember: 85000000,
      asetDesember: 90000000,
      jumlahKantor: 5
    },
    {
      id: 4,
      perusahaan: "PT JKL",
      wilayah: "Jawa Tengah",
      asetOktober: 120000000,
      asetNovember: 110000000,
      asetDesember: 140000000,
      jumlahKantor: 15
    },
    {
      id: 5,
      perusahaan: "PT MNO",
      wilayah: "Bali",
      asetOktober: 60000000,
      asetNovember: 65000000,
      asetDesember: 70000000,
      jumlahKantor: 3
    }
  ];
  fs.writeFileSync(dbFile, JSON.stringify(initialData, null, 2), 'utf8');
}

// Helper untuk membaca file
const readData = () => {
  try {
    const raw = fs.readFileSync(dbFile, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Gagal membaca database.txt:", err);
    return [];
  }
};

// Helper untuk menulis file
const writeData = (data) => {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Gagal menulis ke database.txt:", err);
    return false;
  }
};

// API: Ambil semua data perusahaan
app.get('/api/perusahaan', (req, res) => {
  res.json(readData());
});

// API: Tambah data perusahaan baru (Append data)
app.post('/api/perusahaan', (req, res) => {
  const { perusahaan, wilayah, asetOktober, asetNovember, asetDesember, jumlahKantor } = req.body;
  
  if (!perusahaan || !wilayah) {
    return res.status(400).json({ error: "Nama perusahaan dan wilayah wajib diisi" });
  }

  const list = readData();
  const newId = list.length > 0 ? Math.max(...list.map(p => p.id)) + 1 : 1;
  
  const newItem = {
    id: newId,
    perusahaan,
    wilayah,
    asetOktober: Number(asetOktober) || 0,
    asetNovember: Number(asetNovember) || 0,
    asetDesember: Number(asetDesember) || 0,
    jumlahKantor: Number(jumlahKantor) || 0
  };

  list.push(newItem);
  if (writeData(list)) {
    res.status(201).json(newItem);
  } else {
    res.status(500).json({ error: "Gagal menyimpan data ke database" });
  }
});

// API: Edit data perusahaan
app.put('/api/perusahaan/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { perusahaan, wilayah, asetOktober, asetNovember, asetDesember, jumlahKantor } = req.body;

  if (!perusahaan || !wilayah) {
    return res.status(400).json({ error: "Nama perusahaan dan wilayah wajib diisi" });
  }

  const list = readData();
  const index = list.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Data perusahaan tidak ditemukan" });
  }

  list[index] = {
    id,
    perusahaan,
    wilayah,
    asetOktober: Number(asetOktober) || 0,
    asetNovember: Number(asetNovember) || 0,
    asetDesember: Number(asetDesember) || 0,
    jumlahKantor: Number(jumlahKantor) || 0
  };

  if (writeData(list)) {
    res.json(list[index]);
  } else {
    res.status(500).json({ error: "Gagal memperbarui data" });
  }
});

// API: Hapus data perusahaan
app.delete('/api/perusahaan/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let list = readData();
  
  const initialLength = list.length;
  list = list.filter(p => p.id !== id);

  if (list.length === initialLength) {
    return res.status(404).json({ error: "Data perusahaan tidak ditemukan" });
  }

  if (writeData(list)) {
    res.json({ message: "Data berhasil dihapus" });
  } else {
    res.status(500).json({ error: "Gagal menghapus data" });
  }
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
