// init_indexes.js

// Connect to the MongoDB instance
const db = connect("mongodb://localhost:27017/reporting");

// Ensure collection exists and create indexes
function ensureCollectionAndIndexes(collectionName, indexes) {
    if (!db.getCollectionNames().includes(collectionName)) {
        db.createCollection(collectionName);
        print(`Collection '${collectionName}' created.`);
    }

    indexes.forEach(index => {
        db.getCollection(collectionName).createIndex(index);
    });

    print(`Indexes for '${collectionName}' created successfully!`);
}

// Define indexes for the 'transactions' collection
ensureCollectionAndIndexes("transaction", [
    { transferId: 1 },
    { sourceCurrency: 1 },
    { targetCurrency: 1 },
    { createdAt: 1 },
    { transferState: 1 },
    { transactionType: 1 },
    { payerDFSP: 1 },
    { payerDFSPProxy: 1 },
    { payeeDFSP: 1 },
    { payeeDFSPProxy: 1 },
    { errorCode: 1 },
    { "payerParty.partyIdType": 1 },
    { "payerParty.partyIdentifier": 1 },
    { "payeeParty.partyIdType": 1 },
    { "payeeParty.partyIdentifier": 1 }
]);

// Define indexes for the 'settlements' collection
ensureCollectionAndIndexes("settlement", [
    { settlementId: 1 },
    { "settlementWindows.settlementWindowId": 1 }
]);

print("Initialization script executed successfully!");

