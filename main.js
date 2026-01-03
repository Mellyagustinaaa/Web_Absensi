// main.js (type=module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
  getDatabase,
  ref,
  set,
  onValue,
  query,
  orderByChild,
  get
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

/* ========== CONFIG FIREBASE ========== */
const firebaseConfig = {
  apiKey: "AIzaSyA8BKSNn2FhHiUfvJC0MrC2mjhBa4EDcLY",
  authDomain: "absensi-efd3c.firebaseapp.com",
  databaseURL: "https://absensi-efd3c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "absensi-efd3c",
  storageBucket: "absensi-efd3c.firebasestorage.app",
  messagingSenderId: "915534946197",
  appId: "1:915534946197:web:13be3e11dfa851edf0609c",
  measurementId: "G-PJJNESL7TT"
};
/* ===================================== */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

/* UI ELEMENTS */
const regEmail = document.getElementById('reg-email');
const regPass = document.getElementById('reg-pass');
const btnRegister = document.getElementById('btn-register');

const loginEmail = document.getElementById('login-email');
const loginPass = document.getElementById('login-pass');
const btnLogin = document.getElementById('btn-login');

const authCard = document.getElementById('auth-card');
const appCard = document.getElementById('app-card');
const displayEmail = document.getElementById('display-email');
const displayUid = document.getElementById('display-uid');
const btnSignout = document.getElementById('btn-signout');

const btnAbsen = document.getElementById('btn-absen');
const statusSelect = document.getElementById('status');
const historyUL = document.getElementById('history');

/* ========== AUTHENTICATION ========== */
btnRegister.addEventListener('click', async () => {
  const email = regEmail.value.trim();
  const pass = regPass.value;
  if (!email || !pass) return alert('Isi email & password!');

  try {
    await createUserWithEmailAndPassword(auth, email, pass);
    alert('Daftar berhasil! Silakan login.');
    regEmail.value = regPass.value = '';
  } catch (e) {
    alert(e.message);
  }
});

btnLogin.addEventListener('click', async () => {
  const email = loginEmail.value.trim();
  const pass = loginPass.value;
  if (!email || !pass) return alert('Isi email & password!');
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    loginEmail.value = loginPass.value = '';
  } catch (e) {
    alert(e.message);
  }
});

btnSignout.addEventListener('click', () => signOut(auth));

/* ========== ON AUTH STATE CHANGED ========== */
onAuthStateChanged(auth, user => {
  if (user) {
    authCard.style.display = 'none';
    appCard.style.display = 'block';
    displayEmail.textContent = user.email;
    displayUid.textContent = user.uid;
    listenUserHistory(user.uid);
  } else {
    authCard.style.display = 'block';
    appCard.style.display = 'none';
  }
});

/* ========== ABSEN SEKARANG ========== */
btnAbsen.addEventListener('click', async () => {
  const user = auth.currentUser;
  if (!user) return alert('Login dulu.');

  const status = statusSelect.value;
  if (!status) return alert('Pilih status kehadiran.');

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString();

  const data = {
    status: status,
    date: dateStr,
    time: timeStr,
    timestamp: Date.now()
  };

  const refUserDate = ref(db, `absensi/${user.uid}/${dateStr}`);

  // Cegah absen ganda di tanggal yang sama
  const existingSnap = await get(refUserDate);
  if (existingSnap.exists()) {
    alert('Kamu sudah absen hari ini!');
    return;
  }

  try {
    await set(refUserDate, data);
    alert(`Absensi tanggal ${dateStr} disimpan dengan status: ${status}`);
    statusSelect.value = '';
  } catch (e) {
    alert('Gagal menyimpan: ' + e.message);
  }
});

/* ========== TAMPIL RIWAYAT ABSENSI ========== */
function listenUserHistory(uid) {
  historyUL.innerHTML = '<li>Memuat...</li>';
  const q = query(ref(db, 'absensi/' + uid), orderByChild('timestamp'));
  onValue(q, snapshot => {
    historyUL.innerHTML = '';
    if (!snapshot.exists()) {
      historyUL.innerHTML = '<li>Belum ada absensi.</li>';
      return;
    }
    const data = [];
    snapshot.forEach(c => data.push(c.val()));
    data.reverse().forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.date} ${item.time} — ${item.status}`;
      historyUL.appendChild(li);
    });
  });
}
