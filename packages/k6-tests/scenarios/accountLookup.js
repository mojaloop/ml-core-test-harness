import { getParties } from "../scripts/getParties.js";
import http from 'k6/http';
import exec from 'k6/execution';

export function accountLookupScenarios() {
  // if (exec.scenario.iterationInTest == 0) {
  //   var data = {
  //     "dashboardUID":"afe9dda2-878b-40c8-90df-072e7ecaaaee",
  //     "time": Date.now(),
  //     "text":"start accountLookupScenarios"
  //   }
  //   let res = http.post('http://grafana:3000/api/annotations', JSON.stringify(data), {
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'Authorization': 'Bearer glsa_5gICyL37Mici1QLe5D9lCYwmSoNEMRkK_92518163'
  //     },
  //   });
  //   console.log(res)
  // }

  getParties();
}
