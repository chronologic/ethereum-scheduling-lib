import EAC from 'eac.js';

let instance = null;
let web3 = null;

const additionalMethods = {

};

export function initEacService(web3Service) {
  if (!instance) {
    web3 = web3Service;
    instance = Object.assign(EAC(web3Service), additionalMethods);
  }

  return instance;
}
