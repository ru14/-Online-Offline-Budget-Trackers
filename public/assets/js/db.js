const request = window.indexedDB.open("budget", 1);
let db;
// Create schema
request.onupgradeneeded = event => {
    const db = event.target.result;

    // Creates an object store with a id keypath with autoincrement that can be used to query on.
    const budgetStore = db.createObjectStore("pending", {
        keyPath: "id",
        autoIncrement: true
    });
    // Creates a statusIndex that we can query on.
    budgetStore.createIndex("statusIndex", "status");
    if (navigator.onLine) {
        checkDatabase();
      }
}

// Opens a transaction, accesses the budget objectStore and statusIndex.
request.onsuccess = () => {
    const db = request.result;
    const transaction = db.transaction(["budget"], "readwrite");
    const budgetStore = transaction.objectStore("pending");
    const statusIndex = budgetStore.index("statusIndex");

    // Adds data to our objectStore
    budgetStore.add({ id: "1", status: "complete" });
    // budgetStore.add({ id: "2", status: "in-progress" });
    // budgetStore.add({ id: "3", status: "complete" });
    // budgetStore.add({ id: "4", status: "backlog" });

    // Return an item by keyPath
    const getRequest = budgetStore.get("1");
    getRequest.onsuccess = () => {
        console.log(getRequest.result);
    };

    // Return an item by index
    const getRequestIdx = statusIndex.getAll("complete");
    getRequestIdx.onsuccess = () => {
        console.log(getRequestIdx.result);
    };
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