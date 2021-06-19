const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;


const request = window.indexedDB.open("budget", 1);
let db;
// Create schema
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = (event) => {
  event.target.result.createObjectStore("pending", {
    keyPath: "id",
    autoIncrement: true
  });
};

request.onerror = (err) => {
  console.log(err.message);
};

request.onsuccess = (event) => {
  db = event.target.result;

  if (navigator.onLine) {
    checkDatabase();
  }
};
function saveRecord(record) {
  const transaction = db.transaction("pending", "readwrite");
  const store = transaction.objectStore("pending");
  store.add(record);
}
// called when user goes online to send transactions stored in db to server
function checkDatabase() {
    const transaction = db.transaction(["pending"], "readonly");
    const budgetStore = transaction.objectStore("pending");
    const getAll = budgetStore.getAll();
  
    getAll.onsuccess = () => {
      if (getAll.result.length > 0) {
        fetch("/api/transaction/bulk", {
          method: "POST",
          body: JSON.stringify(getAll.result),
          headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json"
          }
        })
          .then((response) => response.json())
          .then(() => {
            const transaction = db.transaction("pending", "readwrite");
            const budgetStore = transaction.objectStore("pending");
            budgetStore.clear();
          });
      }
    };
  }
  // listen for app coming back online
window.addEventListener("online", checkDatabase);