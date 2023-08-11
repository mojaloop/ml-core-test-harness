const utf8 = require('utf8');
murmurhash = require('murmurhash');

const FSP_PREFIX = 'perffsp'
const FSP_NUM = 8
const PARTITION_NUM = 17

let fspPartitionMap = {}

for (let i=1; i<=FSP_NUM; i++) {
  const fsp = FSP_PREFIX + i
  const hash = murmurhash.v2(utf8.encode(fsp), 0x9747b28c)
  fspPartitionMap[fsp] = (hash & 0x7fffffff) % PARTITION_NUM;
}

console.log(`Partition allocation for ${PARTITION_NUM} partitions`,fspPartitionMap)
