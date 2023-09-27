const utf8 = require('utf8');
murmurhash = require('murmurhash');

const ATTEMPTS = parseInt(process.env.ATTEMPTS) || 100
const MAX_INTEGER_SIGNED = 0x7fffffff // ref: https://github.com/apache/pinot/blob/master/pinot-segment-spi/src/main/java/org/apache/pinot/segment/spi/partition/MurmurPartitionFunction.java#L45
const KAFKA_SEED = 0x9747b28c // ref: https://github.com/a0x8o/kafka/blob/master/clients/src/main/java/org/apache/kafka/common/utils/Utils.java#L481

// Using FSP name as keys
const FSP_PREFIX = 'perffsp'
const FSP_NUM = 8
const fspKeys = []
for (let i=1; i<=FSP_NUM; i++) {
  fspKeys.push(FSP_PREFIX + i)
}
findOutNumberOfPartitions(fspKeys)

// Using AccountID as keys from DB
// const fspAccountIds = []
// const mysql = require('mysql')
// const con = mysql.createConnection({
//   host: "localhost",
//   user: "central_ledger",
//   password: "password",
//   database: "central_ledger"
// })
// con.connect(function(err) {
//   if (err) throw err;
//   con.query("select pc.participantCurrencyId from participantCurrency as pc, participant as p, ledgerAccountType as lat where lat.ledgerAccountTypeId=pc.ledgerAccountTypeId and p.participantId=pc.participantId and lat.name='POSITION' and pc.currencyId='USD'", function (err, result, fields) {
//     if (err) throw err
//     // Iterate through result and push to keys
//     for (let i=0; i<result.length; i++) {
//       fspAccountIds.push(result[i].participantCurrencyId + "")
//     }
//     console.log(fspAccountIds)
//     findOutNumberOfPartitions(fspAccountIds)
//     con.end()
//   })
// })


function getPartitionAllocationMap(keys, totalPartitions, breakOnCollision = false) {
  let partitionFspMap = {}
  
  for (let i=0; i<keys.length; i++) {
    const hash = murmurhash.v2(utf8.encode(keys[i]), KAFKA_SEED)
    const selectedPartition = (hash & MAX_INTEGER_SIGNED) % totalPartitions;
    if (partitionFspMap[selectedPartition]) {
      if(breakOnCollision) {
        return null
      }
      partitionFspMap[selectedPartition].push(keys[i])
    } else {
      partitionFspMap[selectedPartition] = [ keys[i] ]
    }
  }
  return partitionFspMap
}


function findOutNumberOfPartitions(keys) {
  // const PARTITION_NUM = 17
  // const result  = getPartitionAllocationMap(keys, PARTITION_NUM)
  // console.log(`Partition allocation for ${PARTITION_NUM} partitions`,result)
  let isResult = false
  for (let partNumCount=1; partNumCount<=ATTEMPTS; partNumCount++) {
    const result  = getPartitionAllocationMap(keys, partNumCount, true)
    if (result) {
      isResult = true
      console.log(`Partition allocation for ${partNumCount} partitions`,result)
      break
    }
  }
  
  if (!isResult) {
    console.error(`Unable to find a no-colission solution after ${ATTEMPTS} attempts!`)
  }
}
