const utf8 = require('utf8');
murmurhash = require('murmurhash');

const FSP_PREFIX = 'perffsp'
const FSP_NUM = 8

const MAX_INTEGER_SIGNED = 0x7fffffff // ref: https://github.com/apache/pinot/blob/master/pinot-segment-spi/src/main/java/org/apache/pinot/segment/spi/partition/MurmurPartitionFunction.java#L45
const KAFKA_SEED = 0x9747b28c // ref: https://github.com/a0x8o/kafka/blob/master/clients/src/main/java/org/apache/kafka/common/utils/Utils.java#L481

const ATTEMPTS = parseInt(process.env.ATTEMPTS) || 100

function getPartitionAllocationMap(totalPartitions, breakOnCollision = false) {
  let partitionFspMap = {}
  
  for (let i=1; i<=FSP_NUM; i++) {
    const fsp = FSP_PREFIX + i
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

if (!isResult) console.error(`Unable to find a solution after ${ATTEMPTS} attempts!`)
