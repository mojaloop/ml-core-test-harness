const utf8 = require('utf8');
murmurhash = require('murmurhash');

// Run the following SQL query to get the list of Account ID
//    docker exec -it mysql-cl mysql -D central_ledger -e 'select PC.participantCurrencyId from participantCurrency as PC, participant as P, ledgerAccountType as LT where PC.ledgerAccountTypeId=1 AND PC.participantId = P.participantId and LT.ledgerAccountTypeId=PC.ledgerAccountTypeId and P.name LIKE "perffsp%" and PC.currencyId="USD";'

const FSP_LIST = [
  '7',
  '15',
  '23',
  '31',
  '39',
  '47',
  '55',
  '63'
]

//// Old FSP_LIST
// const FSP_LIST = [
//   'perffsp1',
//   'perffsp2',
//   'perffsp3',
//   'perffsp4',
//   'perffsp5',
//   'perffsp6',
//   'perffsp7',
//   'perffsp8',
// ]

const MAX_INTEGER_SIGNED = 0x7fffffff // ref: https://github.com/apache/pinot/blob/master/pinot-segment-spi/src/main/java/org/apache/pinot/segment/spi/partition/MurmurPartitionFunction.java#L45
const KAFKA_SEED = 0x9747b28c // ref: https://github.com/a0x8o/kafka/blob/master/clients/src/main/java/org/apache/kafka/common/utils/Utils.java#L481

const ATTEMPTS = parseInt(process.env.ATTEMPTS) || 100

function getPartitionAllocationMap(totalPartitions, breakOnCollision = false) {
  let partitionFspMap = {}

  const fspNum = FSP_LIST.length
  
  for (let i=1; i<=fspNum; i++) {
    const fsp = FSP_LIST[i-1]
    const hash = murmurhash.v2(utf8.encode(fsp), KAFKA_SEED)
    const selectedPartition = (hash & MAX_INTEGER_SIGNED) % totalPartitions;
    if (partitionFspMap[selectedPartition]) {
      if(breakOnCollision) {
        return null
      }
      partitionFspMap[selectedPartition].push(fsp)
    } else {
      partitionFspMap[selectedPartition] = [ fsp ]
    }
  }
  return partitionFspMap
}

// const PARTITION_NUM = 17
// const result  = getPartitionAllocationMap(PARTITION_NUM)
// console.log(`Partition allocation for ${PARTITION_NUM} partitions`,result)
let isResult = false
for (let partNumCount=1; partNumCount<=ATTEMPTS; partNumCount++) {
  const result  = getPartitionAllocationMap(partNumCount, true)
  if (result) {
    isResult = true
    console.log(`Partition allocation for ${partNumCount} partitions`,result)
    break
  }
}

if (!isResult) console.error(`Unable to find a no-colission solution after ${ATTEMPTS} attempts!`)
